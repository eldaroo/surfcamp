import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from './webhook';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const order_id = searchParams.get('order_id');
  if (!order_id) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }
  const status = getPaymentStatus(order_id);
  if (!status) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(status);
} 