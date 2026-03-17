import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, updatePayment, updateOrder, updateWetravelEventByKey } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual fix for orphaned events requested');

    // Get all orphaned events
    const orphanedEvents = await query(
      `SELECT * FROM wetravel_events
       WHERE event_type = 'booking.created' AND payment_id IS NULL`
    );

    if (!orphanedEvents) {
      console.error('❌ Error fetching orphaned events');
      return NextResponse.json({ error: 'Error fetching orphaned events' }, { status: 500 });
    }

    console.log('🔍 Found orphaned events:', orphanedEvents.length || 0);

    let fixed = 0;
    let errors = 0;

    for (const event of orphanedEvents || []) {
      try {
        // Extract trip_id from event_key (format: booking.created_tripId_timestamp)
        const eventKeyParts = (event as any).event_key.split('_');
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
          console.log('⚠️ Could not extract trip_id from event_key:', (event as any).event_key);
          errors++;
          continue;
        }

        console.log('🔍 Processing event:', (event as any).event_key, 'trip_id:', tripId);

        // Find payment by trip_id
        const payments = await query(
          `SELECT id, order_id, wetravel_data, status
           FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
          [JSON.stringify({ trip_id: tripId })]
        );

        if (!payments || payments.length === 0) {
          console.log('⚠️ Could not find payment for trip_id:', tripId);
          errors++;
          continue;
        }

        const payment = payments[0] as any;
        console.log('✅ Found payment:', payment.id, 'order:', payment.order_id);

        // Update the event
        try {
          await updateWetravelEventByKey((event as any).event_key, {
            payment_id: payment.id,
            order_id: payment.order_id
          });
        } catch (updateError) {
          console.error('❌ Error updating event:', updateError);
          errors++;
          continue;
        }

        // Update payment status if needed
        if (payment.status === 'pending') {
          await updatePayment(payment.id, { status: 'booking_created' });
          await updateOrder(payment.order_id, { status: 'booking_created' });

          console.log('✅ Updated payment and order status for:', payment.id);
        }

        fixed++;

      } catch (error) {
        console.error('❌ Error processing event:', (event as any).event_key, error);
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
    const orphanedEvents = await query(
      `SELECT event_key, processed_at FROM wetravel_events
       WHERE event_type = 'booking.created' AND payment_id IS NULL`
    );

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
