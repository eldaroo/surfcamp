import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getRecentPayments } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tripId = searchParams.get('trip_id');
    const orderId = searchParams.get('order_id');

    console.log('🔍 Debug request for:', { tripId, orderId });

    let results: any = {
      trip_id: tripId,
      order_id: orderId,
      searches: []
    };

    // Search 1: If we have tripId, search by wetravel_data
    if (tripId) {
      try {
        const paymentsByTrip = await query(
          `SELECT id, order_id, status, wetravel_data, created_at, updated_at
           FROM payments WHERE wetravel_data @> $1::jsonb`,
          [JSON.stringify({ trip_id: tripId })]
        );
        results.searches.push({
          method: 'wetravel_data contains trip_id',
          tripId,
          found: paymentsByTrip?.length || 0,
          payments: paymentsByTrip,
          error: null
        });
      } catch (tripError) {
        results.searches.push({
          method: 'wetravel_data contains trip_id',
          tripId,
          found: 0,
          payments: null,
          error: tripError instanceof Error ? tripError.message : 'Unknown error'
        });
      }
    }

    // Search 2: If we have orderId, search by order_id
    if (orderId) {
      try {
        const paymentsByOrder = await query(
          `SELECT id, order_id, status, wetravel_data, created_at, updated_at
           FROM payments WHERE order_id = $1`,
          [orderId]
        );
        results.searches.push({
          method: 'direct order_id match',
          orderId,
          found: paymentsByOrder?.length || 0,
          payments: paymentsByOrder,
          error: null
        });
      } catch (orderError) {
        results.searches.push({
          method: 'direct order_id match',
          orderId,
          found: 0,
          payments: null,
          error: orderError instanceof Error ? orderError.message : 'Unknown error'
        });
      }
    }

    // Search 3: Get recent payments for context
    let recentPayments: any[] = [];
    let recentError: any = null;
    try {
      recentPayments = await getRecentPayments(5);
    } catch (e) {
      recentError = e instanceof Error ? e.message : 'Unknown error';
    }

    results.recent_payments = {
      found: recentPayments?.length || 0,
      payments: recentPayments,
      error: recentError
    };

    // Search 4: Get recent events with timing analysis
    let recentEvents: any[] = [];
    let eventsError: any = null;
    try {
      recentEvents = await query(
        `SELECT * FROM wetravel_events ORDER BY processed_at DESC LIMIT 10`
      );
    } catch (e) {
      eventsError = e instanceof Error ? e.message : 'Unknown error';
    }

    // Add timing analysis to events
    const eventsWithTiming = recentEvents?.map((event: any) => {
      const processedAt = new Date(event.processed_at);
      const createdAt = event.created_at ? new Date(event.created_at) : null;

      return {
        ...event,
        timing: {
          processed_at_readable: processedAt.toISOString(),
          created_at_readable: createdAt?.toISOString() || 'N/A',
          seconds_since_processed: Math.floor((Date.now() - processedAt.getTime()) / 1000)
        }
      };
    });

    results.recent_events = {
      found: recentEvents?.length || 0,
      events: eventsWithTiming,
      error: eventsError
    };

    // Search 5: If tripId provided, check if any payment has this tripId anywhere
    if (tripId) {
      try {
        const anyMatch = await query(
          `SELECT id, order_id, status, wetravel_data, created_at
           FROM payments
           WHERE wetravel_data->>'trip_id' = $1 OR wetravel_data->>'order_id' = $1`,
          [tripId]
        );
        results.searches.push({
          method: 'any field contains tripId',
          tripId,
          found: anyMatch?.length || 0,
          payments: anyMatch,
          error: null
        });
      } catch (anyError) {
        results.searches.push({
          method: 'any field contains tripId',
          tripId,
          found: 0,
          payments: null,
          error: anyError instanceof Error ? anyError.message : 'Unknown error'
        });
      }
    }

    // Search 6: Get timing correlation for latest payment
    const targetOrderId = orderId || recentPayments?.[0]?.order_id;
    if (targetOrderId) {
      try {
        const payment = await queryOne(
          `SELECT * FROM payments WHERE order_id = $1`,
          [targetOrderId]
        );

        const order = await queryOne(
          `SELECT * FROM orders WHERE id = $1`,
          [targetOrderId]
        );

        const events = await query(
          `SELECT * FROM wetravel_events WHERE order_id = $1 ORDER BY processed_at ASC`,
          [targetOrderId]
        );

        if (payment && order) {
          const paymentCreated = new Date((payment as any).created_at);
          const orderCreated = new Date((order as any).created_at);
          const paymentUpdated = (payment as any).updated_at ? new Date((payment as any).updated_at) : null;
          const orderUpdated = (order as any).updated_at ? new Date((order as any).updated_at) : null;

          results.timing_correlation = {
            order_id: targetOrderId,
            timeline: {
              payment_created: paymentCreated.toISOString(),
              order_created: orderCreated.toISOString(),
              payment_updated: paymentUpdated?.toISOString() || 'N/A',
              order_updated: orderUpdated?.toISOString() || 'N/A',
              time_diff_payment_order_ms: orderCreated.getTime() - paymentCreated.getTime(),
              time_diff_payment_updated_ms: paymentUpdated ? (paymentUpdated.getTime() - paymentCreated.getTime()) : null
            },
            payment_status: (payment as any).status,
            order_status: (order as any).status,
            has_lobbypms_reservation: !!(order as any).lobbypms_reservation_id,
            lobbypms_reservation_id: (order as any).lobbypms_reservation_id,
            events: events?.map((e: any) => ({
              event_type: e.event_type,
              processed_at: new Date(e.processed_at).toISOString(),
              ms_after_payment_created: new Date(e.processed_at).getTime() - paymentCreated.getTime()
            })) || []
          };
        }
      } catch (correlationError) {
        // ignore timing correlation errors
      }
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
