import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('NOWPayments Webhook recibido:', body);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
  }
} 