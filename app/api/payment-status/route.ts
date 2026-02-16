import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaymentByOrderId, getOrderById } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create fresh Supabase client for each request to avoid cache
    // Force read from PRIMARY database to avoid replica lag
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
            'cache-control': 'no-cache, no-store, must-revalidate',
            'x-supabase-read-preference': 'primary'
          }
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const tripId = searchParams.get('trip_id');
    const tripUuid = searchParams.get('trip_uuid');

    if (!orderId && !tripId && !tripUuid) {
      return NextResponse.json(
        { error: 'Either order_id, trip_id, or trip_uuid is required' },
        { status: 400 }
      );
    }
    let payment;
    let paymentError;

    if (orderId) {
      try {
        payment = await getPaymentByOrderId(orderId);

        if (!payment) {
          const { data, error } = await supabase
            .from('payments')
            .select('id, order_id, status, wetravel_data, created_at, updated_at')
            .eq('order_id', orderId)
            .single();

          payment = data;
          paymentError = error;
        }
      } catch (error) {
        console.error('❌ [PAYMENT-STATUS] Error querying database:', error);
        paymentError = error;
      }
    } else if (tripId && tripId !== '') {
      const { data, error } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .contains('wetravel_data', { trip_id: tripId });

      payment = data && data.length > 0 ? data[0] : null;
      paymentError = error;

      if (!payment && tripUuid && tripUuid !== '') {
        const { data: uuidData, error: uuidError } = await supabase
          .from('payments')
          .select('id, order_id, status, wetravel_data, created_at, updated_at')
          .contains('wetravel_data', { trip_uuid: tripUuid });

        payment = uuidData && uuidData.length > 0 ? uuidData[0] : null;
        paymentError = uuidError;
      }
    } else if (tripUuid && tripUuid !== '') {
      const { data, error } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .contains('wetravel_data', { trip_uuid: tripUuid });

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

    // 🔄 CACHE/TIMING FIX: If status is pending and recently updated, retry multiple times with delays
    if (payment.status === 'pending' && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      // If updated in last 60 seconds, might be read-after-write issue / replica lag
      if (secondsSinceUpdate < 60) {
        // Try up to 6 times with shorter delays: 1s, 1.5s, 2s, 2.5s, 3s, 3.5s (total ~13.5s)
        for (let attempt = 1; attempt <= 6; attempt++) {
          const delay = 500 + (attempt * 500);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry the query from PRIMARY database (with fallback)
          let retryPayment;
          if (orderId) {
            retryPayment = await getPaymentByOrderId(orderId);
            if (!retryPayment) {
              const { data } = await supabase
                .from('payments')
                .select('id, order_id, status, wetravel_data, created_at, updated_at')
                .eq('order_id', orderId)
                .single();
              retryPayment = data;
            }
          } else if (tripId) {
            const { data } = await supabase
              .from('payments')
              .select('id, order_id, status, wetravel_data, created_at, updated_at')
              .contains('wetravel_data', { trip_id: tripId });
            retryPayment = data && data.length > 0 ? data[0] : null;
          }

          if (retryPayment) {
            payment = retryPayment as typeof payment;
            if (retryPayment.status !== 'pending') {
              break;
            }
          }
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
      }
    }

    // ⚠️ DISABLED: LobbyPMS reservation creation moved to webhook handler only
    // This code was creating reservations from the polling endpoint, which caused
    // premature reservation creation for $0 test payments before users saw the payment page.
    // Now ONLY the WeTravel webhook handler creates reservations after receiving booking.created event.
    //
    // if (payment.status === 'booking_created') {
    //   const { data: orderData } = await supabase
    //     .from('orders')
    //     .select('booking_data, lobbypms_reservation_id')
    //     .eq('id', payment.order_id)
    //     .single();
    //
    //   if (orderData && orderData.booking_data && !orderData.lobbypms_reservation_id) {
    //     ... [LobbyPMS reservation creation code disabled] ...
    //   }
    // }

    // Get order details
    let order = await getOrderById(payment.order_id);

    if (!order) {
      const { data } = await supabase
        .from('orders')
        .select('id, status, booking_data, lobbypms_reservation_id')
        .eq('id', payment.order_id)
        .single();
      order = data;
    }

    // 🔄 RETRY LOGIC: If no reservation ID but recently updated, retry
    if (!order?.lobbypms_reservation_id && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      if (secondsSinceUpdate < 60) {
        for (let attempt = 1; attempt <= 6; attempt++) {
          const delay = 500 + (attempt * 500);
          await new Promise(resolve => setTimeout(resolve, delay));

          let retryPayment = await getPaymentByOrderId(payment.order_id);
          let retryOrder = await getOrderById(payment.order_id);

          if (!retryPayment) {
            const { data } = await supabase
              .from('payments')
              .select('id, order_id, status, updated_at')
              .eq('id', payment.id)
              .single();
            retryPayment = data;
          }

          if (!retryOrder) {
            const { data } = await supabase
              .from('orders')
              .select('id, status, booking_data, lobbypms_reservation_id')
              .eq('id', payment.order_id)
              .single();
            retryOrder = data;
          }

          if (retryPayment && retryPayment.status !== 'pending') {
            payment = { ...payment, ...retryPayment } as typeof payment;
          }

          if (retryOrder) {
            order = retryOrder;
            if (retryOrder.lobbypms_reservation_id) {
              break;
            }
          }
        }
      }
    }

    // Check if reservation exists
    const hasReservation = order?.lobbypms_reservation_id &&
                          !order.lobbypms_reservation_id.startsWith('CREATING_');

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
