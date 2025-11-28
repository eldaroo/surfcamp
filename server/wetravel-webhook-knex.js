const express = require('express');
const crypto = require('crypto');
const knex = require('knex');

const app = express();

// Knex configuration
const db = knex({
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10
  }
});

// Configuration
const WETRAVEL_WEBHOOK_SECRET = process.env.WETRAVEL_WEBHOOK_SECRET;
const WETRAVEL_WEBHOOK_TOKEN = process.env.WETRAVEL_WEBHOOK_TOKEN;

// Middleware for raw body
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
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', WETRAVEL_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ HMAC verification error:', error.message);
    return false;
  }
};

// Token-based verification
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

// Background processing
const processWebhookBackground = (eventData) => {
  setImmediate(async () => {
    try {
      await processWebhookEvent(eventData);
    } catch (error) {
      console.error('❌ Background webhook processing error:', error);
    }
  });
};

// Main webhook processing with Knex
const processWebhookEvent = async (eventData) => {
  const { type, data } = eventData;
  const trx = await db.transaction();

  try {
    console.log(`📥 Processing webhook event: ${type}`, {
      payment_id: data.id,
      order_id: data.order_id,
      status: data.status,
      updated_at: data.updated_at
    });

    // Check idempotency
    const eventKey = data.updated_at ? `${data.id}:${data.updated_at}` : `${data.id}:${Date.now()}`;
    const existingEvent = await trx('wetravel_events')
      .where('event_key', eventKey)
      .first();

    if (existingEvent) {
      console.log(`⏭️ Event already processed: ${eventKey}`);
      await trx.commit();
      return;
    }

    // Record event for idempotency
    await trx('wetravel_events').insert({
      event_key: eventKey,
      event_type: type,
      payment_id: data.id,
      order_id: data.order_id
    });

    // Process different event types
    switch (type) {
      case 'payment.created':
        await handlePaymentCreated(trx, data);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(trx, data);
        break;

      case 'transaction.created':
      case 'transaction.updated':
        await handleTransaction(trx, data, type);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${type}`);
    }

    await trx.commit();
    console.log(`✅ Successfully processed ${type} for payment ${data.id}`);

  } catch (error) {
    await trx.rollback();
    console.error(`❌ Error processing webhook ${type}:`, error);
    throw error;
  }
};

// Handle payment.created with Knex
const handlePaymentCreated = async (trx, data) => {
  const {
    id: paymentId,
    order_id: orderId,
    status,
    total_amount,
    currency,
    payment_method
  } = data;

  // Ensure order exists (Knex upsert)
  await trx.raw(`
    INSERT INTO orders (id, status, total_amount, currency) 
    VALUES (?, 'pending', ?, ?) 
    ON CONFLICT (id) DO NOTHING
  `, [orderId, total_amount, currency || 'USD']);

  // Insert/update payment record (Knex upsert)
  await trx.raw(`
    INSERT INTO payments 
    (id, order_id, status, total_amount, currency, payment_method, wetravel_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      total_amount = EXCLUDED.total_amount,
      currency = EXCLUDED.currency,
      payment_method = EXCLUDED.payment_method,
      wetravel_data = EXCLUDED.wetravel_data,
      updated_at = NOW()
  `, [
    paymentId,
    orderId,
    status || 'pending',
    total_amount,
    currency || 'USD',
    payment_method,
    JSON.stringify(data)
  ]);

  console.log(`💰 Payment created: ${paymentId} for order ${orderId} (${status})`);
};

// Handle payment.updated with Knex
const handlePaymentUpdated = async (trx, data) => {
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
  await trx('payments')
    .where('id', paymentId)
    .update({
      status,
      total_amount,
      net_amount,
      payment_processing_fee,
      currency: currency || 'USD',
      payment_method,
      wetravel_data: JSON.stringify(data),
      updated_at: trx.fn.now()
    });

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
    await trx('orders')
      .where('id', orderId)
      .update({
        status: orderStatus,
        updated_at: trx.fn.now()
      });
  }

  console.log(`🔄 Payment updated: ${paymentId} -> ${status} (order ${orderId} -> ${orderStatus})`);
};

// Handle transaction events with Knex
const handleTransaction = async (trx, data, eventType) => {
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

  // Use Knex's onConflict for PostgreSQL
  await trx('transactions')
    .insert({
      payment_id: paymentId,
      order_id: orderId,
      amount,
      net_amount,
      payment_processing_fee,
      type: transactionType,
      status,
      currency: currency || 'USD',
      wetravel_data: JSON.stringify(data)
    })
    .onConflict()
    .ignore(); // PostgreSQL: ON CONFLICT DO NOTHING

  console.log(`📊 Transaction ${eventType}: ${paymentId} (${transactionType})`);
};

// Main webhook endpoint
app.post('/api/wetravel-webhook', getRawBody, async (req, res) => {
  const startTime = Date.now();

  try {
    // Security checks
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (WETRAVEL_WEBHOOK_SECRET && !verifyHMACSignature(req.rawBody, signature, timestamp)) {
      console.error('❌ HMAC signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    if (!WETRAVEL_WEBHOOK_SECRET && !verifyToken(req)) {
      console.error('❌ Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Validate payload
    const { type, data } = req.body;
    if (!type || !data || !data.id) {
      console.error('❌ Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    // Respond quickly
    res.status(200).json({ 
      status: 'received', 
      event_type: type, 
      payment_id: data.id,
      processing_time_ms: Date.now() - startTime
    });

    // Process in background
    processWebhookBackground({ type, data });

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check with Knex
app.get('/api/wetravel-webhook/health', async (req, res) => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('💤 Closing database connections...');
  db.destroy(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 WeTravel webhook server (Knex) running on port ${PORT}`);
    console.log(`📡 Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook`);
  });
}

module.exports = app;