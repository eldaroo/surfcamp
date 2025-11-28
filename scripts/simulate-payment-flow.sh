#!/bin/bash
# Simulate Complete WeTravel Payment Flow
# No real payment required!

WEBHOOK_URL="https://surfcampwidget.duckdns.org/api/wetravel-webhook"
SECRET="whsec_6R/1HdALC0sq7DY/I2oTnCkdGsafwiqQ"

# Generate unique IDs for this simulation
PAYMENT_ID="sim_$(date +%s)$(shuf -i 1000-9999 -n 1)"
ORDER_ID="ord_$(date +%s)$(shuf -i 1000-9999 -n 1)"

echo "🎭 SIMULANDO FLUJO COMPLETO DE PAGO"
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

# Step 1: Payment Created (Usuario inicia pago)
echo "📝 PASO 1: Usuario inicia pago (payment.created)"
echo "----------------------------------------------"
PAYLOAD_CREATED="{\"type\":\"payment.created\",\"data\":{\"id\":\"$PAYMENT_ID\",\"order_id\":\"$ORDER_ID\",\"status\":\"pending\",\"total_amount\":100,\"currency\":\"USD\",\"payment_method\":\"card\",\"customer_name\":\"Test Simulator\",\"customer_email\":\"test@simulator.com\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

HMAC_DATA=$(generate_hmac "$PAYLOAD_CREATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

RESPONSE=$(curl -s -w "HTTP_%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD_CREATED")

echo "Response: $RESPONSE"
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

# Step 3: Payment Updated to Processed (Pago exitoso)
echo "💰 PASO 3: Pago completado exitosamente (payment.updated)"
echo "--------------------------------------------------------"
PAYLOAD_UPDATED="{\"type\":\"payment.updated\",\"data\":{\"id\":\"$PAYMENT_ID\",\"order_id\":\"$ORDER_ID\",\"status\":\"processed\",\"total_amount\":100,\"net_amount\":97,\"payment_processing_fee\":3,\"currency\":\"USD\",\"payment_method\":\"card\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

HMAC_DATA=$(generate_hmac "$PAYLOAD_UPDATED")
TIMESTAMP=$(echo $HMAC_DATA | cut -d: -f1)
SIGNATURE=$(echo $HMAC_DATA | cut -d: -f2)

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
  psql $DATABASE_URL -c "SELECT id, status, total_amount, currency, customer_name FROM orders WHERE id = '$ORDER_ID';"
  
  echo ""
  echo "💳 Estado del pago:"
  psql $DATABASE_URL -c "SELECT id, order_id, status, total_amount, net_amount, payment_processing_fee FROM payments WHERE id = '$PAYMENT_ID';"
  
  echo ""
  echo "📋 Eventos procesados:"
  psql $DATABASE_URL -c "SELECT event_type, payment_id, order_id, processed_at FROM wetravel_events WHERE payment_id = '$PAYMENT_ID' ORDER BY processed_at;"
else
  echo "⚠️ DATABASE_URL no configurada. No se puede verificar DB."
fi

echo ""
echo "🎉 SIMULACIÓN COMPLETADA!"
echo "========================"
echo "✅ Orden creada: $ORDER_ID"
echo "✅ Pago procesado: $PAYMENT_ID" 
echo "✅ Estado final: PAGADO"
echo ""
echo "🔍 Para verificar manualmente:"
echo "SELECT * FROM orders WHERE id = '$ORDER_ID';"
echo "SELECT * FROM payments WHERE id = '$PAYMENT_ID';"
echo ""

# Step 5: Optional - Test frontend API
if [ ! -z "$FRONTEND_API_TOKEN" ]; then
  echo "🌐 BONUS: Probando frontend API"
  echo "-------------------------------"
  curl -s -H "Authorization: Bearer $FRONTEND_API_TOKEN" \
    "https://your-domain.com/api/payment-status?order_id=$ORDER_ID" | jq '.'
else
  echo "💡 TIP: Configura FRONTEND_API_TOKEN para probar la API del frontend"
fi