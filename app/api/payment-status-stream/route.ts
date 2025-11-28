import { NextRequest } from 'next/server';
import { addSSEConnection, removeSSEConnection } from '@/lib/sse-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return new Response('Missing order_id parameter', { status: 400 });
  }

  console.log(`📡 [SSE-STREAM] New SSE connection request for order ${orderId}`);

  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the manager
      addSSEConnection(orderId, controller);

      // Send initial connection confirmation
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', orderId })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Keep-alive ping every 15 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log(`📡 [SSE-STREAM] Connection aborted for order ${orderId}`);
        clearInterval(keepAliveInterval);
        removeSSEConnection(orderId, controller);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },

    cancel() {
      console.log(`📡 [SSE-STREAM] Stream cancelled for order ${orderId}`);
      // Will be cleaned up by abort listener
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
