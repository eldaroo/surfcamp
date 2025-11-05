import { NextRequest, NextResponse } from 'next/server';
import { Activity, LobbyPMSReservationRequest } from '@/types';
import { generateBookingReference } from '@/lib/utils';
import { lobbyPMSClient, LobbyPMSCustomerPayload } from '@/lib/lobbypms';
import { createClient } from '@supabase/supabase-js';
import {
  sendBookingConfirmation,
  sendWhatsAppMessage,
  sendDarioWelcomeMessage,
  sendIceBathReservationNotification,
  sendSurfClassReservationNotification,
  sendUnifiedActivitiesNotification,
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
  quantity?: number;
  participantId?: string;
  participantName?: string;
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
      const rawQuantity = activity?.quantity;
      let normalizedQuantity: number | undefined;
      if (typeof rawQuantity === 'number' && Number.isFinite(rawQuantity)) {
        normalizedQuantity = Math.max(1, Math.round(rawQuantity));
      } else if (typeof rawQuantity === 'string') {
        const parsedQuantity = parseInt(rawQuantity, 10);
        if (Number.isFinite(parsedQuantity)) {
          normalizedQuantity = Math.max(1, parsedQuantity);
        }
      }
      const baseCategory = (activity.category || baseActivity?.category) as Activity['category'] | undefined;

      let effectiveClassCount =
        normalizedClassCount ??
        (activity.package ? parsePackageMultiplier(activity.package) : undefined);

      if (!effectiveClassCount && typeof activity.name === 'string') {
        const classMatch = activity.name.match(/(\d+)\s*class/i);
        if (classMatch) {
          const parsed = parseInt(classMatch[1], 10);
          if (Number.isFinite(parsed)) {
            effectiveClassCount = parsed;
          }
        }
      }

      if (baseCategory === 'surf' && effectiveClassCount) {
        effectiveClassCount = Math.min(10, Math.max(3, effectiveClassCount));
      } else if (baseCategory === 'yoga' && effectiveClassCount) {
        if (![1, 3, 10].includes(effectiveClassCount)) {
          effectiveClassCount = undefined;
        }
      }

      let effectivePackage = activity.package;
      if (!effectivePackage) {
        if (baseCategory === 'surf' && effectiveClassCount) {
          effectivePackage = `${effectiveClassCount}-classes`;
        } else if (baseCategory === 'yoga') {
          if (effectiveClassCount === 3) {
            effectivePackage = '3-classes';
          } else if (effectiveClassCount === 10) {
            effectivePackage = '10-classes';
          } else if (effectiveClassCount === 1) {
            effectivePackage = '1-class';
          }
        }
      }

      if (baseCategory === 'yoga' && !effectivePackage) {
        effectivePackage = '1-class';
        effectiveClassCount = effectiveClassCount ?? 1;
      }

      return {
        id: activity.id,
        category: baseCategory,
        package: effectivePackage,
        classCount: effectiveClassCount,
        quantity: normalizedQuantity,
        participantId: typeof activity.participantId === 'string' ? activity.participantId : undefined,
        participantName: typeof activity.participantName === 'string' ? activity.participantName : undefined,
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
      classCount: isSurf ? 4 : undefined,
      quantity: undefined,
    };
  });
};

