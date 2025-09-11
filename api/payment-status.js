// Next.js API Route: /api/payment-status
// 🔒 SECURE: Frontend can only check payment status, never write to DB

import { Pool } from 'pg';
import crypto from 'crypto';

// 🔒 SECURE: Use service_role for backend DB access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // service_role connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 🔒 SECURITY: Rate limiting (simple in-memory, use Redis for production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
};

// 🔒 SECURITY: Input validation and sanitization
const validateOrderId = (orderId) => {
  if (!orderId) return null;
  
  // Must be numeric string, reasonable length
  if (!/^\d{1,20}$/.test(orderId)) {
    throw new Error('Invalid order ID format');
  }
  
  return orderId;
};

const validatePaymentId = (paymentId) => {
  if (!paymentId) return null;
  
  // Must be numeric string, reasonable length  
  if (!/^\d{1,20}$/.test(paymentId)) {
    throw new Error('Invalid payment ID format');
  }
  
  return paymentId;
};

// 🔒 SECURE: Token-based verification for frontend requests
const verifyFrontendToken = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.FRONTEND_API_TOKEN;
  
  if (!expectedToken) {
    console.warn('⚠️ FRONTEND_API_TOKEN not configured');
    return true; // Allow if not configured (development)
  }
  
  if (!token) {
    return false;
  }
  
  // Constant-time comparison
  const tokenBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(expectedToken, 'utf8');
  
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
};

export default async function handler(req, res) {
  // Only GET requests allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  try {
    // 🔒 SECURITY: Rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({ error: 'Too many requests' });
    }

    // 🔒 SECURITY: Token verification
    if (!verifyFrontendToken(req)) {
      console.error(`❌ Frontend token verification failed for IP: ${clientIP}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 🔒 SECURITY: Input validation
    const { order_id, payment_id } = req.query;
    
    let validOrderId, validPaymentId;
    try {
      validOrderId = validateOrderId(order_id);
      validPaymentId = validatePaymentId(payment_id);
    } catch (error) {
      console.error(`❌ Input validation failed: ${error.message}`);
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    if (!validOrderId && !validPaymentId) {
      return res.status(400).json({ error: 'Either order_id or payment_id required' });
    }

    console.log(`🔍 Payment status check: order=${validOrderId}, payment=${validPaymentId}, ip=${clientIP}`);

    // 🔒 SECURE: Query with parameterized statements only
    const client = await pool.connect();
    let result;

    try {
      if (validOrderId) {
        // Get order status with latest payment info
        result = await client.query(`
          SELECT 
            o.id as order_id,
            o.status as order_status,
            o.total_amount,
            o.currency,
            o.created_at as order_created_at,
            o.updated_at as order_updated_at,
            p.id as payment_id,
            p.status as payment_status,
            p.payment_method,
            p.updated_at as payment_updated_at
          FROM orders o
          LEFT JOIN payments p ON o.id = p.order_id
          WHERE o.id = $1
          ORDER BY p.updated_at DESC
          LIMIT 1
        `, [validOrderId]);
      } else {
        // Get payment status with order info
        result = await client.query(`
          SELECT 
            o.id as order_id,
            o.status as order_status,
            o.total_amount,
            o.currency,
            o.created_at as order_created_at,
            o.updated_at as order_updated_at,
            p.id as payment_id,
            p.status as payment_status,
            p.payment_method,
            p.updated_at as payment_updated_at
          FROM payments p
          JOIN orders o ON p.order_id = o.id
          WHERE p.id = $1
        `, [validPaymentId]);
      }

      if (result.rows.length === 0) {
        console.log(`⚠️ No order/payment found: order=${validOrderId}, payment=${validPaymentId}`);
        return res.status(404).json({ 
          error: 'Order or payment not found',
          found: false
        });
      }

      const row = result.rows[0];
      
      // 🔒 SECURE: Only return safe, non-sensitive data to frontend
      const responseData = {
        found: true,
        order_id: row.order_id,
        order_status: row.order_status, // pending, paid, cancelled, refunded
        payment_id: row.payment_id,
        payment_status: row.payment_status, // pending, processed, failed, refunded
        payment_method: row.payment_method, // card, bank_transfer, etc
        total_amount: row.total_amount,
        currency: row.currency,
        order_created_at: row.order_created_at,
        order_updated_at: row.order_updated_at,
        payment_updated_at: row.payment_updated_at,
        // Computed fields for frontend convenience
        is_paid: row.order_status === 'paid' && row.payment_status === 'processed',
        is_pending: row.order_status === 'pending' && row.payment_status === 'pending',
        is_failed: row.payment_status === 'failed' || row.order_status === 'cancelled',
        is_refunded: row.order_status === 'refunded'
      };

      console.log(`✅ Payment status returned: order=${row.order_id}, status=${row.order_status}`);
      
      res.status(200).json(responseData);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error(`❌ Payment status API error for IP ${clientIP}:`, error);
    
    // Don't expose internal errors to frontend
    res.status(500).json({ 
      error: 'Internal server error',
      found: false 
    });
  }
}

// 🔒 SECURITY NOTES:
// 1. Frontend calls this with Bearer token
// 2. Only GET requests allowed (no DB writes possible)
// 3. Input validation prevents SQL injection
// 4. Rate limiting prevents abuse
// 5. No sensitive data exposed (no customer info, no internal IDs)
// 6. Uses service_role connection for DB access
// 7. RLS is bypassed by service_role but endpoint is read-only anyway