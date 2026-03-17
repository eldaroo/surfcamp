import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById, updateOrder,
  getPaymentByOrderId, updatePayment, findPaymentByField, findPaymentByWetravelData,
  getRecentPendingPayments, getRecentPayments,
  getWetravelEvent, insertWetravelEvent, updateWetravelEvents, updateWetravelEventByKey,
} from '@/lib/db';
import crypto from 'crypto';
import { notifyOrderUpdate } from '@/lib/sse-manager';
import { sendDarioWelcomeMessage } from '@/lib/whatsapp';


function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  const expectedSignature = `sha256=${computedSignature}`;

  const expected = Buffer.from(expectedSignature, 'utf8');
  const actual = Buffer.from(signature, 'utf8');

  if (expected.length !== actual.length) {
    console.error('❌ [WEBHOOK] Signature length mismatch:', {
      expected: expectedSignature,
      received: signature,
    });
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
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
  interface Attempt {
    label: string;
    run: () => Promise<PaymentRecord | null>;
  }
  const attempts: Attempt[] = [];

  const addEqAttempt = (field: 'order_id' | 'wetravel_order_id', value?: string | null, label?: string) => {
    if (!value) return;
    attempts.push({
      label: label || `${field} = ${value}`,
      run: () => findPaymentByField(field, value) as Promise<PaymentRecord | null>
    });
  };

  const addContainsAttempt = (
    key: string,
    value: string | null | undefined,
    label: string
  ) => {
    if (!value) return;
    attempts.push({
      label,
      run: () => findPaymentByWetravelData(key, value) as Promise<PaymentRecord | null>
    });
  };

  addEqAttempt('order_id', context.actualOrderId, 'order_id (actualOrderId)');
  addEqAttempt('order_id', context.metadataOrderId, 'order_id (metadataOrderId)');
  addEqAttempt('order_id', context.wetravelOrderId, 'order_id (wetravelOrderId)');
  addEqAttempt('wetravel_order_id', context.metadataOrderId, 'wetravel_order_id (metadataOrderId)');
  addEqAttempt('wetravel_order_id', context.wetravelOrderId, 'wetravel_order_id (WeTravel order_id)');

  if (context.tripId) {
    addContainsAttempt('trip_id', context.tripId, 'wetravel_data contains trip_id');
  }
  if (context.metadataOrderId) {
    addContainsAttempt('metadata_order_id', context.metadataOrderId, 'wetravel_data contains metadata_order_id');
  }
  if (context.wetravelOrderId) {
    addContainsAttempt('wetravel_order_id', context.wetravelOrderId, 'wetravel_data contains wetravel_order_id');
  }
  if (context.wetravelPaymentId) {
    addContainsAttempt('wetravel_payment_id', context.wetravelPaymentId, 'wetravel_data contains wetravel_payment_id');
  }

  for (const attempt of attempts) {
    try {
      const payment = await attempt.run();
      if (payment) {
        return {
          payment: payment as PaymentRecord,
          matchedBy: attempt.label
        };
      }
    } catch (searchError) {
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-wetravel-signature') || request.headers.get('x-webhook-signature') || '';
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
    const existingEvent = await getWetravelEvent(eventKey);

    if (existingEvent) {
      return NextResponse.json({ status: 'duplicate', event_key: eventKey });
    }

    // Save event to database
    try {
      await insertWetravelEvent({
        event_key: eventKey,
        event_type: eventType,
        payment_id: null, // Will be updated if we find matching payment
        order_id: actualOrderId || metadataOrderId || null
      });
    } catch (eventError) {
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
        await handlePaymentCreated(webhookData, baseSearchContext);
        break;

      case 'payment.completed':
        await handlePaymentCompleted(webhookData, baseSearchContext, eventType);
        break;

      case 'payment.failed':
        await handlePaymentFailed(webhookData, baseSearchContext);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(webhookData, baseSearchContext);
        break;

      case 'booking.created':
        await handleBookingCreated(webhookData, baseSearchContext, { eventKey, actualOrderId });
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
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    const match = await findMatchingPayment({
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

    try {
      await updatePayment(payment.id, updatePayload);
    } catch (updateError) {
    }
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos actualizados
async function handlePaymentUpdated(
  webhookData: WeTravelWebhookData,
  context: PaymentSearchContext
) {
  try {
    const match = await findMatchingPayment({
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

    try {
      await updatePayment(payment.id, updatePayload);
    } catch (updateError) {
    }
  } catch (error) {
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
    const match = await findMatchingPayment({
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

    const rowCount = await updatePayment(payment.id, updatePayload);
    if (!rowCount) {
      return;
    }

    try {
      await updateOrder(payment.order_id, { status: 'paid' });
    } catch (updateOrderError) {
    }

    await updateWetravelEvents(
      { event_type: eventType, event_key_like: `%${context.tripId || ''}%` },
      { payment_id: payment.id, order_id: payment.order_id }
    );
  } catch (error) {
    throw error;
  }
}

// Función para manejar pagos fallidos
async function handlePaymentFailed(
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

    let match = await findMatchingPayment({
      ...context,
      eventType: 'booking.created'
    });

    // 🔄 FALLBACK: If no match found, try searching by recent pending/booking_created payments
    if (!match && context.tripId) {
      console.log('⚠️ [WEBHOOK] No match found, trying fallback search by recent payments...');

      // Get the most recent pending OR booking_created payment (within last 5 minutes)
      // Note: payment might already be booking_created if polling detected it first
      const recentPayments = await getRecentPendingPayments(5);

      if (recentPayments && recentPayments.length > 0) {
        console.log(`🔍 [WEBHOOK] Found ${recentPayments.length} recent pending payments`);

        // Try to match by order_id similarity or just use the most recent one
        const possibleMatch = recentPayments[0] as any;

        // Update this payment with the trip_id for future reference
        try {
          await updatePayment(possibleMatch.id, {
            wetravel_data: {
              ...(possibleMatch.wetravel_data as any || {}),
              trip_id: context.tripId,
              wetravel_order_id: context.wetravelOrderId,
              matched_by_fallback: true,
              matched_at: new Date().toISOString()
            },
            wetravel_order_id: context.wetravelOrderId || possibleMatch.wetravel_order_id
          });
          console.log('✅ [WEBHOOK] Updated payment with trip_id via fallback');
          match = {
            payment: possibleMatch as any,
            matchedBy: 'fallback-recent-pending'
          };
        } catch (updateError) {
          // fallback update failed, continue
        }
      }
    }

    if (!match) {
      console.error('❌ [WEBHOOK] NO PAYMENT FOUND for booking.created');
      console.error('❌ [WEBHOOK] Search context was:', context);

      try {
        const allPayments = await getRecentPayments(5);
        if (allPayments) {
          console.log('📋 [WEBHOOK] Recent payments in DB:', allPayments.map((p: any) => ({
            id: p.id,
            order_id: p.order_id,
            status: p.status,
            created_at: p.created_at,
            trip_id: (p.wetravel_data as any)?.trip_id,
            wetravel_order_id: p.wetravel_order_id
          })));
        }
      } catch (e) {
        // ignore logging errors
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

      const updatedRows = await updatePayment(payment.id, paymentUpdatePayload);

      if (!updatedRows) {
        console.error('❌ [WEBHOOK] Failed to update payment');
        return;
      }

      console.log('✅ [WEBHOOK] Payment UPDATE result:', {
        rowsAffected: updatedRows
      });
      console.log('✅ [WEBHOOK] Payment marked as booking_created:', payment.id);

      const orderRows = await updateOrder(payment.order_id, { status: 'booking_created' });

      if (!orderRows) {
        console.error('❌ [WEBHOOK] Failed to update order');
      } else {
        console.log('✅ [WEBHOOK] Order UPDATE result:', {
          rowsAffected: orderRows,
          order_id: payment.order_id
        });
        console.log('✅ [WEBHOOK] Order marked as booking_created:', payment.order_id);
        console.log('📞 [WEBHOOK] Now creating LobbyPMS reservation directly from webhook');
      }

      // 🏨 CREATE LOBBYPMS RESERVATION DIRECTLY FROM WEBHOOK
      try {
        console.log('🔍 [WEBHOOK] Attempting to fetch order data for order_id:', payment.order_id);
        const orderData = await getOrderById(payment.order_id) as any;

        if (!orderData) {
          console.error('❌ [WEBHOOK] No order data found for order_id:', payment.order_id);
        } else {
          console.log('📋 [WEBHOOK] Order data fetched:', {
            has_booking_data: !!orderData.booking_data,
            has_lobbypms_reservation_id: !!orderData.lobbypms_reservation_id,
            lobbypms_reservation_id: orderData.lobbypms_reservation_id
          });

          if (orderData.booking_data && !orderData.lobbypms_reservation_id) {
            console.log('✅ [WEBHOOK] Order has booking data and no reservation yet, calling /api/reserve');

            const booking = orderData.booking_data;
            console.log('📦 [WEBHOOK] Full booking_data from DB:', JSON.stringify(booking, null, 2));

            const reservePayload = {
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              guests: booking.guests,
              roomTypeId: booking.roomTypeId,
              isSharedRoom: booking.isSharedRoom ?? booking.selectedRoom?.isSharedRoom ?? false,
              contactInfo: booking.contactInfo,
              activityIds: booking.selectedActivities?.map((a: any) => a.id) || [],
              selectedActivities: booking.selectedActivities || [],
              participants: booking.participants || [],
              locale: booking.locale || 'es', // Pass locale for WhatsApp messages
              priceBreakdown: booking.priceBreakdown || null,
              selectedRoom: booking.selectedRoom || null,
              nights: booking.nights,
              discountedAccommodationTotal: booking.discountedAccommodationTotal || null
            };

            console.log('📞 [WEBHOOK] Calling /api/reserve with FULL payload:', JSON.stringify(reservePayload, null, 2));

            // Call reserve endpoint - use localhost for internal server-to-server calls
            // (external domain not resolvable from within the container)
            const baseUrl = process.env.INTERNAL_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
            console.log('🌐 [WEBHOOK] Using base URL:', baseUrl);
            console.log('🌐 [WEBHOOK] Full reserve endpoint:', `${baseUrl}/api/reserve`);

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
              try {
                await updateOrder(payment.order_id, {
                  lobbypms_reservation_id: reservationId,
                  lobbypms_data: reserveData,
                  status: 'booking_created'
                });
                console.log('✅ [WEBHOOK] Reservation ID UPDATE executed');

                // 🔄 VERIFY the update actually persisted by reading it back
                let verified = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                  console.log(`🔍 [WEBHOOK] Verifying reservation ID was saved (attempt ${attempt}/3)...`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

                  const verifyOrder = await getOrderById(payment.order_id) as any;

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
              } catch (updateError) {
                console.error('❌ [WEBHOOK] Failed to save reservation ID:', updateError);
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

              try {
                await updatePayment(payment.id, {
                  status: 'completed',
                  updated_at: updateTimestamp
                });
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
              } catch (paymentUpdateError) {
                console.error('❌ [WEBHOOK] Failed to update payment to completed:', paymentUpdateError);
              }
            } else {
              console.error('❌ [WEBHOOK] Could not extract reservation ID from response');
            }
          } else {
            console.error('❌ [WEBHOOK] /api/reserve failed:', {
              status: reserveResponse.status,
              statusText: reserveResponse.statusText,
              error: reserveData
            });
          }
        } else if (orderData?.lobbypms_reservation_id) {
          console.log('ℹ️ [WEBHOOK] Reservation already exists for this order:', {
            order_id: payment.order_id,
            lobbypms_reservation_id: orderData.lobbypms_reservation_id
          });
        } else if (!orderData?.booking_data) {
          console.warn('⚠️ [WEBHOOK] Order has no booking_data - skipping reservation creation:', {
            order_id: payment.order_id
          });
        }
        } // Close the else block
      } catch (error) {
        console.error('❌ [WEBHOOK] Error creating reservation:', error);
        console.error('❌ [WEBHOOK] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }

      if (bookingContext.eventKey) {
        await updateWetravelEventByKey(bookingContext.eventKey, {
          payment_id: payment.id,
          order_id: payment.order_id
        });
      } else {
        await updateWetravelEvents(
          { event_type: 'booking.created', event_key_like: `%${context.tripId || ''}%` },
          { payment_id: payment.id, order_id: payment.order_id }
        );
      }

      await updateWetravelEvents(
        { event_type: 'booking.created', event_key_like: `%${context.tripId || ''}%`, payment_id_null: true },
        { payment_id: payment.id, order_id: payment.order_id }
      );
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

  try {
    const match = await findMatchingPayment({
      tripId: tripId || undefined,
      wetravelOrderId: webhookOrderId || undefined,
      metadataOrderId: metadataOrderId || undefined,
      eventType: 'fixOrphanedEvents'
    });

    if (!match) {
      return;
    }

    const payment = match.payment;
    try {
      await updateWetravelEvents(
        { event_type: 'booking.created', event_key_like: `%${tripId || ''}%`, payment_id_null: true },
        { payment_id: payment.id, order_id: payment.order_id }
      );

      if (payment.status === 'pending') {
        await updatePayment(payment.id, { status: 'booking_created' });
        await updateOrder(payment.order_id, { status: 'booking_created' });
      }
    } catch (updateError) {
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
