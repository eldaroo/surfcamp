import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create fresh Supabase client for each request to avoid cache
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'cache-control': 'no-cache, no-store, must-revalidate'
          }
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const tripId = searchParams.get('trip_id');

    console.log('🔍 [PAYMENT-STATUS] Endpoint called with:', { orderId, tripId });

    if (!orderId && !tripId) {
      return NextResponse.json(
        { error: 'Either order_id or trip_id is required' },
        { status: 400 }
      );
    }
    let payment;
    let paymentError;

    if (orderId) {
      // Search by order_id
      const { data, error } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .eq('order_id', orderId)
        .single();

      payment = data;
      paymentError = error;
    } else if (tripId) {
      // Search by trip_id in the wetravel_data JSONB field
      const { data, error } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .contains('wetravel_data', { trip_id: tripId });

      payment = data && data.length > 0 ? data[0] : null;
      paymentError = error;
    }

    if (paymentError) {
      return NextResponse.json(
        { error: 'Error finding payment' },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json({
        found: false,
        status: 'not_found',
        message: 'Payment not found'
      });
    }

    console.log('💾 [PAYMENT-STATUS] Payment found with status:', payment.status);
    console.log('🕐 [PAYMENT-STATUS] Payment updated_at:', payment.updated_at);
    console.log('🔢 [PAYMENT-STATUS] Payment ID:', payment.id);

    // 🔄 CACHE/TIMING FIX: If status is pending and recently updated, retry after delay
    if (payment.status === 'pending' && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      console.log('⏱️ [PAYMENT-STATUS] Seconds since last update:', secondsSinceUpdate);

      // If updated in last 30 seconds, might be read-after-write issue
      if (secondsSinceUpdate < 30) {
        console.log('⏳ [PAYMENT-STATUS] Recent update detected, waiting 1s and retrying payment query...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Retry the query with fresh client
        const freshSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { 'cache-control': 'no-cache, no-store, must-revalidate' } }
          }
        );

        let retryPayment;
        if (orderId) {
          const { data } = await freshSupabase
            .from('payments')
            .select('id, order_id, status, wetravel_data, created_at, updated_at')
            .eq('order_id', orderId)
            .single();
          retryPayment = data;
        } else if (tripId) {
          const { data } = await freshSupabase
            .from('payments')
            .select('id, order_id, status, wetravel_data, created_at, updated_at')
            .contains('wetravel_data', { trip_id: tripId });
          retryPayment = data && data.length > 0 ? data[0] : null;
        }

        if (retryPayment) {
          console.log('🔄 [PAYMENT-STATUS] Retry result - status:', retryPayment.status);
          payment = retryPayment;
        }
      }
    }

    // Check if this payment has orphaned events and fix them automatically
    if (tripId && payment.status === 'pending') {
      // Try to fix any orphaned events for this trip
      const { data: orphanedEvents, error: orphanError } = await supabase
        .from('wetravel_events')
        .update({
          payment_id: payment.id,
          order_id: payment.order_id
        })
        .eq('event_type', 'booking.created')
        .like('event_key', `%${tripId}%`)
        .is('payment_id', null)
        .select();

      if (orphanedEvents && orphanedEvents.length > 0) {
        // Update payment and order status to booking_created
        await supabase
          .from('payments')
          .update({ status: 'booking_created' })
          .eq('id', payment.id);

        await supabase
          .from('orders')
          .update({ status: 'booking_created' })
          .eq('id', payment.order_id);
        // Update the payment object to reflect the new status
        payment.status = 'booking_created';
        console.log('🔄 [PAYMENT-STATUS] Status updated to booking_created after fixing orphaned events');
      }
    }

    console.log('🎯 [PAYMENT-STATUS] About to check reservation creation. Current status:', payment.status);

    // Check if booking_created but no LobbyPMS reservation yet
    if (payment.status === 'booking_created') {
      console.log('📊 [PAYMENT-STATUS] Status is booking_created, checking if reservation needed');

      const { data: orderData } = await supabase
        .from('orders')
        .select('booking_data, lobbypms_reservation_id')
        .eq('id', payment.order_id)
        .single();

      console.log('📊 [PAYMENT-STATUS] Order check:', {
        hasBookingData: !!orderData?.booking_data,
        hasReservationId: !!orderData?.lobbypms_reservation_id,
        reservationId: orderData?.lobbypms_reservation_id
      });

      if (orderData && orderData.booking_data && !orderData.lobbypms_reservation_id) {
        // 🔒 RACE CONDITION PROTECTION: Use optimistic locking
        // Try to claim this order for reservation creation by setting a temporary marker
        const claimTimestamp = new Date().toISOString();
        const { data: claimResult, error: claimError } = await supabase
          .from('orders')
          .update({
            lobbypms_reservation_id: `CREATING_${claimTimestamp}`
          })
          .eq('id', payment.order_id)
          .is('lobbypms_reservation_id', null)  // Only update if still null
          .select();

        if (claimError || !claimResult || claimResult.length === 0) {
          console.log('⚠️ [PAYMENT-STATUS] Could not claim order (already claimed or error)');
          // Another process claimed it, skip
        } else {
          console.log('✅ [PAYMENT-STATUS] Successfully claimed order, creating reservation');

          const booking = orderData.booking_data;

          try {
            const reserveUrl = `${request.nextUrl.origin}/api/reserve`;
            console.log('📞 [PAYMENT-STATUS] Calling /api/reserve:', reserveUrl);

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
          const reserveResponse = await fetch(reserveUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservePayload)
          });

          const reserveData = await reserveResponse.json();
          console.log('📥 [PAYMENT-STATUS] /api/reserve responded:', {
            ok: reserveResponse.ok,
            status: reserveResponse.status,
            success: reserveData.success
          });

          if (reserveResponse.ok) {
            // Handle both single and multiple reservations
            let reservationId;
            if (reserveData.multipleReservations && reserveData.reservationIds) {
              // Multiple reservations: use the first ID or join them
              reservationId = Array.isArray(reserveData.reservationIds)
                ? reserveData.reservationIds[0]
                : reserveData.reservationIds;
              console.log('✅ [PAYMENT-STATUS] Multiple reservations created:', reserveData.reservationIds);
            } else {
              // Single reservation
              reservationId = reserveData.reservationId ||
                             reserveData.reservation?.id ||
                             reserveData.lobbyPMSResponse?.booking?.booking_id ||
                             reserveData.lobbyPMSResponse?.id;
              console.log('✅ [PAYMENT-STATUS] Single reservation created:', reservationId);
            }

            if (reservationId) {
              await supabase
                .from('orders')
                .update({
                  lobbypms_reservation_id: reservationId,
                  lobbypms_data: reserveData
                })
                .eq('id', payment.order_id);
              console.log('💾 [PAYMENT-STATUS] Reservation ID saved to database:', reservationId);
            } else {
              console.error('❌ [PAYMENT-STATUS] Could not extract reservation ID from response');
            }
          } else {
            console.error('❌ [PAYMENT-STATUS] /api/reserve failed:', reserveData);
          }
        } catch (lobbyError) {
          console.error('❌ [PAYMENT-STATUS] Error calling /api/reserve:', lobbyError);
        }
        }  // End of claim success block
      } else {
      }
    } else {
    }

    // Get order details if available
    let { data: order } = await supabase
      .from('orders')
      .select('id, status, booking_data, lobbypms_reservation_id')
      .eq('id', payment.order_id)
      .single();

    console.log('🏨 [PAYMENT-STATUS] Order data (first read):', {
      orderId: order?.id,
      orderStatus: order?.status,
      lobbypmsReservationId: order?.lobbypms_reservation_id
    });

    // 🔄 RETRY LOGIC: If no reservation ID but recently updated, retry after delay
    if (!order?.lobbypms_reservation_id && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      if (secondsSinceUpdate < 30) {
        console.log('⏳ [PAYMENT-STATUS] No reservation yet but recent update, waiting 1.5s and retrying order query...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { data: retryOrder } = await supabase
          .from('orders')
          .select('id, status, booking_data, lobbypms_reservation_id')
          .eq('id', payment.order_id)
          .single();

        if (retryOrder) {
          console.log('🔄 [PAYMENT-STATUS] Order data (after retry):', {
            orderId: retryOrder.id,
            orderStatus: retryOrder.status,
            lobbypmsReservationId: retryOrder.lobbypms_reservation_id
          });
          order = retryOrder;
        }
      }
    }

    // Check if reservation exists (even if status shows pending due to cache)
    const hasReservation = order?.lobbypms_reservation_id &&
                          !order.lobbypms_reservation_id.startsWith('CREATING_');

    console.log('✨ [PAYMENT-STATUS] Final decision:', {
      hasReservation,
      paymentStatus: payment.status,
      willShowSuccess: payment.status === 'booking_created' || payment.status === 'completed' || hasReservation
    });

    const response = {
      found: true,
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        status: payment.status,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        wetravel_data: payment.wetravel_data
      },
      order: order ? {
        id: order.id,
        status: order.status,
        booking_data: order.booking_data,
        lobbypms_reservation_id: order.lobbypms_reservation_id
      } : null,
      is_booking_created: payment.status === 'booking_created' || hasReservation,
      is_completed: payment.status === 'completed',
      show_success: payment.status === 'booking_created' || payment.status === 'completed' || hasReservation
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
