import { NextRequest, NextResponse } from 'next/server';
import { config, isConfigValid, getWeTravelAccessToken } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📤 WeTravel API request received:', body);

    // Validar que tengamos los datos necesarios
    if (!body.data?.trip?.start_date || !body.data?.trip?.end_date || !body.data?.pricing?.price) {
      return NextResponse.json(
        { error: 'Missing required fields: start_date, end_date, or price' },
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
    console.log('📤 Sending payload to WeTravel:', JSON.stringify(body, null, 2));
    
    const wetravelResponse = await fetch(config.wetravel.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
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
    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      trip_id: tripId,
      metadata: wetravelData.data || wetravelData.metadata
    });

  } catch (error) {
    console.error('❌ Error in WeTravel payment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
