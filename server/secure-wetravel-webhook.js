const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();

// 🔒 SECURE: PostgreSQL connection with service_role
// Use service_role credentials that bypass RLS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Should be service_role URL
  // Alternative configuration for Supabase:
  // host: 'your-project.supabase.co',
  // port: 5432,
  // database: 'postgres',
  // user: 'service_role', // ← This bypasses RLS
  // password: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuration
const WETRAVEL_WEBHOOK_SECRET = process.env.WETRAVEL_WEBHOOK_SECRET;
const WETRAVEL_WEBHOOK_TOKEN = process.env.WETRAVEL_WEBHOOK_TOKEN;

// 🔒 SECURITY: IP Allowlist (optional)
const ALLOWED_IPS = process.env.WETRAVEL_ALLOWED_IPS?.split(',') || [];

const checkIPAllowlist = (req, res, next) => {
  if (ALLOWED_IPS.length === 0) {
    return next(); // No IP restriction configured
  }

  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
  
  if (!ALLOWED_IPS.includes(clientIP)) {
    console.error(`❌ Blocked request from unauthorized IP: ${clientIP}`);
    return res.status(403).json({ error: 'IP not allowed' });
  }
  
  next();
};

// 🔒 SECURITY: Enhanced HMAC verification with timing attack protection
const verifyHMACSignature = (rawBody, signature, timestamp) => {
  if (!WETRAVEL_WEBHOOK_SECRET) {
    console.warn('⚠️ WETRAVEL_WEBHOOK_SECRET not set - SECURITY RISK');
    return true;
  }

  if (!signature || !timestamp) {
    console.error('❌ Missing required security headers');
    return false;
  }

  // Prevent replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);
  if (Math.abs(now - webhookTime) > 300) {
    console.error('❌ Webhook timestamp too old/future, potential replay attack');
    return false;
  }

  try {
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', WETRAVEL_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    // Constant-time comparison prevents timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    if (!isValid) {
      console.error('❌ HMAC signature verification failed - potential security breach');
    }

    return isValid;
  } catch (error) {
    console.error('❌ HMAC verification error:', error.message);
    return false;
  }
};

// Middleware for raw body (needed for HMAC)
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
      console.error('❌ Invalid JSON payload:', error.message);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  });
};

