// Función para enviar mensajes de WhatsApp directamente a Green API desde el backend
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  console.log('📱 [WHATSAPP] sendWhatsAppMessage called with:', { phone, messageLength: message.length });

  const idInstance = '7105281616';
  const apiTokenInstance = 'e44f5320e85d4222baff6089d5f192bc6363f86e55da4e3e8c';

  // Formatea el número para Green API
  let cleaned = phone.replace(/[^0-9]/g, '');
  console.log('📱 [WHATSAPP] Phone cleaned:', cleaned);

  // Don't modify numbers that already have a country code
  // Only add Argentina code (54) if number has 10 digits and no country code
  if (cleaned.length === 10 && !cleaned.startsWith('54')) {
    cleaned = '54' + cleaned;
    console.log('📱 [WHATSAPP] Added Argentina country code:', cleaned);
  }

  const chatId = cleaned + '@c.us';
  console.log('📱 [WHATSAPP] ChatId:', chatId);

  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
  console.log('📱 [WHATSAPP] Calling Green API URL:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    console.log('📱 [WHATSAPP] Green API response status:', res.status);

    const data = await res.json();
    console.log('📱 [WHATSAPP] Green API response data:', JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error('❌ [WHATSAPP] Error HTTP:', data);
      return { success: false, error: data.error || 'Error enviando mensaje' };
    }

    console.log('✅ [WHATSAPP] Message sent successfully, messageId:', data.idMessage);
    return { success: true, messageId: data.idMessage };
  } catch (error) {
    console.error('❌ [WHATSAPP] Error de conexión:', error);
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
  // Parse the date string correctly to avoid timezone issues
  // If the date is in YYYY-MM-DD format, parse it as local time
  const parts = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

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

// Función para enviar notificación de reserva de baño de hielo
export const sendIceBathReservationNotification = async (
  bookingData: {
    checkIn: string;
    checkOut: string;
    guestName: string;
    phone: string;
    dni: string;
    total: number;
    quantity?: number;
  }
) => {
  const quantity = Math.max(1, bookingData.quantity ?? 1);
  const quantityLabel = quantity === 1 ? 'sesión' : 'sesiones';
  const dni = bookingData.dni?.trim() || 'No informado';

  const message = `🧊 *NUEVA RESERVA DE BAÑO DE HIELO* 🧊

📇 *Cliente:* ${bookingData.guestName}
📞 *Teléfono:* ${bookingData.phone}
🪪 *DNI:* ${dni}
📅 *Llegada:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Salida:* ${formatDateForWhatsApp(bookingData.checkOut)}
❄️ *Cantidad reservada:* ${quantity} ${quantityLabel}
💵 *Total abonado:* $${bookingData.total}

¡Reserva confirmada para terapia de frío!`;

  return sendWhatsAppMessage('+541153695627', message);
};

// Función para enviar notificación de reserva de clases de surf
export const sendSurfClassReservationNotification = async (
  bookingData: {
    checkIn: string;
    checkOut: string;
    guestName: string;
    phone: string;
    dni: string;
    total: number;
    surfPackage: string;
    guests: number;
    surfClasses?: number;
  }
) => {
  const dni = bookingData.dni?.trim() || 'No informado';
  const participants = Math.max(1, bookingData.guests || 1);
  const surfClasses =
    bookingData.surfClasses && bookingData.surfClasses > 0
      ? bookingData.surfClasses
      : undefined;
  const classesLine = surfClasses
    ? `🏄‍♂️ *Clases reservadas:* ${surfClasses} ${surfClasses === 1 ? 'clase' : 'clases'}`
    : '';

  const message = `🏄‍♂️ *NUEVA RESERVA DE CLASES DE SURF* 🏄‍♂️

📇 *Cliente:* ${bookingData.guestName}
📞 *Teléfono:* ${bookingData.phone}
🪪 *DNI:* ${dni}
📅 *Llegada:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Salida:* ${formatDateForWhatsApp(bookingData.checkOut)}
👥 *Participantes:* ${participants}
📦 *Plan elegido:* ${bookingData.surfPackage}
${classesLine}
💵 *Total abonado:* $${bookingData.total}

¡Reserva confirmada para plan de progreso en surf!`;

  return sendWhatsAppMessage('+541153695627', message);
};

// Función para enviar notificación unificada de actividades (múltiples participantes)
export const sendUnifiedActivitiesNotification = async (
  bookingData: {
    checkIn: string;
    checkOut: string;
    guestName: string;
    phone: string;
    dni: string;
    total: number;
    participants: Array<{
      name: string;
      activities: Array<{
        type: 'surf' | 'yoga' | 'ice_bath' | string;
        classes?: number;
        package?: string;
        quantity?: number;
      }>;
    }>;
  }
) => {
  const dni = bookingData.dni?.trim() || 'No informado';

  // Build activity details for each participant
  let activitiesDetails = '';
  bookingData.participants.forEach((participant, index) => {
    // Only show participant section if they have activities
    const validActivities = participant.activities.filter(
      activity => activity.type && (activity.classes || activity.quantity)
    );

    if (validActivities.length > 0) {
      activitiesDetails += `\n👤 *${participant.name}:*\n`;
      validActivities.forEach(activity => {
        if (activity.type === 'surf' && activity.classes) {
          activitiesDetails += `   🏄‍♂️ Surf: ${activity.classes} ${activity.classes === 1 ? 'clase' : 'clases'}\n`;
        } else if (activity.type === 'yoga' && activity.classes) {
          activitiesDetails += `   🧘‍♀️ Yoga: ${activity.classes} ${activity.classes === 1 ? 'clase' : 'clases'}\n`;
        } else if (activity.type === 'ice_bath' && activity.quantity) {
          activitiesDetails += `   🧊 Baño de Hielo: ${activity.quantity} ${activity.quantity === 1 ? 'sesión' : 'sesiones'}\n`;
        }
      });
    }
  });

  const message = `🎯 *NUEVA RESERVA DE ACTIVIDADES* 🎯

📇 *Cliente:* ${bookingData.guestName}
📞 *Teléfono:* ${bookingData.phone}
🪪 *DNI:* ${dni}
📅 *Llegada:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Salida:* ${formatDateForWhatsApp(bookingData.checkOut)}
${activitiesDetails}
💵 *Total abonado:* $${bookingData.total}

¡Reserva confirmada!`;

  return sendWhatsAppMessage('+541153695627', message);
};

// Función para enviar mensaje personalizado de Dario al cliente después del booking
export const sendDarioWelcomeMessage = async (
  phone: string,
  bookingData: {
    checkIn: string;
    checkOut: string;
    guestName: string;
    activities: string[];
    roomTypeName: string;
    guests: number;
  }
) => {
  const activitiesList = bookingData.activities.join(', ');

  const message = `¡Hola ${bookingData.guestName}! 👋

Soy Dario, y quería presentarme personalmente para confirmar tu reserva en Zeneida's Garden.

✅ *Tu reserva está confirmada:*
📅 *Fechas:* ${formatDateForWhatsApp(bookingData.checkIn)} - ${formatDateForWhatsApp(bookingData.checkOut)}
🏠 *Alojamiento:* ${bookingData.roomTypeName}
👥 *Huéspedes:* ${bookingData.guests}
🎯 *Actividades:* ${activitiesList}

🤙 *Próximos pasos:*
Los profesores se van a estar contactando contigo para coordinar los horarios de las clases y todos los detalles.

💬 Estoy acá para cualquier duda que tengas antes, durante o después de tu estadía. No dudes en escribirme cuando necesites!

¡Nos vemos pronto! 🌊🏄‍♂️

*Dario*
Zeneida's Garden`;

  return sendWhatsAppMessage(phone, message);
};

// ========== NEW MESSAGE SYSTEM ==========

// Mensaje al instructor de Ice Bath
export const sendIceBathInstructorNotification = async (
  bookingData: {
    clientFullName: string;
    clientPhone: string;
    checkIn: string;
    checkOut: string;
    participants: Array<{
      name: string;
      iceBathSessions: number;
    }>;
  }
) => {
  // Build participant list
  let participantsList = '';
  bookingData.participants.forEach((p) => {
    participantsList += `   • ${p.name}: ${p.iceBathSessions} ${p.iceBathSessions === 1 ? 'sesión' : 'sesiones'}\n`;
  });

  const message = `🧊 *NUEVA RESERVA - BAÑO DE HIELO*

📇 *Cliente:* ${bookingData.clientFullName}
📞 *Teléfono:* ${bookingData.clientPhone}
📅 *Llegada:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Salida:* ${formatDateForWhatsApp(bookingData.checkOut)}

❄️ *Participantes y sesiones:*
${participantsList}
Coordiná horarios directamente con el cliente.`;

  // Get ice bath instructor phone from environment
  const instructorPhone = process.env.ICEBATH_INSTRUCTOR_PHONE || '+541153695627';
  console.log('🧊 [WHATSAPP] Sending ice bath notification to instructor:', instructorPhone);

  return sendWhatsAppMessage(instructorPhone, message);
};

// Mensaje al instructor de Surf
export const sendSurfInstructorNotification = async (
  bookingData: {
    clientFullName: string;
    clientPhone: string;
    checkIn: string;
    checkOut: string;
    participants: Array<{
      name: string;
      surfClasses: number;
    }>;
  }
) => {
  // Build participant list
  let participantsList = '';
  bookingData.participants.forEach((p) => {
    participantsList += `   • ${p.name}: ${p.surfClasses} ${p.surfClasses === 1 ? 'clase' : 'clases'}\n`;
  });

  const message = `🏄‍♂️ *NUEVA RESERVA - SURF*

📇 *Cliente:* ${bookingData.clientFullName}
📞 *Teléfono:* ${bookingData.clientPhone}
📅 *Llegada:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Salida:* ${formatDateForWhatsApp(bookingData.checkOut)}

🌊 *Participantes y clases:*
${participantsList}
Coordiná horarios directamente con el cliente.`;

  // Get surf instructor phone from environment
  const instructorPhone = process.env.SURF_INSTRUCTOR_PHONE || '+541153695627';
  console.log('🏄 [WHATSAPP] Sending surf notification to instructor:', instructorPhone);

  return sendWhatsAppMessage(instructorPhone, message);
};

// Mensaje de confirmación al cliente
export const sendClientConfirmationMessage = async (
  bookingData: {
    clientPhone: string;
    clientFirstName: string;
    checkIn: string;
    checkOut: string;
    locale?: string; // 'en' or 'es', defaults to 'es'
  }
) => {
  console.log('📧 [WHATSAPP] sendClientConfirmationMessage called with:', {
    clientPhone: bookingData.clientPhone,
    clientFirstName: bookingData.clientFirstName,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    locale: bookingData.locale
  });

  const isEnglish = bookingData.locale === 'en';

  // Format dates according to locale
  const formattedCheckIn = isEnglish
    ? new Date(bookingData.checkIn.split('T')[0]).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : formatDateForWhatsApp(bookingData.checkIn);

  const formattedCheckOut = isEnglish
    ? new Date(bookingData.checkOut.split('T')[0]).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : formatDateForWhatsApp(bookingData.checkOut);

  const message = isEnglish
    ? `Hi ${bookingData.clientFirstName}! 👋

✅ *Your reservation is confirmed*

📅 *Check-in:* ${formattedCheckIn}
📅 *Check-out:* ${formattedCheckOut}

The instructors will contact you to coordinate the activity schedules.

If you have any questions, write to us at this number. We're here to help!

See you soon! 🌊

*Zeneida's Garden*`
    : `¡Hola ${bookingData.clientFirstName}! 👋

✅ *Tu reserva está confirmada*

📅 *Check-in:* ${formattedCheckIn}
📅 *Check-out:* ${formattedCheckOut}

Los instructores se van a contactar contigo para coordinar los horarios de las actividades.

Si tenés alguna duda, escribinos a este número. ¡Estamos para ayudarte!

¡Nos vemos pronto! 🌊

*Zeneida's Garden*`;

  console.log('📧 [WHATSAPP] About to send message to:', bookingData.clientPhone);
  console.log('📧 [WHATSAPP] Message preview:', message.substring(0, 100) + '...');

  const result = await sendWhatsAppMessage(bookingData.clientPhone, message);

  console.log('📧 [WHATSAPP] sendWhatsAppMessage result:', result);

  return result;
};

// Mensaje de notificación al administrador sobre nueva reserva
export const sendAdminNewBookingNotification = async (
  bookingData: {
    bookingReference: string;
    clientFullName: string;
    clientEmail: string;
    clientPhone: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomTypeName?: string;
    totalAmount?: number;
    depositAmount?: number;
    activities?: Array<{
      name: string;
      participants: string[];
      quantity?: number;
    }>;
  }
) => {
  console.log('📋 [WHATSAPP] Sending admin notification for booking:', bookingData.bookingReference);

  // Build activities list
  let activitiesList = '';
  if (bookingData.activities && bookingData.activities.length > 0) {
    activitiesList = '\n\n🎯 *Actividades:*\n';
    bookingData.activities.forEach((activity) => {
      const participantNames = activity.participants.join(', ');
      const quantityInfo = activity.quantity ? ` x${activity.quantity}` : '';
      activitiesList += `   • ${activity.name}${quantityInfo}\n     👥 ${participantNames}\n`;
    });
  }

  // Build pricing info
  let pricingInfo = '';
  if (bookingData.totalAmount) {
    pricingInfo = `\n💰 *Total:* $${bookingData.totalAmount}`;
    if (bookingData.depositAmount) {
      pricingInfo += `\n💳 *Depósito WeTravel:* $${bookingData.depositAmount}`;
      const remaining = bookingData.totalAmount - bookingData.depositAmount;
      pricingInfo += `\n💵 *Pendiente:* $${remaining}`;
    }
  }

  const message = `🔔 *NUEVA RESERVA - ${bookingData.bookingReference}*

📇 *Cliente:* ${bookingData.clientFullName}
📧 *Email:* ${bookingData.clientEmail}
📞 *Teléfono:* ${bookingData.clientPhone}

📅 *Check-in:* ${formatDateForWhatsApp(bookingData.checkIn)}
📅 *Check-out:* ${formatDateForWhatsApp(bookingData.checkOut)}
👥 *Huéspedes:* ${bookingData.guests}
${bookingData.roomTypeName ? `🏠 *Alojamiento:* ${bookingData.roomTypeName}` : ''}${activitiesList}${pricingInfo}

✅ Reserva confirmada en LobbyPMS`;

  // Get admin phone from environment
  const adminPhone = process.env.ADMIN_PHONE || '+541153695627';
  console.log('📋 [WHATSAPP] Sending to admin:', adminPhone);

  return sendWhatsAppMessage(adminPhone, message);
}; 