// Función para enviar mensajes de WhatsApp directamente a Green API desde el backend
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const idInstance = '7105281616';
  const apiTokenInstance = 'e44f5320e85d4222baff6089d5f192bc6363f86e55da4e3e8c';

  // Formatea el número para Green API
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned.startsWith('54')) {
    cleaned = '54' + cleaned;
  }
  const chatId = cleaned + '@c.us';

  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[GreenAPI] Error HTTP:', data);
      return { success: false, error: data.error || 'Error enviando mensaje' };
    }
    return { success: true, messageId: data.idMessage };
  } catch (error) {
    console.error('[GreenAPI] Error de conexión:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

// Función para obtener el nombre del tipo de habitación
export const getRoomTypeName = (roomTypeId: string): string => {
  const roomTypes: { [key: string]: string } = {
    'casa-playa': 'Casa de Playa (Cuarto Compartido)',
    'casitas-privadas': 'Casitas Privadas',
    'casas-deluxe': 'Casas Deluxe'
  };

  return roomTypes[roomTypeId] || roomTypeId;
};

// Función para formatear fechas para WhatsApp
export const formatDateForWhatsApp = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Función para enviar confirmación de reserva
export const sendBookingConfirmation = async (
  phone: string,
  bookingData: {
    checkIn: string;
    checkOut: string;
    roomTypeId: string;
    guests: number;
    bookingReference: string;
    total: number;
    guestName: string;
  }
) => {
  const message = `¡Hola ${bookingData.guestName}! 🎉

Tu reserva ha sido confirmada exitosamente.

📅 Check-in: ${formatDateForWhatsApp(bookingData.checkIn)}
📅 Check-out: ${formatDateForWhatsApp(bookingData.checkOut)}
🏠 Habitación: ${getRoomTypeName(bookingData.roomTypeId)}
👥 Huéspedes: ${bookingData.guests}
💰 Total: $${bookingData.total}
🔢 Referencia: ${bookingData.bookingReference}

¡Nos vemos pronto en SurfCamp Santa Teresa! 🌊`;

  return sendWhatsAppMessage(phone, message);
};

// Función para enviar recordatorio de reserva
export const sendBookingReminder = async (
  phone: string,
  bookingData: {
    checkIn: string;
    roomTypeId: string;
    bookingReference: string;
    guestName: string;
  }
) => {
  const message = `¡Hola ${bookingData.guestName}! 🌊

Te recordamos tu reserva en SurfCamp Santa Teresa:

📅 Check-in: ${formatDateForWhatsApp(bookingData.checkIn)}
🏠 Habitación: ${getRoomTypeName(bookingData.roomTypeId)}
🔢 Referencia: ${bookingData.bookingReference}

¡Estamos ansiosos por recibirte! 🏄‍♂️`;

  return sendWhatsAppMessage(phone, message);
};

// Función para enviar mensaje de bienvenida
export const sendWelcomeMessage = async (
  phone: string,
  bookingData: {
    roomTypeId: string;
    bookingReference: string;
    guestName: string;
  }
) => {
  const message = `¡Bienvenido/a ${bookingData.guestName}! 🎉

Tu reserva en SurfCamp Santa Teresa está lista:

🏠 Habitación: ${getRoomTypeName(bookingData.roomTypeId)}
🔢 Referencia: ${bookingData.bookingReference}

¡Disfruta de tu estadía! 🌊`;

  return sendWhatsAppMessage(phone, message);
};

// Función para verificar estado de Green API
export const checkWhatsAppStatus = async (): Promise<{
  configured: boolean;
  state?: string;
  instance?: string;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/whatsapp', {
      method: 'GET'
    });

    const result = await response.json();

    if (!response.ok) {
      return { configured: false, error: result.error };
    }

    return {
      configured: true,
      state: result.state,
      instance: result.instance
    };
  } catch (error) {
    return { configured: false, error: 'Error de conexión' };
  }
}; 