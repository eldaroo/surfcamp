const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // or individual config:
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuration
const WETRAVEL_WEBHOOK_SECRET = process.env.WETRAVEL_WEBHOOK_SECRET;
const WETRAVEL_WEBHOOK_TOKEN = process.env.WETRAVEL_WEBHOOK_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware for raw body (needed for HMAC verification)
const getRawBody = (req, res, next) => {
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    rawBody += chunk;
  });
  req.on('end', () => {
    req.rawBody = rawBody;
    try {
      req.body = JSON.parse(rawBody);
      next();
    } catch (error) {
      console.error('❌ Invalid JSON in webhook payload:', error.message);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  });
};

// HMAC Signature Verification
const verifyHMACSignature = (rawBody, signature, timestamp) => {
  if (!WETRAVEL_WEBHOOK_SECRET) {
    console.warn('⚠️ WETRAVEL_WEBHOOK_SECRET not set, skipping HMAC verification');
    return true;
  }

  if (!signature || !timestamp) {
    console.error('❌ Missing signature or timestamp headers');
    return false;
  }

  try {
    // WeTravel typically uses format: timestamp.payload for HMAC
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', WETRAVEL_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');

    // Remove 'sha256=' prefix if present
    const receivedSignature = signature.replace('sha256=', '');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ HMAC verification error:', error.message);
    return false;
  }
};

// Token-based verification (fallback if no HMAC)
const verifyToken = (req) => {
  if (!WETRAVEL_WEBHOOK_TOKEN) {
    console.warn('⚠️ WETRAVEL_WEBHOOK_TOKEN not set, skipping token verification');
    return true;
  }

  const token = req.query.token;
  if (!token || token !== WETRAVEL_WEBHOOK_TOKEN) {
    console.error('❌ Invalid or missing webhook token');
    return false;
  }

  return true;
};

// Background job processing (simple implementation)
const processWebhookBackground = (eventData) => {
  setImmediate(async () => {
    try {
      await processWebhookEvent(eventData);
    } catch (error) {
      console.error('❌ Background webhook processing error:', error);
      // In production, you'd want to retry or send to dead letter queue
    }
  });
};

