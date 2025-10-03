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

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual fix for orphaned events requested');

    // Get all orphaned events
    const { data: orphanedEvents, error: orphanError } = await supabase
      .from('wetravel_events')
      .select('*')
      .eq('event_type', 'booking.created')
      .is('payment_id', null);

    if (orphanError) {
      console.error('❌ Error fetching orphaned events:', orphanError);
      return NextResponse.json({ error: 'Error fetching orphaned events' }, { status: 500 });
    }

    console.log('🔍 Found orphaned events:', orphanedEvents?.length || 0);

    let fixed = 0;
    let errors = 0;

    for (const event of orphanedEvents || []) {
      try {
        // Extract trip_id from event_key (format: booking.created_tripId_timestamp)
        const eventKeyParts = event.event_key.split('_');
        let tripId = null;

        // Try different formats
        if (eventKeyParts.length >= 3) {
          // Look for the trip_id - usually the middle part that's not a timestamp
          for (let i = 1; i < eventKeyParts.length; i++) {
            const part = eventKeyParts[i];
            // Trip IDs are typically 8 digits, timestamps are 13+ digits
            if (part.length === 8 && /^\d+$/.test(part)) {
              tripId = part;
              break;
            }
          }
        }

        if (!tripId) {
          console.log('⚠️ Could not extract trip_id from event_key:', event.event_key);
          errors++;
          continue;
        }

        console.log('🔍 Processing event:', event.event_key, 'trip_id:', tripId);

        // Find payment by trip_id
        const { data: payments, error: findError } = await supabase
          .from('payments')
          .select('id, order_id, wetravel_data, status')
          .contains('wetravel_data', { trip_id: tripId })
          .limit(1);

        if (findError || !payments || payments.length === 0) {
          console.log('⚠️ Could not find payment for trip_id:', tripId);
          errors++;
          continue;
        }

        const payment = payments[0];
        console.log('✅ Found payment:', payment.id, 'order:', payment.order_id);

        // Update the event
        const { error: updateError } = await supabase
          .from('wetravel_events')
          .update({
            payment_id: payment.id,
            order_id: payment.order_id
          })
          .eq('event_key', event.event_key);

        if (updateError) {
          console.error('❌ Error updating event:', updateError);
          errors++;
          continue;
        }

        // Update payment status if needed
        if (payment.status === 'pending') {
          await supabase
            .from('payments')
            .update({ status: 'booking_created' })
            .eq('id', payment.id);

          await supabase
            .from('orders')
            .update({ status: 'booking_created' })
            .eq('id', payment.order_id);

          console.log('✅ Updated payment and order status for:', payment.id);
        }

        fixed++;

      } catch (error) {
        console.error('❌ Error processing event:', event.event_key, error);
        errors++;
      }
    }

    console.log('🎯 Fix completed - Fixed:', fixed, 'Errors:', errors);

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} orphaned events with ${errors} errors`,
      fixed,
      errors,
      total_orphaned: orphanedEvents?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in manual fix:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Just check how many orphaned events we have
    const { data: orphanedEvents, error } = await supabase
      .from('wetravel_events')
      .select('event_key, processed_at')
      .eq('event_type', 'booking.created')
      .is('payment_id', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orphaned_events: orphanedEvents?.length || 0,
      events: orphanedEvents || []
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}