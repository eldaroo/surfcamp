import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { notifyOrderUpdate } from '@/lib/sse-manager';
import { sendDarioWelcomeMessage } from '@/lib/whatsapp';

// Helper to create fresh Supabase client (no cache, no pooling)
// Force read/write to PRIMARY database to avoid replica lag
function createFreshSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          'expires': '0',
          'x-supabase-read-preference': 'primary'
        }
      }
    }
  );
}

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
  supabase: ReturnType<typeof createFreshSupabaseClient>,
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
    try {
      const { payment, error } = await attempt.run();
      if (error) {
        continue;
      }

      if (payment) {
        return {
          payment,
          matchedBy: attempt.label
        };
      }
    } catch (searchError) {
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Create fresh Supabase client for this request (no cache)
  const supabase = createFreshSupabaseClient();

  try {
    const signature = request.headers.get('x-webhook-signature') || '';
    const rawBody = await request.text();

    console.log('🔔 [WEBHOOK] ========== NEW WEBHOOK RECEIVED ==========');
    console.log('🔔 [WEBHOOK] Raw body length:', rawBody.length);
    
    // Verify webhook signature
    const webhookSecret = process.env.WETRAVEL_WEBHOOK_SECRET;
    if (signature && webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
    }
    
    // Signature verified
    
    const body = JSON.parse(rawBody);
    // Validar que sea un webhook válido de WeTravel (soporta múltiples formatos)
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing type or data' },
        { status: 400 }
      );
    }

    const webhookData: WeTravelWebhookData = body;

    console.log('📨 [WEBHOOK] Event type:', body.type);
    console.log('📨 [WEBHOOK] Event data keys:', Object.keys(body.data || {}));

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
    // Process webhook event
    if (!tripId) {
    }

    // Prefer metadata order_id for deduplicación y vínculo interno
    let actualOrderId = metadataOrderId || null;
    if (actualOrderId) {
    } else if (eventType === 'booking.created') {
      
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
    } else {
    }

    // After processing, try to fix orphaned events if this is a booking.created
    if (eventType === 'booking.created') {
      setTimeout(() => {
        fixOrphanedEvents(tripId, orderId, metadataOrderId).catch(console.error);
      }, 1000); // Give 1 second delay to allow processing
    }

    // Manejar diferentes tipos de eventos
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
        await handlePaymentCreated(supabase, webhookData, baseSearchContext);
        break;

      case 'payment.completed':
        await handlePaymentCompleted(supabase, webhookData, baseSearchContext, eventType);
        break;

      case 'payment.failed':
        await handlePaymentFailed(supabase, webhookData, baseSearchContext);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(supabase, webhookData, baseSearchContext);
        break;

      case 'booking.created':
        await handleBookingCreated(supabase, webhookData, baseSearchContext, { eventKey, actualOrderId });
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
        break;
    }
    // Responder con éxito a WeTravel
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función para manejar reembolsos parciales
async function handlePartialRefund(webhookData: WeTravelWebhookData) {
  try {
    // TODO: Implementar lógica para manejar reembolsos parciales
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado de pago
    // 3. Notificar al usuario sobre el reembolso
    // 4. Actualizar la base de datos
  } catch (error) {
    throw error;
  }
}