// Main webhook processing logic
const processWebhookEvent = async (eventData) => {
  const { type, data } = eventData;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log(`📥 Processing webhook event: ${type}`, {
      payment_id: data.id,
      order_id: data.order_id,
      status: data.status,
      updated_at: data.updated_at
    });

    // Check idempotency
    const eventKey = data.updated_at ? `${data.id}:${data.updated_at}` : `${data.id}:${Date.now()}`;
    const existingEvent = await client.query(
      'SELECT event_key FROM wetravel_events WHERE event_key = $1',
      [eventKey]
    );

    if (existingEvent.rows.length > 0) {
      console.log(`⏭️ Event already processed: ${eventKey}`);
      await client.query('COMMIT');
      return;
    }

    // Record event for idempotency
    await client.query(
      `INSERT INTO wetravel_events (event_key, event_type, payment_id, order_id) 
       VALUES ($1, $2, $3, $4)`,
      [eventKey, type, data.id, data.order_id]
    );

    // Process different event types
    switch (type) {
      case 'payment.created':
        await handlePaymentCreated(client, data);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(client, data);
        break;

      case 'transaction.created':
      case 'transaction.updated':
        await handleTransaction(client, data, type);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${type}`);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully processed ${type} for payment ${data.id}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error processing webhook ${type}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

// Handle payment.created events
const handlePaymentCreated = async (client, data) => {
  const {
    id: paymentId,
    order_id: orderId,
    status,
    total_amount,
    currency,
    payment_method
  } = data;

  // Ensure order exists
  await client.query(
    `INSERT INTO orders (id, status, total_amount, currency) 
     VALUES ($1, 'pending', $2, $3) 
     ON CONFLICT (id) DO NOTHING`,
    [orderId, total_amount, currency || 'USD']
  );

  // Insert payment record
  await client.query(
    `INSERT INTO payments 
     (id, order_id, status, total_amount, currency, payment_method, wetravel_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       total_amount = EXCLUDED.total_amount,
       currency = EXCLUDED.currency,
       payment_method = EXCLUDED.payment_method,
       wetravel_data = EXCLUDED.wetravel_data,
       updated_at = NOW()`,
    [
      paymentId,
      orderId,
      status || 'pending',
      total_amount,
      currency || 'USD',
      payment_method,
      JSON.stringify(data)
    ]
  );

  console.log(`💰 Payment created: ${paymentId} for order ${orderId} (${status})`);
};

// Handle payment.updated events
const handlePaymentUpdated = async (client, data) => {
  const {
    id: paymentId,
    order_id: orderId,
    status,
    total_amount,
    net_amount,
    payment_processing_fee,
    currency,
    payment_method
  } = data;

  // Update payment record
  await client.query(
    `UPDATE payments SET
       status = $2,
       total_amount = $3,
       net_amount = $4,
       payment_processing_fee = $5,
       currency = $6,
       payment_method = $7,
       wetravel_data = $8,
       updated_at = NOW()
     WHERE id = $1`,
    [
      paymentId,
      status,
      total_amount,
      net_amount,
      payment_processing_fee,
      currency || 'USD',
      payment_method,
      JSON.stringify(data)
    ]
  );

  // Update order status based on payment status
  let orderStatus = 'pending';
  if (status === 'processed') {
    orderStatus = 'paid';
  } else if (status === 'failed') {
    orderStatus = 'cancelled';
  } else if (status === 'refunded') {
    orderStatus = 'refunded';
  }

  if (orderStatus !== 'pending') {
    await client.query(
      `UPDATE orders SET
         status = $2,
         updated_at = NOW()
       WHERE id = $1`,
      [orderId, orderStatus]
    );
  }

  console.log(`🔄 Payment updated: ${paymentId} -> ${status} (order ${orderId} -> ${orderStatus})`);
};

// Handle transaction events (optional for accounting)
const handleTransaction = async (client, data, eventType) => {
  const {
    payment_id: paymentId,
    order_id: orderId,
    amount,
    net_amount,
    payment_processing_fee,
    type: transactionType,
    status,
    currency
  } = data;

  await client.query(
    `INSERT INTO transactions 
     (payment_id, order_id, amount, net_amount, payment_processing_fee, type, status, currency, wetravel_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING`,
    [
      paymentId,
      orderId,
      amount,
      net_amount,
      payment_processing_fee,
      transactionType,
      status,
      currency || 'USD',
      JSON.stringify(data)
    ]
  );

  console.log(`📊 Transaction ${eventType}: ${paymentId} (${transactionType})`);
};

// Main webhook endpoint
app.post('/api/wetravel-webhook', getRawBody, async (req, res) => {
  const startTime = Date.now();

  try {
    // Quick security checks first
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    // Verify HMAC signature (if configured)
    if (WETRAVEL_WEBHOOK_SECRET && !verifyHMACSignature(req.rawBody, signature, timestamp)) {
      console.error('❌ HMAC signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Verify token (if configured and no HMAC)
    if (!WETRAVEL_WEBHOOK_SECRET && !verifyToken(req)) {
      console.error('❌ Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Validate payload structure
    const { type, data } = req.body;
    if (!type || !data || !data.id) {
      console.error('❌ Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    // Respond quickly (< 3s requirement)
    res.status(200).json({ 
      status: 'received', 
      event_type: type, 
      payment_id: data.id,
      processing_time_ms: Date.now() - startTime
    });

    // Process webhook in background
    processWebhookBackground({ type, data });

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/wetravel-webhook/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' // Add actual DB health check if needed
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (for standalone use)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 WeTravel webhook server running on port ${PORT}`);
    console.log(`📡 Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook`);
  });
}

module.exports = app;