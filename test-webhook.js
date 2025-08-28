// Script para probar el webhook de WeTravel
// Ejecutar con: node test-webhook.js

const webhookUrl = 'https://surfcampwidget.duckdns.org/api/wetravel-webhook';

const testData = {
  "data": {
    "booking_note": "Something notable",
    "buyer": {
      "cancelled": false,
      "email": "john.doe@example.com",
      "first_name": "John",
      "full_name": "John Doe",
      "id": 3797,
      "last_name": "Doe"
    },
    "created_at": "2022-07-31T10:32:48.000+00:00",
    "departure_date": "2023-10-27",
    "event_type": "partial_refund_made",
    "order_id": "1741954582453420000",
    "participants": [
      {
        "cancelled": false,
        "email": "john.doe@example.com",
        "first_name": "John",
        "full_name": "John Doe",
        "id": "3797",
        "last_name": "Doe"
      },
      {
        "cancelled": true,
        "email": "john.doe2@example.com",
        "first_name": "John",
        "full_name": "John Doe 2",
        "id": "3798",
        "last_name": "Doe 2"
      },
      {
        "cancelled": true,
        "email": "john.doe3@example.com",
        "first_name": "John",
        "full_name": "John Doe 3",
        "id": "3799",
        "last_name": "Doe 3"
      }
    ],
    "rebooked_from_order_id": null,
    "total_deposit_amount": 20000,
    "total_due_amount": 80000,
    "total_paid_amount": 20000,
    "total_price_amount": 100000,
    "trip_currency": "USD",
    "trip_end_date": "2023-10-30",
    "trip_id": "sth_123",
    "trip_length": 12,
    "trip_title": "SF Epic Trip!",
    "trip_uuid": "56710545"
  },
  "type": "booking.updated"
};

async function testWebhook() {
  try {
    console.log('🧪 Probando webhook de WeTravel...');
    console.log('📍 URL:', webhookUrl);
    console.log('📤 Enviando datos de prueba...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Respuesta recibida:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    const responseData = await response.json();
    console.log('   Body:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ Webhook funcionando correctamente!');
    } else {
      console.log('❌ Error en el webhook:', response.status);
    }

  } catch (error) {
    console.error('❌ Error al probar el webhook:', error.message);
  }
}

// Ejecutar la prueba
testWebhook();
