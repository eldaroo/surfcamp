import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const order_id = searchParams.get('order_id');
  if (!order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
  }

  // Llama a la API de NOWPayments para obtener el estado del pago
  const response = await fetch(`https://api.nowpayments.io/v1/payment/${order_id}`, {
    headers: { 'x-api-key': 'SF2615P-YQ04ZCY-GF4ECGV-XFZPW1X' }
  });
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.message || 'NOWPayments error' }, { status: 500 });
  }

  return NextResponse.json(data);
} 