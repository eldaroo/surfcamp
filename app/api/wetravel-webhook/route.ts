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
    payment_id?: string;
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

interface WeTravelIdentifiers {
  tripId?: string | null;
  wetravelOrderId?: string | null;
  metadataOrderId?: string | null;
  wetravelPaymentId?: string | null;
  metadataPaymentId?: string | null;
}

interface PaymentRecord {
  id: string;
  order_id: string;
  status: string;
  wetravel_data: Record<string, unknown> | null;
  wetravel_order_id?: string | null;
}

interface PaymentSearchContext extends WeTravelIdentifiers {
  actualOrderId?: string | null;
  eventType?: string;
}

interface PaymentSearchResult {
  payment: PaymentRecord;
  matchedBy: string;
}

interface BookingEventContext {
  eventKey?: string;
  actualOrderId?: string | null;
}

function extractWebhookIdentifiers(webhookData: WeTravelWebhookData): WeTravelIdentifiers {
  const data = webhookData?.data || {};
  const metadata = (data as Record<string, any>)?.metadata || {};
  const metadataBooking = (metadata as Record<string, any>)?.booking_data || {};

  const tripId =
    data?.trip?.uuid ||
    data?.trip_uuid ||
    data?.trip_id ||
    metadata?.trip_id ||
    metadataBooking?.trip_id ||
    metadataBooking?.tripUuid ||
    null;

  const wetravelOrderId = data?.order_id || metadata?.wetravel_order_id || null;
  const metadataOrderId =
    metadata?.order_id ||
    metadataBooking?.order_id ||
    metadataBooking?.orderId ||
    null;

  const wetravelPaymentId = data?.id || data?.payment_id || null;
  const metadataPaymentId = metadata?.payment_id || metadata?.paymentId || null;

  return {
    tripId,
    wetravelOrderId,
    metadataOrderId,
    wetravelPaymentId,
    metadataPaymentId
  };
}

function buildUpdatedWetravelData(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
) {
  return {
    ...(existing || {}),
    ...patch
  };
}

