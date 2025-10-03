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
    const orderId = searchParams.get('order_id');
    const tripId = searchParams.get('trip_id');

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

    console.log('✅ Payment found:', {
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