import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: NextRequest) {
  try {
    console.log('');
    console.log('🔵 [LOBBYPMS-DEBUG] ='.repeat(40));
    console.log('🔵 [LOBBYPMS-DEBUG] 🧪 TEST ENDPOINT - Manually triggering LobbyPMS reservation');
    console.log('🔵 [LOBBYPMS-DEBUG] ='.repeat(40));

    // Get the most recent completed payment
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, status, wetravel_data')
      .eq('status', 'booking_created')
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentError || !payments || payments.length === 0) {
      console.log('🔵 [LOBBYPMS-DEBUG] ❌ No booking_created payments found');
      return NextResponse.json({
        success: false,
        error: 'No booking_created payments found',
        details: paymentError
      });
    }

    const payment = payments[0];
    console.log('🔵 [LOBBYPMS-DEBUG] 📋 Found payment:', {
      id: payment.id,
      order_id: payment.order_id,
      status: payment.status
    });

    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('booking_data')
      .eq('id', payment.order_id)
      .single();

    if (orderError || !orderData?.booking_data) {
      console.log('🔵 [LOBBYPMS-DEBUG] ❌ No booking data found');
      return NextResponse.json({
        success: false,
        error: 'No booking data found',
        details: orderError
      });
    }

    const booking = orderData.booking_data;
    console.log('🔵 [LOBBYPMS-DEBUG] 📦 Booking data retrieved:', {
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      roomTypeId: booking.roomTypeId,
      hasContactInfo: !!booking.contactInfo,
      activitiesCount: booking.selectedActivities?.length || 0
    });

    // Create reservation in LobbyPMS
    const reserveUrl = `${request.nextUrl.origin}/api/reserve`;

    const reservePayload = {
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      roomTypeId: booking.roomTypeId,
      contactInfo: booking.contactInfo,
      activityIds: booking.selectedActivities?.map((a: any) => a.id) || []
    };

    console.log('🔵 [LOBBYPMS-DEBUG] 🏨 Creating reservation in LobbyPMS...');
    console.log('🔵 [LOBBYPMS-DEBUG] 🔗 Reserve URL:', reserveUrl);
    console.log('🔵 [LOBBYPMS-DEBUG] 📤 Reserve payload:', JSON.stringify(reservePayload, null, 2));

    const reserveResponse = await fetch(reserveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservePayload)
    });

    console.log('🔵 [LOBBYPMS-DEBUG] 📥 Reserve response status:', reserveResponse.status);
    console.log('🔵 [LOBBYPMS-DEBUG] 📥 Reserve response ok:', reserveResponse.ok);

    const reserveData = await reserveResponse.json();
    console.log('🔵 [LOBBYPMS-DEBUG] 📥 Reserve response data:', JSON.stringify(reserveData, null, 2));

    if (reserveResponse.ok) {
      console.log('🔵 [LOBBYPMS-DEBUG] ✅ LobbyPMS reservation created successfully');
      console.log('🔵 [LOBBYPMS-DEBUG] 🔑 Reservation ID:', reserveData.reservation?.id || reserveData.lobbyPMSResponse?.id);

      // Update order with LobbyPMS reservation ID
      const updateResult = await supabase
        .from('orders')
        .update({
          lobbypms_reservation_id: reserveData.reservation?.id || reserveData.lobbyPMSResponse?.id,
          lobbypms_data: reserveData
        })
        .eq('id', payment.order_id);

      console.log('🔵 [LOBBYPMS-DEBUG] 💾 Order update result:', {
        error: updateResult.error,
        orderId: payment.order_id
      });

      return NextResponse.json({
        success: true,
        message: 'LobbyPMS reservation created successfully',
        reservationId: reserveData.reservation?.id || reserveData.lobbyPMSResponse?.id,
        orderId: payment.order_id
      });
    } else {
      console.error('🔵 [LOBBYPMS-DEBUG] ❌ Failed to create LobbyPMS reservation');
      console.error('🔵 [LOBBYPMS-DEBUG] ❌ Status:', reserveResponse.status);
      console.error('🔵 [LOBBYPMS-DEBUG] ❌ Response:', reserveData);

      return NextResponse.json({
        success: false,
        error: 'Failed to create LobbyPMS reservation',
        status: reserveResponse.status,
        details: reserveData
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🔵 [LOBBYPMS-DEBUG] ❌ Error in test endpoint:', error);
    console.error('🔵 [LOBBYPMS-DEBUG] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
