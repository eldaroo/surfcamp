import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendDarioWelcomeMessage } from '@/lib/whatsapp';

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

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const expectedSignature = `sha256=${computedSignature}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

// Tipos para el webhook de WeTravel (formato real)
interface WeTravelWebhookData {
  data: {
    // Payment data
    id?: string; // payment ID
    order_id?: string;
    status?: string;
    total_amount?: number;
    subtotal_amount?: number;
    net_amount?: number;
    payment_processing_fee?: number;
    currency?: string;
    payment_method?: string;
    payment_type?: string;
    created_at?: string;
    updated_at?: string;
    
    // Buyer info
    buyer?: {
      email: string;
      first_name: string;
      last_name: string;
    };
    
    // Trip info
    trip?: {
      uuid: string;
      title: string;
      start_date: string;
      end_date: string;
      location: string;
      recurring: boolean;
      trip_id?: string | null;
    };
    
    // Participants
    participants?: Array<{
      email: string;
      first_name: string;
      last_name: string;
    }>;
    
    // Legacy format support
    booking_note?: string;
    departure_date?: string;
    event_type?: string;
    total_deposit_amount?: number;
    total_due_amount?: number;
    total_paid_amount?: number;
    total_price_amount?: number;
    trip_currency?: string;
    trip_end_date?: string;
    trip_id?: string;
    trip_length?: number;
    trip_title?: string;
    trip_uuid?: string;
  };
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 WeTravel webhook received');
    console.log('📋 Headers:', Object.fromEntries(request.headers.entries()));

    const signature = request.headers.get('x-webhook-signature') || '';
    const rawBody = await request.text();

    console.log('📦 Raw body length:', rawBody.length);
    console.log('🔐 Signature:', signature ? signature.substring(0, 20) + '...' : 'none');

    // Webhook payload received
    
    // Verify webhook signature
    const webhookSecret = process.env.WETRAVEL_WEBHOOK_SECRET;
    if (signature && webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook signature validation skipped (no secret or signature)');
    }
    
    // Signature verified
    
    const body = JSON.parse(rawBody);

    // Validar que sea un webhook válido de WeTravel (soporta múltiples formatos)
    if (!body.type || !body.data) {
      console.warn('⚠️ Invalid webhook payload received:', body);
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing type or data' },
        { status: 400 }
      );
    }

    const webhookData: WeTravelWebhookData = body;

    // Determinar el tipo de evento y trip ID según el formato
    let eventType = body.type; // payment.created, payment.updated, etc.
    let tripId = body.data?.trip?.uuid || body.data?.trip_uuid || body.data?.trip_id;

    // Para booking.created, también intentar obtener order_id como fallback
    let orderId = body.data?.order_id;

    console.log('🎯 WeTravel webhook:', eventType, tripId ? `trip:${tripId}` : 'no-trip-id', orderId ? `order:${orderId}` : 'no-order-id');
    
    // Process webhook event
    if (!tripId) {
      console.warn('⚠️ No trip ID found in webhook payload');
    }

    // For booking.created, we need to find the payment first to get the correct order_id
    // before creating the event_key to ensure consistency
    let actualOrderId = null;
    if (eventType === 'booking.created' && tripId) {
      console.log('🔍 Pre-searching for payment with trip_id:', tripId);

      // Quick search to find the correct order_id before creating event_key
      const { data: foundPayments, error: searchError } = await supabase
        .from('payments')
        .select('order_id, wetravel_data')
        .contains('wetravel_data', { trip_id: tripId })
        .limit(1);

      console.log('🔍 Pre-search result:', {
        foundPayments,
        searchError,
        searchQuery: { trip_id: tripId },
        foundCount: foundPayments?.length || 0,
        foundData: foundPayments?.map(p => ({
          order_id: p.order_id,
          wetravel_data_trip_id: p.wetravel_data?.trip_id
        })) || []
      });

      if (foundPayments && foundPayments.length > 0) {
        actualOrderId = foundPayments[0].order_id;
        console.log('🎯 Found actual order_id for event_key:', actualOrderId);
      } else {
        console.log('⚠️ Pre-search did not find payment, will use fallback logic');
      }
    }

    // Save event to database for audit trail and deduplication
    // Use actual order_id if found, otherwise fallback to provided IDs
    const eventKey = `${eventType}_${actualOrderId || orderId || tripId || 'no_id'}_${tripId || 'no_trip'}`;
    
    // Check for duplicate events
    const { data: existingEvent } = await supabase
      .from('wetravel_events')
      .select('event_key')
      .eq('event_key', eventKey)
      .single();
    
    if (existingEvent) {
      console.log('⚠️ Duplicate event detected, ignoring:', eventKey);
      return NextResponse.json({ status: 'duplicate', event_key: eventKey });
    }
    
    // Save event to database
    const { error: eventError } = await supabase
      .from('wetravel_events')
      .insert({
        event_key: eventKey,
        event_type: eventType,
        payment_id: null, // Will be updated if we find matching payment
        order_id: null    // Will be updated if we find matching order
      });
    
    if (eventError) {
      console.error('❌ Failed to save event:', eventError);
    } else {
      console.log('✅ Event saved to database:', eventKey);
    }

    // After processing, try to fix orphaned events if this is a booking.created
    if (eventType === 'booking.created') {
      setTimeout(() => {
        fixOrphanedEvents(tripId, orderId).catch(console.error);
      }, 1000); // Give 1 second delay to allow processing
    }

    // Manejar diferentes tipos de eventos
    switch (eventType) {
      case 'payment.created':
        await handlePaymentCreated(webhookData, tripId);
        break;
      
      case 'payment.completed':
        await handlePaymentCompleted(webhookData, tripId, eventType);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData, tripId);
        break;
      
      case 'payment.updated':
        await handlePaymentUpdated(webhookData, tripId);
        break;

      case 'booking.created':
        await handleBookingCreated(webhookData, tripId, orderId, actualOrderId, eventKey);
        break;

      // Legacy events
      case 'partial_refund_made':
        await handlePartialRefund(webhookData);
        break;

      case 'booking.updated':
        await handleBookingUpdated(webhookData);
        break;
      
      case 'trip.confirmed':
        await handleTripConfirmed(webhookData);
        break;
      
      default:
        console.warn(`Unhandled webhook event: ${eventType}`);
        break;
    }

    // Responder con éxito a WeTravel
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ Error processing WeTravel webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función para manejar reembolsos parciales
async function handlePartialRefund(webhookData: WeTravelWebhookData) {
  try {
    console.log('💸 Partial refund webhook received:', {
      trip_id: webhookData.data.trip_id,
      trip_uuid: webhookData.data.trip_uuid,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      total_paid_amount: webhookData.data.total_paid_amount,
      total_due_amount: webhookData.data.total_due_amount,
      currency: webhookData.data.trip_currency
    });

    // TODO: Implementar lógica para manejar reembolsos parciales
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado de pago
    // 3. Notificar al usuario sobre el reembolso
    // 4. Actualizar la base de datos

    console.log('✅ Partial refund webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling partial refund webhook:', error);
    throw error;
  }
}

// Función para manejar actualizaciones de reserva
async function handleBookingUpdated(webhookData: WeTravelWebhookData) {
  try {
    console.log('📝 Booking updated webhook received:', {
      trip_id: webhookData.data.trip_id,
      trip_uuid: webhookData.data.trip_uuid,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      trip_title: webhookData.data.trip_title,
      departure_date: webhookData.data.departure_date,
      total_paid_amount: webhookData.data.total_paid_amount,
      total_due_amount: webhookData.data.total_due_amount
    });

    // TODO: Implementar lógica para manejar actualizaciones de reserva
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar información de la reserva
    // 3. Notificar al usuario sobre cambios
    // 4. Actualizar la base de datos

    console.log('✅ Booking updated webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling booking updated webhook:', error);
    throw error;
  }
}

// Función para manejar pagos creados
async function handlePaymentCreated(webhookData: WeTravelWebhookData, tripId?: string) {
  try {
    console.log('💳 Payment created webhook received:', {
      trip_id: tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      amount: webhookData.data.total_amount,
      currency: webhookData.data.currency,
      status: webhookData.data.status,
      buyer: webhookData.data.buyer?.first_name + ' ' + webhookData.data.buyer?.last_name
    });

    // For payment.created, we mainly log and potentially update status
    // The payment should already exist in our DB from the payment link creation
    if (tripId) {
      const { data: payments, error: findError } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, status')
        .contains('wetravel_data', { trip_id: tripId });

      if (!findError && payments && payments.length > 0) {
        const payment = payments[0];
        console.log(`💳 Found matching payment: ${payment.id} for trip: ${tripId}`);
        
        // Update with WeTravel payment data
        await supabase
          .from('payments')
          .update({
            wetravel_data: {
              ...payment.wetravel_data,
              payment_created_webhook: webhookData,
              wetravel_payment_id: webhookData.data.id,
              wetravel_order_id: webhookData.data.order_id,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', payment.id);
        
        console.log('✅ Payment updated with WeTravel payment creation data');
      }
    }

    console.log('✅ Payment created webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment created webhook:', error);
    throw error;
  }
}

// Función para manejar pagos actualizados
async function handlePaymentUpdated(webhookData: WeTravelWebhookData, tripId?: string) {
  try {
    console.log('🔄 Payment updated webhook received:', {
      trip_id: tripId,
      payment_id: webhookData.data.id,
      status: webhookData.data.status,
      amount: webhookData.data.total_amount
    });

    // Similar logic to payment.completed but for status updates
    if (tripId) {
      const { data: payments, error: findError } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data')
        .contains('wetravel_data', { trip_id: tripId });

      if (!findError && payments && payments.length > 0) {
        const payment = payments[0];
        
        await supabase
          .from('payments')
          .update({
            wetravel_data: {
              ...payment.wetravel_data,
              payment_updated_webhook: webhookData,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', payment.id);
        
        console.log('✅ Payment updated with latest WeTravel data');
      }
    }

    console.log('✅ Payment updated webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment updated webhook:', error);
    throw error;
  }
}

// Función para manejar pagos completados
async function handlePaymentCompleted(webhookData: WeTravelWebhookData, tripId?: string, eventType?: string) {
  try {
    console.log('💰 Payment completed webhook received:', {
      trip_id: tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_paid_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      status: webhookData.data.status
    });

    // Find payment by trip_id in the wetravel_data JSONB field
    if (!tripId) {
      console.log('ℹ️ No trip ID available, cannot find matching payment');
      return;
    }

    const { data: payments, error: findError } = await supabase
      .from('payments')
      .select('id, order_id, wetravel_data, status')
      .contains('wetravel_data', { trip_id: tripId });

    if (findError) {
      console.error('❌ Error finding payment:', findError);
      return;
    }

    if (payments && payments.length > 0) {
      const payment = payments[0];
      console.log(`💰 Found matching payment: ${payment.id} for order: ${payment.order_id}`);
      
      // Update payment status to completed
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          wetravel_data: {
            ...payment.wetravel_data,
            payment_completed_webhook: webhookData,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('❌ Error updating payment:', updatePaymentError);
      } else {
        console.log('✅ Payment marked as completed in database');
        
        // Update order status to paid
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', payment.order_id);

        if (updateOrderError) {
          console.error('❌ Error updating order status:', updateOrderError);
        } else {
          console.log('✅ Order marked as paid in database');
        }
        
        // Update the wetravel_events record with the payment and order IDs
        await supabase
          .from('wetravel_events')
          .update({
            payment_id: payment.id,
            order_id: payment.order_id
          })
          .eq('event_type', eventType)
          .like('event_key', `%${tripId}%`);
      }
    } else {
      console.log('ℹ️ No matching payment found for trip_id:', tripId);
      console.log('💰 Payment details:', {
        amount: webhookData.data.total_amount || webhookData.data.total_paid_amount,
        currency: webhookData.data.currency || webhookData.data.trip_currency,
        customer: webhookData.data.buyer ? 
          `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
          'Unknown'
      });
    }

    console.log('✅ Payment completed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment completed webhook:', error);
    throw error;
  }
}

