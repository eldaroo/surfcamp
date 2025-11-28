import { NextResponse } from 'next/server';
import { sendBookingConfirmation, sendBookingReminder, sendWelcomeMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { phone, testType = 'confirmation' } = await request.json();

    if (!phone) {
      return NextResponse.json({
        error: 'Phone number is required'
      }, { status: 400 });
    }

    // Datos de prueba
    const testData = {
      checkIn: '2025-01-15',
      checkOut: '2025-01-17',
      roomTypeId: 'casa-playa',
      guests: 2,
      bookingReference: 'SC-TEST123',
      total: 120,
      guestName: 'Usuario de Prueba'
    };

    let result;

    switch (testType) {
      case 'confirmation':
        result = await sendBookingConfirmation(phone, testData);
        break;
      case 'reminder':
        result = await sendBookingReminder(phone, {
          checkIn: testData.checkIn,
          roomTypeId: testData.roomTypeId,
          bookingReference: testData.bookingReference,
          guestName: testData.guestName
        });
        break;
      case 'welcome':
        result = await sendWelcomeMessage(phone, {
          roomTypeId: testData.roomTypeId,
          bookingReference: testData.bookingReference,
          guestName: testData.guestName
        });
        break;
      default:
        return NextResponse.json({
          error: 'Invalid test type. Use: confirmation, reminder, welcome'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      testType,
      phone,
      testData
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error testing WhatsApp',
      details: error.message
    }, { status: 500 });
  }
}

// Endpoint para obtener ejemplos de uso
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Test Endpoint',
    usage: {
      endpoint: '/api/whatsapp/test',
      method: 'POST',
      body: {
        phone: '+5491123456789',
        testType: 'confirmation | reminder | welcome'
      }
    },
    examples: [
      {
        description: 'Test confirmation message',
        curl: 'curl -X POST http://localhost:3000/api/whatsapp/test -H "Content-Type: application/json" -d \'{"phone": "+5491123456789", "testType": "confirmation"}\''
      },
      {
        description: 'Test reminder message',
        curl: 'curl -X POST http://localhost:3000/api/whatsapp/test -H "Content-Type: application/json" -d \'{"phone": "+5491123456789", "testType": "reminder"}\''
      },
      {
        description: 'Test welcome message',
        curl: 'curl -X POST http://localhost:3000/api/whatsapp/test -H "Content-Type: application/json" -d \'{"phone": "+5491123456789", "testType": "welcome"}\''
      }
    ]
  });
} 