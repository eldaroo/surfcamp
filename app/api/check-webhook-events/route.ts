import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getPaymentByOrderId, getOrderById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');
  const tripId = searchParams.get('trip_id');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // If orderId provided, also get events for that order
    let orderEvents = null;
    if (orderId) {
      orderEvents = await query(
        `SELECT * FROM wetravel_events
         WHERE order_id = $1 OR event_key ILIKE $2
         ORDER BY processed_at DESC`,
        [orderId, `%${orderId}%`]
      );
    }

    // If tripId provided, get events for that trip
    let tripEvents = null;
    if (tripId) {
      tripEvents = await query(
        `SELECT * FROM wetravel_events
         WHERE event_key ILIKE $1
         ORDER BY processed_at DESC`,
        [`%${tripId}%`]
      );
    }

    // Get all recent events
    const recentEvents = await query(
      `SELECT * FROM wetravel_events ORDER BY processed_at DESC LIMIT $1`,
      [limit]
    );

    // Get payment info if IDs provided
    let paymentInfo = null;
    if (orderId) {
      const payment = await getPaymentByOrderId(orderId);
      const order = await getOrderById(orderId);

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