// Función para manejar actualizaciones de reserva
async function handleBookingUpdated(webhookData: WeTravelWebhookData) {
  try {
    // TODO: Implementar lógica para manejar actualizaciones de reserva
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar información de la reserva
    // 3. Notificar al usuario sobre cambios
    // 4. Actualizar la base de datos
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos creados
async function handlePaymentCreated(
  supabase: ReturnType<typeof createFreshSupabaseClient>,
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    const match = await findMatchingPayment(supabase, {
      ...context,
      eventType: 'payment.created'
    });

    if (!match) {
      return;
    }

    const payment = match.payment;
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
    } else {
    }
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos actualizados
async function handlePaymentUpdated(
  supabase: ReturnType<typeof createFreshSupabaseClient>,
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    const match = await findMatchingPayment(supabase, {
      ...context,
      eventType: 'payment.updated'
    });

    if (!match) {
      return;
    }

    const payment = match.payment;
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
    } else {
    }
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos completados
async function handlePaymentCompleted(
  supabase: ReturnType<typeof createFreshSupabaseClient>,
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext,
  eventType?: string
) {
  try {
    const match = await findMatchingPayment(supabase, {
      ...context,
      eventType: eventType || 'payment.completed'
    });

    if (!match) {
      return;
    }

    const payment = match.payment;
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
      return;
    }
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', payment.order_id);

    if (updateOrderError) {
    } else {
    }

    await supabase
      .from('wetravel_events')
      .update({
        payment_id: payment.id,
        order_id: payment.order_id
      })
      .eq('event_type', eventType)
      .like('event_key', `%${context.tripId || ''}%`);
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos fallidos
async function handlePaymentFailed(
  supabase: ReturnType<typeof createFreshSupabaseClient>,
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    // TODO: Implementar lógica para manejar pagos fallidos
    // 1. Buscar la reserva por trip_id o order_id (usar context)
    // 2. Actualizar el estado a 'payment_failed'
    // 3. Notificar al usuario sobre el problema
    // 4. Ofrecer opciones alternativas de pago
  } catch (error) {
    throw error;
  }
}

// Función para manejar confirmación de viaje
async function handleTripConfirmed(webhookData: WeTravelWebhookData) {
  try {
    // TODO: Implementar lógica para confirmación de viaje
    // 1. Buscar la reserva por trip_id o order_id
    // 2. Actualizar el estado a 'confirmed'
    // 3. Enviar confirmación final al usuario
    // 4. Activar notificaciones de recordatorio
  } catch (error) {
    throw error;
  }
}

// Función para manejar reserva creada
async function handleBookingCreated(
  supabase: ReturnType<typeof createFreshSupabaseClient>,
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext,
  bookingContext: BookingEventContext
) {
  try {
    console.log('📦 [WEBHOOK] handleBookingCreated called with context:', {
      tripId: context.tripId,
      wetravelOrderId: context.wetravelOrderId,
      metadataOrderId: context.metadataOrderId,
      actualOrderId: context.actualOrderId
    });

    let match = await findMatchingPayment(supabase, {
      ...context,
      eventType: 'booking.created'
    });

    // 🔄 FALLBACK: If no match found, try searching by recent pending payments
    if (!match && context.tripId) {
      console.log('⚠️ [WEBHOOK] No match found, trying fallback search by recent pending payments...');

      // Get the most recent pending payment (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, wetravel_order_id, status, created_at')
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentPayments && recentPayments.length > 0) {
        console.log(`🔍 [WEBHOOK] Found ${recentPayments.length} recent pending payments`);

        // Try to match by order_id similarity or just use the most recent one
        const possibleMatch = recentPayments[0];

        // Update this payment with the trip_id for future reference
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            wetravel_data: {
              ...(possibleMatch.wetravel_data as any || {}),
              trip_id: context.tripId,
              wetravel_order_id: context.wetravelOrderId,
              matched_by_fallback: true,
              matched_at: new Date().toISOString()
            },
            wetravel_order_id: context.wetravelOrderId || possibleMatch.wetravel_order_id
          })
          .eq('id', possibleMatch.id);

        if (!updateError) {
          console.log('✅ [WEBHOOK] Updated payment with trip_id via fallback');
          match = {
            payment: possibleMatch as any,
            matchedBy: 'fallback-recent-pending'
          };
        }
      }
    }

    if (!match) {
      console.error('❌ [WEBHOOK] NO PAYMENT FOUND for booking.created');
      console.error('❌ [WEBHOOK] Search context was:', context);

      const { data: allPayments, error: allPaymentsError } = await supabase
        .from('payments')
        .select('id, order_id, wetravel_data, wetravel_order_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!allPaymentsError && allPayments) {
        console.log('📋 [WEBHOOK] Recent payments in DB:', allPayments.map(p => ({
          id: p.id,
          order_id: p.order_id,
          status: p.status,
          created_at: p.created_at,
          trip_id: (p.wetravel_data as any)?.trip_id,
          wetravel_order_id: p.wetravel_order_id
        })));
      }

      return; // Exit early if no payment found
    } else {
      console.log('✅ [WEBHOOK] Payment FOUND, matched by:', match.matchedBy);
      const payment = match.payment;
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

      console.log('🔄 [WEBHOOK] Attempting to update payment:', {
        payment_id: payment.id,
        payload: paymentUpdatePayload
      });

      const { data: updatedPayment, error: updatePaymentError } = await supabase
        .from('payments')
        .update(paymentUpdatePayload)
        .eq('id', payment.id)
        .select();

      if (updatePaymentError) {
        console.error('❌ [WEBHOOK] Failed to update payment:', updatePaymentError);
        return;
      }

      console.log('✅ [WEBHOOK] Payment UPDATE result:', {
        rowsAffected: updatedPayment?.length || 0,
        updated: updatedPayment
      });
      console.log('✅ [WEBHOOK] Payment marked as booking_created:', payment.id);

      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'booking_created' })
        .eq('id', payment.order_id)
        .select();

      if (updateOrderError) {
        console.error('❌ [WEBHOOK] Failed to update order:', updateOrderError);
      } else {
        console.log('✅ [WEBHOOK] Order UPDATE result:', {
          rowsAffected: updatedOrder?.length || 0,
          order_id: payment.order_id
        });
        console.log('✅ [WEBHOOK] Order marked as booking_created:', payment.order_id);
        console.log('📞 [WEBHOOK] Now creating LobbyPMS reservation directly from webhook');
      }

      // 🏨 CREATE LOBBYPMS RESERVATION DIRECTLY FROM WEBHOOK
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('booking_data, lobbypms_reservation_id')
          .eq('id', payment.order_id)
          .single();

        if (orderError) {
          console.error('❌ [WEBHOOK] Error fetching order data:', orderError);
        } else if (orderData && orderData.booking_data && !orderData.lobbypms_reservation_id) {
          console.log('✅ [WEBHOOK] Order has booking data and no reservation yet, calling /api/reserve');

            const booking = orderData.booking_data;
            console.log('📦 [WEBHOOK] Full booking_data from DB:', JSON.stringify(booking, null, 2));

            const reservePayload = {
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              guests: booking.guests,
              roomTypeId: booking.roomTypeId,
              isSharedRoom: booking.isSharedRoom || false,
              contactInfo: booking.contactInfo,
              activityIds: booking.selectedActivities?.map((a: any) => a.id) || [],
              selectedActivities: booking.selectedActivities || [],
              participants: booking.participants || []
            };

            console.log('📞 [WEBHOOK] Calling /api/reserve with FULL payload:', JSON.stringify(reservePayload, null, 2));

            // Call reserve endpoint
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://surfcampwidget.duckdns.org';
            const reserveResponse = await fetch(`${baseUrl}/api/reserve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reservePayload)
            });

            const reserveData = await reserveResponse.json();
            console.log('📥 [WEBHOOK] /api/reserve responded:', {
              ok: reserveResponse.ok,
              status: reserveResponse.status,
              success: reserveData.success
            });
            console.log('📦 [WEBHOOK] Full /api/reserve response:', JSON.stringify(reserveData, null, 2));

            if (reserveResponse.ok) {
              let reservationId;
              if (reserveData.multipleReservations && reserveData.reservationIds) {
                reservationId = Array.isArray(reserveData.reservationIds)
                  ? reserveData.reservationIds[0]
                  : reserveData.reservationIds;
                console.log('✅ [WEBHOOK] Multiple reservations created:', reserveData.reservationIds);
              } else {
                reservationId = reserveData.reservationId ||
                               reserveData.reservation?.id ||
                               reserveData.lobbyPMSResponse?.booking?.booking_id ||
                               reserveData.lobbyPMSResponse?.id;
                console.log('✅ [WEBHOOK] Single reservation created:', reservationId);
              }

            if (reservationId) {
              console.log('💾 [WEBHOOK] Reservation ID from /api/reserve:', reservationId);

              // Save reservation ID to database
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  lobbypms_reservation_id: reservationId,
                  lobbypms_data: reserveData,
                  status: 'booking_created'
                })
                .eq('id', payment.order_id);

              if (updateError) {
                console.error('❌ [WEBHOOK] Failed to save reservation ID:', updateError);
              } else {
                console.log('✅ [WEBHOOK] Reservation ID UPDATE executed');

                // 🔄 VERIFY the update actually persisted by reading it back
                let verified = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                  console.log(`🔍 [WEBHOOK] Verifying reservation ID was saved (attempt ${attempt}/3)...`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

                  const { data: verifyOrder } = await supabase
                    .from('orders')
                    .select('lobbypms_reservation_id')
                    .eq('id', payment.order_id)
                    .single();

                  if (verifyOrder?.lobbypms_reservation_id === reservationId.toString()) {
                    console.log('✅ [WEBHOOK] Reservation ID verified in database!');
                    verified = true;
                    break;
                  } else {
                    console.log(`⚠️ [WEBHOOK] Verification attempt ${attempt} - still not visible:`, verifyOrder?.lobbypms_reservation_id);
                  }
                }

                if (!verified) {
                  console.error('❌ [WEBHOOK] Could not verify reservation ID after 3 attempts - replica lag issue');
                }
              }

              // ALSO update payment status to completed so frontend sees it immediately
              // Force cache invalidation by updating updated_at
              const updateTimestamp = new Date().toISOString();
              console.log('🔄 [WEBHOOK] Attempting to update payment status', {
                paymentId: payment.id,
                orderId: payment.order_id,
                currentStatus: payment.status,
                targetStatus: 'completed',
                timestamp: updateTimestamp
              });

              const { error: paymentUpdateError } = await supabase
                .from('payments')
                .update({
                  status: 'completed',
                  updated_at: updateTimestamp
                })
                .eq('id', payment.id);

              if (paymentUpdateError) {
                console.error('❌ [WEBHOOK] Failed to update payment to completed:', paymentUpdateError);
              } else {
                console.log('✅ [WEBHOOK] Payment status updated to completed',{
                  paymentId: payment.id,
                  updatedAt: updateTimestamp
                });

                // 📡 NOTIFY FRONTEND VIA SSE
                notifyOrderUpdate(payment.order_id.toString(), {
                  type: 'reservation_complete',
                  status: 'completed',
                  orderId: payment.order_id,
                  paymentId: payment.id,
                  reservationId: reservationId,
                  reservationIds: reserveData.reservationIds || [reservationId],
                  bookingReference: reserveData.bookingReference,
                  message: 'Reservation created successfully!'
                });
                console.log('📡 [WEBHOOK] SSE notification sent for order:', payment.order_id);
              }
            } else {
              console.error('❌ [WEBHOOK] Could not extract reservation ID from response');
            }
          } else {
            console.error('❌ [WEBHOOK] /api/reserve failed:', reserveData);
          }
        } else if (orderData?.lobbypms_reservation_id) {
          console.log('ℹ️ [WEBHOOK] Reservation already exists:', orderData.lobbypms_reservation_id);
        }
      } catch (error) {
        console.error('❌ [WEBHOOK] Error creating reservation:', error);
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
    }
  } catch (error) {
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

  // Create fresh Supabase client for this background task
  const supabase = createFreshSupabaseClient();

  try {
    const match = await findMatchingPayment(supabase, {
      tripId: tripId || undefined,
      wetravelOrderId: webhookOrderId || undefined,
      metadataOrderId: metadataOrderId || undefined,
      eventType: 'fixOrphanedEvents'
    });

    if (!match) {
      return;
    }

    const payment = match.payment;
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
    } else {
      if (payment.status === 'pending') {
        await supabase
          .from('payments')
          .update({ status: 'booking_created' })
          .eq('id', payment.id);

        await supabase
          .from('orders')
          .update({ status: 'booking_created' })
          .eq('id', payment.order_id);
      }
    }

  } catch (error) {
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
