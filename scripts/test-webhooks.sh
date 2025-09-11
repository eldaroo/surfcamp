#!/bin/bash
# WeTravel Webhook Test Script

WEBHOOK_URL="https://surfcampwidget.duckdns.org/api/wetravel-webhook"
WEBHOOK_TOKEN="your_secure_random_token"  # Replace with your actual token
WEBHOOK_SECRET="your_hmac_secret"         # Replace with your actual secret

echo "🧪 Testing WeTravel Webhooks"
echo "================================"

# Function to generate HMAC signature
generate_hmac() {
  local payload="$1"
  local timestamp=$(date +%s)
  local message="${timestamp}.${payload}"
  local signature=$(echo -n "${message}" | openssl dgst -sha256 -hmac "${WEBHOOK_SECRET}" | cut -d' ' -f2)
  echo "${timestamp}:sha256=${signature}"
}

# Test 1: Health Check
echo ""
echo "🔍 Test 1: Health Check"
echo "------------------------"
curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  "${WEBHOOK_URL}/health" | jq '.'

# Test 2: Payment Created (with HMAC)
echo ""
echo "💰 Test 2: Payment Created (HMAC)"
echo "-----------------------------------"
PAYLOAD_CREATED='{"type":"payment.created","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"pending","total_amount":100,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:34:56Z"}}'
HMAC_DATA=$(generate_hmac "$PAYLOAD_CREATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_CREATED" | jq '.'

# Test 3: Payment Updated to Processed (with HMAC)
echo ""
echo "✅ Test 3: Payment Updated to Processed (HMAC)"
echo "------------------------------------------------"
PAYLOAD_UPDATED='{"type":"payment.updated","data":{"id":"1745562483151601664","order_id":"1745562464788938752","status":"processed","total_amount":100,"net_amount":97,"payment_processing_fee":3,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:35:00Z"}}'
HMAC_DATA=$(generate_hmac "$PAYLOAD_UPDATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_UPDATED" | jq '.'

# Test 4: Payment Created (with Token - fallback)
echo ""
echo "🔑 Test 4: Payment Created (Token Auth)"
echo "---------------------------------------"
PAYLOAD_TOKEN='{"type":"payment.created","data":{"id":"1745562483151601999","order_id":"1745562464788938999","status":"pending","total_amount":200,"currency":"USD","payment_method":"card","updated_at":"2025-09-11T12:36:00Z"}}'

curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST "${WEBHOOK_URL}?token=${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_TOKEN" | jq '.'

# Test 5: Invalid Signature (should fail)
echo ""
echo "❌ Test 5: Invalid Signature (Expected Failure)"
echo "------------------------------------------------"
curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=invalid_signature" \
  -H "X-Timestamp: $(date +%s)" \
  -d "$PAYLOAD_CREATED" | jq '.'

# Test 6: Invalid JSON (should fail)
echo ""
echo "📄 Test 6: Invalid JSON (Expected Failure)"
echo "-------------------------------------------"
curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST "${WEBHOOK_URL}?token=${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "invalid json payload"

# Test 7: Duplicate Event (should be idempotent)
echo ""
echo "🔄 Test 7: Duplicate Event (Idempotency Test)"
echo "----------------------------------------------"
echo "Sending the same event twice..."
for i in {1..2}; do
  echo "Attempt $i:"
  curl -s -w "HTTP Status: %{http_code}\n" \
    -X POST "${WEBHOOK_URL}?token=${WEBHOOK_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD_UPDATED" | jq '.'
  sleep 1
done

echo ""
echo "🎉 Webhook testing completed!"
echo ""
echo "Next steps:"
echo "1. Check your database for created orders and payments"
echo "2. Verify webhook events were recorded in wetravel_events table"
echo "3. Monitor application logs for any errors"
echo ""
echo "Database verification queries:"
echo "SELECT * FROM wetravel_events ORDER BY processed_at DESC LIMIT 5;"
echo "SELECT * FROM payments ORDER BY updated_at DESC LIMIT 5;"
echo "SELECT * FROM orders ORDER BY updated_at DESC LIMIT 5;"