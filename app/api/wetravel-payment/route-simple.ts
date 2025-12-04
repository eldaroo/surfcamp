import { NextRequest, NextResponse } from 'next/server';
import { config, isConfigValid, getWeTravelAccessToken } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📤 WeTravel API request received:', body);

    // 🔄 NEW: Support both old and new payload formats
    let wetravelPayload;
    
    // NEW FORMAT: { checkIn, checkOut, guests, roomTypeId, contactInfo, ... }
    if (body.checkIn && body.checkOut && body.contactInfo) {
      console.log('📝 New format detected - converting to WeTravel format');
      
      const { checkIn, checkOut, guests, roomTypeId, contactInfo, selectedActivities } = body;
      
      // Calculate totals (simplified for now)
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = 1; // $1 for testing
      
      // Create WeTravel payload from booking data
      const daysBeforeDeparture = Math.max(1, Math.ceil((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      
      wetravelPayload = {
        data: {
          trip: {
            title: "Surf & Yoga Retreat – Santa Teresa",
            start_date: checkIn,
            end_date: checkOut,
            currency: "USD",
            participant_fees: "none"
          },
          pricing: {
            price: totalAmount, // $1 for testing
            payment_plan: {
              allow_auto_payment: false,
              allow_partial_payment: false,
              deposit: 0,
              installments: [
                { 
                  price: totalAmount,
                  days_before_departure: daysBeforeDeparture
                }
              ]
            }
          },
          metadata: {
            customer_id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            booking_data: {
              checkIn,
              checkOut,
              guests,
              roomTypeId,
              contactInfo,
              selectedActivities,
              nights,
              totalAmount
            }
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
    console.log('📥 WeTravel response headers:', Object.fromEntries(wetravelResponse.headers.entries()));

    if (!wetravelResponse.ok) {
      let errorData;
      try {
        errorData = await wetravelResponse.json();
        console.error('❌ WeTravel API error - Full response:', {
          status: wetravelResponse.status,
          statusText: wetravelResponse.statusText,
          headers: Object.fromEntries(wetravelResponse.headers.entries()),
          body: errorData
        });
      } catch (parseError) {
        console.error('❌ WeTravel API error - Could not parse response body:', parseError);
        const errorText = await wetravelResponse.text();
        console.error('❌ WeTravel API error - Raw response body:', errorText);
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
      console.log('✅ WeTravel API successful response - Full details:', {
        status: wetravelResponse.status,
        statusText: wetravelResponse.statusText,
        headers: Object.fromEntries(wetravelResponse.headers.entries()),
        body: wetravelData
      });
    } catch (parseError) {
      console.error('❌ WeTravel API error - Could not parse successful response body:', parseError);
      const errorText = await wetravelResponse.text();
      console.error('❌ WeTravel API error - Raw successful response body:', errorText);
      throw new Error('Could not parse WeTravel response');
    }

    // Extraer la URL de pago de la respuesta de WeTravel
    const paymentUrl = wetravelData.data?.trip?.url || wetravelData.payment_url || wetravelData.url;
    const tripId = wetravelData.data?.trip?.uuid || wetravelData.trip_id;
    
    console.log('🔗 Extracted payment URL:', paymentUrl);
    console.log('🆔 Extracted trip ID:', tripId);
    
    // Retornar la URL de pago generada
    const response = {
      success: true,
      payment_url: paymentUrl,
      trip_id: tripId,
      metadata: wetravelData.data || wetravelData.metadata,
      debug: {
        originalFormat: body.checkIn ? 'new' : 'legacy',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Returning response:', { ...response, metadata: '[included]' });
    
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