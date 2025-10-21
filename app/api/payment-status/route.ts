import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔵 [LOBBYPMS-DEBUG] 📞 /api/payment-status called');
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const tripId = searchParams.get('trip_id');

    console.log('🔵 [LOBBYPMS-DEBUG] 🔍 Search params:', { orderId, tripId });

    if (!orderId && !tripId) {
      return NextResponse.json(
        { error: 'Either order_id or trip_id is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking payment status for:', { orderId, tripId });
    console.log('🔍 Search params raw:', { orderIdRaw: searchParams.get('order_id'), tripIdRaw: searchParams.get('trip_id') });

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
      console.error('❌ Error finding payment:', paymentError);
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

    console.log('🔵 [LOBBYPMS-DEBUG] ✅ Payment found:', {
      id: payment.id,
      order_id: payment.order_id,
      status: payment.status
    });

    // Check if this payment has orphaned events and fix them automatically
    if (tripId && payment.status === 'pending') {
      console.log('🔧 Checking for orphaned events for trip_id:', tripId);

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
        console.log('🔧 Fixed orphaned events:', orphanedEvents.length);

        // Update payment and order status to booking_created
        await supabase
          .from('payments')
          .update({ status: 'booking_created' })
          .eq('id', payment.id);

        await supabase
          .from('orders')
          .update({ status: 'booking_created' })
          .eq('id', payment.order_id);

        console.log('✅ Updated payment and order status to booking_created');

        // Update the payment object to reflect the new status
        payment.status = 'booking_created';
      }
    }

    // Check if booking_created but no LobbyPMS reservation yet
    console.log('🔵 [LOBBYPMS-DEBUG] 🔍 Checking if LobbyPMS reservation needed...');
    console.log('🔵 [LOBBYPMS-DEBUG] Payment status:', payment.status);

    if (payment.status === 'booking_created') {
      console.log('🔵 [LOBBYPMS-DEBUG] ✅ Status is booking_created - fetching order data...');

      const { data: orderData } = await supabase
        .from('orders')
        .select('booking_data, lobbypms_reservation_id')
        .eq('id', payment.order_id)
        .single();

      console.log('🔵 [LOBBYPMS-DEBUG] 📋 Order data fetched:', {
        hasOrderData: !!orderData,
        hasBookingData: !!orderData?.booking_data,
        hasLobbyPMSId: !!orderData?.lobbypms_reservation_id,
        lobbypms_reservation_id: orderData?.lobbypms_reservation_id
      });

      if (orderData && orderData.booking_data && !orderData.lobbypms_reservation_id) {
        console.log('🔵 [LOBBYPMS-DEBUG] 🏨 Booking created but no LobbyPMS reservation - creating now...');

        const booking = orderData.booking_data;

        try {
          const reserveUrl = `${request.nextUrl.origin}/api/reserve`;

          const reservePayload = {
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests,
            roomTypeId: booking.roomTypeId,
            contactInfo: booking.contactInfo,
            activityIds: booking.selectedActivities?.map((a: any) => a.id) || [],
            selectedActivities: booking.selectedActivities || []
          };

          console.log('🔵 [LOBBYPMS-DEBUG] 🔗 Reserve URL:', reserveUrl);
          console.log('🔵 [LOBBYPMS-DEBUG] 📤 Reserve payload:', JSON.stringify(reservePayload, null, 2));

          const reserveResponse = await fetch(reserveUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservePayload)
          });

          const reserveData = await reserveResponse.json();
          console.log('🔵 [LOBBYPMS-DEBUG] 📥 Reserve response:', JSON.stringify(reserveData, null, 2));

          if (reserveResponse.ok) {
            console.log('🔵 [LOBBYPMS-DEBUG] ✅ LobbyPMS reservation created successfully');

            await supabase
              .from('orders')
              .update({
                lobbypms_reservation_id: reserveData.reservation?.id || reserveData.lobbyPMSResponse?.id,
                lobbypms_data: reserveData
              })
              .eq('id', payment.order_id);

            console.log('🔵 [LOBBYPMS-DEBUG] 💾 Order updated with LobbyPMS reservation ID');
          } else {
            console.error('🔵 [LOBBYPMS-DEBUG] ❌ Failed to create LobbyPMS reservation:', reserveData);
          }
        } catch (lobbyError) {
          console.error('🔵 [LOBBYPMS-DEBUG] ❌ Error creating LobbyPMS reservation:', lobbyError);
        }
      } else {
        console.log('🔵 [LOBBYPMS-DEBUG] ℹ️ Skipping LobbyPMS creation:', {
          reason: !orderData ? 'No order data' : !orderData.booking_data ? 'No booking data' : 'Already has LobbyPMS reservation',
          lobbypms_reservation_id: orderData?.lobbypms_reservation_id
        });
      }
    } else {
      console.log('🔵 [LOBBYPMS-DEBUG] ℹ️ Status is not booking_created, skipping LobbyPMS check');
    }

    // Get order details if available
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, booking_data')
      .eq('id', payment.order_id)
      .single();

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
        booking_data: order.booking_data
      } : null,
      is_booking_created: payment.status === 'booking_created',
      is_completed: payment.status === 'completed',
      show_success: payment.status === 'booking_created' || payment.status === 'completed'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
