import { NextRequest, NextResponse } from 'next/server';
import { Activity, LobbyPMSReservationRequest } from '@/types';
import { generateBookingReference } from '@/lib/utils';
import { lobbyPMSClient } from '@/lib/lobbypms';
import {
  sendBookingConfirmation,
  sendWhatsAppMessage,
  sendDarioWelcomeMessage,
  sendIceBathReservationNotification,
  sendSurfClassReservationNotification,
  getRoomTypeName
} from '@/lib/whatsapp';
import { getActivityById } from '@/lib/activities';
import { lookupActivityProductId } from '@/lib/lobbypms-products';

// Mapeo de roomTypeId a category_id de LobbyPMS
const ROOM_TYPE_MAPPING = {
  'casa-playa': 4234,        // Casa Playa
  'casitas-privadas': 15507, // Casita 7 (representativa de casitas privadas)
  'casas-deluxe': 5348       // Studio 1 (representativa de casas deluxe)
};

const DEFAULT_INVENTORY_CENTER_ID = process.env.LOBBYPMS_DEFAULT_INVENTORY_CENTER_ID;

const normalizeActivityKey = (value: string) =>
  value.replace(/[^a-z0-9]/gi, '_').toUpperCase();

const getEnvProductId = (activityId: string, activityPackage?: string, classCount?: number) => {
  const baseKey = `LOBBYPMS_PRODUCT_${normalizeActivityKey(activityId)}`;
  const packageKey = activityPackage
    ? `LOBBYPMS_PRODUCT_${normalizeActivityKey(activityId)}_${normalizeActivityKey(activityPackage)}`
    : null;

  if (packageKey && process.env[packageKey]) {
    return process.env[packageKey];
  }

  if (process.env[baseKey]) {
    return process.env[baseKey];
  }

  return lookupActivityProductId(activityId, {
    package: activityPackage,
    classCount: classCount ?? undefined
  });
};

const getEnvInventoryCenterId = (activityId: string, activityPackage?: string) => {
  const baseKey = `LOBBYPMS_PRODUCT_${normalizeActivityKey(activityId)}_INVENTORY`;
  const packageKey = activityPackage
    ? `LOBBYPMS_PRODUCT_${normalizeActivityKey(activityId)}_${normalizeActivityKey(activityPackage)}_INVENTORY`
    : null;

  if (packageKey && process.env[packageKey]) {
    return process.env[packageKey];
  }

  return process.env[baseKey] || DEFAULT_INVENTORY_CENTER_ID;
};

const parsePackageMultiplier = (activityPackage?: string) => {
  if (!activityPackage) return 1;
  const match = activityPackage.match(/\d+/);
  if (!match) return 1;
  const value = parseInt(match[0], 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const normalizePhoneNumber = (phone?: string | null) => {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D+/g, "");
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return undefined;
  }
  if (phone.trim().startsWith("+")) {
    const plusDigits = `+${digitsOnly}`;
    return plusDigits;
  }
  return digitsOnly;
};

interface ResolvedActivityConsumption {
  id: string;
  category?: Activity['category'];
  package?: string;
  classCount?: number;
}

const resolveActivitiesForConsumption = (
  selectedActivities: any[],
  fallbackIds: string[] = []
): ResolvedActivityConsumption[] => {
  if (selectedActivities && selectedActivities.length > 0) {
    return selectedActivities.map((activity: any) => {
      const baseActivity = getActivityById(activity.id);
      const rawClassCount = typeof activity.classCount === 'number' ? activity.classCount : undefined;
      const normalizedClassCount = rawClassCount && Number.isFinite(rawClassCount)
        ? Math.max(1, Math.round(rawClassCount))
        : undefined;

      return {
        id: activity.id,
        category: activity.category || baseActivity?.category,
        package: activity.package,
        classCount: normalizedClassCount ?? (activity.package ? parsePackageMultiplier(activity.package) : undefined)
      };
    });
  }

  return fallbackIds.map((id) => {
    const baseActivity = getActivityById(id);
    const isSurf = baseActivity?.category === 'surf';
    return {
      id,
      category: baseActivity?.category,
      package: isSurf ? '4-classes' : undefined,
      classCount: isSurf ? 4 : undefined
    };
  });
};

