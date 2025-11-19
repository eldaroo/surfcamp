import { NextRequest, NextResponse } from 'next/server';
import { config, isConfigValid, getWeTravelAccessToken } from '@/lib/config';

// 🔒 SUPABASE: Use @supabase/supabase-js for better integration
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This key bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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

      const { checkIn, checkOut, guests, roomTypeId, contactInfo, selectedActivities, participants = [], wetravelData } = body;

      // Get price from wetravelData if provided, otherwise use $1 for testing
      const price = wetravelData?.pricing?.price || 1;
      const installmentPrice = wetravelData?.pricing?.payment_plan?.installments?.[0]?.price || price;
      const daysBeforeDeparture = wetravelData?.pricing?.payment_plan?.installments?.[0]?.days_before_departure ||
        Math.max(1, Math.ceil((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      console.log('💰 Price from payload:', price);
      console.log('💰 Installment price:', installmentPrice);
      console.log('📅 Days before departure:', daysBeforeDeparture);

      // Calculate totals
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmountCents = Math.round(price * 100); // Convert to cents

      // Calculate 10% deposit
      const depositAmount = Math.round(price * 0.10); // 10% of total price
      const depositAmountCents = Math.round(depositAmount * 100);

      console.log('💰 Full price: $' + price + ' (' + totalAmountCents + ' cents)');
      console.log('💰 10% Deposit: $' + depositAmount + ' (' + depositAmountCents + ' cents)');

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
        depositPrice: depositAmount
      };

      // Build dynamic title based on booking
      const customerName = `${contactInfo.firstName} ${contactInfo.lastName}`;
      const accommodationType = roomTypeId === 'casa-playa' ? 'Casa de Playa' :
                                roomTypeId === 'casitas-privadas' ? 'Casitas Privadas' :
                                'Casas Deluxe';
      const nightsText = nights === 1 ? '1 night' : `${nights} nights`;
      const guestsText = guests === 1 ? '1 guest' : `${guests} guests`;

      const dynamicTitle = `${customerName} - ${accommodationType} (${nightsText}, ${guestsText}) - 10% Deposit`;

      // Create WeTravel payload from booking data
      wetravelPayload = {
        data: {
          trip: wetravelData?.trip || {
            title: dynamicTitle,
            trip_id: `booking_${Date.now()}`, // Unique reference for internal tracking
            start_date: checkIn,
            end_date: checkOut,
            currency: "USD",
            participant_fees: "all"
          },
          pricing: {
            price: depositAmount, // Only charge 10% deposit (in dollars)
            payment_plan: {
              allow_auto_payment: false,
              allow_partial_payment: false,
              deposit: 0,
              installments: [
                {
                  price: depositAmount, // 10% deposit payment (in dollars)
                  days_before_departure: daysBeforeDeparture
                }
              ]
            }
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
      console.log('📝 Legacy format detected - using directly');
      wetravelPayload = body;
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
      
      console.log(`💾 Saving to Supabase - Order: ${orderId}, Payment: ${paymentId}`);
      
      try {
        // Save order first
        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            status: 'pending',
            total_amount: bookingData.totalAmountCents,
            currency: 'USD',
            customer_name: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
            customer_email: bookingData.contactInfo.email,
            booking_data: bookingData
          })
          .select();

        if (orderError) {
          throw new Error(`Order insert failed: ${orderError.message}`);
        }

        console.log('✅ Order saved to Supabase:', orderResult);

        // Save payment
        const { data: paymentResult, error: paymentError } = await supabase
          .from('payments')
          .insert({
            id: paymentId,
            order_id: orderId,
            status: 'pending',
            total_amount: bookingData.totalAmountCents,
            currency: 'USD',
            payment_method: 'card',
            wetravel_data: {
              created_from: 'payment_request',
              booking_data: bookingData,
              created_at: new Date().toISOString(),
              metadata_order_id: orderId,
              internal_payment_id: paymentId
            }
          })
          .select();

        if (paymentError) {
          throw new Error(`Payment insert failed: ${paymentError.message}`);
        }

        console.log('✅ Payment saved to Supabase:', paymentResult);

        createdPaymentRecord = paymentResult?.[0] || null;

        // Add DB IDs to WeTravel metadata
        wetravelPayload.data.metadata = {
          ...wetravelPayload.data.metadata,
          order_id: orderId,
          payment_id: paymentId
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

        const { error: updateError } = await supabase
          .from('payments')
          .update(paymentUpdatePayload)
          .eq('id', paymentId);

        if (updateError) {
          console.error('❌ Failed to update payment with WeTravel response:', updateError);
        } else {
          console.log('✅ Payment updated with WeTravel response in Supabase');
        }
      } catch (updateErr) {
        console.error('❌ Error updating payment:', updateErr);
      }
    }
    
    // Retornar la URL de pago generada
    const response = {
      success: true,
      payment_url: paymentUrl,
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
