import { NextResponse } from 'next/server';
import { sendAdminNotificationEmail } from '@/lib/brevo-email';

export async function GET() {
  try {
    await sendAdminNotificationEmail({
      bookingReference: 'TEST-001',
      clientFullName: 'Test Cliente',
      clientEmail: 'test@test.com',
      clientPhone: '+506 8888 8888',
      checkIn: '2026-04-10',
      checkOut: '2026-04-15',
      guests: 2,
      roomTypeName: 'Casa de Playa',
      totalAmount: 800,
      depositAmount: 200,
      remainingBalance: 600,
      locale: 'es',
      iceBathParticipants: [{ name: 'Test Cliente', iceBathSessions: 2 }],
      surfParticipants: [{ name: 'Test Cliente', surfClasses: 5 }],
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
