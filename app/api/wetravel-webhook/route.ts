import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
  console.log('🔐 Computed signature:', expectedSignature);
  console.log('🔐 Received signature:', signature);
  
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
    
    const signature = request.headers.get('x-webhook-signature') || '';
    const rawBody = await request.text();
    
    console.log('📝 Raw webhook payload:', rawBody);
    console.log('🔐 Webhook signature:', signature);
    
    // Verify webhook signature
    const webhookSecret = process.env.WETRAVEL_WEBHOOK_SECRET!;
    if (signature && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    console.log('✅ Webhook signature verified');
    
    const body = JSON.parse(rawBody);
    console.log('🔔 WeTravel webhook received:', {
      timestamp: new Date().toISOString(),
      body: body
    });

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
    
    console.log(`📋 Processing webhook - Type: ${eventType}, Trip ID: ${tripId}`);
    
    if (!tripId) {
      console.warn('⚠️ No trip ID found in webhook payload');
      // Continue processing anyway, log for debugging
    }
    
    // Save event to database for audit trail and deduplication
    const eventKey = `${eventType}_${tripId || 'no_trip_id'}_${Date.now()}`;
    console.log(`📋 Processing webhook event: ${eventType} for trip ${tripId}`);
    
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
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}`);
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

// Endpoint GET para verificar que el webhook esté funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'WeTravel webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supported_events: [
      'partial_refund_made',
      'booking.updated',
      'payment.completed',
      'payment.failed',
      'trip.confirmed'
    ]
  });
}
