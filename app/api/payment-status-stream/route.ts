import { NextRequest } from 'next/server';
import { getPaymentByOrderId, getOrderById } from '@/lib/db';

export const dynamic = 'force-dynamic';

// How often the server polls the DB while the client is connected
const POLL_INTERVAL_MS = 4000;
// Maximum time to keep the connection open (30 minutes)
const MAX_DURATION_MS = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return new Response('Missing order_id parameter', { status: 400 });
  }

  console.log(`📡 [SSE] DB-polling stream opened for order ${orderId}`);

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_e) { /* controller already closed */ }
      };

      // Confirm connection to client
      send({ type: 'connected', orderId });

      const poll = async () => {
        try {
          const payment = await getPaymentByOrderId(orderId);
          if (!payment) return;

          const isDone =
            payment.status === 'booking_created' ||
            payment.status === 'completed';

          if (isDone) {
            const order = await getOrderById(payment.order_id);
            console.log(`📡 [SSE] DB poll found ${payment.status} for order ${orderId} — pushing to client`);
            send({
              type: 'reservation_complete',
              status: payment.status,
              payment_id: payment.id,
              order_id: payment.order_id,
              lobbypms_reservation_id: order?.lobbypms_reservation_id ?? null,
            });
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            try { controller.close(); } catch (_e) { /* ignore */ }
          }
        } catch (err) {
          console.error(`📡 [SSE] DB poll error for order ${orderId}:`, err);
        }
      };

      // Poll immediately, then on interval
      await poll();
      const intervalId = setInterval(poll, POLL_INTERVAL_MS);

      // Keep-alive ping every 20 seconds so proxies don't close the connection
      const pingId = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')); } catch (_e) { clearInterval(pingId); }
      }, 20_000);

      // Close after MAX_DURATION_MS to avoid zombie connections
      const timeoutId = setTimeout(() => {
        console.log(`📡 [SSE] Stream timeout for order ${orderId} after ${MAX_DURATION_MS / 60000}min`);
        clearInterval(intervalId);
        clearInterval(pingId);
        send({ type: 'timeout' });
        try { controller.close(); } catch (_e) { /* ignore */ }
      }, MAX_DURATION_MS);

      // Clean up if client disconnects
      request.signal.addEventListener('abort', () => {
        console.log(`📡 [SSE] Client disconnected for order ${orderId}`);
        clearInterval(intervalId);
        clearInterval(pingId);
        clearTimeout(timeoutId);
        try { controller.close(); } catch (_e) { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
