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
          maxGuests: 8,
          categories: [] as any[],
          availableRoomsByDay: [] as number[],
          prices: [] as number[]
        },
        'casitas-privadas': {
          roomTypeId: 'casitas-privadas',
          roomTypeName: 'Casitas Privadas',
          maxGuests: 2,
          categories: [] as any[],
          availableRoomsByDay: [] as number[],
          prices: [] as number[]
        },
        'casas-deluxe': {
          roomTypeId: 'casas-deluxe',
          roomTypeName: 'Casas Deluxe',
          maxGuests: 2,
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
      
      // Only process the days we need (number of nights)
      const daysToProcess = Math.min(nights, availabilityData.length);
      availabilityData.slice(0, daysToProcess).forEach((dayData, dayIndex) => {
        console.log(`📅 Processing day ${dayIndex + 1}: ${dayData.date}`);
        
        if (dayData.categories && Array.isArray(dayData.categories)) {
          dayData.categories.forEach((category: any, catIndex: number) => {
            console.log(`🏠 ===== PROCESSING CATEGORY ${catIndex + 1} =====`);
            console.log(`🏠 Category ID: ${category.category_id}`);
            console.log(`🏠 Category name: "${category.name}"`);
            console.log(`🏠 Available rooms: ${category.available_rooms}`);
            console.log(`🏠 Prices:`, category.prices);
            
            // Map categories to our 3 accommodation types
            const categoryName = (category.name || '').toLowerCase();
            const singlePrice = category.prices?.find((p: any) => p.people === 1)?.value;
            
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
              roomTypes['casa-playa'].categories.push(category);
              individualCategories[categoryName].roomType = 'casa-playa';
              // Solo agregar precio si hay disponibilidad
              if (singlePrice && singlePrice > 0 && (category.available_rooms || 0) > 0) {
                roomTypes['casa-playa'].prices.push(singlePrice);
                individualCategories[categoryName].prices.push(singlePrice);
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
              console.log(`   - Casas Deluxe: "Studio 1", "Studio 2", "Casita 5", "Casita 6"`);
              // Continue processing but don't include this category
            }
          });
        }
      });
      
      // Calculate total availability for each room type using correct logic
      Object.keys(roomTypes).forEach(roomTypeKey => {
        const roomType = roomTypes[roomTypeKey as keyof typeof roomTypes];
        let totalAvailableForAllDays = 0;
        
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
      });

      // Convert grouped data to final format
      const availableRooms: any[] = [];
      
      // ALWAYS return all 3 accommodation types, even if not available
      Object.entries(roomTypes).forEach(([key, roomType]) => {
        // Calculate representative price (median or most common)
        let finalPrice = null;
        
        if (roomType.prices.length > 0) {
          // Use the special price for "Casa Playa" if it exists
          if (key === 'casa-playa') {
            const casaPlayaPrice = roomType.prices.find(p => p === 20);
            if (casaPlayaPrice) {
              finalPrice = casaPlayaPrice;
            } else {
              // Use median price
              const sortedPrices = roomType.prices.sort((a, b) => a - b);
              finalPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
            }
          } else {
            // Use median price for other types
            const sortedPrices = roomType.prices.sort((a, b) => a - b);
            finalPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
          }
        }
        
        // Add room type regardless of availability
        const totalAvailable = roomType.availableRoomsByDay.length > 0 ? roomType.availableRoomsByDay[0] : 0;
        
        availableRooms.push({
          roomTypeId: roomType.roomTypeId,
          roomTypeName: roomType.roomTypeName,
          pricePerNight: finalPrice,
          realPrice: finalPrice,
          priceSource: finalPrice ? 'LOBBYPMS_AVAILABLE_ROOMS_API' : null,
          maxGuests: roomType.maxGuests,
          availableRooms: totalAvailable,
          available: totalAvailable > 0,
          debug: {
            originalCategory: roomType.categories[0] || null, // First category as example (null if none)
            source: 'available-rooms-endpoint',
            allCategories: roomType.categories.map(c => c.name),
            allPrices: roomType.prices,
            availableRoomsByDay: roomType.availableRoomsByDay,
            minAvailableRooms: totalAvailable
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