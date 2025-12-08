import { NextRequest, NextResponse } from 'next/server';
import { LobbyPMSAvailabilityResponse } from '@/types';
import { lobbyPMSClient } from '@/lib/lobbypms';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const sentWhatsAppSet = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Availability API called - START');
    
    const body = await request.json();
    const { checkIn, checkOut, guests } = body;

    console.log('🎯 Availability API called with:', { checkIn, checkOut, guests });

    try {
      console.log('🚀 Calling LobbyPMS API with CORRECT endpoint...');
      
      // Use the correct endpoint: /available-rooms
      const availabilityData = await lobbyPMSClient.getAvailableRooms({
        start_date: checkIn,
        end_date: checkOut,
        // Note: guest_count is not a parameter for this endpoint according to docs
      });

      console.log('📋 ===== AVAILABILITY DATA RECEIVED =====');
      console.log('📋 Total days received:', availabilityData.length);
      console.log('📋 Raw availability data:', JSON.stringify(availabilityData, null, 2));
      
      // Process the availability data to extract rooms and prices
      const roomTypes = {
        'casa-playa': {
          roomTypeId: 'casa-playa',
          roomTypeName: 'Casa de Playa (Cuarto Compartido)',
          maxGuests: 8, // Total beds: 3 rooms (2 rooms with 2 beds each + 1 room with 4 beds)
          isSharedRoom: true, // 3 rooms with shared facilities
          categories: [] as any[],
          availableRoomsByDay: [] as number[],
          prices: [] as number[]
        },
        'casitas-privadas': {
          roomTypeId: 'casitas-privadas',
          roomTypeName: 'Casitas Privadas',
          maxGuests: 2, // Guests per individual casita
          isSharedRoom: false, // These are individual private rooms
          categories: [] as any[],
          availableRoomsByDay: [] as number[],
          prices: [] as number[]
        },
        'casas-deluxe': {
          roomTypeId: 'casas-deluxe',
          roomTypeName: 'Casa Privada',
          maxGuests: 2, // Guests per individual casa
          isSharedRoom: false, // These are individual private rooms
          categories: [] as any[],
          availableRoomsByDay: [] as number[],
          prices: [] as number[]
        }
      };
      
      // Calculate number of nights (not days)
      // For check-in 17/7 and check-out 18/7, we only need to verify night of 17/7
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Check-in: ${checkIn}, Check-out: ${checkOut}`);
      console.log(`📅 Nights needed: ${nights}`);
      console.log(`📅 Will only process first ${nights} days for availability`);
      
      // Track individual categories for proper availability calculation
      const individualCategories: { [key: string]: { availableByDay: number[], prices: number[], roomType: string } } = {};
      
      // Helper function to calculate price per room based on guest count
      const calculatePricePerRoom = (category: any, guestsRequestedTotal: number, availableRoomsForCategory: number, isSharedRoom: boolean) => {
        if (!category.prices || category.prices.length === 0) return null;
        
        if (isSharedRoom) {
          // Casa de Playa: precio por cama/persona
          return category.prices.find((p: any) => p.people === 1)?.value || null;
        } else {
          // Casitas/Casa Privada: calcular huéspedes por habitación
          const guestsPerRoom = Math.min(2, Math.ceil(guestsRequestedTotal / availableRoomsForCategory));
          
          // Si hay 1 huésped por habitación, usar precio single. Si 2+, usar precio double
          if (guestsPerRoom === 1) {
            return category.prices.find((p: any) => p.people === 1)?.value || null;
          } else {
            return category.prices.find((p: any) => p.people === 2)?.value || 
                   category.prices.find((p: any) => p.people === 1)?.value || null; // fallback to single price
          }
        }
      };

      console.log(`\n📊 ==== STARTING CATEGORY PROCESSING ====`);
      console.log(`📊 Total days to process: ${nights}`);
      console.log(`📊 Days available from API: ${availabilityData.length}`);
      console.log(`📊 Guests requested: ${guests}`);
      
      // Only process the days we need (number of nights)
      const daysToProcess = Math.min(nights, availabilityData.length);
      availabilityData.slice(0, daysToProcess).forEach((dayData, dayIndex) => {
        console.log(`\n📅 ===== PROCESSING DAY ${dayIndex + 1}: ${dayData.date} =====`);
        
        if (dayData.categories && Array.isArray(dayData.categories)) {
          console.log(`📅 Day ${dayIndex + 1} has ${dayData.categories.length} categories`);
          
          dayData.categories.forEach((category: any, catIndex: number) => {
            console.log(`🏠 ===== PROCESSING CATEGORY ${catIndex + 1} =====`);
            console.log(`🏠 Category ID: ${category.category_id}`);
            console.log(`🏠 Category name: "${category.name}"`);
            console.log(`🏠 Available rooms: ${category.available_rooms}`);
            console.log(`🏠 Prices:`, category.prices);
            
            // Log detailed pricing structure for debugging
            if (category.prices && category.prices.length > 0) {
              category.prices.forEach((priceObj: any) => {
                console.log(`   💰 ${priceObj.people} person(s): $${priceObj.value}`);
              });
            }
            
            // Map categories to our 3 accommodation types
            const categoryName = (category.name || '').toLowerCase();
            const singlePrice = category.prices?.find((p: any) => p.people === 1)?.value;
            const doublePrice = category.prices?.find((p: any) => p.people === 2)?.value;
            
            // Initialize category tracking if not exists
            if (!individualCategories[categoryName]) {
              individualCategories[categoryName] = {
                availableByDay: new Array(nights).fill(0),
                prices: [],
                roomType: ''
              };
            }
            
            // Set availability for this day
            individualCategories[categoryName].availableByDay[dayIndex] = category.available_rooms || 0;
            
            // 1. CASA DE PLAYA: SOLO "Casa Playa" (las 8 camas dentro de Casa Playa)
            if (categoryName === 'casa playa') {
              console.log('✅ Matched as Casa de Playa (Cuarto Compartido)');
              console.log(`🏠 Adding category "${category.name}" to casa-playa`);
              console.log(`🏠 This category has ${category.available_rooms} available rooms`);
              
              roomTypes['casa-playa'].categories.push(category);
              individualCategories[categoryName].roomType = 'casa-playa';
              
              // Solo agregar precio si hay disponibilidad
              if (singlePrice && singlePrice > 0 && (category.available_rooms || 0) > 0) {
                roomTypes['casa-playa'].prices.push(singlePrice);
                individualCategories[categoryName].prices.push(singlePrice);
                console.log(`💰 Added price $${singlePrice} for casa-playa`);
              }
            }
            
            // 2. CASITAS PRIVADAS: SOLO casita 3, casita 4, casita 7
            else if (categoryName === 'casita 3' || 
                     categoryName === 'casita 4' || 
                     categoryName === 'casita 7') {
              console.log('✅ Matched as Casita Privada');
              roomTypes['casitas-privadas'].categories.push(category);
              individualCategories[categoryName].roomType = 'casitas-privadas';
              // Solo agregar precio si hay disponibilidad
              if (singlePrice && singlePrice > 0 && (category.available_rooms || 0) > 0) {
                roomTypes['casitas-privadas'].prices.push(singlePrice);
                individualCategories[categoryName].prices.push(singlePrice);
              }
            }
            
            // 3. CASAS DELUXE: SOLO Studio 1, Studio 2, Casita 5, Casita 6
            else if (categoryName === 'studio 1' || 
                     categoryName === 'studio 2' || 
                     categoryName === 'casita 5' || 
                     categoryName === 'casita 6') {
              console.log('✅ Matched as Casa Deluxe');
              roomTypes['casas-deluxe'].categories.push(category);
              individualCategories[categoryName].roomType = 'casas-deluxe';
              // Solo agregar precio si hay disponibilidad
              if (singlePrice && singlePrice > 0 && (category.available_rooms || 0) > 0) {
                roomTypes['casas-deluxe'].prices.push(singlePrice);
                individualCategories[categoryName].prices.push(singlePrice);
              }
            }
            
            // 4. CATEGORÍAS NO VÁLIDAS 
            else {
              console.log(`❌ CATEGORY NOT INCLUDED: "${category.name}"`);
              console.log(`❌ This category is not part of the valid accommodation types`);
              console.log(`❌ Only these categories are valid:`);
              console.log(`   - Casa de Playa: "Casa Playa"`);
              console.log(`   - Casitas Privadas: "Casita 3", "Casita 4", "Casita 7"`);
              console.log(`   - Casa Privada: "Studio 1", "Studio 2", "Casita 5", "Casita 6"`);
              // Continue processing but don't include this category
            }
          });
        }
      });
      
      // Calculate total availability for each room type using correct logic
      Object.keys(roomTypes).forEach(roomTypeKey => {
        const roomType = roomTypes[roomTypeKey as keyof typeof roomTypes];
        let totalAvailableForAllDays = 0;
        
        console.log(`\n🔍 ==== PROCESSING ROOM TYPE: ${roomTypeKey} ====`);
        
        // Find all categories that belong to this room type
        Object.entries(individualCategories).forEach(([categoryName, categoryData]) => {
          if (categoryData.roomType === roomTypeKey) {
            // For each individual category, calculate minimum available across all days
            const minAvailableForCategory = categoryData.availableByDay.length > 0 ? 
              Math.min(...categoryData.availableByDay) : 0;
            
            console.log(`🏠 Category "${categoryName}" - Days: [${categoryData.availableByDay.join(', ')}] - Min: ${minAvailableForCategory}`);
            
            // Add this category's minimum to the total
            totalAvailableForAllDays += minAvailableForCategory;
          }
        });
        
        // Set the calculated availability
        roomType.availableRoomsByDay = [totalAvailableForAllDays]; // Single value representing total available
        
        console.log(`🎯 ${roomTypeKey} - Total available for all days: ${totalAvailableForAllDays}`);
        console.log(`🎯 ${roomTypeKey} - Max guests per room: ${roomType.maxGuests}`);
        console.log(`🎯 ${roomTypeKey} - Total capacity: ${totalAvailableForAllDays * roomType.maxGuests} huéspedes`);
        console.log(`🔍 ==== END PROCESSING: ${roomTypeKey} ====\n`);
      });

      // Validate capacity and filter out room types that cannot accommodate the requested guests
      console.log(`👥 Validating capacity: ${guests} guests requested`);
      
      // Filter room types that can accommodate the requested guests
      const validRoomTypes: { [key: string]: any } = {};
      let totalBedsAvailable = 0;
      
             Object.entries(roomTypes).forEach(([roomTypeKey, roomType]) => {
         const availableRooms = roomType.availableRoomsByDay[0] || 0;
         let totalCapacity = 0;
         let canAccommodate = false;
         let roomsNeeded = 0;
         let requiresMultipleRooms = false;

         if (roomType.isSharedRoom) {
           // For shared rooms (Casa de Playa), available_rooms indicates available beds
           totalCapacity = availableRooms;
           roomsNeeded = 1; // Shared room is always 1 unit
           canAccommodate = availableRooms >= guests;
           requiresMultipleRooms = false;
           console.log(`🏠 ${roomTypeKey}: ${availableRooms} camas disponibles de ${roomType.maxGuests} totales`);
         } else {
           // For individual private rooms, calculate how many rooms are needed
           roomsNeeded = Math.ceil(guests / roomType.maxGuests);
           totalCapacity = availableRooms * roomType.maxGuests;
           canAccommodate = availableRooms >= roomsNeeded;
           requiresMultipleRooms = roomsNeeded > 1;

           console.log(`🏠 ${roomTypeKey}: ${availableRooms} habitaciones disponibles, cada una con capacidad para ${roomType.maxGuests} huéspedes`);
           console.log(`🏠 ${roomTypeKey}: Para ${guests} huéspedes se necesitan ${roomsNeeded} habitaciones`);
           console.log(`🏠 ${roomTypeKey}: ¿Puede acomodar? ${canAccommodate ? 'SÍ' : 'NO'} (${requiresMultipleRooms ? 'MÚLTIPLES habitaciones' : 'UNA habitación'})`);
         }

         // Include room types that can accommodate guests (either in single or multiple rooms)
         if (canAccommodate && availableRooms > 0) {
           validRoomTypes[roomTypeKey] = {
             ...roomType,
             roomsNeeded,
             requiresMultipleRooms
           };
           totalBedsAvailable += (roomType.isSharedRoom ? availableRooms : totalCapacity);

           if (requiresMultipleRooms) {
             console.log(`✅ ${roomTypeKey} puede acomodar a ${guests} huéspedes usando ${roomsNeeded} habitaciones`);
           } else {
             console.log(`✅ ${roomTypeKey} puede acomodar a ${guests} huéspedes en UNA unidad`);
           }
         } else {
           if (availableRooms === 0) {
             console.log(`❌ ${roomTypeKey} no tiene habitaciones disponibles`);
           } else {
             console.log(`❌ ${roomTypeKey} NO puede acomodar a ${guests} huéspedes (necesita ${roomsNeeded} habitaciones, solo ${availableRooms} disponibles)`);
           }
         }
       });
      
      console.log(`🛏️ Total beds available: ${totalBedsAvailable} (${guests} guests requested)`);
      
      // If no room types can accommodate the requested guests, return error
      if (Object.keys(validRoomTypes).length === 0) {
        console.log(`❌ No hay ningún tipo de habitación individual que pueda acomodar a ${guests} huéspedes`);

        // Create detailed capacity breakdown for better error message
        const capacityBreakdown = Object.entries(roomTypes).map(([key, roomType]) => {
          const availableBeds = roomType.availableRoomsByDay[0] || 0;
          const maxGuestsPerUnit = roomType.maxGuests;
          const roomsNeeded = roomType.isSharedRoom ?
            (availableBeds >= guests ? 1 : 0) :
            Math.ceil(guests / maxGuestsPerUnit);
          const canAccommodateWithMultiple = roomType.isSharedRoom ?
            availableBeds >= guests :
            (availableBeds * maxGuestsPerUnit) >= guests;

          return {
            roomType: roomType.roomTypeName,
            availableRooms: availableBeds,
            maxGuestsPerUnit: maxGuestsPerUnit,
            roomsNeeded: roomsNeeded,
            canAccommodateWithMultiple: canAccommodateWithMultiple,
            isSharedRoom: roomType.isSharedRoom
          };
        });

        // Check if any room type can accommodate with multiple units
        const multiRoomOptions = capacityBreakdown.filter(room =>
          !room.isSharedRoom && room.canAccommodateWithMultiple && room.roomsNeeded <= room.availableRooms
        );

        let errorMessage = `No hay habitaciones individuales que puedan acomodar a ${guests} huéspedes.`;
        let suggestions = [
          'Reducir el número de huéspedes',
          'Seleccionar fechas diferentes'
        ];

        if (multiRoomOptions.length > 0) {
          errorMessage = `Para ${guests} huéspedes, necesitas reservar múltiples habitaciones.`;
          suggestions = [
            ...multiRoomOptions.map(room =>
              `${room.roomType}: Reservar ${room.roomsNeeded} habitaciones (${room.availableRooms} disponibles)`
            ),
            'Contactar al surfcamp para asistencia con reservas múltiples'
          ];
        } else {
          suggestions.push('Contactar al surfcamp para opciones especiales');
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
          available: false,
          requestedGuests: guests,
          totalBedsAvailable: 0,
          capacityBreakdown: capacityBreakdown,
          multiRoomOptions: multiRoomOptions,
          suggestions: suggestions,
          debug: {
            totalDaysFromAPI: availabilityData.length,
            endpointUsed: '/available-rooms',
            capacityValidation: {
              requested: guests,
              available: 0,
              insufficient: true,
              breakdown: capacityBreakdown
            }
          }
        }, { status: 404 });
      }
      
      console.log(`✅ Hay ${Object.keys(validRoomTypes).length} tipos de habitación que pueden acomodar a ${guests} huéspedes`);

      // Convert grouped data to final format
      const availableRooms: any[] = [];
      
      // Only return room types that can accommodate the requested guests
      Object.entries(validRoomTypes).forEach(([key, roomType]) => {
        // Calculate price per room based on guest count and room availability
        let finalPrice = null;
        const totalAvailableTemp = roomType.availableRoomsByDay.length > 0 ? roomType.availableRoomsByDay[0] : 0;
        
        if (roomType.categories.length > 0 && totalAvailableTemp > 0) {
          // Use first category as representative for pricing structure
          const representativeCategory = roomType.categories[0];
          
          if (key === 'casa-playa') {
            // Casa de Playa: precio por persona/cama
            const pricePerBed = representativeCategory.prices?.find((p: any) => p.people === 1)?.value || null;
            finalPrice = pricePerBed; // Price per night per person
            console.log(`💰 ${key}: ${guests} guests × $${pricePerBed} per person = $${pricePerBed} per person per night`);
          } else {
            // Casitas Privadas/Deluxe: calcular precio total para múltiples habitaciones
            const singlePrice = representativeCategory.prices?.find((p: any) => p.people === 1)?.value;
            const doublePrice = representativeCategory.prices?.find((p: any) => p.people === 2)?.value;

            const roomsNeeded = roomType.roomsNeeded || 1;
            console.log(`💰 ${key} available prices - Single: $${singlePrice}, Double: $${doublePrice}`);
            console.log(`💰 ${key}: Need ${roomsNeeded} room(s) for ${guests} guests`);

            // Calculate price per room based on optimal occupancy
            let pricePerRoom = doublePrice || singlePrice;

            if (roomsNeeded === 1) {
              // Single room - use appropriate pricing
              if (guests === 1) {
                pricePerRoom = singlePrice;
              } else {
                pricePerRoom = doublePrice || singlePrice;
              }
            } else {
              // Multiple rooms needed - use double occupancy pricing as base
              // For example: 3 guests = 2 rooms (1 double + 1 single)
              pricePerRoom = doublePrice || singlePrice;
            }

            finalPrice = pricePerRoom;
            console.log(`💰 ${key}: Base price per room: $${finalPrice}`);
          }
        }
        
        // Add room type regardless of availability
        const totalAvailable = roomType.availableRoomsByDay.length > 0 ? roomType.availableRoomsByDay[0] : 0;
        
        // Calculate total capacity for this room type based on room type
        let totalCapacity = 0;
        let roomsForDisplay = totalAvailable;
        
        if (roomType.isSharedRoom) {
          // For shared rooms, totalAvailable is the number of available beds
          totalCapacity = totalAvailable;
          roomsForDisplay = totalAvailable > 0 ? 1 : 0; // Show 1 shared room if available
        } else {
          // For individual rooms, multiply by capacity per room
          totalCapacity = totalAvailable * roomType.maxGuests;
          roomsForDisplay = totalAvailable;
        }
        
        const canAccommodateRequestedGuests = totalCapacity >= guests;
        
        availableRooms.push({
          roomTypeId: roomType.roomTypeId,
          roomTypeName: roomType.roomTypeName,
          pricePerNight: finalPrice,
          realPrice: finalPrice,
          priceSource: finalPrice ? 'LOBBYPMS_AVAILABLE_ROOMS_API' : null,
          maxGuests: roomType.maxGuests, // Always show the total capacity regardless of current availability
          availableRooms: roomsForDisplay, // Show correct number of rooms for display
          available: totalAvailable > 0,
          totalCapacity: totalCapacity,
          canAccommodateRequestedGuests: canAccommodateRequestedGuests,
          isSharedRoom: roomType.isSharedRoom,
          roomsNeeded: roomType.roomsNeeded || 1, // Number of rooms needed for requested guests
          requiresMultipleRooms: roomType.requiresMultipleRooms || false, // Flag indicating multiple rooms required
          debug: {
            originalCategory: roomType.categories[0] || null, // First category as example (null if none)
            source: 'available-rooms-endpoint',
            allCategories: roomType.categories.map((c: any) => c.name),
            allPrices: roomType.prices,
            availableRoomsByDay: roomType.availableRoomsByDay,
            minAvailableRooms: totalAvailable,
            capacityInfo: {
              roomsAvailable: roomsForDisplay,
              maxGuestsPerRoom: roomType.isSharedRoom ? totalCapacity : roomType.maxGuests,
              totalCapacity: totalCapacity,
              requestedGuests: guests,
              canAccommodate: canAccommodateRequestedGuests,
              isSharedRoom: roomType.isSharedRoom
            },
            pricingDebug: {
              selectedPrice: finalPrice,
              availablePrices: roomType.categories[0]?.prices || [],
              guestsRequested: guests,
              priceType: key === 'casa-playa' ? 'per-person' : 
                        guests === 1 ? 'single-occupancy' : 
                        guests === 2 ? 'double-occupancy' : 'multiple-rooms'
            }
          }
        });
      });

      console.log('🎯 ===== FINAL RESULT WITH REAL PRICES =====');
      console.log('🎯 Available rooms:', availableRooms.length);
      availableRooms.forEach((room, index) => {
        console.log(`🏠 ${index + 1}. ${room.roomTypeName}:`);
        console.log(`   💰 Real Price: $${room.realPrice} (${room.priceSource || 'NO_PRICE'})`);
        console.log(`   🛏️ Available: ${room.availableRooms} (min across days)`);
        console.log(`   📅 By day: [${room.debug.availableRoomsByDay.join(', ')}]`);
        console.log(`   📊 All prices: [${room.debug.allPrices.join(', ')}]`);
        console.log(`   🏷️ Categories: [${room.debug.allCategories.join(', ')}]`);
      });

      if (availableRooms.length === 0) {
      return NextResponse.json({
          success: false,
          error: 'No rooms available for the selected dates',
          debug: {
            totalDaysProcessed: availabilityData.length,
            availabilityData: availabilityData,
            message: 'No matching room categories found'
          }
        }, { status: 404 });
      }

      const result = {
        success: true,
        available: true,
        maxGuests: 12,
        availableRooms: availableRooms,
        debug: {
          totalDaysFromAPI: availabilityData.length,
          endpointUsed: '/available-rooms',
          priceAnalysis: availableRooms.map(r => ({
            room: r.roomTypeName,
            price: r.pricePerNight,
            realPrice: r.realPrice,
            source: r.priceSource
          }))
        }
      };
      
      // Eliminar toda la lógica de envío de WhatsApp aquí
      // Solo devolver la respuesta normalmente
      console.log('📤 Returning result with REAL prices from correct endpoint:', JSON.stringify(result, null, 2));
      return NextResponse.json(result);

    } catch (apiError: any) {
      console.error('❌ LobbyPMS API error:', apiError.message);
      console.error('❌ Full error details:', {
        message: apiError.message,
        name: apiError.name,
        stack: apiError.stack,
        response: apiError.response?.data
      });
      
      // Determine if this is an HTML response error
      const isHtmlError = apiError.message && apiError.message.includes('HTML');
      
      return NextResponse.json({
        success: false,
        error: isHtmlError 
          ? 'LobbyPMS API está devolviendo HTML en lugar de JSON - posible problema de IP o autenticación' 
          : 'Error de conexión con LobbyPMS',
        debug: {
          errorType: apiError.name,
          message: apiError.message,
          suggestion: isHtmlError 
            ? 'Verifica que tu IP está autorizada en LobbyPMS y que el API token es válido'
            : 'Endpoint /available-rooms failed - check API credentials and IP authorization',
          endpointUsed: '/available-rooms',
          isHtmlError: isHtmlError,
          timestamp: new Date().toISOString()
        }
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error('❌ General availability error:', error);

    return NextResponse.json({
      success: false,
      error: 'Error checking availability',
      details: error.message
    }, { status: 500 });
  }
} 