async function findMatchingPayment(
  context: PaymentSearchContext
): Promise<PaymentSearchResult | null> {
  const selectColumns = 'id, order_id, status, wetravel_data, wetravel_order_id';
  const attempts: Array<{
    label: string;
    run: () => Promise<{ payment: PaymentRecord | null; error: any }>;
  }> = [];

  const addEqAttempt = (field: string, value?: string | null, label?: string) => {
    if (!value) return;
    attempts.push({
      label: label || `${field} = ${value}`,
      run: async () => {
        const { data, error } = await supabase
          .from('payments')
          .select(selectColumns)
          .eq(field, value)
          .maybeSingle();
        return {
          payment: (data as PaymentRecord | null) || null,
          error
        };
      }
    });
  };

  const addContainsAttempt = (
    value: Record<string, unknown>,
    label: string
  ) => {
    if (!value || Object.keys(value).length === 0) return;
    attempts.push({
      label,
      run: async () => {
        const { data, error } = await supabase
          .from('payments')
          .select(selectColumns)
          .contains('wetravel_data', value)
          .limit(1);
        const paymentArray = (data as PaymentRecord[] | null) || [];
        return {
          payment: paymentArray.length > 0 ? paymentArray[0] : null,
          error
        };
      }
    });
  };

  addEqAttempt('order_id', context.actualOrderId, 'order_id (actualOrderId)');
  addEqAttempt('order_id', context.metadataOrderId, 'order_id (metadataOrderId)');
  addEqAttempt('order_id', context.wetravelOrderId, 'order_id (wetravelOrderId)');
  addEqAttempt('wetravel_order_id', context.metadataOrderId, 'wetravel_order_id (metadataOrderId)');
  addEqAttempt('wetravel_order_id', context.wetravelOrderId, 'wetravel_order_id (WeTravel order_id)');

  addContainsAttempt(
    context.tripId ? { trip_id: context.tripId } : {},
    'wetravel_data contains trip_id'
  );
  addContainsAttempt(
    context.metadataOrderId ? { metadata_order_id: context.metadataOrderId } : {},
    'wetravel_data contains metadata_order_id'
  );
  addContainsAttempt(
    context.wetravelOrderId ? { wetravel_order_id: context.wetravelOrderId } : {},
    'wetravel_data contains wetravel_order_id'
  );
  addContainsAttempt(
    context.wetravelPaymentId ? { wetravel_payment_id: context.wetravelPaymentId } : {},
    'wetravel_data contains wetravel_payment_id'
  );
  addContainsAttempt(
    context.metadataPaymentId
      ? { metadata: { payment_id: context.metadataPaymentId } }
      : {},
    'wetravel_data.metadata.payment_id'
  );

  for (const attempt of attempts) {
    console.log('🔍 [LOBBYPMS-DEBUG] Payment search attempt:', attempt.label);
    try {
      const { payment, error } = await attempt.run();
      if (error) {
        console.error('❌ [LOBBYPMS-DEBUG] Payment search error:', {
          label: attempt.label,
          error,
          eventType: context.eventType || 'unknown'
        });
        continue;
      }

      if (payment) {
        console.log('✅ [LOBBYPMS-DEBUG] Payment found:', {
          matchedBy: attempt.label,
          paymentId: payment.id,
          orderId: payment.order_id,
          wetravelOrderId: payment.wetravel_order_id || null
        });
        return {
          payment,
          matchedBy: attempt.label
        };
      }
    } catch (searchError) {
      console.error('❌ [LOBBYPMS-DEBUG] Unexpected payment search failure:', {
        label: attempt.label,
        error: searchError,
        eventType: context.eventType || 'unknown'
      });
    }
  }

  console.log('⚠️ [LOBBYPMS-DEBUG] No matching payment found after attempts:', {
    eventType: context.eventType || 'unknown',
    attempts: attempts.map((attempt) => attempt.label)
  });

  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('');
    console.log('🔵 [LOBBYPMS-DEBUG] ='.repeat(40));
    console.log('🔵 [LOBBYPMS-DEBUG] 🎯 WeTravel webhook received');
    console.log('🔵 [LOBBYPMS-DEBUG] 📋 Headers:', Object.fromEntries(request.headers.entries()));

    const signature = request.headers.get('x-webhook-signature') || '';
    const rawBody = await request.text();

    console.log('🔵 [LOBBYPMS-DEBUG] 📦 Raw body length:', rawBody.length);
    console.log('🔵 [LOBBYPMS-DEBUG] 🔐 Signature:', signature ? signature.substring(0, 20) + '...' : 'none');

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

    console.log('🔵 [LOBBYPMS-DEBUG] 📦 Parsed body:', JSON.stringify(body, null, 2));

    // Validar que sea un webhook válido de WeTravel (soporta múltiples formatos)
    if (!body.type || !body.data) {
      console.warn('🔵 [LOBBYPMS-DEBUG] ⚠️ Invalid webhook payload received:', body);
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing type or data' },
        { status: 400 }
      );
    }

    const webhookData: WeTravelWebhookData = body;

    // Determinar el tipo de evento y extraer identificadores útiles
    const eventType = body.type; // payment.created, payment.updated, etc.
    const identifiers = extractWebhookIdentifiers(webhookData);

    let tripId =
      identifiers.tripId ||
      body.data?.trip?.uuid ||
      body.data?.trip_uuid ||
      body.data?.trip_id ||
      null;

    let orderId = identifiers.wetravelOrderId || body.data?.order_id || null;
    const metadataOrderId = identifiers.metadataOrderId || null;
    const wetravelPaymentId = identifiers.wetravelPaymentId || null;
    const metadataPaymentId = identifiers.metadataPaymentId || null;

    console.log('🔵 [LOBBYPMS-DEBUG] 🎯 WeTravel webhook:', eventType, tripId ? `trip:${tripId}` : 'no-trip-id', orderId ? `order:${orderId}` : 'no-order-id');
    console.log('🔵 [LOBBYPMS-DEBUG] 🧩 Identifiers extracted:', {
      tripId,
      wetravelOrderId: orderId,
      metadataOrderId,
      wetravelPaymentId,
      metadataPaymentId
    });
    
    // Process webhook event
    if (!tripId) {
      console.warn('⚠️ No trip ID found in webhook payload');
    }

    // Prefer metadata order_id for deduplicación y vínculo interno
    let actualOrderId = metadataOrderId || null;
    if (actualOrderId) {
      console.log('🎯 [LOBBYPMS-DEBUG] Using metadata order_id as internal reference:', actualOrderId);
    } else if (eventType === 'booking.created') {
      console.log('⚠️ [LOBBYPMS-DEBUG] Metadata order_id not provided; relying on WeTravel identifiers only');
    }

    // Save event to database for audit trail and deduplication
    // Use actual order_id if found, otherwise fallback to provided IDs
    const eventKey = `${eventType}_${actualOrderId || metadataOrderId || orderId || tripId || 'no_id'}_${tripId || 'no_trip'}`;
    
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
        order_id: actualOrderId || metadataOrderId || null
      });
    
    if (eventError) {
      console.error('❌ Failed to save event:', eventError);
    } else {
      console.log('✅ Event saved to database:', eventKey);
    }

    // After processing, try to fix orphaned events if this is a booking.created
    if (eventType === 'booking.created') {
      setTimeout(() => {
        fixOrphanedEvents(tripId, orderId, metadataOrderId).catch(console.error);
      }, 1000); // Give 1 second delay to allow processing
    }

    // Manejar diferentes tipos de eventos
    console.log('🔵 [LOBBYPMS-DEBUG] 🔀 Routing to event handler for:', eventType);

    const baseSearchContext: PaymentSearchContext = {
      tripId,
      wetravelOrderId: orderId,
      metadataOrderId,
      wetravelPaymentId,
      metadataPaymentId,
      actualOrderId,
      eventType
    };

    switch (eventType) {
      case 'payment.created':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handlePaymentCreated');
        await handlePaymentCreated(webhookData, baseSearchContext);
        break;

      case 'payment.completed':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handlePaymentCompleted');
        await handlePaymentCompleted(webhookData, baseSearchContext, eventType);
        break;

      case 'payment.failed':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handlePaymentFailed');
        await handlePaymentFailed(webhookData, baseSearchContext);
        break;

      case 'payment.updated':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handlePaymentUpdated');
        await handlePaymentUpdated(webhookData, baseSearchContext);
        break;

      case 'booking.created':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handleBookingCreated');
        await handleBookingCreated(webhookData, baseSearchContext, { eventKey, actualOrderId });
        break;

      // Legacy events
      case 'partial_refund_made':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handlePartialRefund');
        await handlePartialRefund(webhookData);
        break;

      case 'booking.updated':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handleBookingUpdated');
        await handleBookingUpdated(webhookData);
        break;

      case 'trip.confirmed':
        console.log('🔵 [LOBBYPMS-DEBUG] ➡️ Calling handleTripConfirmed');
        await handleTripConfirmed(webhookData);
        break;

      default:
        console.warn('🔵 [LOBBYPMS-DEBUG] ⚠️ Unhandled webhook event:', eventType);
        break;
    }

    console.log('🔵 [LOBBYPMS-DEBUG] ✅ Event handler completed for:', eventType);

    // Responder con éxito a WeTravel
    console.log('🔵 [LOBBYPMS-DEBUG] 📤 Sending success response to WeTravel');
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('🔵 [LOBBYPMS-DEBUG] ❌ Error processing WeTravel webhook:', error);
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
async function handlePaymentCreated(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    console.log('💳 Payment created webhook received:', {
      trip_id: context.tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      metadata_order_id: context.metadataOrderId,
      amount: webhookData.data.total_amount,
      currency: webhookData.data.currency,
      status: webhookData.data.status,
      buyer: webhookData.data.buyer?.first_name + ' ' + webhookData.data.buyer?.last_name
    });

    const match = await findMatchingPayment({
      ...context,
      eventType: 'payment.created'
    });

    if (!match) {
      console.log('⚠️ Payment created webhook could not be matched to an existing payment record');
      return;
    }

    const payment = match.payment;
    console.log('💳 Matched payment for payment.created:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      matchedBy: match.matchedBy
    });

    const updatedWetravelData = buildUpdatedWetravelData(
      payment.wetravel_data as Record<string, unknown> | null,
      {
        payment_created_webhook: webhookData,
        updated_at: new Date().toISOString(),
        ...(context.tripId ? { trip_id: context.tripId } : {}),
        ...(context.metadataOrderId ? { metadata_order_id: context.metadataOrderId } : {}),
        ...(context.wetravelOrderId ? { wetravel_order_id: context.wetravelOrderId } : {}),
        ...(context.wetravelPaymentId ? { wetravel_payment_id: context.wetravelPaymentId } : {})
      }
    );

    const updatePayload: Record<string, unknown> = {
      wetravel_data: updatedWetravelData
    };

    if (context.wetravelOrderId || context.metadataOrderId) {
      updatePayload.wetravel_order_id = context.wetravelOrderId || context.metadataOrderId;
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id);

    if (updateError) {
      console.error('❌ Error updating payment with payment.created data:', updateError);
    } else {
      console.log('✅ Payment updated with WeTravel payment creation data');
    }

    console.log('✅ Payment created webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment created webhook:', error);
    throw error;
  }
}

