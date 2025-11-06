import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOrderUpdate } from '@/lib/sse-manager';

export const dynamic = 'force-dynamic';

function createFreshSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate'
        }
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const supabase = createFreshSupabaseClient();

  try {
    const body = await request.json();
    const { orderId, tripId, forceStatus } = body;

    if (!orderId && !tripId) {
      return NextResponse.json(
        { error: 'Please provide either orderId or tripId' },
        { status: 400 }
      );
    }

    console.log('🔧 [FIX-PAYMENT] Attempting to fix payment status for:', { orderId, tripId, forceStatus });

    // Find payment
    let payment;
    if (orderId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single();
      payment = data;
    } else if (tripId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .contains('wetravel_data', { trip_id: tripId });
      payment = data && data.length > 0 ? data[0] : null;
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', searched: { orderId, tripId } },
        { status: 404 }
      );
    }

    console.log('✅ [FIX-PAYMENT] Payment found:', {
      id: payment.id,
      order_id: payment.order_id,
      current_status: payment.status
    });

    // Get order data
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single();

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order not found', payment_id: payment.id },
        { status: 404 }
      );
    }

    const updates: any = {
      timestamp: new Date().toISOString(),
      payment: {
        before: {
          id: payment.id,
          status: payment.status
        },
        after: {}
      },
      order: {
        before: {
          id: orderData.id,
          status: orderData.status,
          has_reservation: !!orderData.lobbypms_reservation_id
        },
        after: {}
      },
      actions: []
    };

    // Determine target status
    const targetStatus = forceStatus || 'booking_created';

    // Update payment status
    if (payment.status !== targetStatus && payment.status !== 'completed') {
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (paymentError) {
        console.error('❌ [FIX-PAYMENT] Failed to update payment:', paymentError);
        return NextResponse.json(
          { error: 'Failed to update payment', details: paymentError },
          { status: 500 }
        );
      }

      updates.payment.after.status = targetStatus;
      updates.actions.push(`Updated payment status from '${payment.status}' to '${targetStatus}'`);
      console.log(`✅ [FIX-PAYMENT] Payment status updated to ${targetStatus}`);
    } else {
      updates.actions.push(`Payment status already at '${payment.status}', no update needed`);
    }

    // Update order status if needed
    if (orderData.status === 'pending' || orderData.status === 'created') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: targetStatus === 'completed' ? 'completed' : 'booking_created'
        })
        .eq('id', payment.order_id);

      if (orderError) {
        console.error('❌ [FIX-PAYMENT] Failed to update order:', orderError);
      } else {
        updates.order.after.status = targetStatus === 'completed' ? 'completed' : 'booking_created';
        updates.actions.push(`Updated order status to '${targetStatus === 'completed' ? 'completed' : 'booking_created'}'`);
        console.log('✅ [FIX-PAYMENT] Order status updated');
      }
    }

    // Check if reservation needs to be created
    if (orderData.booking_data && !orderData.lobbypms_reservation_id) {
      console.log('🏨 [FIX-PAYMENT] No reservation exists, attempting to create...');

      try {
        const booking = orderData.booking_data;
        const reservePayload = {
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          roomTypeId: booking.roomTypeId,
          isSharedRoom: booking.isSharedRoom || false,
          contactInfo: booking.contactInfo,
          activityIds: booking.selectedActivities?.map((a: any) => a.id) || [],
          selectedActivities: booking.selectedActivities || [],
          participants: booking.participants || []
        };

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        const reserveResponse = await fetch(`${baseUrl}/api/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservePayload)
        });

        const reserveData = await reserveResponse.json();

        if (reserveResponse.ok) {
          let reservationId;
          if (reserveData.multipleReservations && reserveData.reservationIds) {
            reservationId = Array.isArray(reserveData.reservationIds)
              ? reserveData.reservationIds[0]
              : reserveData.reservationIds;
          } else {
            reservationId = reserveData.reservationId ||
                           reserveData.reservation?.id ||
                           reserveData.lobbyPMSResponse?.booking?.booking_id ||
                           reserveData.lobbyPMSResponse?.id;
          }

          if (reservationId) {
            await supabase
              .from('orders')
              .update({
                lobbypms_reservation_id: reservationId,
                lobbypms_data: reserveData
              })
              .eq('id', payment.order_id);

            updates.order.after.reservation_id = reservationId;
            updates.actions.push(`Created LobbyPMS reservation: ${reservationId}`);
            console.log('✅ [FIX-PAYMENT] Reservation created:', reservationId);

            // Update payment to completed
            await supabase
              .from('payments')
              .update({ status: 'completed' })
              .eq('id', payment.id);

            updates.payment.after.status = 'completed';

            // Notify frontend via SSE
            notifyOrderUpdate(payment.order_id.toString(), {
              type: 'reservation_complete',
              status: 'completed',
              orderId: payment.order_id,
              paymentId: payment.id,
              reservationId: reservationId,
              message: 'Payment status fixed and reservation created!'
            });
            updates.actions.push('SSE notification sent to frontend');
          }
        } else {
          console.error('❌ [FIX-PAYMENT] Failed to create reservation:', reserveData);
          updates.actions.push(`Failed to create reservation: ${reserveData.error || 'Unknown error'}`);
        }
      } catch (reserveError) {
        console.error('❌ [FIX-PAYMENT] Error creating reservation:', reserveError);
        updates.actions.push(`Error creating reservation: ${reserveError instanceof Error ? reserveError.message : 'Unknown'}`);
      }
    } else if (orderData.lobbypms_reservation_id) {
      updates.actions.push(`Reservation already exists: ${orderData.lobbypms_reservation_id}`);

      // If reservation exists but status is not completed, update it
      if (payment.status !== 'completed') {
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('id', payment.id);

        updates.payment.after.status = 'completed';
        updates.actions.push('Updated payment status to completed (reservation exists)');

        // Notify frontend
        notifyOrderUpdate(payment.order_id.toString(), {
          type: 'reservation_complete',
          status: 'completed',
          orderId: payment.order_id,
          paymentId: payment.id,
          reservationId: orderData.lobbypms_reservation_id,
          message: 'Payment status fixed!'
        });
        updates.actions.push('SSE notification sent to frontend');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status fixed successfully',
      updates
    });

  } catch (error) {
    console.error('❌ [FIX-PAYMENT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