const buildConsumptionItems = (
  activities: ResolvedActivityConsumption[],
  guests: number
) => {
  const itemsMap: Record<string, { product_id: string; cant: number; inventory_center_id?: string }> = {};

  activities.forEach((activity) => {
    if (!activity?.id) return;

    const normalizedClassCount = typeof activity.classCount === 'number' && Number.isFinite(activity.classCount)
      ? Math.max(1, Math.round(activity.classCount))
      : undefined;

    const productId = getEnvProductId(activity.id, activity.package, normalizedClassCount);

    if (!productId) {
      console.warn('?s??,? [RESERVE] No LobbyPMS product mapping for activity. Skipping consumption:', {
        activityId: activity.id,
        package: activity.package,
        classCount: normalizedClassCount
      });
      return;
    }

    const baseQuantityCategories: Activity['category'][] = ['yoga', 'ice_bath'];
    const baseGuests = guests && baseQuantityCategories.includes(activity.category as Activity['category'])
      ? guests
      : 1;

    const packageMultiplier = activity.category === 'surf'
      ? 1
      : normalizedClassCount ?? (activity.package ? parsePackageMultiplier(activity.package) : 1);
    const quantity = Math.max(1, baseGuests) * Math.max(1, packageMultiplier);

    if (!itemsMap[productId]) {
      const inventoryCenterId = getEnvInventoryCenterId(activity.id, activity.package) || undefined;
      itemsMap[productId] = {
        product_id: productId,
        cant: quantity,
        ...(inventoryCenterId ? { inventory_center_id: inventoryCenterId } : {})
      };
    } else {
      itemsMap[productId].cant += quantity;
    }
  });

  return Object.values(itemsMap);
};


