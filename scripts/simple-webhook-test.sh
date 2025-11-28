#!/bin/bash
# Simple WeTravel Webhook Test - Formato básico que debe funcionar

WEBHOOK_URL="https://surfcampwidget.duckdns.org/api/wetravel-webhook"
SECRET="whsec_6R/1HdALC0sq7DY/I2oTnCkdGsafwiqQ"

# Generate unique IDs
PAYMENT_ID="$(date +%s)123456789"
ORDER_ID="$(date +%s)987654321"

echo "🧪 TEST SIMPLE DE WEBHOOK WETRAVEL"
echo "=================================="
echo "Payment ID: $PAYMENT_ID"
echo "Order ID: $ORDER_ID"
echo ""

# Function to generate HMAC signature
generate_hmac() {
  local payload="$1"
  local timestamp=$(date +%s)
  local message="${timestamp}.${payload}"
  local signature=$(echo -n "${message}" | openssl dgst -sha256 -hmac "${SECRET}" | cut -d' ' -f2)
  echo "${timestamp}:sha256=${signature}"
}

# Test 1: Formato básico (como en tu código original)
echo "🔸 TEST 1: Formato básico { type, data }"
echo "----------------------------------------"

PAYLOAD="{\"type\":\"payment.created\",\"data\":{\"id\":\"$PAYMENT_ID\",\"order_id\":\"$ORDER_ID\",\"status\":\"pending\",\"total_amount\":100,\"currency\":\"USD\",\"payment_method\":\"card\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

HMAC_DATA=$(generate_hmac "$PAYLOAD")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

echo "📤 Enviando: $PAYLOAD"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD")

echo "📥 Respuesta: $RESPONSE"

if [[ $RESPONSE == *"HTTP_CODE:200"* ]]; then
  echo "✅ TEST 1 EXITOSO - payment.created"
else
  echo "❌ TEST 1 FALLÓ"
fi

echo ""
sleep 2

# Test 2: Payment updated (pago procesado)
echo "🔸 TEST 2: Payment updated (procesado)"
echo "------------------------------------"

PAYLOAD_2="{\"type\":\"payment.updated\",\"data\":{\"id\":\"$PAYMENT_ID\",\"order_id\":\"$ORDER_ID\",\"status\":\"processed\",\"total_amount\":100,\"net_amount\":97,\"payment_processing_fee\":3,\"currency\":\"USD\",\"payment_method\":\"card\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

HMAC_DATA=$(generate_hmac "$PAYLOAD_2")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

echo "📤 Enviando: $PAYLOAD_2"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_2")

echo "📥 Respuesta: $RESPONSE"

if [[ $RESPONSE == *"HTTP_CODE:200"* ]]; then
  echo "✅ TEST 2 EXITOSO - payment.updated"
else
  echo "❌ TEST 2 FALLÓ"
fi

echo ""

# Test 3: Verificar base de datos
echo "🔸 TEST 3: Verificar base de datos"
echo "---------------------------------"

if [ ! -z "$DATABASE_URL" ]; then
  echo "📊 Consultando orden $ORDER_ID:"
  psql $DATABASE_URL -c "SELECT id, status, total_amount, currency FROM orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "❌ Error consultando orders"
  
  echo ""
  echo "💳 Consultando pago $PAYMENT_ID:"
  psql $DATABASE_URL -c "SELECT id, order_id, status, total_amount, net_amount FROM payments WHERE id = '$PAYMENT_ID';" 2>/dev/null || echo "❌ Error consultando payments"
  
  echo ""
  echo "📋 Eventos procesados:"
  psql $DATABASE_URL -c "SELECT event_type, payment_id, processed_at FROM wetravel_events WHERE payment_id = '$PAYMENT_ID';" 2>/dev/null || echo "❌ Error consultando events"
else
  echo "⚠️ DATABASE_URL no configurado"
fi

echo ""

# Test 4: Health check
echo "🔸 TEST 4: Health check del webhook"
echo "----------------------------------"
HEALTH_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" "$WEBHOOK_URL/health")
echo "📥 Health response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"HTTP_CODE:200"* ]]; then
  echo "✅ Webhook servidor activo"
else
  echo "❌ Webhook servidor no responde"
fi

echo ""

# Test 5: Sin firma HMAC (debe fallar)
echo "🔸 TEST 5: Sin firma HMAC (debe fallar con 401)"
echo "-----------------------------------------------"
TEST_PAYLOAD="{\"type\":\"payment.created\",\"data\":{\"id\":\"test123\"}}"
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

echo "📥 Respuesta: $RESPONSE"

if [[ $RESPONSE == *"HTTP_CODE:401"* ]]; then
  echo "✅ Seguridad funciona - rechaza sin firma"
else
  echo "⚠️ Seguridad podría estar deshabilitada"
fi

echo ""
echo "🎉 TESTS COMPLETADOS"
echo "===================="
echo "IDs usados para verificación manual:"
echo "Payment ID: $PAYMENT_ID"  
echo "Order ID: $ORDER_ID"
echo ""
echo "Verificación manual SQL:"
echo "SELECT * FROM orders WHERE id = '$ORDER_ID';"
echo "SELECT * FROM payments WHERE id = '$PAYMENT_ID';"