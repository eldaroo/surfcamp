import { NextRequest, NextResponse } from 'next/server';
import { LobbyPMSReservationRequest } from '@/types';
import { generateBookingReference } from '@/lib/utils';
import { lobbyPMSClient } from '@/lib/lobbypms';
import { sendBookingConfirmation, sendWhatsAppMessage } from '@/lib/whatsapp';

// Mapeo de roomTypeId a category_id de LobbyPMS
const ROOM_TYPE_MAPPING = {
  'casa-playa': 4234,        // Casa Playa
  'casitas-privadas': 15507, // Casita 7 (representativa de casitas privadas)
  'casas-deluxe': 5348       // Studio 1 (representativa de casas deluxe)
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      checkIn, 
      checkOut, 
      guests, 
      contactInfo,
      roomTypeId = 'casa-playa', // Default room type
      activities = [],
      paymentIntentId
    } = body;

    const bookingReference = generateBookingReference();

    console.log('🏨 ===== PROCESSING RESERVATION =====');
    console.log('🏨 Booking data:', {
      checkIn,
      checkOut,
      guests,
      roomTypeId,
      contactInfo: contactInfo ? `${contactInfo.firstName} ${contactInfo.lastName}` : 'Missing',
      paymentIntentId,
      bookingReference
    });

    // Get the corresponding category_id for LobbyPMS
    const categoryId = ROOM_TYPE_MAPPING[roomTypeId as keyof typeof ROOM_TYPE_MAPPING];
    
    if (!categoryId) {
      console.error('❌ Invalid room type:', roomTypeId);
      return NextResponse.json(
        { error: `Tipo de habitación no válido: ${roomTypeId}` },
        { status: 400 }
      );
    }

    console.log('🔄 Mapping room type:', {
      roomTypeId,
      categoryId,
      mappingUsed: ROOM_TYPE_MAPPING
    });

    // Convert dates to the format expected by LobbyPMS (Y-m-d)
    const formatDateForLobbyPMS = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    };

    const formattedCheckIn = formatDateForLobbyPMS(checkIn);
    const formattedCheckOut = formatDateForLobbyPMS(checkOut);

    console.log('📅 Date formatting:', {
      original: { checkIn, checkOut },
      formatted: { checkIn: formattedCheckIn, checkOut: formattedCheckOut }
    });

    // Prepare LobbyPMS reservation request with correct field names and date format
    const bookingData = {
      start_date: formattedCheckIn,     // Y-m-d format as required by LobbyPMS
      end_date: formattedCheckOut,      // Y-m-d format as required by LobbyPMS
      guest_count: guests,
      total_adults: guests,             // Required field by LobbyPMS
      total_children: 0,                // Default to 0 children
      guest_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
      holder_name: `${contactInfo.firstName} ${contactInfo.lastName}`, // Required when customer document is not present
      guest_email: contactInfo.email,
      guest_phone: contactInfo.phone,
      guest_document: contactInfo.dni,  // DNI del huésped
      customer_document: contactInfo.dni, // También como customer_document por si LobbyPMS lo requiere así
      customer_nationality: 'ES',       // Nacionalidad por defecto España (requerido cuando hay documento)
      category_id: categoryId,
      room_type_id: roomTypeId,
      booking_reference: bookingReference,
      source: 'Surfcamp Santa Teresa',     // Fuente más clara
      payment_intent_id: paymentIntentId,
      status: 'confirmed',
      notes: `🏄‍♂️ RESERVA DESDE SURFCAMP SANTA TERESA 🏄‍♂️\n\nDetalles de la reserva:\n- Web: surfcamp-santa-teresa.com\n- Referencia: ${bookingReference}\n- Huésped: ${contactInfo.firstName} ${contactInfo.lastName}\n- DNI: ${contactInfo.dni}\n- Email: ${contactInfo.email}\n- Teléfono: ${contactInfo.phone}\n- Pago: ${paymentIntentId}`,
      special_requests: `Reserva realizada a través de la página web oficial de Surfcamp Santa Teresa. Referencia de pago: ${paymentIntentId}`
    };

    console.log('📡 Sending to LobbyPMS:', bookingData);

    try {
      console.log('🚀 Attempting to create booking in LobbyPMS...');
      const reservationData = await lobbyPMSClient.createBooking(bookingData);

      console.log('✅ LobbyPMS reservation successful:', reservationData);

      // Enviar mensaje de confirmación por WhatsApp
      try {
        const waMessage = `¡Hola! Se confirmó una reserva en SurfCamp para las fechas ${checkIn} a ${checkOut} para ${guests} huésped(es). Referencia: ${bookingReference}`;
        const whatsappResult = await sendWhatsAppMessage(
          '+5491162802566',
          waMessage
        );
        console.log('📱 WhatsApp confirmation sent:', whatsappResult);
      } catch (whatsappError) {
        console.error('❌ WhatsApp error (non-blocking):', whatsappError);
      }

      return NextResponse.json({
        success: true,
        reservationId: reservationData.reservation_id || reservationData.id,
        bookingReference,
        status: reservationData.status || 'confirmed',
        message: 'Reserva confirmada exitosamente en LobbyPMS',
        demoMode: false,
        lobbyPMSResponse: reservationData
      });

    } catch (lobbyError: any) {
      console.error('❌ LobbyPMS booking error:', {
        message: lobbyError.message,
        status: lobbyError.response?.status,
        data: lobbyError.response?.data,
        bookingData
      });

      // Si es error de capacidad, ajustar y reintentar
      if (lobbyError.response?.data?.error_code === 'MAXIMUM_CAPACITY') {
        console.log('🔄 Capacity error detected, adjusting guest count...');
        
        // Reducir huéspedes a 1 e intentar de nuevo
        const adjustedBookingData = {
          ...bookingData,
          guest_count: 1,
          total_adults: 1
        };
        
        try {
          console.log('🔄 Retrying with 1 guest...');
          const retryReservationData = await lobbyPMSClient.createBooking(adjustedBookingData);
          
          console.log('✅ LobbyPMS reservation successful (adjusted):', retryReservationData);
          
          // Enviar mensaje de confirmación por WhatsApp
          try {
            const waMessage = `¡Hola! Se confirmó una reserva en SurfCamp para las fechas ${checkIn} a ${checkOut} para 1 huésped (ajustado por capacidad). Referencia: ${bookingReference}`;
            const whatsappResult = await sendWhatsAppMessage(
              '+5491162802566',
              waMessage
            );
            console.log('📱 WhatsApp confirmation sent (adjusted):', whatsappResult);
          } catch (whatsappError) {
            console.error('❌ WhatsApp error (non-blocking):', whatsappError);
          }
          
          return NextResponse.json({
            success: true,
            reservationId: retryReservationData.reservation_id || retryReservationData.id,
            bookingReference,
            status: retryReservationData.status || 'confirmed',
            message: 'Reserva confirmada exitosamente en LobbyPMS (ajustada a 1 huésped por capacidad)',
            demoMode: false,
            adjusted: true,
            originalGuests: guests,
            finalGuests: 1,
            lobbyPMSResponse: retryReservationData
          });
          
        } catch (retryError: any) {
          console.error('❌ Retry also failed:', retryError);
          // Continue to fallback below
        }
      }

      // Solo como ÚLTIMO RECURSO: modo demo con notificación especial
      console.log('🔄 LobbyPMS failed, using emergency fallback mode');
      
      // Enviar mensaje de alerta por WhatsApp 
      try {
        const alertMessage = `🚨 ALERTA: Fallo en LobbyPMS - Reserva ${bookingReference} requiere procesamiento manual.\n\nDatos:\n- Fechas: ${checkIn} a ${checkOut}\n- Huéspedes: ${guests}\n- Cliente: ${contactInfo.firstName} ${contactInfo.lastName}\n- Email: ${contactInfo.email}\n- Teléfono: ${contactInfo.phone}\n- Error: ${lobbyError.message}`;
        const alertResult = await sendWhatsAppMessage(
          '+5491162802566',
          alertMessage
        );
        console.log('📱 WhatsApp alert sent:', alertResult);
      } catch (whatsappError) {
        console.error('❌ WhatsApp alert error:', whatsappError);
      }
      
      return NextResponse.json({
        success: true,
        reservationId: `EMERGENCY-${bookingReference}`,
        bookingReference,
        status: 'pending_manual_processing',
        message: 'Reserva recibida - procesándose manualmente',
        demoMode: true,
        needsManualProcessing: true,
        fallbackReason: lobbyError.message,
        originalError: lobbyError.response?.data,
        note: 'Tu reserva está confirmada. Nos contactaremos contigo en las próximas horas para finalizar los detalles.'
      });
    }

  } catch (error: any) {
    console.error('❌ General reservation error:', error);
    
    // Generate a fallback booking reference if we don't have one
    const fallbackReference = generateBookingReference();
    
    // Enviar alerta crítica por WhatsApp
    try {
      const criticalAlert = `🚨 ERROR CRÍTICO: Fallo general en sistema de reservas.\n\nReferencia: ${fallbackReference}\nError: ${error.message}`;
      await sendWhatsAppMessage('+5491162802566', criticalAlert);
    } catch (whatsappError) {
      console.error('❌ Critical WhatsApp alert failed:', whatsappError);
    }
    
    // Incluso en error general, confirmar al usuario
    return NextResponse.json({
      success: true,
      reservationId: `CRITICAL-FALLBACK-${fallbackReference}`,
      bookingReference: fallbackReference,
      status: 'pending_manual_processing',
      message: 'Reserva recibida - procesándose manualmente',
      demoMode: true,
      needsManualProcessing: true,
      error: error.message,
      note: 'Tu reserva ha sido registrada. Nos pondremos en contacto contigo para confirmar los detalles.'
    });
  }
} 