import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// 🔒 SECURE: Use service_role for backend DB operations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // service_role connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    console.log('🎯 WeTravel Payment API called - START');
    
    const body = await request.json();
    const { checkIn, checkOut, guests, roomTypeId, contactInfo, selectedActivities } = body;

    console.log('📝 Payment request data:', { checkIn, checkOut, guests, roomTypeId });

    // 🔒 SECURE: Input validation
    if (!checkIn || !checkOut || !guests || !roomTypeId || !contactInfo) {
      return NextResponse.json({ 
        error: 'Missing required fields: checkIn, checkOut, guests, roomTypeId, contactInfo' 
      }, { status: 400 });
    }

    // Calculate total price (same logic as your PaymentSection)
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    // Get room price (you'll need to adapt this to your pricing logic)
    const roomPrice = getRoomPrice(roomTypeId, guests); // Implement this function
    const activitiesTotal = calculateActivitiesTotal(selectedActivities); // Implement this function
    
    const totalAmount = Math.round((roomPrice * nights + activitiesTotal) * 100); // Convert to cents
    
    // If testing with $1, override the total
    const finalAmount = process.env.NODE_ENV === 'development' ? 100 : totalAmount; // $1 for testing

    await client.query('BEGIN');

    // 📊 STEP 1: Generate unique IDs
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💾 Creating order ${orderId} and payment ${paymentId}`);

    // 📊 STEP 2: Save ORDER to database FIRST
    await client.query(`
      INSERT INTO orders (
        id, status, total_amount, currency, 
        customer_name, customer_email, booking_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      orderId,
      'pending',
      finalAmount,
      'USD',
      `${contactInfo.firstName} ${contactInfo.lastName}`,
      contactInfo.email,
      JSON.stringify({
        checkIn,
        checkOut,
        guests,
        roomTypeId,
        contactInfo,
        selectedActivities,
        nights,
        created_at: new Date().toISOString()
      })
    ]);

    console.log('✅ Order saved to database');

    // 📊 STEP 3: Save PAYMENT to database (pending)
    await client.query(`
      INSERT INTO payments (
        id, order_id, status, total_amount, currency, 
        payment_method, wetravel_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      paymentId,
      orderId,
      'pending',
      finalAmount,
      'USD',
      'card', // Default, will be updated by webhook
      JSON.stringify({
        created_from: 'payment_request',
        booking_details: { checkIn, checkOut, guests, roomTypeId },
        created_at: new Date().toISOString()
      })
    ]);

    console.log('✅ Payment saved to database');

    // 📊 STEP 4: Create WeTravel payment link
    console.log('🚀 Creating WeTravel payment link...');
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const daysBeforeDeparture = Math.max(1, Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    
    const wetravelPayload = {
      data: {
        trip: {
          title: "Surf & Yoga Retreat – Santa Teresa",
          start_date: checkIn,
          end_date: checkOut,
          currency: "USD",
          participant_fees: "all"
        },
        pricing: {
          price: Math.round(finalAmount / 100), // Convert cents back to dollars for WeTravel
          payment_plan: {
            allow_auto_payment: false,
            allow_partial_payment: false,
            deposit: 0,
            installments: [
              { 
                price: Math.round(finalAmount / 100),
                days_before_departure: daysBeforeDeparture
              }
            ]
          }
        },
        metadata: {
          order_id: orderId,        // ← Link to our order
          payment_id: paymentId,    // ← Link to our payment
          customer_id: `cus_${Date.now()}`,
          booking_data: {
            checkIn,
            checkOut,
            guests,
            roomType: roomTypeId,
            total: finalAmount
          }
        }
      }
    };

    console.log('📤 Sending request to WeTravel API:', { 
      price: Math.round(finalAmount / 100), 
      order_id: orderId 
    });

    const wetravelResponse = await fetch('/api/wetravel-api-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wetravelPayload),
    });

    if (!wetravelResponse.ok) {
      const error = await wetravelResponse.json();
      throw new Error(`WeTravel API error: ${error.message || 'Unknown error'}`);
    }

    const wetravelData = await wetravelResponse.json();
    
    // 📊 STEP 5: Update payment with WeTravel response
    await client.query(`
      UPDATE payments SET 
        wetravel_data = $2,
        updated_at = NOW()
      WHERE id = $1
    `, [
      paymentId,
      JSON.stringify({
        ...JSON.parse(wetravelData.wetravel_data || '{}'),
        wetravel_response: wetravelData,
        payment_url: wetravelData.payment_url,
        updated_at: new Date().toISOString()
      })
    ]);

    await client.query('COMMIT');

    console.log('✅ WeTravel payment link created and saved');
    console.log(`🔗 Payment URL: ${wetravelData.payment_url}`);

    // 📊 STEP 6: Return success response
    const response = {
      success: true,
      order_id: orderId,
      payment_id: paymentId,
      payment_url: wetravelData.payment_url,
      total_amount: finalAmount,
      currency: 'USD',
      status: 'pending',
      debug: {
        nights,
        room_price: roomPrice,
        activities_total: activitiesTotal,
        final_amount_cents: finalAmount,
        wetravel_price_dollars: Math.round(finalAmount / 100)
      }
    };

    console.log('📤 Returning payment response:', { 
      order_id: orderId, 
      payment_id: paymentId,
      amount: finalAmount 
    });

    return NextResponse.json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ WeTravel payment creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/wetravel-payment'
      }
    }, { status: 500 });
    
  } finally {
    client.release();
  }
}

// Helper functions (implement based on your existing logic)
function getRoomPrice(roomTypeId: string, guests: number): number {
  // Implement your room pricing logic here
  // Return price in dollars (will be converted to cents later)
  const roomPrices = {
    'casa-playa': 25,      // $25/night per person
    'casitas-privadas': 80, // $80/night per room
    'casas-deluxe': 120     // $120/night per room
  };

  const basePrice = roomPrices[roomTypeId as keyof typeof roomPrices] || 50;
  
  if (roomTypeId === 'casa-playa') {
    return basePrice * guests; // Per person
  } else {
    return basePrice; // Per room
  }
}

function calculateActivitiesTotal(selectedActivities: any[]): number {
  // Implement your activities pricing logic here
  // Return total in dollars
  if (!selectedActivities || selectedActivities.length === 0) {
    return 0;
  }
  
  return selectedActivities.reduce((total, activity) => {
    return total + (activity.price || 0);
  }, 0);
}