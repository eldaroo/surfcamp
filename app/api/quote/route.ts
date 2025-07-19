import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_ACTIVITIES, getActivityById, calculateActivitiesTotal } from '@/lib/activities';
import { calculateNights, validateDateRange, validateGuestCount } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests, activities, activityIds, roomTypeId } = body;

    // Validations
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const dateError = validateDateRange(checkInDate, checkOutDate);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const guestError = validateGuestCount(guests);
    if (guestError) {
      return NextResponse.json({ error: guestError }, { status: 400 });
    }

    // Calculate accommodation cost
    const nights = calculateNights(checkInDate, checkOutDate);
    let accommodationPricePerNight = 0; // Will be set when room is selected
    let accommodationTotal = 0;

    if (roomTypeId) {
      // Get room pricing from availability check
      try {
        const availabilityResponse = await fetch(`${request.nextUrl.origin}/api/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn,
            checkOut,
            guests,
          }),
        });

        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          const selectedRoom = availabilityData.availableRooms?.find(
            (room: any) => room.roomTypeId === roomTypeId
          );

          if (selectedRoom) {
            // Use room price per night for the total capacity (not per person)
            accommodationPricePerNight = selectedRoom.pricePerNight;
            accommodationTotal = accommodationPricePerNight * nights;
          }
        }
      } catch (error) {
        console.error('Error fetching room pricing:', error);
      }
    }
    // If no room selected, accommodationTotal remains 0

    // Calculate activities cost
    let activitiesTotal = 0;
    let activityBreakdown: Array<{ activityId: string; name: string; price: number; quantity: number; }> = [];

    if (activities && Array.isArray(activities)) {
      // New format with quantities
      activities.forEach((item: { activityId: string; quantity: number }) => {
        const activity = getActivityById(item.activityId);
        if (activity) {
          let totalPrice = 0;
          if (activity.category === 'yoga') {
            // Yoga: price per class * quantity * guests
            totalPrice = activity.price * item.quantity * guests;
          } else if (activity.category === 'ice_bath') {
            // Ice bath: price per session * quantity * guests
            totalPrice = activity.price * item.quantity * guests;
          } else if (activity.category === 'transport') {
            // Transport: price per trip * quantity * guests
            totalPrice = activity.price * item.quantity * guests;
          } else {
            // Surf: price per person * guests (no quantity)
            totalPrice = activity.price * guests;
          }
          
          activitiesTotal += totalPrice;
          activityBreakdown.push({
            activityId: activity.id,
            name: activity.name,
            price: totalPrice,
            quantity: activity.category === 'yoga' ? item.quantity : 1,
          });
        }
      });
    } else if (activityIds && Array.isArray(activityIds)) {
      // Legacy format for backward compatibility
      const selectedActivities = activityIds
        .map((id: string) => getActivityById(id))
        .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity));
      
      activitiesTotal = calculateActivitiesTotal(selectedActivities, guests);
      activityBreakdown = selectedActivities.map(activity => ({
        activityId: activity.id,
        name: activity.name,
        price: activity.price * guests,
        quantity: 1,
      }));
    }

    // Calculate breakdown
    const subtotal = accommodationTotal + activitiesTotal;
    const taxes = 0; // No IVA
    const total = subtotal;

    const priceBreakdown = {
      accommodation: accommodationTotal,
      activities: activityBreakdown,
      subtotal,
      taxes,
      total,
    };

    return NextResponse.json({
      success: true,
      priceBreakdown,
      nights,
      accommodationPricePerNight,
    });
  } catch (error) {
    console.error('Quote calculation error:', error);
    return NextResponse.json(
      { error: 'Error calculating quote' },
      { status: 500 }
    );
  }
} 