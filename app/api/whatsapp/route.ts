import { NextResponse } from 'next/server';
import axios from 'axios';

// Configuración de Green API
const GREEN_API_URL = process.env.GREEN_API_URL || 'https://api.green-api.com';
const GREEN_API_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;

// Función para formatear número de teléfono
const formatPhoneNumber = (phone: string): string => {
  // Remover espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si no empieza con +, agregar código de país por defecto
  if (!cleaned.startsWith('+')) {
    // Si empieza con 0, removerlo (formato argentino)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Agregar código de país Argentina por defecto
    cleaned = '+54' + cleaned;
  }
  
  // Formato para Green API (sin + y con @c.us)
  return cleaned.replace('+', '') + '@c.us';
};

// Plantillas de mensajes
const messageTemplates = {
  booking_confirmation: (data: any) => `🏄‍♂️ *CONFIRMACIÓN DE RESERVA*
*Surfcamp Santa Teresa*

✅ ¡Tu reserva ha sido confirmada!

📅 *Fechas:* ${data.checkIn} - ${data.checkOut}
🏠 *Alojamiento:* ${data.roomType}
👥 *Huéspedes:* ${data.guests}
📞 *Referencia:* ${data.bookingReference}

💰 *Total:* $${data.total}

📍 *Ubicación:* Santa Teresa, Costa Rica
🏄‍♂️ ¡Te esperamos para una experiencia increíble!

_Cualquier consulta responde a este mensaje_
*Surfcamp Santa Teresa*
Powered by zeneidas`,

  booking_reminder: (data: any) => `🏄‍♂️ *RECORDATORIO DE RESERVA*
*Surfcamp Santa Teresa*

¡Hola ${data.guestName}!

⏰ Tu check-in es mañana: ${data.checkIn}
🏠 ${data.roomType}
📞 Referencia: ${data.bookingReference}

📋 *Qué traer:*
• Documentos de identidad
• Traje de baño
• Protector solar
• Ganas de surfear! 🏄‍♂️

📍 *Dirección:* Santa Teresa, Costa Rica
🕒 *Check-in:* 14:00 hrs

¡Nos vemos pronto!
*Surfcamp Santa Teresa*`,

  welcome_message: (data: any) => `🏄‍♂️ *¡BIENVENIDO A SURFCAMP SANTA TERESA!*

¡Hola ${data.guestName}!

✅ Check-in completado
🏠 ${data.roomType}
📞 Referencia: ${data.bookingReference}

🌊 *Información importante:*
• WiFi: SurfcampST / Password: 123456
• Clases de surf: 8:00 AM y 2:00 PM
• Desayuno: 7:00 - 10:00 AM
• Check-out: 11:00 AM

📱 *Contacto de emergencia:* +506 XXXX-XXXX
🏄‍♂️ ¡Disfruta tu estadía!

*Surfcamp Santa Teresa*
Powered by zeneidas`
};

export async function POST(request: Request) {
  try {
    if (!GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
      return NextResponse.json({
        error: 'Green API no está configurada. Verifica GREEN_API_INSTANCE y GREEN_API_TOKEN'
      }, { status: 500 });
    }

    const { phone, template, data } = await request.json();

    if (!phone || !template || !data) {
      return NextResponse.json({
        error: 'Faltan parámetros: phone, template, data'
      }, { status: 400 });
    }

    // Verificar que la plantilla existe
    if (!messageTemplates[template as keyof typeof messageTemplates]) {
      return NextResponse.json({
        error: `Plantilla '${template}' no encontrada`
      }, { status: 400 });
    }

    // Formatear número de teléfono
    const formattedPhone = formatPhoneNumber(phone);
    
    // Generar mensaje usando la plantilla
    const messageText = messageTemplates[template as keyof typeof messageTemplates](data);

    // Enviar mensaje via Green API
    const response = await axios.post(
      `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`,
      {
        chatId: formattedPhone,
        message: messageText
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('📱 WhatsApp enviado exitosamente:', {
      phone: formattedPhone,
      template,
      messageId: response.data.idMessage,
      response: response.data
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.idMessage,
      phone: formattedPhone,
      template,
      message: 'Mensaje enviado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error enviando WhatsApp:', error);
    
    return NextResponse.json({
      error: 'Error enviando mensaje de WhatsApp',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}

// Endpoint para obtener información de instancia
export async function GET(request: Request) {
  try {
    if (!GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
      return NextResponse.json({
        error: 'Green API no está configurada'
      }, { status: 500 });
    }

    const response = await axios.get(
      `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/getStateInstance/${GREEN_API_TOKEN}`
    );

    return NextResponse.json({
      instance: GREEN_API_INSTANCE,
      state: response.data.stateInstance,
      configured: true
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error obteniendo estado de instancia',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
} 