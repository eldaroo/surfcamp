import { NextRequest, NextResponse } from 'next/server';

// Tipos para el webhook de WeTravel
interface WeTravelWebhookData {
  event_type: string;
  trip_id: string;
  customer_id: string;
  payment_status: string;
  amount: number;
  currency: string;
  metadata?: {
    trip_id?: string;
    customer_id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 WeTravel webhook received:', {
      timestamp: new Date().toISOString(),
      body: body
    });

    // Validar que sea un webhook válido de WeTravel
    if (!body.event_type || !body.trip_id) {
      console.warn('⚠️ Invalid webhook payload received:', body);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const webhookData: WeTravelWebhookData = body;

    // Manejar diferentes tipos de eventos
    switch (webhookData.event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(webhookData);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData);
        break;
      
      case 'payment.refunded':
        await handlePaymentRefunded(webhookData);
        break;
      
      case 'trip.confirmed':
        await handleTripConfirmed(webhookData);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event type: ${webhookData.event_type}`);
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

// Función para manejar pagos completados
async function handlePaymentCompleted(webhookData: WeTravelWebhookData) {
  try {
    console.log('💰 Payment completed webhook received:', {
      trip_id: webhookData.trip_id,
      customer_id: webhookData.customer_id,
      amount: webhookData.amount,
      currency: webhookData.currency
    });

    // TODO: Implementar lógica para actualizar el estado de la reserva
    // 1. Buscar la reserva por trip_id o customer_id
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
      trip_id: webhookData.trip_id,
      customer_id: webhookData.customer_id,
      amount: webhookData.amount
    });

    // TODO: Implementar lógica para manejar pagos fallidos
    // 1. Buscar la reserva
    // 2. Actualizar el estado a 'payment_failed'
    // 3. Notificar al usuario sobre el problema
    // 4. Ofrecer opciones alternativas de pago

    console.log('✅ Payment failed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment failed webhook:', error);
    throw error;
  }
}

// Función para manejar reembolsos
async function handlePaymentRefunded(webhookData: WeTravelWebhookData) {
  try {
    console.log('💸 Payment refunded webhook received:', {
      trip_id: webhookData.trip_id,
      customer_id: webhookData.customer_id,
      amount: webhookData.amount
    });

    // TODO: Implementar lógica para manejar reembolsos
    // 1. Buscar la reserva
    // 2. Actualizar el estado a 'refunded'
    // 3. Cancelar la reserva si es necesario
    // 4. Notificar al usuario

    console.log('✅ Payment refunded webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment refunded webhook:', error);
    throw error;
  }
}

// Función para manejar confirmación de viaje
async function handleTripConfirmed(webhookData: WeTravelWebhookData) {
  try {
    console.log('✅ Trip confirmed webhook received:', {
      trip_id: webhookData.trip_id,
      customer_id: webhookData.customer_id
    });

    // TODO: Implementar lógica para confirmación de viaje
    // 1. Buscar la reserva
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
      'payment.completed',
      'payment.failed', 
      'payment.refunded',
      'trip.confirmed'
    ]
  });
}