// Función para manejar pagos actualizados
async function handlePaymentUpdated(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    console.log('🔄 Payment updated webhook received:', {
      trip_id: context.tripId,
      payment_id: webhookData.data.id,
      metadata_order_id: context.metadataOrderId,
      status: webhookData.data.status,
      amount: webhookData.data.total_amount
    });

    const match = await findMatchingPayment({
      ...context,
      eventType: 'payment.updated'
    });

    if (!match) {
      console.log('⚠️ Payment updated webhook could not be matched to an existing payment record');
      return;
    }

    const payment = match.payment;
    console.log('🔄 Matched payment for payment.updated:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      matchedBy: match.matchedBy
    });

    const updatedWetravelData = buildUpdatedWetravelData(
      payment.wetravel_data as Record<string, unknown> | null,
      {
        payment_updated_webhook: webhookData,
        updated_at: new Date().toISOString(),
        ...(context.tripId ? { trip_id: context.tripId } : {}),
        ...(context.metadataOrderId ? { metadata_order_id: context.metadataOrderId } : {}),
        ...(context.wetravelOrderId ? { wetravel_order_id: context.wetravelOrderId } : {}),
        ...(context.wetravelPaymentId ? { wetravel_payment_id: context.wetravelPaymentId } : {})
      }
    );

    const updatePayload: Record<string, unknown> = {
      wetravel_data: updatedWetravelData
    };

    if (context.wetravelOrderId || context.metadataOrderId) {
      updatePayload.wetravel_order_id = context.wetravelOrderId || context.metadataOrderId;
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id);

    if (updateError) {
      console.error('❌ Error updating payment with payment.updated data:', updateError);
    } else {
      console.log('✅ Payment updated with latest WeTravel data');
    }

    console.log('✅ Payment updated webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment updated webhook:', error);
    throw error;
  }
}

