import { NextRequest, NextResponse } from 'next/server';
import {
  buildTripDates,
  buildTripDescription,
  buildTripTitle,
  buildMinimalPayload,
  calculateWeTravelPayment,
  getSurfProgramContent,
  sanitizeMinimalPayload,
  validateMinimalPayload,
} from '@/lib/wetravel';

export const dynamic = 'force-dynamic';

const WETRAVEL_AUTH_URL =
  process.env.WETRAVEL_AUTH_URL || 'https://api.wetravel.com/v2/auth/tokens/access';
const WETRAVEL_API_URL =
  process.env.WETRAVEL_API_URL || 'https://api.wetravel.com/v2/payment_links';

async function getWeTravelAccessToken() {
  const apiKey = process.env.WETRAVEL_API_KEY;

  if (!apiKey) {
    throw new Error('WETRAVEL_API_KEY is not configured.');
  }

  const response = await fetch(WETRAVEL_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const message = await safeErrorMessage(response);
    throw new Error(`Could not get WeTravel access token: ${message}`);
  }

  const data = await response.json();
  const accessToken = data.access_token || data.token || data.accessToken;

  if (!accessToken) {
    throw new Error('WeTravel auth response did not include an access token.');
  }

  return accessToken as string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const minimalPayload = sanitizeMinimalPayload(body);
    const errors = validateMinimalPayload(minimalPayload);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const payload = buildMinimalPayload(minimalPayload);

    const paymentBreakdown = calculateWeTravelPayment(payload);
    const tripDates = buildTripDates(payload);
    const tripTitle = buildTripTitle(payload);
    const tripDescription = buildTripDescription(payload);
    const programContent = getSurfProgramContent(minimalPayload.surfProgram);

    const localReference = `manual_${Date.now()}`;

    const wetravelPayload = {
      data: {
        trip: {
          title: tripTitle,
          description: tripDescription,
          start_date: tripDates.startDate,
          end_date: tripDates.endDate,
          currency: 'USD',
          participant_fees: 'none',
        },
        pricing: {
          price: paymentBreakdown.depositAmount,
        },
        customer: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
        },
        metadata: {
          source: 'links-generator',
          local_reference: localReference,
          generated_email: payload.email,
          trip_title: tripTitle,
          trip_description: tripDescription,
          surf_program_content: programContent,
          booking_mode: payload.bookingMode,
          room_label: payload.roomLabel,
          guests: payload.guests,
          full_price: payload.fullPrice,
          accommodation_total: payload.bookingMode === 'existing' ? 0 : payload.accommodationTotal,
          deposit_price: paymentBreakdown.depositAmount,
          remaining_balance: paymentBreakdown.remainingBalance,
          existing_reservation_id: payload.existingReservationId || null,
          participants: payload.participants,
        },
      },
    };

    const accessToken = await getWeTravelAccessToken();
    const response = await fetch(WETRAVEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(wetravelPayload),
    });

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      return NextResponse.json(
        {
          error: `WeTravel API error: ${message}`,
          paymentBreakdown,
          payloadSent: wetravelPayload,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const paymentUrl = data?.data?.trip?.url || data?.payment_url || data?.url || null;
    const tripId = data?.data?.trip?.uuid || data?.data?.trip_uuid || data?.trip_id || null;

    return NextResponse.json({
      success: true,
      paymentUrl,
      tripId,
      tripTitle,
      tripDescription,
      tripDates,
      paymentBreakdown,
      payloadSent: wetravelPayload,
      rawResponse: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function safeErrorMessage(response: Response) {
  try {
    const json = await response.json();
    return json?.message || json?.error || response.statusText;
  } catch {
    return response.statusText;
  }
}
