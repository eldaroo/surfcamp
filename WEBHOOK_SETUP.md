#  WeTravel Webhook Setup

## 📍 **Endpoint del Webhook**

```
POST /api/wetravel-webhook
GET /api/wetravel-webhook (para verificar estado)
```

## 🔧 **Configuración en WeTravel**

### 1. **URL del Webhook**
Configura esta URL en tu panel de WeTravel:
```
https://tu-dominio.com/api/wetravel-webhook
```

### 2. **Eventos Soportados**
El webhook maneja los siguientes eventos del formato real de WeTravel:
- `partial_refund_made` - Reembolso parcial realizado
- `booking.updated` - Reserva actualizada
- `payment.completed` - Pago completado exitosamente
- `payment.failed` - Pago fallido
- `trip.confirmed` - Viaje confirmado

### 3. **Configuración de Seguridad**
- **Autenticación:** Implementar verificación de firma si WeTravel lo soporta
- **HTTPS:** Asegúrate de que tu dominio use HTTPS
- **Rate Limiting:** Considerar implementar límites de tasa

## 📊 **Estructura del Webhook**

### **Payload Recibido (Formato Real de WeTravel)**
```json
{
  "data": {
    "booking_note": "Something notable",
    "buyer": {
      "cancelled": false,
      "email": "john.doe@example.com",
      "first_name": "John",
      "full_name": "John Doe",
      "id": 3797,
      "last_name": "Doe"
    },
    "created_at": "2022-07-31T10:32:48.000+00:00",
    "departure_date": "2023-10-27",
    "event_type": "partial_refund_made",
    "order_id": "1741954582453420000",
    "participants": [...],
    "total_deposit_amount": 20000,
    "total_due_amount": 80000,
    "total_paid_amount": 20000,
    "total_price_amount": 100000,
    "trip_currency": "USD",
    "trip_end_date": "2023-10-30",
    "trip_id": "sth_123",
    "trip_length": 12,
    "trip_title": "SF Epic Trip!",
    "trip_uuid": "56710545"
  },
  "type": "booking.updated"
}
```

### **Respuesta del Webhook**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## 🚀 **Implementación Actual**

### **Funciones Implementadas**
1. **`handlePaymentCompleted()`** - Maneja pagos exitosos
2. **`handlePaymentFailed()`** - Maneja pagos fallidos
3. **`handlePaymentRefunded()`** - Maneja reembolsos
4. **`handleTripConfirmed()`** - Maneja confirmaciones de viaje

### **Logs del Sistema**
El webhook registra todos los eventos:
```
🔔 WeTravel webhook received: { timestamp: "...", body: {...} }
💰 Payment completed webhook received: { trip_id: "...", amount: 45 }
✅ Payment completed webhook processed successfully
```

## 📝 **Próximos Pasos de Implementación**

### **1. Base de Datos**
```typescript
// Crear tabla de reservas con estado
interface Booking {
  id: string;
  trip_id: string;
  customer_id: string;
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled';
  amount: number;
  payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### **2. Notificaciones por Email**
```typescript
// Enviar confirmación cuando el pago se complete
await sendPaymentConfirmationEmail({
  customerEmail: customer.email,
  tripDetails: tripInfo,
  amount: webhookData.amount
});
```

### **3. Notificaciones por WhatsApp**
```typescript
// Enviar confirmación por WhatsApp
await sendPaymentConfirmationWhatsApp({
  phone: customer.phone,
  tripDetails: tripInfo,
  amount: webhookData.amount
});
```

### **4. Actualización de Estado**
```typescript
// Actualizar estado de la reserva
await updateBookingStatus({
  trip_id: webhookData.trip_id,
  status: 'paid',
  payment_date: new Date(),
  payment_amount: webhookData.amount
});
```

## 🧪 **Testing del Webhook**

### **1. Verificar Estado**
```bash
GET https://tu-dominio.com/api/wetravel-webhook
```

### **2. Simular Evento de Pago**
```bash
curl -X POST https://surfcampwidget.duckdns.org/api/wetravel-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "event_type": "partial_refund_made",
      "trip_id": "test_123",
      "trip_uuid": "test_uuid_123",
      "order_id": "test_order_123",
      "buyer": {
        "email": "test@example.com",
        "first_name": "Test",
        "full_name": "Test User",
        "id": 123,
        "last_name": "User",
        "cancelled": false
      },
      "total_paid_amount": 4500,
      "total_due_amount": 0,
      "trip_currency": "USD"
    },
    "type": "booking.updated"
  }'
```

### **3. Script de Prueba Automatizado**
También puedes usar el script `test-webhook.js` incluido:
```bash
node test-webhook.js
```

## 🔒 **Seguridad y Validación**

### **1. Validación de Payload**
- Verificar campos requeridos (`event_type`, `trip_id`)
- Validar tipos de datos
- Sanitizar entrada

### **2. Manejo de Errores**
- Logs detallados para debugging
- Respuestas HTTP apropiadas
- No exponer información sensible

### **3. Rate Limiting**
```typescript
// Implementar límites de tasa
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
};
```

## 📱 **Integración con el Frontend**

### **1. Estado de Pago en Tiempo Real**
```typescript
// En PaymentSection.tsx
useEffect(() => {
  // Polling para verificar estado del pago
  const checkPaymentStatus = async () => {
    const response = await fetch(`/api/booking/status/${tripId}`);
    const status = await response.json();
    
    if (status.payment_status === 'completed') {
      setCurrentStep('success');
    }
  };
  
  const interval = setInterval(checkPaymentStatus, 5000);
  return () => clearInterval(interval);
}, [tripId]);
```

### **2. Página de Éxito**
```typescript
// Mostrar confirmación cuando el webhook actualice el estado
if (paymentStatus === 'completed') {
  return <PaymentSuccessPage />;
}
```

## 🚨 **Monitoreo y Alertas**

### **1. Logs del Sistema**
- Todos los webhooks se registran con timestamp
- Errores se registran con stack trace completo
- Eventos exitosos se confirman

### **2. Métricas Recomendadas**
- Tasa de éxito de webhooks
- Tiempo de respuesta
- Errores por tipo de evento
- Volumen de transacciones

### **3. Alertas**
```typescript
// Enviar alerta si el webhook falla
if (webhookFailed) {
  await sendAlert({
    type: 'webhook_failure',
    message: 'WeTravel webhook failed',
    data: errorDetails
  });
}
```

## 🔄 **Flujo Completo del Pago**

1. **Usuario genera link de pago** → `POST /api/wetravel-payment`
2. **Usuario completa pago en WeTravel**
3. **WeTravel envía webhook** → `POST /api/wetravel-webhook`
4. **Sistema actualiza estado** → Base de datos + notificaciones
5. **Usuario ve confirmación** → Frontend actualizado

---

## 📞 **Soporte**

Para problemas con el webhook:
1. Revisar logs del servidor
2. Verificar configuración en WeTravel
3. Probar endpoint con `GET /api/wetravel-webhook`
4. Simular eventos para debugging
