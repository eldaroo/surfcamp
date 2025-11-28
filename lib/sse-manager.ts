// SSE Manager - Handles Server-Sent Events connections
type SSEConnection = {
  controller: ReadableStreamDefaultController;
  orderId: string;
};

// Store active SSE connections in memory
const connections = new Map<string, SSEConnection[]>();

export function addSSEConnection(orderId: string, controller: ReadableStreamDefaultController) {
  const existing = connections.get(orderId) || [];
  existing.push({ controller, orderId });
  connections.set(orderId, existing);

  console.log(`📡 [SSE] New connection for order ${orderId}. Total connections: ${existing.length}`);
}

export function removeSSEConnection(orderId: string, controller: ReadableStreamDefaultController) {
  const existing = connections.get(orderId) || [];
  const filtered = existing.filter(conn => conn.controller !== controller);

  if (filtered.length === 0) {
    connections.delete(orderId);
  } else {
    connections.set(orderId, filtered);
  }

  console.log(`📡 [SSE] Connection removed for order ${orderId}. Remaining: ${filtered.length}`);
}

export function notifyOrderUpdate(orderId: string, data: any) {
  const orderConnections = connections.get(orderId);

  if (!orderConnections || orderConnections.length === 0) {
    console.log(`📡 [SSE] No connections found for order ${orderId}`);
    return;
  }

  console.log(`📡 [SSE] Notifying ${orderConnections.length} connection(s) for order ${orderId}`);

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;

  orderConnections.forEach(({ controller }) => {
    try {
      controller.enqueue(encoder.encode(message));
      console.log(`✅ [SSE] Message sent to connection for order ${orderId}`);
    } catch (error) {
      console.error(`❌ [SSE] Failed to send message:`, error);
    }
  });
}

export function getConnectionCount(orderId?: string): number {
  if (orderId) {
    return connections.get(orderId)?.length || 0;
  }
  return Array.from(connections.values()).reduce((sum, conns) => sum + conns.length, 0);
}
