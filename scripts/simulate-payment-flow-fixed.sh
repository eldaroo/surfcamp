#!/bin/bash
# Simulate Complete WeTravel Payment Flow - FIXED FORMAT
# Uses actual WeTravel webhook payload structure

WEBHOOK_URL="https://surfcampwidget.duckdns.org/api/wetravel-webhook"
SECRET="whsec_6R/1HdALC0sq7DY/I2oTnCkdGsafwiqQ"

# Generate unique IDs for this simulation
PAYMENT_ID="1745562483$(shuf -i 100000-999999 -n 1)"
ORDER_ID="1745562464$(shuf -i 100000-999999 -n 1)"
TRIP_ID="trip_$(date +%s)"

echo "🎭 SIMULANDO FLUJO COMPLETO DE PAGO - FORMATO WETRAVEL"
echo "======================================================"
echo "Payment ID: $PAYMENT_ID"
echo "Order ID: $ORDER_ID"
echo "Trip ID: $TRIP_ID"
echo ""

# Function to generate HMAC signature
generate_hmac() {
  local payload="$1"
  local timestamp=$(date +%s)
  local message="${timestamp}.${payload}"
  local signature=$(echo -n "${message}" | openssl dgst -sha256 -hmac "${SECRET}" | cut -d' ' -f2)
  echo "${timestamp}:sha256=${signature}"
}

# Step 1: Payment Created (Usuario inicia pago) - WeTravel Format
echo "📝 PASO 1: Usuario inicia pago (payment.created)"
echo "----------------------------------------------"

# WeTravel actual payload structure
PAYLOAD_CREATED="{
  \"event_type\": \"payment.created\",
  \"type\": \"payment.created\",
  \"trip_id\": \"$TRIP_ID\",
  \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
  \"data\": {
    \"id\": \"$PAYMENT_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"trip_id\": \"$TRIP_ID\",
    \"status\": \"pending\",
    \"total_amount\": 100,
    \"currency\": \"USD\",
    \"payment_method\": \"card\",
    \"customer\": {
      \"name\": \"Test Simulator\",
      \"email\": \"test@simulator.com\"
    },
    \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
    \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
  }
}"

# Compact JSON (remove newlines for HMAC)
PAYLOAD_CREATED=$(echo "$PAYLOAD_CREATED" | tr -d '\n' | tr -d ' ')

HMAC_DATA=$(generate_hmac "$PAYLOAD_CREATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

echo "Payload: $PAYLOAD_CREATED"
echo "Signature: $SIGNATURE"
echo ""

RESPONSE=$(curl -s -w "HTTP_%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_CREATED")

echo "Response: $RESPONSE"
echo ""

# Check if step 1 was successful
if [[ $RESPONSE == *"HTTP_200"* ]]; then
  echo "✅ Paso 1 exitoso!"
else
  echo "❌ Paso 1 falló. Continuando con formato alternativo..."
fi

echo ""

# Step 2: Simulate payment processing time
echo "⏳ PASO 2: WeTravel procesa el pago..."
echo "-------------------------------------"
for i in {3..1}; do
  echo "Procesando... $i"
  sleep 1
done
echo "✅ Procesamiento completado!"
echo ""

# Step 3: Payment Updated to Processed (Pago exitoso) - WeTravel Format
echo "💰 PASO 3: Pago completado exitosamente (payment.updated)"
echo "--------------------------------------------------------"

PAYLOAD_UPDATED="{
  \"event_type\": \"payment.updated\",
  \"type\": \"payment.updated\",
  \"trip_id\": \"$TRIP_ID\",
  \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
  \"data\": {
    \"id\": \"$PAYMENT_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"trip_id\": \"$TRIP_ID\",
    \"status\": \"processed\",
    \"total_amount\": 100,
    \"net_amount\": 97,
    \"payment_processing_fee\": 3,
    \"currency\": \"USD\",
    \"payment_method\": \"card\",
    \"customer\": {
      \"name\": \"Test Simulator\",
      \"email\": \"test@simulator.com\"
    },
    \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
    \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
  }
}"

# Compact JSON
PAYLOAD_UPDATED=$(echo "$PAYLOAD_UPDATED" | tr -d '\n' | tr -d ' ')

HMAC_DATA=$(generate_hmac "$PAYLOAD_UPDATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

echo "Payload: $PAYLOAD_UPDATED"
echo "Signature: $SIGNATURE"
echo ""

RESPONSE=$(curl -s -w "HTTP_%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_UPDATED")

echo "Response: $RESPONSE"
echo ""

# Step 4: Verify database state
echo "🔍 PASO 4: Verificando estado en base de datos"
echo "----------------------------------------------"
if [ ! -z "$DATABASE_URL" ]; then
  echo "📊 Estado de la orden:"
  psql $DATABASE_URL -c "SELECT id, status, total_amount, currency, customer_name FROM orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "⚠️ No se pudo consultar orders"
  
  echo ""
  echo "💳 Estado del pago:"
  psql $DATABASE_URL -c "SELECT id, order_id, status, total_amount, net_amount, payment_processing_fee FROM payments WHERE id = '$PAYMENT_ID';" 2>/dev/null || echo "⚠️ No se pudo consultar payments"
  
  echo ""
  echo "📋 Eventos procesados:"
  psql $DATABASE_URL -c "SELECT event_type, payment_id, order_id, processed_at FROM wetravel_events WHERE payment_id = '$PAYMENT_ID' ORDER BY processed_at;" 2>/dev/null || echo "⚠️ No se pudo consultar events"
else
  echo "⚠️ DATABASE_URL no configurada. No se puede verificar DB."
fi

echo ""
echo "🎉 SIMULACIÓN COMPLETADA!"
echo "========================"
echo "✅ Payment ID: $PAYMENT_ID"
echo "✅ Order ID: $ORDER_ID" 
echo "✅ Trip ID: $TRIP_ID"
echo ""

# Alternative format test if WeTravel format fails
echo "🔄 PRUEBA ALTERNATIVA: Formato simplificado"
echo "============================================"

# Simple format that should work
SIMPLE_PAYLOAD="{\"type\":\"payment.updated\",\"data\":{\"id\":\"simple_123\",\"order_id\":\"simple_456\",\"status\":\"processed\",\"total_amount\":100,\"net_amount\":97,\"payment_processing_fee\":3,\"currency\":\"USD\",\"payment_method\":\"card\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

HMAC_DATA=$(generate_hmac "$SIMPLE_PAYLOAD")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

echo "Probando formato simple..."
RESPONSE=$(curl -s -w "HTTP_%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$SIMPLE_PAYLOAD")

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"HTTP_200"* ]]; then
  echo "✅ Formato simple funciona!"
else
  echo "❌ Formato simple también falló"
fi

echo ""
echo "🔍 PARA DEBUG: Verificar estructura del webhook backend..."
echo "curl https://surfcampwidget.duckdns.org/api/wetravel-webhook/health"