export async function POST(request: NextRequest) {
  try {
    console.log('🏨 [RESERVE] Incoming reservation request');
    const body = await request.json();
    console.log('🏨 [RESERVE] Raw request body:', JSON.stringify(body, null, 2));
    const {
      checkIn,
      checkOut,
      guests,
      contactInfo,
      roomTypeId = 'casa-playa', // Default room type
      activities = [],
      selectedActivities: selectedActivitiesPayload = [],
      activityIds = [],
      paymentIntentId
    } = body;

    const phoneForLobby = normalizePhoneNumber(contactInfo?.phone);
    if (contactInfo?.phone) {
      if (phoneForLobby) {
        if (phoneForLobby !== contactInfo.phone) {
          console.log('[RESERVE] Normalized phone number for LobbyPMS:', {
            original: contactInfo.phone,
            normalized: phoneForLobby,
          });
        }
      } else {
        console.warn('[RESERVE] Phone discarded for LobbyPMS (fails validation rules):', contactInfo.phone);
      }
    }

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

    console.log('🏨 [RESERVE] Environment snapshot:', {
      nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      lobbypmsApiUrl: process.env.LOBBYPMS_API_URL,
      hasLobbyApiKey: !!process.env.LOBBYPMS_API_KEY,
      vercelUrl: process.env.VERCEL_URL,
      nodeEnv: process.env.NODE_ENV
    });

    // Get the corresponding category_id for LobbyPMS
    const categoryId = ROOM_TYPE_MAPPING[roomTypeId as keyof typeof ROOM_TYPE_MAPPING];
    
    if (!categoryId) {
      console.error('❌ Invalid room type:', roomTypeId);
      console.error('🏨 [RESERVE] Known roomTypeIds:', ROOM_TYPE_MAPPING);
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
    const baseNotes = `🏄‍♂️ RESERVA DESDE SURFCAMP SANTA TERESA 🏄‍♂️\n\nDetalles de la reserva:\n- Web: surfcamp-santa-teresa.com\n- Referencia: ${bookingReference}\n- Huésped: ${contactInfo.firstName} ${contactInfo.lastName}\n- DNI: ${contactInfo.dni}\n- Email: ${contactInfo.email}\n- Teléfono: ${contactInfo.phone}\n- Pago: ${paymentIntentId}`;
    const bookingData = {
      start_date: formattedCheckIn,     // Y-m-d format as required by LobbyPMS
      end_date: formattedCheckOut,      // Y-m-d format as required by LobbyPMS
      guest_count: guests,
      total_adults: guests,             // Required field by LobbyPMS
      total_children: 0,                // Default to 0 children
      guest_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
      holder_name: `${contactInfo.firstName} ${contactInfo.lastName}`, // Required when customer document is not present
      guest_email: contactInfo.email,
      guest_document: contactInfo.dni,  // DNI del huésped
      customer_document: contactInfo.dni, // También como customer_document por si LobbyPMS lo requiere así
      customer_nationality: 'ES',       // Nacionalidad por defecto España (requerido cuando hay documento)
      customer_email: contactInfo.email,
      category_id: categoryId,
      room_type_id: roomTypeId,
      booking_reference: bookingReference,
      source: 'Surfcamp Santa Teresa',     // Fuente más clara
      payment_intent_id: paymentIntentId,
      status: 'confirmed',
      notes: `${baseNotes}\n- Nota Surfcamp: Surfcamp`,
      special_requests: `Reserva realizada a través de la página web oficial de Surfcamp Santa Teresa. Referencia de pago: ${paymentIntentId}`
    };

    if (phoneForLobby) {
      (bookingData as any).guest_phone = phoneForLobby;
      (bookingData as any).customer_phone = phoneForLobby;
    }

    const fallbackActivityIds = Array.isArray(activityIds) && activityIds.length > 0
      ? activityIds
      : Array.isArray(activities)
        ? activities
            .map((item: any) => (typeof item === 'string' ? item : item?.id))
            .filter((id: string | undefined): id is string => Boolean(id))
        : [];

    const resolvedActivities = resolveActivitiesForConsumption(
      Array.isArray(selectedActivitiesPayload) ? selectedActivitiesPayload : [],
      fallbackActivityIds
    );

    // Ensure customer exists in LobbyPMS before booking
    try {
      if (contactInfo?.dni && contactInfo.firstName && contactInfo.lastName) {
        console.log('[RESERVE] Creating LobbyPMS customer with payload:', {
          customer_document: contactInfo.dni,
          customer_nationality: contactInfo?.nationality || 'ES',
          name: contactInfo.firstName,
          surname: contactInfo.lastName,
          phoneOriginal: contactInfo.phone,
          phoneNormalized: phoneForLobby || null,
          email: contactInfo.email
        });

        const customerPayload: Record<string, any> = {
          customer_document: contactInfo.dni,
          customer_nationality: contactInfo?.nationality || 'ES',
          name: contactInfo.firstName,
          surname: contactInfo.lastName,
          email: contactInfo.email,
          note: `Cliente creado desde Surfcamp Santa Teresa (${bookingReference})`
        };

        if (phoneForLobby) {
          customerPayload.phone = phoneForLobby;
        }

        const customerResult = await lobbyPMSClient.createCustomer(customerPayload);

        console.log('[RESERVE] LobbyPMS createCustomer response:', customerResult);
      } else {
        console.warn('⚠️ [RESERVE] Missing customer data to create LobbyPMS customer:', {
          hasDni: !!contactInfo?.dni,
          hasFirstName: !!contactInfo?.firstName,
          hasLastName: !!contactInfo?.lastName
        });
      }
    } catch (customerError) {
      console.error('❌ [RESERVE] Failed to create LobbyPMS customer:', customerError);
      // Continue with booking even if customer creation failed (LobbyPMS may auto-create)
    }

    console.log('📡 Sending to LobbyPMS:', bookingData);

    try {
      console.log('🚀 Attempting to create booking in LobbyPMS...');
      const reservationData = await lobbyPMSClient.createBooking(bookingData);
      console.log('🏨 [RESERVE] LobbyPMS createBooking response:', JSON.stringify(reservationData, null, 2));

      const registeredGuests =
        reservationData?.booking?.guests?.registered ??
        reservationData?.booking?.registered_guests ??
        reservationData?.registeredGuests ??
        reservationData?.registered_guests ??
        null;
      const expectedGuests =
        guests ??
        (typeof bookingData === 'object' ? (bookingData as any)?.guest_count : undefined) ??
        (typeof bookingData === 'object' ? (bookingData as any)?.total_adults : undefined) ??
        null;

      console.log('[RESERVE] Guest registration status:', {
        registeredGuests,
        expectedGuests,
        lobbyResponseHasGuestsField: Boolean(reservationData?.booking?.guests),
      });

      console.log('✅ LobbyPMS reservation successful:', reservationData);

      const bookingId =
        reservationData?.booking?.booking_id ||
        reservationData?.booking_id ||
        reservationData?.id;

      if (!bookingId) {
        console.warn('⚠️ [RESERVE] Could not determine booking_id from LobbyPMS response. Skipping add-product-service.');
      } else {
        try {
          const consumptionItems = buildConsumptionItems(resolvedActivities, guests || 1);
          if (consumptionItems.length > 0) {
            await lobbyPMSClient.addProductsToBooking(bookingId, consumptionItems);
          } else {
            console.warn('?s??,? [RESERVE] No consumption items resolved for booking. Skipping addProductsToBooking call.');
          }
        } catch (consumptionError) {
          console.error('❌ [RESERVE] Failed to add products/services to booking:', consumptionError);
        }
      }

      // Enviar mensajes de WhatsApp (solo si todo salió bien)
      try {
        // 1. Notificación a Dario (admin)
        const waMessage = `¡Hola! Se confirmó una reserva en SurfCamp para las fechas ${checkIn} a ${checkOut} para ${guests} huésped(es). Referencia: ${bookingReference}`;
        const whatsappResult = await sendWhatsAppMessage(
          '+5491162802566',
          waMessage
        );
        console.log('📱 WhatsApp confirmation sent to admin:', whatsappResult);

        // 2. Mensaje de bienvenida de Dario al cliente
        if (contactInfo?.phone) {
          const activityNames = resolvedActivities.map(act => {
            const activity = getActivityById(act.id);
            return activity?.name || act.id;
          });

          await sendDarioWelcomeMessage(contactInfo.phone, {
            checkIn,
            checkOut,
            guestName: contactInfo.firstName,
            activities: activityNames,
            roomTypeName: getRoomTypeName(roomTypeId),
            guests: guests || 1
          });
          console.log('📱 Welcome message sent to client');
        }

        // 3. Notificaciones de actividades específicas al staff
        const hasSurf = resolvedActivities.some(act => act.category === 'surf');
        const hasIceBath = resolvedActivities.some(act => act.category === 'ice_bath');

        if (hasSurf) {
          const surfActivity = resolvedActivities.find(act => act.category === 'surf');
          await sendSurfClassReservationNotification({
            checkIn,
            checkOut,
            guestName: `${contactInfo.firstName} ${contactInfo.lastName}`,
            phone: contactInfo.phone,
            dni: contactInfo.dni || 'No informado',
            total: 0, // Will be calculated from priceBreakdown if needed
            surfPackage: surfActivity?.package || '4-classes',
            guests: guests || 1,
            surfClasses: surfActivity?.classCount
          });
          console.log('📱 Surf notification sent to staff');
        }

        if (hasIceBath) {
          await sendIceBathReservationNotification({
            checkIn,
            checkOut,
            guestName: `${contactInfo.firstName} ${contactInfo.lastName}`,
            phone: contactInfo.phone,
            dni: contactInfo.dni || 'No informado',
            total: 0, // Will be calculated from priceBreakdown if needed
            quantity: 1
          });
          console.log('📱 Ice bath notification sent to staff');
        }

      } catch (whatsappError) {
        console.error('❌ WhatsApp error (non-blocking):', whatsappError);
      }

      return NextResponse.json({
        success: true,
        reservationId: bookingId,
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
      console.error('🏨 [RESERVE] LobbyPMS error stack:', lobbyError.stack);

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

          const adjustedBookingId =
            retryReservationData?.booking?.booking_id ||
            retryReservationData?.booking_id ||
            retryReservationData?.reservation_id ||
            retryReservationData?.id;

          if (!adjustedBookingId) {
            console.warn('?s??,? [RESERVE] Could not determine booking_id from adjusted LobbyPMS response. Skipping add-product-service.');
          } else {
            try {
              const consumptionItems = buildConsumptionItems(resolvedActivities, guests || 1);
              if (consumptionItems.length > 0) {
                await lobbyPMSClient.addProductsToBooking(adjustedBookingId, consumptionItems);
              } else {
                console.warn('?s??,? [RESERVE] No consumption items resolved for adjusted booking.');
              }
            } catch (consumptionError) {
              console.error('??O [RESERVE] Failed to add products/services to adjusted booking:', consumptionError);
            }
          }

          // Enviar mensaje de confirmación por WhatsApp (solo si el retry fue exitoso)
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

      // NO enviar mensaje de WhatsApp aquí - ya se envió en el retry o en el intento principal
      // El mensaje de alerta se enviará solo si hay un error crítico general (catch block)

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
    console.error('🏨 [RESERVE] Error stack:', error.stack);

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