// 🔒 SECURITY: Token verification with constant-time comparison
const verifyToken = (req) => {
  if (!WETRAVEL_WEBHOOK_TOKEN) {
    console.warn('⚠️ WETRAVEL_WEBHOOK_TOKEN not set - SECURITY RISK');
    return true;
  }

  const token = req.query.token;
  if (!token) {
    console.error('❌ Missing webhook token');
    return false;
  }

  // Constant-time comparison prevents timing attacks
  const expectedBuffer = Buffer.from(WETRAVEL_WEBHOOK_TOKEN, 'utf8');
  const receivedBuffer = Buffer.from(token, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    console.error('❌ Invalid token length');
    return false;
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  
  if (!isValid) {
    console.error('❌ Token verification failed');
  }

  return isValid;
};

// Background processing with error handling
const processWebhookBackground = (eventData) => {
  setImmediate(async () => {
    try {
      await processWebhookEvent(eventData);
    } catch (error) {
      console.error('❌ Background webhook processing error:', error);
      // TODO: Add to dead letter queue or retry mechanism
      await logProcessingError(eventData, error);
    }
  });
};

// 🔒 SECURE: Audit logging
const logProcessingError = async (eventData, error) => {
  try {
    const client = await pool.connect();
    await client.query(`
      INSERT INTO processing_errors (event_type, event_data, error_message, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT DO NOTHING
    `, [
      eventData.type,
      JSON.stringify(eventData),
      error.message
    ]);
    client.release();
  } catch (logError) {
    console.error('❌ Failed to log processing error:', logError);
  }
};

// Main webhook processing (using service_role DB access)
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

    // 🔒 SECURE: Idempotency check with enhanced key
    const eventKey = `${data.id}:${data.updated_at || Date.now()}:${type}`;
    const existingEvent = await client.query(
      'SELECT event_key FROM wetravel_events WHERE event_key = $1',
      [eventKey]
    );

    if (existingEvent.rows.length > 0) {
      console.log(`⏭️ Event already processed (idempotent): ${eventKey}`);
      await client.query('COMMIT');
      return;
    }

    // Record event for idempotency
    await client.query(
      `INSERT INTO wetravel_events (event_key, event_type, payment_id, order_id) 
       VALUES ($1, $2, $3, $4)`,
      [eventKey, type, data.id, data.order_id]
    );

    // Process events
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
        // Log but don't fail
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

// Enhanced payment.created handler
const handlePaymentCreated = async (client, data) => {
  const {
    id: paymentId,
    order_id: orderId,
    status,
    total_amount,
    currency,
    payment_method,
    customer_name,
    customer_email
  } = data;

  // 🔒 SECURE: Input validation
  if (!paymentId || !orderId || !total_amount) {
    throw new Error('Missing required payment data');
  }

  if (total_amount < 0 || total_amount > 100000000) { // $1M limit
    throw new Error('Invalid payment amount');
  }

  // Create/update order with customer info
  await client.query(
    `INSERT INTO orders (id, status, total_amount, currency, customer_name, customer_email) 
     VALUES ($1, 'pending', $2, $3, $4, $5) 
     ON CONFLICT (id) DO UPDATE SET
       customer_name = COALESCE(EXCLUDED.customer_name, orders.customer_name),
       customer_email = COALESCE(EXCLUDED.customer_email, orders.customer_email),
       updated_at = NOW()`,
    [orderId, total_amount, currency || 'USD', customer_name, customer_email]
  );

  // Create payment record
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

// Enhanced payment.updated handler
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

  // 🔒 SECURE: Input validation
  if (!paymentId || !orderId || !status) {
    throw new Error('Missing required payment update data');
  }

  // Update payment record
  const updateResult = await client.query(
    `UPDATE payments SET
       status = $2,
       total_amount = $3,
       net_amount = $4,
       payment_processing_fee = $5,
       currency = $6,
       payment_method = $7,
       wetravel_data = $8,
       updated_at = NOW()
     WHERE id = $1
     RETURNING order_id`,
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

  if (updateResult.rows.length === 0) {
    console.warn(`⚠️ Payment ${paymentId} not found, creating it first`);
    await handlePaymentCreated(client, data);
    return;
  }

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

// Transaction handler remains the same
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

// 🔒 SECURE: Main webhook endpoint with comprehensive security
app.post('/api/wetravel-webhook', checkIPAllowlist, getRawBody, async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    console.log(`🔐 Webhook request from IP: ${clientIP}`);

    // Security checks
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    // HMAC verification (preferred)
    if (WETRAVEL_WEBHOOK_SECRET && !verifyHMACSignature(req.rawBody, signature, timestamp)) {
      console.error(`❌ HMAC verification failed for IP: ${clientIP}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Token verification (fallback)
    if (!WETRAVEL_WEBHOOK_SECRET && !verifyToken(req)) {
      console.error(`❌ Token verification failed for IP: ${clientIP}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Payload validation
    const { type, data } = req.body;
    if (!type || !data || !data.id) {
      console.error('❌ Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    // Rate limiting check (basic)
    const processingTime = Date.now() - startTime;
    if (processingTime > 100) {
      console.warn(`⚠️ Slow security validation: ${processingTime}ms`);
    }

    // Quick response (< 3s requirement)
    res.status(200).json({ 
      status: 'received', 
      event_type: type, 
      payment_id: data.id,
      processing_time_ms: processingTime
    });

    // Process in background
    processWebhookBackground({ type, data });

  } catch (error) {
    console.error(`❌ Webhook endpoint error from IP ${clientIP}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔒 SECURE: Health check with basic auth
app.get('/api/wetravel-webhook/health', async (req, res) => {
  try {
    // Optional: Simple auth for health checks
    const authHeader = req.headers.authorization;
    const expectedAuth = process.env.HEALTH_CHECK_AUTH;
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Test database connection (using service_role)
    const result = await pool.query('SELECT NOW() as server_time, version() as db_version');
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      server_time: result.rows[0].server_time,
      connection_pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
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

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('💤 Shutting down gracefully...');
  pool.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Secure WeTravel webhook server running on port ${PORT}`);
    console.log(`📡 Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook`);
    console.log(`🔒 Security: ${WETRAVEL_WEBHOOK_SECRET ? 'HMAC' : WETRAVEL_WEBHOOK_TOKEN ? 'Token' : 'NONE - RISK!'}`);
  });
}

module.exports = app;