// Función para manejar pagos fallidos
async function handlePaymentFailed(webhookData: WeTravelWebhookData, tripId?: string) {
  try {
    console.log('❌ Payment failed webhook received:', {
      trip_id: tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_due_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      status: webhookData.data.status
    });

    // TODO: Implementar lógica para manejar pagos fallidos
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado a 'payment_failed'
    // 3. Notificar al usuario sobre el problema
    // 4. Ofrecer opciones alternativas de pago

    console.log('✅ Payment failed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment failed webhook:', error);
    throw error;
  }
}

// Función para manejar confirmación de viaje
async function handleTripConfirmed(webhookData: WeTravelWebhookData) {
  try {
    console.log('✅ Trip confirmed webhook received:', {
      trip_id: webhookData.data.trip_id,
      trip_uuid: webhookData.data.trip_uuid,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      trip_title: webhookData.data.trip_title,
      departure_date: webhookData.data.departure_date
    });

    // TODO: Implementar lógica para confirmación de viaje
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado a 'confirmed'
    // 3. Enviar confirmación final al usuario
    // 4. Activar notificaciones de recordatorio

    console.log('✅ Trip confirmed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling trip confirmed webhook:', error);
    throw error;
  }
}

// Función para manejar reserva creada
async function handleBookingCreated(webhookData: WeTravelWebhookData, tripId?: string, orderId?: string, actualOrderId?: string, eventKey?: string) {
  try {
    console.log('🎉 Booking created webhook received:', {
      trip_id: tripId,
      order_id: orderId,
      actual_order_id: actualOrderId,
      buyer: webhookData.data.buyer ?
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` :
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_price_amount || webhookData.data.total_paid_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      trip_title: webhookData.data.trip_title,
      participants: webhookData.data.participants?.length || 1
    });

    // Find payment - use actualOrderId if available, otherwise fallback to previous logic
    let payments = null;
    let findError = null;

    if (actualOrderId) {
      console.log('🎯 Using pre-found order_id to fetch payment details:', actualOrderId);
      const result = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, status')
        .eq('order_id', actualOrderId);

      payments = result.data;
      findError = result.error;
      console.log('🎯 Pre-found payment result:', { payments: payments?.length, error: findError });
    } else if (tripId) {
      // Fallback to trip_id search
      console.log('🔍 Fallback: searching by trip_id...');
      const result = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, status')
        .contains('wetravel_data', { trip_id: tripId });

      payments = result.data;
      findError = result.error;
    }

    if (findError) {
      console.error('❌ Error finding payment:', findError);
      return;
    }

    if (payments && payments.length > 0) {
      const payment = payments[0];
      console.log(`🎉 Found matching payment: ${payment.id} for order: ${payment.order_id}`);

      // Update payment status to booking_created (intermediate status before completed)
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'booking_created', // New intermediate status
          wetravel_data: {
            ...payment.wetravel_data,
            booking_created_webhook: webhookData,
            booking_created_at: new Date().toISOString()
          }
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('❌ Error updating payment:', updatePaymentError);
      } else {
        console.log('✅ Payment marked as booking_created in database');

        // Update order status to booking_created
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({ status: 'booking_created' })
          .eq('id', payment.order_id);

        if (updateOrderError) {
          console.error('❌ Error updating order status:', updateOrderError);
        } else {
          console.log('✅ Order marked as booking_created in database');

          // Send Dario welcome message to customer
          try {
            // Get order details for the welcome message
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('booking_data')
              .eq('id', payment.order_id)
              .single();

            if (orderData && orderData.booking_data && !orderError) {
              const booking = orderData.booking_data;

              // Get room type name
              const roomTypeNames: { [key: string]: string } = {
                'casa-playa': 'Casa de Playa (Cuarto Compartido)',
                'casitas-privadas': 'Casitas Privadas',
                'casas-deluxe': 'Casas Deluxe'
              };

              const roomTypeName = roomTypeNames[booking.roomTypeId] || booking.roomTypeId;

              // Prepare activities list
              const activities = booking.selectedActivities?.map((activity: any) => activity.name) || [];

              // Send welcome message from Dario
              const messageResult = await sendDarioWelcomeMessage(
                booking.contactInfo.phone,
                {
                  checkIn: booking.checkIn,
                  checkOut: booking.checkOut,
                  guestName: booking.contactInfo.firstName,
                  activities: activities,
                  roomTypeName: roomTypeName,
                  guests: booking.guests
                }
              );

              if (messageResult.success) {
                console.log('✅ Dario welcome message sent successfully');
              } else {
                console.error('❌ Failed to send Dario welcome message:', messageResult.error);
              }
            } else {
              console.error('❌ Could not retrieve order data for welcome message:', orderError);
            }
          } catch (error) {
            console.error('❌ Error sending Dario welcome message:', error);
          }
        }

        // Update the wetravel_events record with the payment and order IDs
        if (eventKey) {
          await supabase
            .from('wetravel_events')
            .update({
              payment_id: payment.id,
              order_id: payment.order_id
            })
            .eq('event_key', eventKey);
        } else {
          // Fallback update for older events
          await supabase
            .from('wetravel_events')
            .update({
              payment_id: payment.id,
              order_id: payment.order_id
            })
            .eq('event_type', 'booking.created')
            .like('event_key', `%${tripId}%`);
        }

        // Also try to update any existing orphaned events for this trip
        const { data: orphanUpdate, error: orphanError } = await supabase
          .from('wetravel_events')
          .update({
            payment_id: payment.id,
            order_id: payment.order_id
          })
          .eq('event_type', 'booking.created')
          .like('event_key', `%${tripId}%`)
          .is('payment_id', null)
          .select();

        console.log('🔧 Orphan update result:', {
          updated: orphanUpdate?.length || 0,
          error: orphanError,
          tripId
        });
      }
    } else {
      console.log('❌ No matching payment found!');
      console.log('🔍 Search criteria used:', {
        tripId,
        orderId,
        searchAttempts: [
          tripId ? 'wetravel_data contains trip_id' : null,
          orderId ? 'wetravel_order_id equals order_id' : null,
          orderId ? 'wetravel_data contains order_id' : null
        ].filter(Boolean)
      });
      console.log('🎉 Booking details:', {
        amount: webhookData.data.total_amount || webhookData.data.total_price_amount || webhookData.data.total_paid_amount,
        currency: webhookData.data.currency || webhookData.data.trip_currency,
        customer: webhookData.data.buyer ?
          `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` :
          'Unknown',
        trip_title: webhookData.data.trip_title,
        full_webhook_data: JSON.stringify(webhookData, null, 2)
      });

      // Try to find any payment records to see what's in the database
      const { data: allPayments, error: allPaymentsError } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, wetravel_order_id, status')
        .limit(5);

      if (!allPaymentsError && allPayments) {
        console.log('💳 Recent payments in database:', allPayments);
      }
    }

    console.log('✅ Booking created webhook processed successfully');

  } catch (error) {
    console.error('❌ Error handling booking created webhook:', error);
    throw error;
  }
}

// Function to fix orphaned events (events with null payment_id/order_id)
async function fixOrphanedEvents(tripId?: string, webhookOrderId?: string) {
  if (!tripId) return;

  try {
    console.log('🔧 Attempting to fix orphaned events for trip_id:', tripId);

    // Find payment by trip_id
    const { data: payments, error: findError } = await supabase
      .from('payments')
      .select('id, order_id, wetravel_data, status')
      .contains('wetravel_data', { trip_id: tripId })
      .limit(1);

    if (findError || !payments || payments.length === 0) {
      console.log('⚠️ Could not find payment to fix orphaned events');
      return;
    }

    const payment = payments[0];
    console.log('🔧 Found payment for orphan fix:', payment.id, 'order:', payment.order_id);

    // Update all orphaned events for this trip
    const { data: updatedEvents, error: updateError } = await supabase
      .from('wetravel_events')
      .update({
        payment_id: payment.id,
        order_id: payment.order_id
      })
      .eq('event_type', 'booking.created')
      .like('event_key', `%${tripId}%`)
      .is('payment_id', null)
      .select();

    if (updateError) {
      console.error('❌ Error fixing orphaned events:', updateError);
    } else {
      console.log('✅ Fixed orphaned events:', updatedEvents?.length || 0);

      // Also update payment status if it's still pending
      if (payment.status === 'pending') {
        await supabase
          .from('payments')
          .update({ status: 'booking_created' })
          .eq('id', payment.id);

        await supabase
          .from('orders')
          .update({ status: 'booking_created' })
          .eq('id', payment.order_id);

        console.log('✅ Updated payment and order status to booking_created');
      }
    }

  } catch (error) {
    console.error('❌ Error in fixOrphanedEvents:', error);
  }
}

// Endpoint GET para verificar que el webhook esté funcionando
export async function GET() {
  return NextResponse.json({
    status: 'WeTravel webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supported_events: [
      'partial_refund_made',
      'booking.created',
      'booking.updated',
      'payment.completed',
      'payment.failed',
      'trip.confirmed'
    ]
  });
}
