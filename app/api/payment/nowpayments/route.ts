import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, order_id, order_description } = await req.json();
    if (!amount || !order_id || !order_description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': 'SF2615P-YQ04ZCY-GF4ECGV-XFZPW1X',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdcsol', // USDC en la red de Solana
        order_id,
        order_description,
        ipn_callback_url: 'https://97ad95c69e68.ngrok-free.app/api/payment/nowpayments/webhook',
        success_url: 'https://97ad95c69e68.ngrok-free.app/success',
        cancel_url: 'https://97ad95c69e68.ngrok-free.app/cancel'
      }),
    });

    const data = await response.json();
    console.error('NOWPayments response:', data);
    if (!response.ok) {
      return NextResponse.json({ error: data.message || data || 'NOWPayments error' }, { status: 500 });
    }

    return NextResponse.json({ invoice_url: data.invoice_url });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 