// Función para manejar pagos completados
async function handlePaymentCompleted(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext,
  eventType?: string
) {
  try {
    console.log('💰 Payment completed webhook received:', {
      trip_id: context.tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      metadata_order_id: context.metadataOrderId,
      buyer: webhookData.data.buyer ?
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` :
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_paid_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      status: webhookData.data.status
    });

    const match = await findMatchingPayment({
      ...context,
      eventType: eventType || 'payment.completed'
    });

    if (!match) {
      console.log('ℹ️ No matching payment found for payment.completed webhook');
      console.log('💰 Payment details:', {
        amount: webhookData.data.total_amount || webhookData.data.total_paid_amount,
        currency: webhookData.data.currency || webhookData.data.trip_currency,
        customer: webhookData.data.buyer ?
          `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` :
          'Unknown'
      });
      return;
    }

    const payment = match.payment;
    console.log('💰 Matched payment for payment.completed:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      matchedBy: match.matchedBy
    });

    const updatedWetravelData = buildUpdatedWetravelData(
      payment.wetravel_data as Record<string, unknown> | null,
      {
        payment_completed_webhook: webhookData,
        completed_at: new Date().toISOString(),
        ...(context.tripId ? { trip_id: context.tripId } : {}),
        ...(context.metadataOrderId ? { metadata_order_id: context.metadataOrderId } : {}),
        ...(context.wetravelOrderId ? { wetravel_order_id: context.wetravelOrderId } : {}),
        ...(context.wetravelPaymentId ? { wetravel_payment_id: context.wetravelPaymentId } : {})
      }
    );

    const updatePayload: Record<string, unknown> = {
      status: 'completed',
      wetravel_data: updatedWetravelData
    };

    if (context.wetravelOrderId || context.metadataOrderId) {
      updatePayload.wetravel_order_id = context.wetravelOrderId || context.metadataOrderId;
    }

    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('❌ Error updating payment to completed:', updatePaymentError);
      return;
    }

    console.log('✅ Payment marked as completed in database');

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', payment.order_id);

    if (updateOrderError) {
      console.error('❌ Error updating order status:', updateOrderError);
    } else {
      console.log('✅ Order marked as paid in database');
    }

    await supabase
      .from('wetravel_events')
      .update({
        payment_id: payment.id,
        order_id: payment.order_id
      })
      .eq('event_type', eventType)
      .like('event_key', `%${context.tripId || ''}%`);

    console.log('✅ Payment completed webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment completed webhook:', error);
    throw error;
  }
}

// Función para manejar pagos fallidos
async function handlePaymentFailed(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    console.log('❌ Payment failed webhook received:', {
      trip_id: context.tripId,
      payment_id: webhookData.data.id,
      order_id: webhookData.data.order_id,
      metadata_order_id: context.metadataOrderId,
      buyer: webhookData.data.buyer ? 
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` : 
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_due_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      status: webhookData.data.status
    });

    // TODO: Implementar lógica para manejar pagos fallidos
    // 1. Buscar la reserva por trip_id o order_id (usar context)
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
async function handleBookingCreated(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext,
  bookingContext: BookingEventContext
) {
  try {
    console.log('');
    console.log('='.repeat(80));
    console.log('🔵 [LOBBYPMS-DEBUG] BOOKING CREATED WEBHOOK HANDLER STARTED');
    console.log('='.repeat(80));
    console.log('🔵 [LOBBYPMS-DEBUG] Booking created webhook received:', {
      trip_id: context.tripId,
      wetravel_order_id: context.wetravelOrderId,
      metadata_order_id: context.metadataOrderId,
      event_key: bookingContext.eventKey,
      buyer: webhookData.data.buyer ?
        `${webhookData.data.buyer.first_name} ${webhookData.data.buyer.last_name}` :
        'Unknown',
      total_amount: webhookData.data.total_amount || webhookData.data.total_price_amount || webhookData.data.total_paid_amount,
      currency: webhookData.data.currency || webhookData.data.trip_currency,
      trip_title: webhookData.data.trip_title,
      participants: webhookData.data.participants?.length || 1
    });

    const match = await findMatchingPayment({
      ...context,
      eventType: 'booking.created'
    });

    if (!match) {
      console.log('❌ No matching payment found for booking.created webhook');
      console.log('🔍 Search criteria used:', {
        tripId: context.tripId,
        wetravelOrderId: context.wetravelOrderId,
        metadataOrderId: context.metadataOrderId
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

      const { data: allPayments, error: allPaymentsError } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, wetravel_order_id, status')
        .limit(5);

      if (!allPaymentsError && allPayments) {
        console.log('💳 Recent payments in database:', allPayments);
      }

    } else {
      const payment = match.payment;
      console.log(`🎉 Found matching payment (${match.matchedBy}):`, {
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status
      });

      const updatedWetravelData = buildUpdatedWetravelData(
        payment.wetravel_data as Record<string, unknown> | null,
        {
          booking_created_webhook: webhookData,
          booking_created_at: new Date().toISOString(),
          ...(context.tripId ? { trip_id: context.tripId } : {}),
          ...(context.metadataOrderId ? { metadata_order_id: context.metadataOrderId } : {}),
          ...(context.wetravelOrderId ? { wetravel_order_id: context.wetravelOrderId } : {}),
          ...(context.wetravelPaymentId ? { wetravel_payment_id: context.wetravelPaymentId } : {})
        }
      );

      const paymentUpdatePayload: Record<string, unknown> = {
        status: 'booking_created',
        wetravel_data: updatedWetravelData
      };

      if (context.wetravelOrderId || context.metadataOrderId) {
        paymentUpdatePayload.wetravel_order_id = context.wetravelOrderId || context.metadataOrderId;
      }

      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update(paymentUpdatePayload)
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('❌ Error updating payment:', updatePaymentError);
        return;
      }

      console.log('✅ Payment marked as booking_created in database');

      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'booking_created' })
        .eq('id', payment.order_id);

      if (updateOrderError) {
        console.error('❌ Error updating order status:', updateOrderError);
      } else {
        console.log('✅ Order marked as booking_created in database');
      }

          try {
            console.log('🔵 [LOBBYPMS-DEBUG] Fetching order data for payment order_id:', payment.order_id);
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('booking_data')
              .eq('id', payment.order_id)
              .single();

        console.log('🔵 [LOBBYPMS-DEBUG] Order data fetch result:', {
          hasData: !!orderData,
          hasBookingData: !!orderData?.booking_data,
          error: orderError,
          orderId: payment.order_id
        });

        // IMPORTANT: Webhook should NOT create reservations to avoid duplicates
        // The payment-status endpoint will handle reservation creation instead
        console.log(`🔵 [LOBBYPMS-DEBUG] [PID:${process.pid}] ⚠️ Webhook does NOT create reservations`);
        console.log('🔵 [LOBBYPMS-DEBUG] Reason: payment-status endpoint handles all reservation creation');
        console.log('🔵 [LOBBYPMS-DEBUG] Order ID:', payment.order_id);
        console.log('🔵 [LOBBYPMS-DEBUG] Booking data exists:', !!orderData?.booking_data);

        // Do NOT proceed with reservation creation
        // payment-status endpoint handles all reservation creation

      } catch (error) {
        console.error('❌ Error processing Booking Created flow:', error);
      }

      if (bookingContext.eventKey) {
        await supabase
          .from('wetravel_events')
          .update({
            payment_id: payment.id,
            order_id: payment.order_id
          })
          .eq('event_key', bookingContext.eventKey);
      } else {
        await supabase
          .from('wetravel_events')
          .update({
            payment_id: payment.id,
            order_id: payment.order_id
          })
          .eq('event_type', 'booking.created')
          .like('event_key', `%${context.tripId || ''}%`);
      }

      const { data: orphanUpdate, error: orphanError } = await supabase
        .from('wetravel_events')
        .update({
          payment_id: payment.id,
          order_id: payment.order_id
        })
        .eq('event_type', 'booking.created')
        .like('event_key', `%${context.tripId || ''}%`)
        .is('payment_id', null)
        .select();

      console.log('🔧 Orphan update result:', {
        updated: orphanUpdate?.length || 0,
        error: orphanError,
        tripId: context.tripId
      });
    }

    console.log('='.repeat(80));
    console.log('🔵 [LOBBYPMS-DEBUG] ✅ BOOKING CREATED WEBHOOK HANDLER COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('');

  } catch (error) {
    console.log('='.repeat(80));
    console.error('🔵 [LOBBYPMS-DEBUG] ❌ ERROR IN BOOKING CREATED WEBHOOK HANDLER:', error);
    console.log('='.repeat(80));
    console.log('');
    throw error;
  }
}

// Function to fix orphaned events (events with null payment_id/order_id)
async function fixOrphanedEvents(
  tripId?: string | null,
  webhookOrderId?: string | null,
  metadataOrderId?: string | null
) {
  if (!tripId && !webhookOrderId && !metadataOrderId) return;

  try {
    console.log('🔧 Attempting to fix orphaned events:', {
      tripId,
      webhookOrderId,
      metadataOrderId
    });

    const match = await findMatchingPayment({
      tripId: tripId || undefined,
      wetravelOrderId: webhookOrderId || undefined,
      metadataOrderId: metadataOrderId || undefined,
      eventType: 'fixOrphanedEvents'
    });

    if (!match) {
      console.log('⚠️ Could not find payment to fix orphaned events');
      return;
    }

    const payment = match.payment;
    console.log('🔧 Found payment for orphan fix:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      matchedBy: match.matchedBy
    });

    const { data: updatedEvents, error: updateError } = await supabase
      .from('wetravel_events')
      .update({
        payment_id: payment.id,
        order_id: payment.order_id
      })
      .eq('event_type', 'booking.created')
      .like('event_key', `%${tripId || ''}%`)
      .is('payment_id', null)
      .select();

    if (updateError) {
      console.error('❌ Error fixing orphaned events:', updateError);
    } else {
      console.log('✅ Fixed orphaned events:', updatedEvents?.length || 0);

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
