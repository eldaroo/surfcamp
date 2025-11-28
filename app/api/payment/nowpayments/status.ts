import { NextRequest, NextResponse } from 'next/server';

// Función simple para obtener el estado del pago
function getPaymentStatus(orderId: string) {
  // Por ahora retornamos un estado mock
  // En una implementación real, esto consultaría la base de datos
  return {
    order_id: orderId,
    status: 'pending',
    amount: 0,
    currency: 'USD',
    timestamp: new Date().toISOString()
  };
}

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