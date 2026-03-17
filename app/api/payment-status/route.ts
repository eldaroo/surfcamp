import { NextRequest, NextResponse } from 'next/server';
import { getPaymentByOrderId, getOrderById, updateOrder, updatePayment, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const tripId = searchParams.get('trip_id');
    const tripUuid = searchParams.get('trip_uuid');

    console.log(`🔍 [PAYMENT-STATUS] poll received — order_id=${orderId} trip_id=${tripId}`);

    if (!orderId && !tripId && !tripUuid) {
      return NextResponse.json(
        { error: 'Either order_id, trip_id, or trip_uuid is required' },
        { status: 400 }
      );
    }
    let payment: any = null;
    let paymentError: any = null;

    if (orderId) {
      try {
        payment = await getPaymentByOrderId(orderId);
      } catch (error) {
        console.error('❌ [PAYMENT-STATUS] Error querying database:', error);
        paymentError = error;
      }
    } else if (tripId && tripId !== '') {
      try {
        const rows = await query(
          `SELECT id, order_id, status, wetravel_data, created_at, updated_at
           FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
          [JSON.stringify({ trip_id: tripId })]
        );
        payment = rows.length > 0 ? rows[0] : null;

        if (!payment && tripUuid && tripUuid !== '') {
          const uuidRows = await query(
            `SELECT id, order_id, status, wetravel_data, created_at, updated_at
             FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
            [JSON.stringify({ trip_uuid: tripUuid })]
          );
          payment = uuidRows.length > 0 ? uuidRows[0] : null;
        }
      } catch (error) {
        paymentError = error;
      }
    } else if (tripUuid && tripUuid !== '') {
      try {
        const rows = await query(
          `SELECT id, order_id, status, wetravel_data, created_at, updated_at
           FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
          [JSON.stringify({ trip_uuid: tripUuid })]
        );
        payment = rows.length > 0 ? rows[0] : null;
      } catch (error) {
        paymentError = error;
      }
    }

    if (paymentError) {
      return NextResponse.json(
        { error: 'Error finding payment' },
        { status: 500 }
      );
    }

    if (!payment) {
      console.log(`⚠️ [PAYMENT-STATUS] payment not found for order_id=${orderId}`);
      return NextResponse.json({
        found: false,
        status: 'not_found',
        message: 'Payment not found'
      });
    }

    console.log(`📊 [PAYMENT-STATUS] found payment ${payment.id} status=${payment.status} updated_at=${payment.updated_at}`);

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
          let retryPayment: any = null;
          if (orderId) {
            retryPayment = await getPaymentByOrderId(orderId);
          } else if (tripId) {
            const rows = await query(
              `SELECT id, order_id, status, wetravel_data, created_at, updated_at
               FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
              [JSON.stringify({ trip_id: tripId })]
            );
            retryPayment = rows.length > 0 ? rows[0] : null;
          }

          if (retryPayment) {
            payment = retryPayment;
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
      try {
        const updatedCount = await query(
          `UPDATE wetravel_events
           SET payment_id = $1, order_id = $2
           WHERE event_type = 'booking.created'
             AND event_key LIKE $3
             AND payment_id IS NULL
           RETURNING id`,
          [payment.id, payment.order_id, `%${tripId}%`]
        );

        if (updatedCount && updatedCount.length > 0) {
          // Update payment and order status to booking_created
          await updatePayment(payment.id, { status: 'booking_created' });
          await updateOrder(payment.order_id, { status: 'booking_created' });
          // Update the payment object to reflect the new status
          payment.status = 'booking_created';
        }
      } catch (orphanError) {
        // ignore orphan fix errors
      }
    }

    // ⚠️ DISABLED: LobbyPMS reservation creation moved to webhook handler only
    // This code was creating reservations from the polling endpoint, which caused
    // premature reservation creation for $0 test payments before users saw the payment page.
    // Now ONLY the WeTravel webhook handler creates reservations after receiving booking.created event.
    //
    // if (payment.status === 'booking_created') {
    //   const orderData = await getOrderById(payment.order_id);
    //
    //   if (orderData && orderData.booking_data && !orderData.lobbypms_reservation_id) {
    //     ... [LobbyPMS reservation creation code disabled] ...
    //   }
    // }

    // Get order details
    let order: any = await getOrderById(payment.order_id);

    // 🔄 RETRY LOGIC: If no reservation ID but recently updated, retry
    if (!order?.lobbypms_reservation_id && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      if (secondsSinceUpdate < 60) {
        for (let attempt = 1; attempt <= 6; attempt++) {
          const delay = 500 + (attempt * 500);
          await new Promise(resolve => setTimeout(resolve, delay));

          const retryPayment = await getPaymentByOrderId(payment.order_id);
          const retryOrder = await getOrderById(payment.order_id);

          if (retryPayment && retryPayment.status !== 'pending') {
            payment = { ...payment, ...retryPayment };
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

    console.log(`📤 [PAYMENT-STATUS] response → show_success=${response.show_success} is_booking_created=${response.is_booking_created} is_completed=${response.is_completed}`);
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
