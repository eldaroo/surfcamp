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

    console.log('🔍 [PAYMENT-STATUS] Endpoint called with:', { orderId, tripId, tripUuid });

    if (!orderId && !tripId && !tripUuid) {
      return NextResponse.json(
        { error: 'Either order_id, trip_id, or trip_uuid is required' },
        { status: 400 }
      );
    }
    let payment;
    let paymentError;

    if (orderId) {
      // Search by order_id using DIRECT connection to PRIMARY database
      console.log('🔍 [PAYMENT-STATUS] Querying PRIMARY database by order_id:', orderId);

      try {
        payment = await getPaymentByOrderId(orderId);
        console.log('📊 [PAYMENT-STATUS] Direct PRIMARY DB response:', {
          found: !!payment,
          status: payment?.status,
          updated_at: payment?.updated_at,
          created_at: payment?.created_at,
          id: payment?.id
        });
      } catch (error) {
        console.error('❌ [PAYMENT-STATUS] Error querying PRIMARY database:', error);
        paymentError = error;
      }
    } else if (tripId && tripId !== '') {
      // Search by trip_id in the wetravel_data JSONB field
      const { data, error } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .contains('wetravel_data', { trip_id: tripId });

      payment = data && data.length > 0 ? data[0] : null;
      paymentError = error;

      // If trip_id search failed and we have trip_uuid, try that
      if (!payment && tripUuid && tripUuid !== '') {
        console.log('🔄 [PAYMENT-STATUS] trip_id search failed, trying trip_uuid:', tripUuid);
        const { data: uuidData, error: uuidError } = await supabase
          .from('payments')
          .select('id, order_id, status, wetravel_data, created_at, updated_at')
          .contains('wetravel_data', { trip_uuid: tripUuid });

        payment = uuidData && uuidData.length > 0 ? uuidData[0] : null;
        paymentError = uuidError;
      }
    } else if (tripUuid && tripUuid !== '') {
      // Search by trip_uuid in the wetravel_data JSONB field
      console.log('🔍 [PAYMENT-STATUS] Searching by trip_uuid:', tripUuid);
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

    console.log('💾 [PAYMENT-STATUS] Payment found with status:', payment.status);
    console.log('🕐 [PAYMENT-STATUS] Payment updated_at:', payment.updated_at);
    console.log('🔢 [PAYMENT-STATUS] Payment ID:', payment.id);

    // 🔄 CACHE/TIMING FIX: If status is pending and recently updated, retry multiple times with delays
    if (payment.status === 'pending' && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      console.log('⏱️ [PAYMENT-STATUS] Seconds since last update:', secondsSinceUpdate);

      // If updated in last 60 seconds, might be read-after-write issue / replica lag
      if (secondsSinceUpdate < 60) {
        console.log('⏳ [PAYMENT-STATUS] Recent update detected, retrying payment query up to 6 times...');

        // Try up to 6 times with shorter delays: 1s, 1.5s, 2s, 2.5s, 3s, 3.5s (total ~13.5s)
        for (let attempt = 1; attempt <= 6; attempt++) {
          const delay = 500 + (attempt * 500); // 1s, 1.5s, 2s, 2.5s, 3s, 3.5s
          console.log(`⏳ [PAYMENT-STATUS] Payment retry attempt ${attempt}/6, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry the query from PRIMARY database
          let retryPayment;
          if (orderId) {
            retryPayment = await getPaymentByOrderId(orderId);
          } else if (tripId) {
            // For tripId search, still use Supabase (JSONB queries not supported in direct SQL helper yet)
            const freshSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { data } = await freshSupabase
              .from('payments')
              .select('id, order_id, status, wetravel_data, created_at, updated_at')
              .contains('wetravel_data', { trip_id: tripId });
            retryPayment = data && data.length > 0 ? data[0] : null;
          }

          console.log(`🔄 [PAYMENT-STATUS] Payment retry ${attempt}/6 from PRIMARY - status:`, retryPayment?.status || 'not_found', {
            paymentId: retryPayment?.id,
            orderId: retryPayment?.order_id,
            updatedAt: retryPayment?.updated_at
          });

          if (retryPayment) {
            payment = retryPayment as typeof payment;
            // If status changed from pending, break early
            if (retryPayment.status !== 'pending') {
              console.log(`✅ [PAYMENT-STATUS] Payment status changed to ${retryPayment.status} on attempt ${attempt}!`);
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

    // Get order details if available using DIRECT connection to PRIMARY database
    console.log('🔍 [PAYMENT-STATUS] Querying PRIMARY database for order_id:', payment.order_id);
    let order = await getOrderById(payment.order_id);

    console.log('🏨 [PAYMENT-STATUS] Order data from PRIMARY (first read):', {
      orderId: order?.id,
      orderStatus: order?.status,
      lobbypmsReservationId: order?.lobbypms_reservation_id
    });

    // 🔄 RETRY LOGIC: If no reservation ID but recently updated, retry multiple times with longer delays
    if (!order?.lobbypms_reservation_id && payment.updated_at) {
      const updatedAt = new Date(payment.updated_at);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;

      // Increased time window from 30s to 60s
      if (secondsSinceUpdate < 60) {
        console.log('⏳ [PAYMENT-STATUS] No reservation yet but recent update, retrying up to 6 times with shorter delays...');

        // Try up to 6 times with shorter delays: 1s, 1.5s, 2s, 2.5s, 3s, 3.5s
        for (let attempt = 1; attempt <= 6; attempt++) {
          const delay = 500 + (attempt * 500); // 1s, 1.5s, 2s, 2.5s, 3s, 3.5s
          console.log(`⏳ [PAYMENT-STATUS] Retry attempt ${attempt}/6, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Re-query both payment and order from PRIMARY database
          const retryPayment = await getPaymentByOrderId(payment.order_id);
          const retryOrder = await getOrderById(payment.order_id);

          console.log(`🔄 [PAYMENT-STATUS] Retry ${attempt}/6 results from PRIMARY:`, {
            paymentStatus: retryPayment?.status || 'not_found',
            orderStatus: retryOrder?.status || 'not_found',
            lobbypmsReservationId: retryOrder?.lobbypms_reservation_id || null,
            paymentUpdatedAt: retryPayment?.updated_at
          });

          // Update local variables if we got better data
          if (retryPayment && retryPayment.status !== 'pending') {
            console.log(`✅ [PAYMENT-STATUS] Payment status updated to ${retryPayment.status} on retry!`);
            payment = { ...payment, ...retryPayment } as typeof payment;
          }

          if (retryOrder) {
            order = retryOrder;
            if (retryOrder.lobbypms_reservation_id) {
              console.log('✅ [PAYMENT-STATUS] Reservation ID found on retry:', retryOrder.lobbypms_reservation_id);
              break;
            }
          }
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
