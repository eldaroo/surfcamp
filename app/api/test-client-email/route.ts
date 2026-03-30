import { NextResponse } from 'next/server';
import { sendClientConfirmationEmail } from '@/lib/brevo-email';

export async function GET() {
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
}
