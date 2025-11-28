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
    
    // NEW FORMAT: { checkIn, checkOut, guests, roomTypeId, contactInfo, ... }
    if (body.checkIn && body.checkOut && body.contactInfo) {
      console.log('📝 New format detected - will save to DB and create payment');
      
      const { checkIn, checkOut, guests, roomTypeId, contactInfo, selectedActivities } = body;
      
      // Calculate totals (simplified for now)
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmountCents = 100; // $1.00 in cents for testing
      
      // Prepare booking data
      bookingData = {
        checkIn,
        checkOut,
        guests,
        roomTypeId,
        contactInfo,
        selectedActivities,
        nights,
        totalAmountCents
      };
      
      // Create WeTravel payload from booking data
      const daysBeforeDeparture = Math.max(1, Math.ceil((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      
      wetravelPayload = {
        data: {
          trip: {
            title: "Surf & Yoga Retreat – Santa Teresa",
            start_date: checkIn,
            end_date: checkOut,
            currency: "USD",
            participant_fees: "all"
          },
          pricing: {
            price: 1, // $1 for testing
            payment_plan: {
              allow_auto_payment: false,
              allow_partial_payment: false,
              deposit: 0,
              installments: [
                { 
                  price: 1, // $1 for testing
                  days_before_departure: daysBeforeDeparture
                }
              ]
            }
          },
          metadata: {
            customer_id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            booking_data: bookingData
          }
        }
      };
      
      console.log('✅ Converted to WeTravel format successfully');
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
              created_at: new Date().toISOString()
            }
          })
          .select();

        if (paymentError) {
          throw new Error(`Payment insert failed: ${paymentError.message}`);
        }

        console.log('✅ Payment saved to Supabase:', paymentResult);

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
    const tripId = wetravelData.data?.trip?.uuid || wetravelData.trip_id;
    
    console.log('🔗 Extracted payment URL:', paymentUrl);
    console.log('🆔 Extracted trip ID:', tripId);

    // 💾 SUPABASE: Update payment with WeTravel response
    if (bookingData && paymentId) {
      try {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            wetravel_data: {
              created_from: 'payment_request',
              booking_data: bookingData,
              wetravel_response: wetravelData,
              payment_url: paymentUrl,
              trip_id: tripId,
              updated_at: new Date().toISOString()
            }
          })
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
      metadata: wetravelData.data || wetravelData.metadata,
      // Include DB IDs if created
      ...(orderId && { order_id: orderId }),
      ...(paymentId && { payment_id: paymentId }),
      debug: {
        originalFormat: body.checkIn ? 'new' : 'legacy',
        dbSaved: !!bookingData,
        timestamp: new Date().toISOString()
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