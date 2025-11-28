import { NextResponse } from 'next/server';
import { AVAILABLE_ACTIVITIES, getActivitiesByCategory } from '@/lib/activities';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      activities: AVAILABLE_ACTIVITIES,
      categorizedActivities: {
        surf: getActivitiesByCategory('surf'),
        yoga: getActivitiesByCategory('yoga'),
        ice_bath: getActivitiesByCategory('ice_bath'),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Error fetching activities' },
      { status: 500 }
    );
  }
} 