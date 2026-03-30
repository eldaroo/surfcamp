import { NextResponse } from 'next/server';
import { sendClientConfirmationEmail } from '@/lib/brevo-email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sendClientConfirmationEmail({
      clientFirstName: 'Dario',
      clientEmail: 'darioegea@gmail.com',
      checkIn: '2026-04-10',
      checkOut: '2026-04-17',
      totalAmount: 840,
      depositAmount: 120,
      remainingBalance: 720,
    });
    return NextResponse.json({ success: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
