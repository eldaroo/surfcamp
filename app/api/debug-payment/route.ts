import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
      const { data: paymentsByTrip, error: tripError } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .contains('wetravel_data', { trip_id: tripId });

      results.searches.push({
        method: 'wetravel_data contains trip_id',
        tripId,
        found: paymentsByTrip?.length || 0,
        payments: paymentsByTrip,
        error: tripError
      });
    }

    // Search 2: If we have orderId, search by order_id
    if (orderId) {
      const { data: paymentsByOrder, error: orderError } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at, updated_at')
        .eq('order_id', orderId);

      results.searches.push({
        method: 'direct order_id match',
        orderId,
        found: paymentsByOrder?.length || 0,
        payments: paymentsByOrder,
        error: orderError
      });
    }

    // Search 3: Get recent payments for context
    const { data: recentPayments, error: recentError } = await supabase
      .from('payments')
      .select('id, order_id, status, wetravel_data, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    results.recent_payments = {
      found: recentPayments?.length || 0,
      payments: recentPayments,
      error: recentError
    };

    // Search 4: Get recent events with timing analysis
    const { data: recentEvents, error: eventsError } = await supabase
      .from('wetravel_events')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(10);

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
      const { data: anyMatch, error: anyError } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, created_at')
        .or(`wetravel_data->>trip_id.eq.${tripId},wetravel_data->>order_id.eq.${tripId}`);

      results.searches.push({
        method: 'any field contains tripId',
        tripId,
        found: anyMatch?.length || 0,
        payments: anyMatch,
        error: anyError
      });
    }

    // Search 6: Get timing correlation for latest payment
    if (orderId || recentPayments?.[0]?.order_id) {
      const targetOrderId = orderId || recentPayments?.[0]?.order_id;

      // Get payment
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', targetOrderId)
        .single();

      // Get order
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', targetOrderId)
        .single();

      // Get related events
      const { data: events } = await supabase
        .from('wetravel_events')
        .select('*')
        .eq('order_id', targetOrderId)
        .order('processed_at', { ascending: true });

      if (payment && order) {
        const paymentCreated = new Date(payment.created_at);
        const orderCreated = new Date(order.created_at);
        const paymentUpdated = payment.updated_at ? new Date(payment.updated_at) : null;
        const orderUpdated = order.updated_at ? new Date(order.updated_at) : null;

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
          payment_status: payment.status,
          order_status: order.status,
          has_lobbypms_reservation: !!order.lobbypms_reservation_id,
          lobbypms_reservation_id: order.lobbypms_reservation_id,
          events: events?.map((e: any) => ({
            event_type: e.event_type,
            processed_at: new Date(e.processed_at).toISOString(),
            ms_after_payment_created: new Date(e.processed_at).getTime() - paymentCreated.getTime()
          })) || []
        };
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
