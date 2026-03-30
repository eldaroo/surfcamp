import { NextRequest, NextResponse } from 'next/server';
import { config, isConfigValid, getWeTravelAccessToken } from '@/lib/config';
import {
  calculateWeTravelPayment,
  detectSurfPrograms,
  getCoachingPrograms,
  getAccommodationTotal
} from '@/lib/wetravel-pricing';

import { insertOrder, insertPayment, updatePayment, updateOrder } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper function to format dates for WeTravel API (YYYY-MM-DD)
function formatDateForWeTravel(date: string | Date): string {
  if (!date) return '';

  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Convert to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Format as YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📤 WeTravel API request received:', body);

    // 🔄 Support both old and new payload formats
    let wetravelPayload;
    let bookingData = null;
    
    // NEW FORMAT: { checkIn, checkOut, guests, roomTypeId, contactInfo, wetravelData, ... }
    if (body.checkIn && body.checkOut && body.contactInfo) {
      console.log('📝 New format detected - will save to DB and create payment');

      const {
        checkIn,
        checkOut,
        guests,
        roomTypeId,
        contactInfo,
        selectedActivities,
        participants = [],
        wetravelData,
        priceBreakdown,
        selectedRoom = null,
        isSharedRoom = false,
        locale = 'es',
        nights: payloadNights
      } = body;

      // 🧪 TESTING MODE: Support $0 payments when ENABLE_ZERO_PAYMENT_TESTING is true OR when price is explicitly 0
      const enableZeroPaymentTesting = process.env.ENABLE_ZERO_PAYMENT_TESTING === 'true';

      // Get price from wetravelData if provided, otherwise use fallback
      // If testing mode is enabled, ALWAYS use $0 regardless of payload
      let price: number;
      if (enableZeroPaymentTesting) {
        price = 0; // 🧪 FORCE $0 for testing mode (env var)
        console.log('🧪 [TESTING MODE ACTIVE - ENV VAR] Forcing price to $0');
      } else if (wetravelData?.pricing?.price !== undefined) {
        price = wetravelData.pricing.price; // Accept explicit price from payload (including 0)
        if (price === 0) {
          console.log('🧪 [TESTING MODE ACTIVE - EXPLICIT $0] Price is explicitly $0 from payload');
        }
      } else {
        price = 1; // $1 default fallback
      }

      const installmentPrice = wetravelData?.pricing?.payment_plan?.installments?.[0]?.price ?? price;
      const daysBeforeDeparture = wetravelData?.pricing?.payment_plan?.installments?.[0]?.days_before_departure ||
        Math.max(1, Math.ceil((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      console.log('🧪 Zero payment testing enabled:', enableZeroPaymentTesting);
      console.log('💰 Price from payload:', price);
      console.log('💰 Installment price:', installmentPrice);
      console.log('📅 Days before departure:', daysBeforeDeparture);

      // Calculate totals
      const calculatedNights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const nights = typeof payloadNights === 'number' && payloadNights > 0 ? payloadNights : calculatedNights;
      const totalAmountCents = Math.round(price * 100); // Convert to cents

      // NEW: Calculate WeTravel payment based on surf programs and coaching (multiple participants)
      const surfPrograms = detectSurfPrograms(participants, selectedActivities);
      const coachingPrograms = getCoachingPrograms(participants, selectedActivities);
      const accommodationTotal = getAccommodationTotal(priceBreakdown);

      // Check if this is adding activities to an existing reservation
      const hasExistingReservation = body.existingReservationId || false;

      let depositAmount: number;
      let paymentBreakdown: any = null;

      // 🧪 If price is $0 or $1 (testing mode), skip recalculation and use price directly
      if (price === 0 || price === 1) {
        depositAmount = price;
        console.log(`🧪 [TESTING MODE] Using $${price} payment for testing`);
      } else if (surfPrograms.length > 0) {
        // Use new pricing formula if we have surf programs
        // For existing reservations, accommodation is already paid, so use 0
        const effectiveAccommodationTotal = hasExistingReservation ? 0 : accommodationTotal;

        paymentBreakdown = calculateWeTravelPayment({
          surfPrograms,
          coachingPrograms,
          accommodationTotal: effectiveAccommodationTotal
        });
        depositAmount = paymentBreakdown.total;

        console.log('💰 [NEW PRICING] WeTravel payment calculated:', {
          hasExistingReservation,
          surfPrograms,
          participantCount: paymentBreakdown.participantCount,
          coachingPrograms,
          coachingCount: paymentBreakdown.coachingParticipants,
          accommodationTotal: effectiveAccommodationTotal,
          originalAccommodationTotal: accommodationTotal,
          programDifference: paymentBreakdown.programDifference,
          accommodationDeposit: paymentBreakdown.accommodationDeposit,
          coachingCost: paymentBreakdown.coachingCost,
          total: depositAmount
        });
      } else {
        // Fallback to old 10% logic if we can't detect surf programs
        depositAmount = Math.round(price * 0.10);
        console.log('⚠️ [FALLBACK] Using old 10% pricing - could not detect surf programs or accommodation');
        console.log('💰 10% Deposit: $' + depositAmount);
      }

      const depositAmountCents = Math.round(depositAmount * 100);

      console.log('💰 Full price: $' + price + ' (' + totalAmountCents + ' cents)');
      console.log('💰 WeTravel Deposit: $' + depositAmount + ' (' + depositAmountCents + ' cents)');

      // Prepare booking data
      bookingData = {
        checkIn,
        checkOut,
        guests,
        roomTypeId,
        contactInfo,
        selectedActivities,
        participants,
        nights,
        totalAmountCents,
        depositAmountCents,
        fullPrice: price,
        depositPrice: depositAmount,
        locale,
        isSharedRoom,
        selectedRoom,
        priceBreakdown,
        accommodationTotal: priceBreakdown?.accommodation ?? null,
        activitiesTotal: priceBreakdown?.activities ?? null,
        totalPrice: priceBreakdown?.total ?? price,
        discountedAccommodationTotal: priceBreakdown?.accommodation
          ? Math.round(priceBreakdown.accommodation * 0.9)
          : null
      };

      // Build dynamic title based on booking
      const customerName = `${contactInfo.firstName} ${contactInfo.lastName}`;

      // Get accommodation name based on locale
      const accommodationNames = {
        'casa-playa': locale === 'es' ? 'Casa de Playa' : 'Beach House',
        'casitas-privadas': locale === 'es' ? 'Casitas Privadas' : 'Private House',
        'casas-deluxe': locale === 'es' ? 'Casa Privada' : 'Private House'
      };
      const accommodationType = accommodationNames[roomTypeId as keyof typeof accommodationNames] || roomTypeId;

      const nightsText = nights === 1 ? (locale === 'es' ? '1 noche' : '1 night') : `${nights} ${locale === 'es' ? 'noches' : 'nights'}`;
      const guestsText = guests === 1 ? (locale === 'es' ? '1 huésped' : '1 guest') : `${guests} ${locale === 'es' ? 'huéspedes' : 'guests'}`;
      const depositLabel = locale === 'es' ? 'Depósito' : 'Deposit';

      const dynamicTitle = `${customerName} - ${accommodationType} (${nightsText}, ${guestsText}) - ${depositLabel}`;

      // Create WeTravel payload from booking data
      wetravelPayload = {
        data: {
          trip: wetravelData?.trip || {
            title: dynamicTitle,
            trip_id: `booking_${Date.now()}`, // Unique reference for internal tracking
            start_date: formatDateForWeTravel(checkIn),
            end_date: formatDateForWeTravel(checkOut),
            currency: "USD",
            participant_fees: "none"
          },
          pricing: {
            price: depositAmount, // Total price = deposit amount (must be paid in full)
            // No payment plan = must pay 100% of price immediately
          },
          customer: {
            first_name: contactInfo.firstName,
            last_name: contactInfo.lastName,
            email: contactInfo.email
          },
          metadata: {
            customer_id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            booking_data: bookingData,
            full_price: price,
            deposit_price: depositAmount,
            deposit_percentage: 10,
            remaining_balance: price - depositAmount
          }
        }
      };

      console.log('✅ Converted to WeTravel format successfully with price:', price);
      console.log('👤 Customer info:', {
        first_name: contactInfo.firstName,
        last_name: contactInfo.lastName,
        email: contactInfo.email
      });
    }
    // OLD FORMAT: { data: { trip: { start_date, end_date }, pricing: { price } } }
    else if (body.data?.trip?.start_date && body.data?.trip?.end_date && body.data?.pricing?.price) {
      console.log('📝 Legacy format detected - formatting dates');
      wetravelPayload = {
        ...body,
        data: {
          ...body.data,
          trip: {
            ...body.data.trip,
            start_date: formatDateForWeTravel(body.data.trip.start_date),
            end_date: formatDateForWeTravel(body.data.trip.end_date)
          }
        }
      };
    }
    else {
      console.error('❌ Invalid payload format:', Object.keys(body));
      return NextResponse.json(
        { error: 'Missing required fields. Need either: (checkIn, checkOut, contactInfo) or (data.trip.start_date, data.trip.end_date, data.pricing.price)' },
        { status: 400 }
      );
    }

    // 💾 SUPABASE: Save to database FIRST if we have booking data
    let orderId = null;
    let paymentId = null;
    let createdPaymentRecord: any = null;
    
    if (bookingData) {
      // Generate unique IDs
      orderId = Date.now().toString(); // Use timestamp as BIGINT
      paymentId = (Date.now() + 1).toString(); // Ensure different from orderId
      
      console.log(`💾 Saving to DB - Order: ${orderId}, Payment: ${paymentId}`);

      try {
        await insertOrder({
          id: orderId,
          status: 'pending',
          total_amount: bookingData.totalAmountCents,
          currency: 'USD',
          customer_name: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
          customer_email: bookingData.contactInfo.email,
          booking_data: bookingData,
        });
        console.log('✅ Order saved to DB:', orderId);

        const wetravelDataInit = {
          created_from: 'payment_request',
          booking_data: bookingData,
          created_at: new Date().toISOString(),
          metadata_order_id: orderId,
          internal_payment_id: paymentId,
        };

        createdPaymentRecord = await insertPayment({
          id: paymentId,
          order_id: orderId,
          status: 'pending',
          total_amount: bookingData.totalAmountCents,
          currency: 'USD',
          payment_method: 'card',
          wetravel_data: wetravelDataInit,
        });
        console.log('✅ Payment saved to DB:', paymentId);

        // Add DB IDs to WeTravel metadata
        wetravelPayload.data.metadata = {
          ...wetravelPayload.data.metadata,
          order_id: orderId,
          payment_id: paymentId
        };

        // Add return_url so WeTravel redirects the customer back after payment
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://surfcamp.duckdns.org';
        const returnUrl = `${appUrl}/${bookingData.locale || 'es'}/payment/success?order_id=${orderId}`;
        wetravelPayload.data.settings = { return_url: returnUrl };
        // Also attach at trip level (some WeTravel API versions use this field)
        wetravelPayload.data.trip = {
          ...wetravelPayload.data.trip,
          return_url: returnUrl,
        };

      } catch (dbError) {
        console.error('❌ Supabase error:', dbError);
        // Continue with WeTravel call even if DB fails (for now)
        console.warn('⚠️ Continuing with WeTravel call despite DB error');
      }
    }

    // Verificar que tengamos la configuración necesaria
    if (!isConfigValid()) {
      return NextResponse.json(
        { error: 'WeTravel API key not configured' },
        { status: 500 }
      );
    }

    // Obtener token de acceso de WeTravel
    const accessToken = await getWeTravelAccessToken();
    
    // Llamar a la API de WeTravel con el token de acceso
    console.log('🔗 Calling WeTravel API with URL:', config.wetravel.apiUrl);
    console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
    console.log('📤 Sending payload to WeTravel:', JSON.stringify(wetravelPayload, null, 2));
    
    const wetravelResponse = await fetch(config.wetravel.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(wetravelPayload),
    });

    console.log('📥 WeTravel response status:', wetravelResponse.status);

    if (!wetravelResponse.ok) {
      let errorData;
      try {
        errorData = await wetravelResponse.json();
        console.error('❌ WeTravel API error:', errorData);
      } catch (parseError) {
        const errorText = await wetravelResponse.text();
        console.error('❌ WeTravel API error - Raw response:', errorText);
        errorData = { error: 'Could not parse error response' };
      }
      
      return NextResponse.json(
        { error: `WeTravel API error: ${errorData.message || errorData.error || wetravelResponse.statusText}` },
        { status: wetravelResponse.status }
      );
    }

    let wetravelData;
    try {
      wetravelData = await wetravelResponse.json();
      console.log('✅ WeTravel API successful response');
    } catch (parseError) {
      console.error('❌ Could not parse WeTravel success response');
      throw new Error('Could not parse WeTravel response');
    }

    // Extraer la URL de pago de la respuesta de WeTravel
    const paymentUrl = wetravelData.data?.trip?.url || wetravelData.payment_url || wetravelData.url;
    const tripId =
      wetravelData.data?.trip?.uuid ||
      wetravelData.data?.trip_uuid ||
      wetravelData.trip?.uuid ||
      wetravelData.trip_id ||
      null;
    const wetravelOrderId = wetravelData.data?.order_id || wetravelData.order_id || null;
    const wetravelPaymentId = wetravelData.data?.id || wetravelData.id || null;
    const metadataOrderId =
      wetravelData.data?.metadata?.order_id ||
      wetravelData.metadata?.order_id ||
      wetravelData.data?.metadata?.booking_data?.order_id ||
      null;

    // Append return_url as a query param to the payment URL (most reliable redirect mechanism)
    let finalPaymentUrl = paymentUrl;
    if (paymentUrl && orderId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://surfcamp.duckdns.org';
      const locale = bookingData?.locale || 'es';
      const returnUrl = `${appUrl}/${locale}/payment/success?order_id=${orderId}`;
      const separator = paymentUrl.includes('?') ? '&' : '?';
      finalPaymentUrl = `${paymentUrl}${separator}return_url=${encodeURIComponent(returnUrl)}`;
    }

    console.log('🔗 Extracted payment URL:', paymentUrl);
    console.log('🆔 Extracted trip ID:', tripId);
    console.log('🧾 Extracted WeTravel order ID:', wetravelOrderId);
    console.log('💳 Extracted WeTravel payment ID:', wetravelPaymentId);
    console.log('🧩 Metadata order ID:', metadataOrderId);

    // 💾 SUPABASE: Update payment with WeTravel response
    if (bookingData && paymentId) {
      try {
        const updatedWetravelData = {
          ...((createdPaymentRecord?.wetravel_data as Record<string, unknown>) || {}),
          wetravel_response: wetravelData,
          payment_url: paymentUrl,
          updated_at: new Date().toISOString(),
          ...(tripId ? { trip_id: tripId } : {}),
          ...(wetravelOrderId ? { wetravel_order_id: wetravelOrderId } : {}),
          ...(wetravelPaymentId ? { wetravel_payment_id: wetravelPaymentId } : {}),
          ...(metadataOrderId ? { metadata_order_id: metadataOrderId } : {})
        };

        const paymentUpdatePayload: Record<string, unknown> = {
          wetravel_data: updatedWetravelData
        };

        if (wetravelOrderId || metadataOrderId) {
          paymentUpdatePayload.wetravel_order_id = wetravelOrderId || metadataOrderId;
        }

        await updatePayment(paymentId, paymentUpdatePayload as any);
        console.log('✅ Payment updated with WeTravel response in DB');

        // NOTE: $0 test payments are NOT auto-marked as booking_created here.
        // The booking.created webhook from WeTravel handles this for all payment types.
      } catch (updateErr) {
        console.error('❌ Error updating payment:', updateErr);
      }
    }
    
    // Retornar la URL de pago generada
    const response = {
      success: true,
      payment_url: finalPaymentUrl,
      trip_id: tripId,
      wetravel_order_id: wetravelOrderId || metadataOrderId || null,
      wetravel_payment_id: wetravelPaymentId || null,
      metadata_order_id: metadataOrderId || null,
      metadata: wetravelData.data || wetravelData.metadata,
      // Include DB IDs if created
      ...(orderId && { order_id: orderId }),
      ...(paymentId && { payment_id: paymentId }),
      debug: {
        originalFormat: body.checkIn ? 'new' : 'legacy',
        dbSaved: !!bookingData,
        timestamp: new Date().toISOString(),
        trip_id: tripId,
        wetravel_order_id: wetravelOrderId || metadataOrderId || null,
        wetravel_payment_id: wetravelPaymentId || null
      }
    };
    
    console.log('📤 Returning response with DB IDs:', { 
      success: true, 
      payment_url: !!paymentUrl, 
      order_id: orderId,
      payment_id: paymentId 
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in WeTravel payment API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
