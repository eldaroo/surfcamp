import { NextRequest, NextResponse } from 'next/server';

// Configure route to allow longer execution time for slow Lobby PMS responses
export const maxDuration = 300; // 5 minutes - Lobby PMS can be slow
export const dynamic = 'force-dynamic';

// Detectar código de país ISO 3166-1 alpha-2 desde código de área del teléfono
// Copiado de reserve/route.ts para mantener consistencia
const getCountryFromPhoneCode = (phone?: string | null): string => {
  if (!phone) {
    return 'ES'; // Default España
  }

  const digitsOnly = phone.replace(/\D+/g, "");

  if (!digitsOnly || digitsOnly.length < 8) {
    return 'ES';
  }

  // Mapeo de códigos de área a códigos ISO 3166-1 alpha-2
  const phoneCodeToCountry: Record<string, string> = {
    // América
    '1': 'US',      // USA/Canadá
    '52': 'MX',     // México
    '54': 'AR',     // Argentina
    '55': 'BR',     // Brasil
    '56': 'CL',     // Chile
    '57': 'CO',     // Colombia
    '58': 'VE',     // Venezuela
    '51': 'PE',     // Perú
    '593': 'EC',    // Ecuador
    '598': 'UY',    // Uruguay
    '595': 'PY',    // Paraguay
    '591': 'BO',    // Bolivia
    '506': 'CR',    // Costa Rica
    '507': 'PA',    // Panamá
    '505': 'NI',    // Nicaragua
    // Europa
    '34': 'ES',     // España
    '33': 'FR',     // Francia
    '39': 'IT',     // Italia
    '49': 'DE',     // Alemania
    '44': 'GB',     // Reino Unido
    '351': 'PT',    // Portugal
    '31': 'NL',     // Países Bajos
    '32': 'BE',     // Bélgica
    '41': 'CH',     // Suiza
    '43': 'AT',     // Austria
    '45': 'DK',     // Dinamarca
    '46': 'SE',     // Suecia
    '47': 'NO',     // Noruega
    '48': 'PL',     // Polonia
    '353': 'IE',    // Irlanda
    // Oceanía
    '61': 'AU',     // Australia
    '64': 'NZ',     // Nueva Zelanda
    // Asia
    '81': 'JP',     // Japón
    '82': 'KR',     // Corea del Sur
    '86': 'CN',     // China
    '91': 'IN',     // India
    '66': 'TH',     // Tailandia
    '65': 'SG',     // Singapur
    '60': 'MY',     // Malasia
    '63': 'PH',     // Filipinas
    '62': 'ID',     // Indonesia
    '84': 'VN',     // Vietnam
    // África
    '27': 'ZA',     // Sudáfrica
    '20': 'EG',     // Egipto
    '212': 'MA',    // Marruecos
    '234': 'NG',    // Nigeria
    '254': 'KE',    // Kenia
  };

  // Intentar coincidencias de 3 dígitos primero (códigos más largos)
  for (let len = 3; len >= 1; len--) {
    const prefix = digitsOnly.substring(0, len);
    if (phoneCodeToCountry[prefix]) {
      return phoneCodeToCountry[prefix];
    }
  }

  return 'ES'; // Default
};

/**
 * API endpoint to find an existing reservation by document number
 * Uses Lobby PMS API to search for reservations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, nationality, phone } = body;

    if (!document || typeof document !== 'string') {
      return NextResponse.json(
        { error: 'Document number is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [FIND-RESERVATION] Searching for reservation:', { document, nationality, phone });

    // Determinar nacionalidad: desde parámetro, teléfono, o default ES
    // Nota: Lobby PMS requiere customer_nationality cuando se usa customer_document
    let customerNationality = nationality;
    if (!customerNationality && phone) {
      customerNationality = getCountryFromPhoneCode(phone);
      console.log('🔍 [FIND-RESERVATION] Nationality detected from phone:', customerNationality);
    }
    if (!customerNationality) {
      customerNationality = 'ES'; // Default - Lobby PMS lo requiere con customer_document
      console.log('🔍 [FIND-RESERVATION] Using default nationality: ES');
    }

    console.log('🔍 [FIND-RESERVATION] Final search params:', { document: document.trim(), nationality: customerNationality });

    // Buscar en Lobby PMS
    const lobbyApiToken = process.env.LOBBYPMS_API_KEY;

    if (!lobbyApiToken) {
      console.error('🔍 [FIND-RESERVATION] LOBBYPMS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Booking system configuration error' },
        { status: 500 }
      );
    }

    // Construir URL con parámetros
    const params = new URLSearchParams({
      api_token: lobbyApiToken,
      customer_document: document.trim(),
      customer_nationality: customerNationality,
    });

    const url = `https://api.lobbypms.com/api/v1/bookings?${params.toString()}`;

    console.log('🔍 [FIND-RESERVATION] Calling Lobby PMS API:', url.replace(lobbyApiToken, 'REDACTED'));

    // Lobby PMS can be very slow, especially with certain nationalities
    // Give it plenty of time to respond (2 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds (2 minutes)

    console.log('🔍 [FIND-RESERVATION] Waiting for Lobby PMS response (max 2 minutes)...');
    const startTime = Date.now();

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Connection': 'keep-alive',
        },
        signal: controller.signal,
        // @ts-ignore - Next.js specific
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      console.log(`🔍 [FIND-RESERVATION] Lobby PMS responded in ${duration}ms (${(duration/1000).toFixed(1)}s)`);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (fetchError.name === 'AbortError') {
        console.error(`🔍 [FIND-RESERVATION] Request timeout after ${duration}ms`);
        return NextResponse.json(
          { error: 'Search is taking too long. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error('🔍 [FIND-RESERVATION] Lobby PMS API error:', response.status, response.statusText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No reservation found with this document number' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error searching for reservation' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 [FIND-RESERVATION] Lobby PMS response:', JSON.stringify(data, null, 2));

    // Verificar si se encontraron reservas
    if (!data.data || data.data.length === 0) {
      console.log('🔍 [FIND-RESERVATION] No reservations found');
      return NextResponse.json(
        { error: 'No reservation found with this document number' },
        { status: 404 }
      );
    }

    // Tomar la primera reserva (más reciente o activa)
    // TODO: Podrías querer filtrar por reservas activas o futuras
    const lobbyReservation = data.data[0];

    // Mapear la respuesta de Lobby PMS a nuestro formato
    const reservation = {
      id: lobbyReservation.booking_id.toString(),
      lobbyBookingId: lobbyReservation.booking_id,
      document: lobbyReservation.holder?.document || document,
      guestName: `${lobbyReservation.holder?.name || ''} ${lobbyReservation.holder?.surname || ''}`.trim(),
      checkIn: lobbyReservation.start_date,
      checkOut: lobbyReservation.end_date,
      roomType: lobbyReservation.category?.name || 'N/A',
      assignedRoom: lobbyReservation.assigned_room?.name || null,
      guests: lobbyReservation.total_guests || 1,
      email: lobbyReservation.holder?.email || '',
      phone: lobbyReservation.holder?.phone || '',
      plan: lobbyReservation.plan || '',
      totalToPay: lobbyReservation.total_to_pay || 0,
      paidOut: lobbyReservation.paid_out || 0,
      checkedIn: lobbyReservation.checked_in || false,
      checkedOut: lobbyReservation.checked_out || false,
    };

    console.log('🔍 [FIND-RESERVATION] Reservation found:', reservation);

    return NextResponse.json({
      success: true,
      reservation,
    });

  } catch (error) {
    console.error('🔍 [FIND-RESERVATION] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
