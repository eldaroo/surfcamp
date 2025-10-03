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
    const { searchParams } = new URL(request.url);
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

    // Search 4: Get recent events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('wetravel_events')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(5);

    results.recent_events = {
      found: recentEvents?.length || 0,
      events: recentEvents,
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

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}