import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');
  const tripId = searchParams.get('trip_id');
  const limit = parseInt(searchParams.get('limit') || '10');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let query = supabase
      .from('wetravel_events')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(limit);

    // If orderId provided, also get events for that order
    let orderEvents = null;
    if (orderId) {
      const { data } = await supabase
        .from('wetravel_events')
        .select('*')
        .or(`order_id.eq.${orderId},event_key.ilike.%${orderId}%`)
        .order('processed_at', { ascending: false });
      orderEvents = data;
    }

    // If tripId provided, get events for that trip
    let tripEvents = null;
    if (tripId) {
      const { data } = await supabase
        .from('wetravel_events')
        .select('*')
        .or(`event_key.ilike.%${tripId}%`)
        .order('processed_at', { ascending: false });
      tripEvents = data;
    }

    // Get all recent events
    const { data: recentEvents, error } = await query;

    if (error) {
      throw error;
    }

    // Get payment info if IDs provided
    let paymentInfo = null;
    if (orderId) {
      const { data: payment } = await supabase
        .from('payments')
        .select('id, order_id, status, wetravel_data, wetravel_order_id, created_at, updated_at')
        .eq('order_id', orderId)
        .single();

      const { data: order } = await supabase
        .from('orders')
        .select('id, status, lobbypms_reservation_id, created_at, updated_at')
        .eq('id', orderId)
        .single();

      paymentInfo = {
        payment,
        order
      };
    }

    return NextResponse.json({
      success: true,
      searchParams: { orderId, tripId, limit },
      paymentInfo,
      orderEvents,
      tripEvents,
      recentEvents,
      summary: {
        total_recent_events: recentEvents?.length || 0,
        order_events_count: orderEvents?.length || 0,
        trip_events_count: tripEvents?.length || 0,
        payment_status: paymentInfo?.payment?.status || null,
        order_status: paymentInfo?.order?.status || null,
        has_reservation: !!paymentInfo?.order?.lobbypms_reservation_id
      }
    });
  } catch (error) {
    console.error('Error checking webhook events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
