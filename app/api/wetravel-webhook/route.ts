import { NextRequest, NextResponse } from 'next/server';

// Tipos para el webhook de WeTravel (formato real)
interface WeTravelWebhookData {
  data: {
    booking_note?: string;
    buyer: {
      cancelled: boolean;
      email: string;
      first_name: string;
      full_name: string;
      id: number;
      last_name: string;
    };
    created_at: string;
    departure_date: string;
    event_type: string;
    order_id: string;
    participants: Array<{
      cancelled: boolean;
      email: string;
      first_name: string;
      full_name: string;
      id: string;
      last_name: string;
    }>;
    rebooked_from_order_id?: string | null;
    total_deposit_amount: number;
    total_due_amount: number;
    total_paid_amount: number;
    total_price_amount: number;
    trip_currency: string;
    trip_end_date: string;
    trip_id: string;
    trip_length: number;
    trip_title: string;
    trip_uuid: string;
  };
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 WeTravel webhook received:', {
      timestamp: new Date().toISOString(),
      body: body
    });

    // Validar que sea un webhook válido de WeTravel
    if (!body.data?.event_type || !body.data?.trip_id || !body.type) {
      console.warn('⚠️ Invalid webhook payload received:', body);
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing event_type, trip_id, or type' },
        { status: 400 }
      );
    }

    const webhookData: WeTravelWebhookData = body;

    // Manejar diferentes tipos de eventos
    switch (webhookData.data.event_type) {
      case 'partial_refund_made':
        await handlePartialRefund(webhookData);
        break;
      
      case 'booking.updated':
        await handleBookingUpdated(webhookData);
        break;
      
      case 'payment.completed':
        await handlePaymentCompleted(webhookData);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData);
        break;
      
      case 'trip.confirmed':
        await handleTripConfirmed(webhookData);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event type: ${webhookData.data.event_type}`);
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
      buyer: webhookData.data.buyer.full_name,
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
      buyer: webhookData.data.buyer.full_name,
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

// Función para manejar pagos completados
async function handlePaymentCompleted(webhookData: WeTravelWebhookData) {
  try {
    console.log('💰 Payment completed webhook received:', {
      trip_id: webhookData.data.trip_id,
      trip_uuid: webhookData.data.trip_uuid,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer.full_name,
      total_paid_amount: webhookData.data.total_paid_amount,
      currency: webhookData.data.trip_currency
    });

    // TODO: Implementar lógica para actualizar el estado de la reserva
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado a 'paid' o 'confirmed'
    // 3. Enviar confirmación por email
    // 4. Enviar notificación por WhatsApp
    // 5. Actualizar la base de datos

    console.log('✅ Payment completed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment completed webhook:', error);
    throw error;
  }
}

// Función para manejar pagos fallidos
async function handlePaymentFailed(webhookData: WeTravelWebhookData) {
  try {
    console.log('❌ Payment failed webhook received:', {
      trip_id: webhookData.data.trip_id,
      trip_uuid: webhookData.data.trip_uuid,
      order_id: webhookData.data.order_id,
      buyer: webhookData.data.buyer.full_name,
      total_due_amount: webhookData.data.total_due_amount,
      currency: webhookData.data.trip_currency
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
      buyer: webhookData.data.buyer.full_name,
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
