# 🔒 WeTravel Webhook Security Setup

## Patrón Arquitectura Backend-Only

```
Frontend (anon/authenticated) → ❌ NO direct DB access (blocked by RLS)
                               ↓
Frontend API (/api/payment-status) → ✅ service_role → DB (read-only)
                               ↓  
WeTravel Webhook → Backend → ✅ service_role → DB (read/write)
```

## 🔐 Variables de Entorno Requeridas

```bash
# Database - Use service_role for backend
DATABASE_URL="postgresql://postgres.service_role:SERVICE_ROLE_KEY@host:5432/db"

# WeTravel Security (choose one method)
WETRAVEL_WEBHOOK_SECRET="your_hmac_secret_from_wetravel"  # ← Preferred
# OR
WETRAVEL_WEBHOOK_TOKEN="your_secure_random_token_256_chars"

# Frontend API Security
FRONTEND_API_TOKEN="secure_random_token_for_frontend_calls"

# Optional: Enhanced Security
WETRAVEL_ALLOWED_IPS="1.2.3.4,5.6.7.8"  # WeTravel IP allowlist
HEALTH_CHECK_AUTH="bearer_token_for_health_endpoint"

# Environment
NODE_ENV="production"
PORT="3000"
```

## 🛡️ Database Security Implementation

### 1. Apply RLS Schema
```bash
psql $DATABASE_URL -f database/secure_wetravel_schema.sql
```

### 2. Verify Security
```sql
-- Check that RLS is enabled (should return 't')
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'payments', 'wetravel_events', 'transactions');

-- Check no policies exist (should be empty)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('orders', 'payments', 'wetravel_events', 'transactions');
```

### 3. Test Security Lockdown
```bash
# This should FAIL (blocked by RLS)
PGUSER=anon_user psql $DATABASE_URL -c "SELECT * FROM orders;"

# This should WORK (service_role bypasses RLS)  
PGUSER=service_role psql $DATABASE_URL -c "SELECT * FROM orders;"
```

## 🔧 Frontend Integration

### Payment Status Check (Frontend)
```javascript
// ✅ SECURE: Frontend calls your API, never DB directly
const checkPaymentStatus = async (orderId) => {
  const response = await fetch(`/api/payment-status?order_id=${orderId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FRONTEND_API_TOKEN}`
    }
  });
  
  const data = await response.json();
  
  if (data.is_paid) {
    // Redirect to success page
    router.push('/booking/success');
  } else if (data.is_failed) {
    // Show error message
    setError('Payment failed');
  } else if (data.is_pending) {
    // Keep polling
    setTimeout(() => checkPaymentStatus(orderId), 5000);
  }
};
```

### Polling Pattern (Recommended)
```javascript
// Poll payment status after user completes WeTravel payment
const pollPaymentStatus = (orderId, maxAttempts = 24) => {
  let attempts = 0;
  
  const poll = async () => {
    attempts++;
    
    try {
      const status = await checkPaymentStatus(orderId);
      
      if (status.is_paid || status.is_failed) {
        return status; // Final state reached
      }
      
      if (attempts < maxAttempts) {
        // Exponential backoff: 2s, 4s, 6s, 8s, then 10s intervals
        const delay = Math.min(2000 + (attempts * 2000), 10000);
        setTimeout(poll, delay);
      } else {
        throw new Error('Payment status check timeout');
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    }
  };
  
  poll();
};
```

## 🧪 Security Testing

### 1. Test RLS Lockdown
```bash
# Should get 403 or similar (access denied)
curl -X POST "https://your-supabase.supabase.co/rest/v1/orders" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": 999, "status": "paid"}'
```

### 2. Test Webhook Security
```bash
# Should get 401 (invalid signature)
curl -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.updated","data":{"id":"123"}}'

# Should get 200 (valid token)
curl -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.updated","data":{"id":"123","order_id":"456","status":"processed"}}'
```

### 3. Test Frontend API
```bash
# Should get 401 (missing token)
curl "https://your-domain.com/api/payment-status?order_id=123"

# Should get 200 (valid token)
curl -H "Authorization: Bearer YOUR_FRONTEND_TOKEN" \
  "https://your-domain.com/api/payment-status?order_id=123"
```

## 🚨 Security Checklist

### Database Security
- [ ] RLS enabled on all sensitive tables
- [ ] No policies created (= no external access)
- [ ] service_role used for backend operations
- [ ] Input validation on all queries
- [ ] No sensitive data in public views

### Webhook Security  
- [ ] HMAC signature verification implemented
- [ ] Timestamp validation (prevent replays)
- [ ] Constant-time comparisons (prevent timing attacks)
- [ ] IP allowlist configured (optional)
- [ ] Rate limiting implemented
- [ ] Idempotency checks working

### API Security
- [ ] Bearer token authentication
- [ ] Input validation and sanitization
- [ ] Rate limiting per IP
- [ ] No sensitive data exposure
- [ ] Read-only operations only
- [ ] Parameterized queries (no SQL injection)

### Infrastructure Security
- [ ] HTTPS enforced
- [ ] Database connections encrypted
- [ ] Environment variables secured
- [ ] Logging configured (no sensitive data)
- [ ] Error handling (no internal details exposed)

## 📊 Monitoring Commands

### Check Recent Activity
```sql
-- Recent webhook events
SELECT event_type, payment_id, order_id, processed_at 
FROM wetravel_events 
ORDER BY processed_at DESC 
LIMIT 20;

-- Recent payment updates
SELECT id, order_id, status, updated_at 
FROM payments 
ORDER BY updated_at DESC 
LIMIT 20;

-- Orders by status
SELECT status, COUNT(*), SUM(total_amount) 
FROM orders 
GROUP BY status;
```

### Security Audit
```sql
-- Check for potential issues
SELECT 
  'No policies' as check_name,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM pg_policies 
WHERE tablename IN ('orders', 'payments', 'wetravel_events', 'transactions');

-- Check RLS is enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'payments', 'wetravel_events', 'transactions');
```

## 🔄 Production Deployment

### 1. Deploy Database Schema
```bash
psql $PRODUCTION_DATABASE_URL -f database/secure_wetravel_schema.sql
```

### 2. Deploy Backend Webhook
```bash
# Using PM2 or systemd
npm install express pg crypto
node server/secure-wetravel-webhook.js
```

### 3. Deploy Frontend API
```bash
# Next.js API route
cp api/payment-status.js pages/api/payment-status.js
# or app router
cp api/payment-status.js app/api/payment-status/route.js
```

### 4. Configure WeTravel
- URL: `https://surfcampwidget.duckdns.org/api/wetravel-webhook`
- Events: `payment.created`, `payment.updated`
- Secret: Your `WETRAVEL_WEBHOOK_SECRET`

### 5. Test End-to-End
```bash
chmod +x scripts/test-webhooks.sh
./scripts/test-webhooks.sh
```

¡Tu sistema está completamente securizado con el patrón backend-only! 🔐