const buildConsumptionItems = (
  activities: ResolvedActivityConsumption[],
  guests: number,
  options: { hasDetailedSelections: boolean }
) => {
  const { hasDetailedSelections } = options;
  const itemsMap: Record<string, { product_id: string; cant: number; inventory_center_id?: string }> = {};

  activities.forEach((activity) => {
    if (!activity?.id) return;

    const normalizedClassCount = typeof activity.classCount === 'number' && Number.isFinite(activity.classCount)
      ? Math.max(1, Math.round(activity.classCount))
      : undefined;

    const productId = getEnvProductId(activity.id, activity.package, normalizedClassCount);

    if (!productId) {
      return;
    }

    let quantity =
      typeof activity.quantity === 'number' && Number.isFinite(activity.quantity)
        ? Math.max(1, Math.round(activity.quantity))
        : 1;
    if (
      quantity === 1 &&
      !hasDetailedSelections &&
      (activity.category === 'yoga' || activity.category === 'ice_bath')
    ) {
      quantity = Math.max(1, guests);
    }

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

  const finalItems = Object.values(itemsMap);
  return finalItems;
};

const buildParticipantConsumptionItems = (participant: any) => {
  const itemsMap: Record<string, { product_id: string; cant: number; inventory_center_id?: string }> = {};

  const participantActivities = Array.isArray(participant?.selectedActivities)
    ? participant.selectedActivities
    : [];
  const uniqueActivities = new Map<string, any>();
  participantActivities.forEach((activity: any) => {
    if (!activity?.id) {
      return;
    }

    if (!uniqueActivities.has(activity.id)) {
      uniqueActivities.set(activity.id, { ...activity });
      return;
    }

    const existing = uniqueActivities.get(activity.id);
    const incomingQty = typeof activity.quantity === 'number' && Number.isFinite(activity.quantity)
      ? Math.max(1, Math.round(activity.quantity))
      : undefined;

    if (incomingQty) {
      const currentQty = typeof existing.quantity === 'number' && Number.isFinite(existing.quantity)
        ? Math.max(1, Math.round(existing.quantity))
        : 0;
      existing.quantity = currentQty + incomingQty;
    }
  });

  uniqueActivities.forEach((activity: any) => {
    const baseActivity = getActivityById(activity.id);
    const category = (activity.category || baseActivity?.category) as Activity['category'] | undefined;
    let packageName = activity.package;
    let classCount = activity.classCount;

    if (category === 'surf') {
      if (participant.selectedSurfPackages) {
        const participantPackage = participant.selectedSurfPackages[activity.id];
        if (participantPackage) {
          packageName = participantPackage;
        }
      }

      if (participant.selectedSurfClasses) {
        const participantClasses = participant.selectedSurfClasses[activity.id];
        if (participantClasses !== undefined) {
          classCount = participantClasses;
        }
      }

      if (classCount === undefined && typeof packageName === 'string') {
        const match = packageName.match(/(\d+)/);
        if (match) {
          classCount = parseInt(match[1], 10);
        }
      }

      if (classCount === undefined) {
        classCount = 4;
      }

      classCount = Math.min(10, Math.max(3, classCount));
      packageName = `${classCount}-classes`;
    } else if (category === 'yoga') {
      if (participant.selectedYogaPackages) {
        const participantPackage = participant.selectedYogaPackages[activity.id];
        if (participantPackage) {
          packageName = participantPackage;
        } else {
        }
      } else {
      }

      // Fallback to yogaClasses if no package
      if (!packageName) {
        if (participant.yogaClasses) {
          const yogaClassCount = participant.yogaClasses[activity.id];
          if (yogaClassCount !== undefined) {
            classCount = yogaClassCount;
            // Generate package name based on class count
            packageName = `${yogaClassCount}-${yogaClassCount === 1 ? 'class' : 'classes'}`;
          } else {
          }
        } else {
        }
      }

      // FINAL FALLBACK: If still no package for yoga, default to 1-class
      if (!packageName && category === 'yoga') {
        packageName = '1-class';
        classCount = 1;
      }

      if (classCount === undefined && typeof packageName === 'string') {
        const match = packageName.match(/(\d+)/);
        if (match) {
          classCount = parseInt(match[1], 10);
        }
      }

      if (classCount && ![1, 3, 10].includes(classCount)) {
        classCount = undefined;
      }
    }

    let quantity: number | undefined =
      typeof activity.quantity === 'number' && Number.isFinite(activity.quantity)
        ? Math.max(1, Math.round(activity.quantity))
        : undefined;

    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      quantity = participant.activityQuantities?.[activity.id];
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      quantity = 1;
    }
    quantity = Math.max(1, Math.round(quantity));

    if (category === 'surf' || category === 'yoga') {
      quantity = 1;
    }

    const productId = getEnvProductId(activity.id, packageName, classCount);
    if (!productId) {
      return;
    }
    if (!itemsMap[productId]) {
      const inventoryCenterId = getEnvInventoryCenterId(activity.id, packageName) || undefined;
      itemsMap[productId] = {
        product_id: productId,
        cant: quantity,
        ...(inventoryCenterId ? { inventory_center_id: inventoryCenterId } : {}),
      };
    } else {
      itemsMap[productId].cant += quantity;
    }
  });

  const finalItems = Object.values(itemsMap);
  return finalItems;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🏨 [RESERVE] ========== NEW RESERVATION REQUEST ==========');
    console.log('🏨 [RESERVE] Request body:', JSON.stringify(body, null, 2));
    // 🛡️ ANTI-DUPLICATE PROTECTION: Check if reservation already exists
    if (body.paymentIntentId || body.contactInfo?.dni) {
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

      // Search by payment_intent_id or DNI + dates
      let existingOrder = null;

      if (body.paymentIntentId) {
        const { data } = await supabase
          .from('orders')
          .select('id, lobbypms_reservation_id, created_at')
          .eq('payment_intent_id', body.paymentIntentId)
          .not('lobbypms_reservation_id', 'is', null)
          .maybeSingle();
        existingOrder = data;
      }

      if (!existingOrder && body.contactInfo?.dni && body.checkIn && body.checkOut) {
        // Fallback: search by DNI + dates (less than 5 minutes old)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('orders')
          .select('id, lobbypms_reservation_id, created_at, booking_data')
          .gte('created_at', fiveMinutesAgo)
          .not('lobbypms_reservation_id', 'is', null);

        if (data && data.length > 0) {
          existingOrder = data.find((order: any) => {
            const bookingData = order.booking_data;
            return (
              bookingData?.contactInfo?.dni === body.contactInfo.dni &&
              bookingData?.checkIn === body.checkIn &&
              bookingData?.checkOut === body.checkOut
            );
          });
        }
      }

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          reservationId: existingOrder.lobbypms_reservation_id,
          status: 'already_exists',
          message: 'Reserva ya existe - se evitó duplicado',
          isDuplicate: true
        });
      }
    }

    const {
      checkIn,
      checkOut,
      guests,
      contactInfo,
      roomTypeId = 'casa-playa', // Default room type
      isSharedRoom = false, // Added to request body
      activities = [],
      selectedActivities: selectedActivitiesPayload = [],
      activityIds = [],
      paymentIntentId,
      participants = [] // Array of participants with their info and activities
    } = body;
    const phoneForLobby = normalizePhoneNumber(contactInfo?.phone);
    if (contactInfo?.phone) {
      if (phoneForLobby) {
        if (phoneForLobby !== contactInfo.phone) {
        }
      } else {
      }
    }

    const bookingReference = generateBookingReference();
    // Get the corresponding category_id for LobbyPMS
    const categoryId = ROOM_TYPE_MAPPING[roomTypeId as keyof typeof ROOM_TYPE_MAPPING];
    
    if (!categoryId) {
      return NextResponse.json(
        { error: `Tipo de habitaciÃ³n no vÃ¡lido: ${roomTypeId}` },
        { status: 400 }
      );
    }
    // Convert dates to the format expected by LobbyPMS (Y-m-d)
    const formatDateForLobbyPMS = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    };

    const formattedCheckIn = formatDateForLobbyPMS(checkIn);
    const formattedCheckOut = formatDateForLobbyPMS(checkOut);
    // Prepare LobbyPMS reservation request with correct field names and date format
    const baseNotes = `ðŸ„â€â™‚ï¸ RESERVA DESDE SURFCAMP SANTA TERESA ðŸ„â€â™‚ï¸\n\nDetalles de la reserva:\n- Web: surfcamp-santa-teresa.com\n- Referencia: ${bookingReference}\n- HuÃ©sped: ${contactInfo.firstName} ${contactInfo.lastName}\n- DNI: ${contactInfo.dni}\n- Email: ${contactInfo.email}\n- TelÃ©fono: ${contactInfo.phone}\n- Pago: ${paymentIntentId}`;
    // FIX: guest_count should always be the number of guests, regardless of room type
    // The logic of creating multiple reservations is handled separately below
    // If guests is not provided, use participants.length as fallback
    const calculatedGuestCount = guests || (Array.isArray(participants) && participants.length > 0 ? participants.length : 1);
    const bookingData = {
      start_date: formattedCheckIn,     // Y-m-d format as required by LobbyPMS
      end_date: formattedCheckOut,      // Y-m-d format as required by LobbyPMS
      guest_count: calculatedGuestCount,
      total_adults: calculatedGuestCount,             // Required field by LobbyPMS
      total_children: 0,                // Default to 0 children
      guest_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
      holder_name: `${contactInfo.firstName} ${contactInfo.lastName}`, // Required when customer document is not present
      guest_email: contactInfo.email,
      guest_document: contactInfo.dni,  // DNI del huÃ©sped
      customer_document: contactInfo.dni, // TambiÃ©n como customer_document por si LobbyPMS lo requiere asÃ­
      customer_nationality: 'ES',       // Nacionalidad por defecto EspaÃ±a (requerido cuando hay documento)
      customer_email: contactInfo.email,
      category_id: categoryId,
      room_type_id: roomTypeId,
      booking_reference: bookingReference,
      source: 'Surfcamp Santa Teresa',     // Fuente mÃ¡s clara
      payment_intent_id: paymentIntentId,
      status: 'confirmed',
      notes: `${baseNotes}\n- Nota Surfcamp: Surfcamp`,
      special_requests: `Reserva realizada a travÃ©s de la pÃ¡gina web oficial de Surfcamp Santa Teresa. Referencia de pago: ${paymentIntentId}`
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
    const hasDetailedActivityPayload =
      Array.isArray(selectedActivitiesPayload) && selectedActivitiesPayload.length > 0;

    // Check if we need to create multiple reservations (ONLY for shared rooms)
    // IMPORTANT: Create individual reservations for EACH participant ONLY in shared rooms (casa-playa)
    // For private houses (casitas-privadas, casas-deluxe), create ONE reservation with all guests
    console.log('🏨 [RESERVE] Checking if multiple reservations needed:', {
      participantsIsArray: Array.isArray(participants),
      participantsLength: participants?.length,
      isSharedRoom,
      roomTypeId,
      shouldCreateMultiple: Array.isArray(participants) && participants.length > 1 && (isSharedRoom || roomTypeId === 'casa-playa')
    });

    const shouldCreateMultipleReservations =
      Array.isArray(participants) &&
      participants.length > 1 &&
      (isSharedRoom || roomTypeId === 'casa-playa');
    // Ensure customer exists in LobbyPMS before booking
    try {
      if (contactInfo?.dni && contactInfo.firstName && contactInfo.lastName) {
        const customerPayload: LobbyPMSCustomerPayload = {
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
      } else {
      }
    } catch (customerError) {
      // Continue with booking even if customer creation failed (LobbyPMS may auto-create)
    }
    // If we need to create multiple reservations (one per participant in shared room)
    if (shouldCreateMultipleReservations) {
      const createdReservations: any[] = [];
      const bookingIds: string[] = [];
      // 🛡️ Deduplicate participants by ID to prevent duplicate reservations
      const seenParticipantIds = new Set<string>();
      const uniqueParticipants = participants.filter((p: any) => {
        if (!p.id) return true; // Keep participants without IDs (shouldn't happen)
        if (seenParticipantIds.has(p.id)) {
          return false;
        }
        seenParticipantIds.add(p.id);
        return true;
      });
      for (let i = 0; i < uniqueParticipants.length; i++) {
        const participant = uniqueParticipants[i];
        // Build participant-specific booking data
        const participantBookingData = {
          ...bookingData,
          guest_count: 1,
          total_adults: 1,
          guest_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
          holder_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
          notes: `${baseNotes}\n- Participante ${i + 1}/${uniqueParticipants.length}: ${participant.name}\n- Nota Surfcamp: Surfcamp`,
        };
        try {
          const participantReservation = await lobbyPMSClient.createBooking(participantBookingData);
          const participantBookingId =
            participantReservation?.booking?.booking_id ||
            participantReservation?.booking_id ||
            participantReservation?.id;

          if (participantBookingId) {
            bookingIds.push(participantBookingId);
            createdReservations.push(participantReservation);

            // Add participant-specific activities
            const participantActivities = participant.selectedActivities || [];
            if (participantActivities.length > 0) {
              // Enrich activities with participant-specific data (classes, packages, quantities)
              const enrichedActivities = participantActivities.map((activity: any) => {
                const baseActivity = getActivityById(activity.id);
                const enriched: any = {
                  id: activity.id,
                  name: activity.name || baseActivity?.name,
                  category: activity.category || baseActivity?.category,
                };

                // Add surf classes if applicable
                if (enriched.category === 'surf' && participant.selectedSurfClasses) {
                  const surfClasses = participant.selectedSurfClasses[activity.id];
                  if (surfClasses !== undefined) {
                    enriched.classCount = surfClasses;
                    enriched.package = `${surfClasses}-classes`;
                  }
                }

                // Add yoga package if applicable
                if (enriched.category === 'yoga' && participant.selectedYogaPackages) {
                  const yogaPackage = participant.selectedYogaPackages[activity.id];
                  if (yogaPackage) {
                    enriched.package = yogaPackage;
                    const classMatch = yogaPackage.match(/(\d+)/);
                    if (classMatch) {
                      enriched.classCount = parseInt(classMatch[1], 10);
                    }
                  }
                }

                // Add quantity if applicable (ice_bath, transport, etc.)
                if (participant.activityQuantities && participant.activityQuantities[activity.id]) {
                  enriched.quantity = participant.activityQuantities[activity.id];
                }

                return enriched;
              });
              const participantConsumptionItems = buildParticipantConsumptionItems(participant);
              if (participantConsumptionItems.length > 0) {
                await lobbyPMSClient.addProductsToBooking(participantBookingId, participantConsumptionItems);
              }
            }
          }
        } catch (participantError) {
          // Continue with other participants even if one fails
        }
      }
      // Send WhatsApp notifications
      try {
        // Send unified activities notification with all participants
        const participantsForNotification = uniqueParticipants.map((p: any) => ({
          name: p.name,
          activities: (p.selectedActivities || []).map((act: any) => {
            const activity = getActivityById(act.id);
            const category = activity?.category || 'other';

            let classes: number | undefined;
            let packageName: string | undefined;
            let quantity: number | undefined;

            // Get surf-specific data
            if (category === 'surf' && p.selectedSurfClasses) {
              classes = p.selectedSurfClasses[act.id];
              if (classes) {
                packageName = `${classes}-classes`;
              }
            }

            // Get yoga-specific data
            if (category === 'yoga' && p.selectedYogaPackages) {
              packageName = p.selectedYogaPackages[act.id];
              if (packageName) {
                const match = packageName.match(/(\d+)/);
                if (match) {
                  classes = parseInt(match[1], 10);
                }
              }
            }

            // Get quantity for other activities (ice_bath, etc.)
            if (p.activityQuantities) {
              quantity = p.activityQuantities[act.id];
            }

            return {
              type: category,
              classes,
              package: packageName,
              quantity
            };
          })
        }));

        await sendUnifiedActivitiesNotification({
          checkIn,
          checkOut,
          guestName: `${contactInfo.firstName} ${contactInfo.lastName}`,
          phone: contactInfo.phone,
          dni: contactInfo.dni || 'No informado',
          total: 0, // Will be calculated if needed
          participants: participantsForNotification
        });
        // Send admin notification
        const waMessage = `Â¡Hola! Se confirmaron ${createdReservations.length} reservas en SurfCamp (Casa Playa compartida) para las fechas ${checkIn} a ${checkOut}. Referencia: ${bookingReference}\nParticipantes: ${uniqueParticipants.map((p: any) => p.name).join(', ')}`;
        await sendWhatsAppMessage('+5491162802566', waMessage);
        // Send welcome message to main contact
        if (contactInfo?.phone) {
          const allActivityNames = uniqueParticipants.flatMap((p: any) =>
            (p.selectedActivities || []).map((act: any) => {
              const activity = getActivityById(act.id);
              return activity?.name || act.id;
            })
          );

          await sendDarioWelcomeMessage(contactInfo.phone, {
            checkIn,
            checkOut,
            guestName: contactInfo.firstName,
            activities: Array.from(new Set(allActivityNames)), // Remove duplicates
            roomTypeName: getRoomTypeName(roomTypeId),
            guests: uniqueParticipants.length
          });
        }
      } catch (whatsappError) {
      }
      return NextResponse.json({
        success: true,
        reservationIds: bookingIds,
        bookingReference,
        status: 'confirmed',
        message: `${createdReservations.length} reservas confirmadas exitosamente en LobbyPMS`,
        demoMode: false,
        multipleReservations: true,
        participantCount: uniqueParticipants.length,
        lobbyPMSResponses: createdReservations
      });
    }

    // ⚠️ THIS CODE SHOULD NOT RUN IF shouldCreateMultipleReservations IS TRUE
    // Single reservation flow (original logic)
    console.log('🏨 [RESERVE] Creating SINGLE reservation with data:', {
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      guest_count: bookingData.guest_count,
      category_id: bookingData.category_id,
      room_type_id: bookingData.room_type_id
    });

    try {
      const reservationData = await lobbyPMSClient.createBooking(bookingData);
      console.log('✅ [RESERVE] LobbyPMS createBooking response:', JSON.stringify(reservationData, null, 2));
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
      const bookingId =
        reservationData?.booking?.booking_id ||
        reservationData?.booking_id ||
        reservationData?.id;

      if (!bookingId) {
      } else {
        try {
          let consumptionItems;

          if (Array.isArray(participants) && participants.length > 0) {
            const aggregatedMap: Record<string, { product_id: string; cant: number; inventory_center_id?: string }> = {};

            participants.forEach((participant: any) => {
              const participantItems = buildParticipantConsumptionItems(participant);
              participantItems.forEach((item) => {
                const key = `${item.product_id}-${item.inventory_center_id ?? ''}`;
                if (!aggregatedMap[key]) {
                  aggregatedMap[key] = { ...item };
                } else {
                  aggregatedMap[key].cant += item.cant;
                }
              });
            });

            consumptionItems = Object.values(aggregatedMap);
          } else {
            consumptionItems = buildConsumptionItems(
              resolvedActivities,
              guests || 1,
              { hasDetailedSelections: hasDetailedActivityPayload }
            );
          }
          if (consumptionItems.length > 0) {
            await lobbyPMSClient.addProductsToBooking(bookingId, consumptionItems);
          } else {
          }
        } catch (consumptionError) {
        }
      }

      // Enviar mensajes de WhatsApp (solo si todo saliÃ³ bien)
      try {
        // 1. NotificaciÃ³n a Dario (admin)
        const waMessage = `Â¡Hola! Se confirmÃ³ una reserva en SurfCamp para las fechas ${checkIn} a ${checkOut} para ${guests} huÃ©sped(es). Referencia: ${bookingReference}`;
        const whatsappResult = await sendWhatsAppMessage(
          '+5491162802566',
          waMessage
        );
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
        }

        // 3. Notificaciones de actividades especÃ­ficas al staff
        // Check if we have multiple participants with different activities
        const hasMultipleParticipantsWithActivities =
          Array.isArray(participants) &&
          participants.length > 1 &&
          participants.some((p: any) => p.selectedActivities && p.selectedActivities.length > 0);

        if (hasMultipleParticipantsWithActivities) {
          // Use unified notification for multiple participants
          const participantsForNotification = participants.map((p: any) => ({
            name: p.name,
            activities: (p.selectedActivities || []).map((act: any) => {
              const activity = getActivityById(act.id);
              const category = activity?.category || 'other';

              let classes: number | undefined;
              let packageName: string | undefined;
              let quantity: number | undefined;

              // Get surf-specific data
              if (category === 'surf' && p.selectedSurfClasses) {
                classes = p.selectedSurfClasses[act.id];
                if (classes) {
                  packageName = `${classes}-classes`;
                }
              }

              // Get yoga-specific data
              if (category === 'yoga' && p.selectedYogaPackages) {
                packageName = p.selectedYogaPackages[act.id];
                if (packageName) {
                  const match = packageName.match(/(\d+)/);
                  if (match) {
                    classes = parseInt(match[1], 10);
                  }
                }
              }

              // Get quantity for other activities (ice_bath, etc.)
              if (p.activityQuantities) {
                quantity = p.activityQuantities[act.id];
              }

              return {
                type: category,
                classes,
                package: packageName,
                quantity
              };
            })
          }));

          await sendUnifiedActivitiesNotification({
            checkIn,
            checkOut,
            guestName: `${contactInfo.firstName} ${contactInfo.lastName}`,
            phone: contactInfo.phone,
            dni: contactInfo.dni || 'No informado',
            total: 0,
            participants: participantsForNotification
          });
        } else {
          // Use individual notifications for single participant or no participants data
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
              guests: surfActivity?.quantity || 1, // Use quantity from surfActivity
              surfClasses: surfActivity?.classCount
            });
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
          }
        }

      } catch (whatsappError) {
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
      console.error('❌ [RESERVE] LobbyPMS createBooking ERROR:', {
        message: lobbyError.message,
        response: lobbyError.response?.data,
        status: lobbyError.response?.status,
        errorCode: lobbyError.response?.data?.error_code
      });

      // Si es error de capacidad, ajustar y reintentar
      if (lobbyError.response?.data?.error_code === 'MAXIMUM_CAPACITY') {
        console.log('⚠️ [RESERVE] MAXIMUM_CAPACITY error detected, retrying with guest_count=1');
        // Reducir huÃ©spedes a 1 e intentar de nuevo
        const adjustedBookingData = {
          ...bookingData,
          guest_count: 1,
          total_adults: 1
        };
        
        try {
          const retryReservationData = await lobbyPMSClient.createBooking(adjustedBookingData);
          const adjustedBookingId =
            retryReservationData?.booking?.booking_id ||
            retryReservationData?.booking_id ||
            retryReservationData?.reservation_id ||
            retryReservationData?.id;

          if (!adjustedBookingId) {
          } else {
            try {
              const consumptionItems = buildConsumptionItems(
                resolvedActivities,
                guests || 1,
                { hasDetailedSelections: hasDetailedActivityPayload }
              );
              if (consumptionItems.length > 0) {
                await lobbyPMSClient.addProductsToBooking(adjustedBookingId, consumptionItems);
              } else {
              }
            } catch (consumptionError) {
            }
          }

          // Enviar mensaje de confirmaciÃ³n por WhatsApp (solo si el retry fue exitoso)
          try {
            const waMessage = `Â¡Hola! Se confirmÃ³ una reserva en SurfCamp para las fechas ${checkIn} a ${checkOut} para 1 huÃ©sped (ajustado por capacidad). Referencia: ${bookingReference}`;
            const whatsappResult = await sendWhatsAppMessage(
              '+5491162802566',
              waMessage
            );
          } catch (whatsappError) {
          }

          return NextResponse.json({
            success: true,
            reservationId: retryReservationData.reservation_id || retryReservationData.id,
            bookingReference,
            status: retryReservationData.status || 'confirmed',
            message: 'Reserva confirmada exitosamente en LobbyPMS (ajustada a 1 huÃ©sped por capacidad)',
            demoMode: false,
            adjusted: true,
            originalGuests: guests,
            finalGuests: 1,
            lobbyPMSResponse: retryReservationData
          });
          
        } catch (retryError: any) {
          // Continue to fallback below
        }
      }

      // Solo como ÃšLTIMO RECURSO: modo demo con notificaciÃ³n especial
      // NO enviar mensaje de WhatsApp aquÃ­ - ya se enviÃ³ en el retry o en el intento principal
      // El mensaje de alerta se enviarÃ¡ solo si hay un error crÃ­tico general (catch block)

      return NextResponse.json({
        success: true,
        reservationId: `EMERGENCY-${bookingReference}`,
        bookingReference,
        status: 'pending_manual_processing',
        message: 'Reserva recibida - procesÃ¡ndose manualmente',
        demoMode: true,
        needsManualProcessing: true,
        fallbackReason: lobbyError.message,
        originalError: lobbyError.response?.data,
        note: 'Tu reserva estÃ¡ confirmada. Nos contactaremos contigo en las prÃ³ximas horas para finalizar los detalles.'
      });
    }

  } catch (error: any) {
    // Generate a fallback booking reference if we don't have one
    const fallbackReference = generateBookingReference();
    
    // Enviar alerta crÃ­tica por WhatsApp
    try {
      const criticalAlert = `ðŸš¨ ERROR CRÃTICO: Fallo general en sistema de reservas.\n\nReferencia: ${fallbackReference}\nError: ${error.message}`;
      await sendWhatsAppMessage('+5491162802566', criticalAlert);
    } catch (whatsappError) {
    }
    
    // Incluso en error general, confirmar al usuario
    return NextResponse.json({
      success: true,
      reservationId: `CRITICAL-FALLBACK-${fallbackReference}`,
      bookingReference: fallbackReference,
      status: 'pending_manual_processing',
      message: 'Reserva recibida - procesÃ¡ndose manualmente',
      demoMode: true,
      needsManualProcessing: true,
      error: error.message,
      note: 'Tu reserva ha sido registrada. Nos pondremos en contacto contigo para confirmar los detalles.'
    });
  }
}

