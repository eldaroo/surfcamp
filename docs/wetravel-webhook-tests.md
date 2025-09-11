# WeTravel Webhook Testing Guide

## Environment Variables

Set these in your production environment:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/surfcamp

# WeTravel webhook security (choose one method)
WETRAVEL_WEBHOOK_SECRET=your_hmac_secret_from_wetravel  # Preferred
# OR
WETRAVEL_WEBHOOK_TOKEN=your_secure_random_token         # Fallback

# Server
NODE_ENV=production
PORT=3000
```

## Test Commands

### 1. Payment Updated - With HMAC Signature (Recommended)

**PowerShell:**
```powershell
# Generate HMAC signature (replace with your secret)
$secret = "your_hmac_secret"
$timestamp = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$payload = '{"type":"payment.updated","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"processed","total_amount":100,"net_amount":97,"payment_processing_fee":3,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
$message = "$timestamp.$payload"
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
$signature = [System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($message))).Replace("-", "").ToLower()

curl.exe -X POST https://surfcampwidget.duckdns.org/api/wetravel-webhook `
  -H "Content-Type: application/json" `
  -H "X-Signature: sha256=$signature" `
  -H "X-Timestamp: $timestamp" `
  -d $payload
```

**Bash:**
```bash
#!/bin/bash
# Generate HMAC signature
SECRET="your_hmac_secret"
TIMESTAMP=$(date +%s)
PAYLOAD='{"type":"payment.updated","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"processed","total_amount":100,"net_amount":97,"payment_processing_fee":3,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
MESSAGE="${TIMESTAMP}.${PAYLOAD}"
SIGNATURE=$(echo -n "${MESSAGE}" | openssl dgst -sha256 -hmac "${SECRET}" | cut -d' ' -f2)

curl -X POST https://surfcampwidget.duckdns.org/api/wetravel-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${PAYLOAD}"
```

### 2. Payment Updated - With Token (Fallback)

**PowerShell:**
```powershell
curl.exe -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook?token=your_secure_random_token" `
  -H "Content-Type: application/json" `
  -d '{"type":"payment.updated","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"processed","total_amount":100,"net_amount":97,"payment_processing_fee":3,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
```

**Bash:**
```bash
curl -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook?token=your_secure_random_token" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.updated","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"processed","total_amount":100,"net_amount":97,"payment_processing_fee":3,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
```

### 3. Payment Created Event

**PowerShell:**
```powershell
curl.exe -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook?token=your_secure_random_token" `
  -H "Content-Type: application/json" `
  -d '{"type":"payment.created","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"pending","total_amount":100,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
```

**Bash:**
```bash
curl -X POST "https://surfcampwidget.duckdns.org/api/wetravel-webhook?token=your_secure_random_token" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.created","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"pending","total_amount":100,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
```

### 4. Health Check

**PowerShell:**
```powershell
curl.exe https://surfcampwidget.duckdns.org/api/wetravel-webhook/health
```

**Bash:**
```bash
curl https://surfcampwidget.duckdns.org/api/wetravel-webhook/health
```

## Expected Responses

### Successful Webhook Processing
```json
{
  "status": "received",
  "event_type": "payment.updated",
  "payment_id": "1745562483151601664",
  "processing_time_ms": 45
}
```

### Health Check
```json
{
  "status": "ok",
  "timestamp": "2025-09-11T12:34:56.789Z",
  "database": "connected"
}
```

### Error Responses
```json
// Invalid signature
{
  "error": "Invalid signature"
}

// Invalid token
{
  "error": "Invalid token"
}

// Invalid payload
{
  "error": "Invalid JSON payload"
}
```

## Database Verification

Check if events are being processed correctly:

```sql
-- Check recent webhook events
SELECT * FROM wetravel_events ORDER BY processed_at DESC LIMIT 10;

-- Check payment status updates
SELECT id, order_id, status, total_amount, net_amount, payment_processing_fee, updated_at 
FROM payments ORDER BY updated_at DESC LIMIT 10;

-- Check order status updates
SELECT id, status, total_amount, currency, updated_at 
FROM orders ORDER BY updated_at DESC LIMIT 10;

-- Check for duplicate events (should be empty)
SELECT event_key, COUNT(*) 
FROM wetravel_events 
GROUP BY event_key 
HAVING COUNT(*) > 1;
```

## Webhook Registration in WeTravel

1. Log into your WeTravel admin panel
2. Go to Settings → Webhooks
3. Add new webhook:
   - **URL**: `https://surfcampwidget.duckdns.org/api/wetravel-webhook`
   - **Events**: Select `payment.created`, `payment.updated`
   - **Secret**: Set your HMAC secret (recommended)
   - **Format**: JSON

4. Test the webhook with WeTravel's built-in test feature
5. Monitor your logs for incoming events

## Monitoring and Troubleshooting

### Log Monitoring
```bash
# Node.js application logs
tail -f /var/log/surfcamp/webhook.log

# Check for webhook processing
grep "Processing webhook event" /var/log/surfcamp/webhook.log

# Check for errors
grep "ERROR" /var/log/surfcamp/webhook.log
```

### Common Issues
1. **HMAC verification fails**: Check that your secret matches WeTravel's configuration
2. **Database connection errors**: Verify DATABASE_URL and PostgreSQL connectivity
3. **Duplicate events**: Normal behavior - idempotency prevents reprocessing
4. **Processing timeouts**: Webhook responds quickly, processing happens in background

### Performance Monitoring
```sql
-- Check webhook response times
SELECT 
  event_type,
  AVG(EXTRACT(EPOCH FROM processed_at - created_at)) as avg_processing_time_seconds,
  COUNT(*) as event_count
FROM wetravel_events 
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

## Test Scenarios

1. **Happy Path**: Payment created → Payment processed → Order marked as paid
2. **Duplicate Events**: Send same event twice → Only processed once
3. **Out of Order**: Send payment.updated before payment.created → Handles gracefully
4. **Failed Payments**: Payment failed → Order marked as cancelled
5. **Refunds**: Payment refunded → Order marked as refunded
6. **Invalid Signatures**: Wrong HMAC → Rejected with 401
7. **Malformed JSON**: Invalid payload → Rejected with 400

## Production Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] HMAC secret configured (preferred) or token-based auth
- [ ] Webhook endpoint deployed and accessible
- [ ] Health check endpoint responding
- [ ] Webhook registered in WeTravel admin
- [ ] Test events processed successfully
- [ ] Log monitoring configured
- [ ] Error alerting configured
- [ ] Database backup strategy in place