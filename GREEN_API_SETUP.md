# 🚀 Configuración de Green API para WhatsApp

## 1. Crear cuenta en Green API

1. Ve a [green-api.com](https://green-api.com)
2. Registra una cuenta gratuita
3. Crea una nueva instancia de WhatsApp

## 2. Configurar la instancia

1. En el panel de Green API, ve a "Instancias"
2. Crea una nueva instancia
3. Escanea el código QR con tu WhatsApp
4. Copia el **Instance ID** y el **Token**

## 3. Variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Green API Configuration (WhatsApp)
GREEN_API_URL=https://api.green-api.com
GREEN_API_INSTANCE=tu_instance_id_aqui
GREEN_API_TOKEN=tu_token_aqui
```

## 4. Ejemplo de uso

### Enviar confirmación de reserva:
```javascript
// Automático cuando se hace una reserva
const result = await sendBookingConfirmation(
  '+5491123456789',
  {
    checkIn: '2025-01-15',
    checkOut: '2025-01-17',
    roomTypeId: 'casa-playa',
    guests: 2,
    bookingReference: 'SC-ABC123',
    total: 100,
    guestName: 'Juan Pérez'
  }
);
```

### Enviar recordatorio:
```javascript
const result = await sendBookingReminder(
  '+5491123456789',
  {
    checkIn: '2025-01-15',
    roomTypeId: 'casa-playa',
    bookingReference: 'SC-ABC123',
    guestName: 'Juan Pérez'
  }
);
```

### Enviar mensaje de bienvenida:
```javascript
const result = await sendWelcomeMessage(
  '+5491123456789',
  {
    roomTypeId: 'casa-playa',
    bookingReference: 'SC-ABC123',
    guestName: 'Juan Pérez'
  }
);
```

## 5. Verificar estado

Para verificar que Green API está funcionando:

```bash
# GET request a tu API
curl http://localhost:3000/api/whatsapp
```

## 6. Costos

Green API tiene precios competitivos:
- **Mensajes**: ~$0.002 por mensaje
- **Plan gratuito**: 1000 mensajes/mes
- **Sin costos de setup**

## 7. Plantillas de mensajes

### Confirmación de reserva:
```
🏄‍♂️ *CONFIRMACIÓN DE RESERVA*
*Surfcamp Santa Teresa*

✅ ¡Tu reserva ha sido confirmada!

📅 *Fechas:* 15 de enero - 17 de enero
🏠 *Alojamiento:* Casa de Playa
👥 *Huéspedes:* 2
📞 *Referencia:* SC-ABC123

💰 *Total:* $100

📍 *Ubicación:* Santa Teresa, Costa Rica
🏄‍♂️ ¡Te esperamos para una experiencia increíble!

_Cualquier consulta responde a este mensaje_
*Surfcamp Santa Teresa*
Powered by zeneidas
```

### Recordatorio:
```
🏄‍♂️ *RECORDATORIO DE RESERVA*
*Surfcamp Santa Teresa*

¡Hola Juan Pérez!

⏰ Tu check-in es mañana: 15 de enero
🏠 Casa de Playa
📞 Referencia: SC-ABC123

📋 *Qué traer:*
• Documentos de identidad
• Traje de baño
• Protector solar
• Ganas de surfear! 🏄‍♂️

📍 *Dirección:* Santa Teresa, Costa Rica
🕒 *Check-in:* 14:00 hrs

¡Nos vemos pronto!
*Surfcamp Santa Teresa*
```

### Mensaje de bienvenida:
```
🏄‍♂️ *¡BIENVENIDO A SURFCAMP SANTA TERESA!*

¡Hola Juan Pérez!

✅ Check-in completado
🏠 Casa de Playa
📞 Referencia: SC-ABC123

🌊 *Información importante:*
• WiFi: SurfcampST / Password: 123456
• Clases de surf: 8:00 AM y 2:00 PM
• Desayuno: 7:00 - 10:00 AM
• Check-out: 11:00 AM

📱 *Contacto de emergencia:* +506 XXXX-XXXX
🏄‍♂️ ¡Disfruta tu estadía!

*Surfcamp Santa Teresa*
Powered by zeneidas
```

## 8. Troubleshooting

### Error común: "Green API no está configurada"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que la instancia esté autorizada (código QR escaneado)

### Error: "Número de teléfono inválido"
- Los números se formatean automáticamente
- Acepta formatos: +5491123456789, 01123456789, 1123456789

### Error: "Instancia desconectada"
- Ve al panel de Green API y verifica el estado
- Puede que necesites escanear el código QR nuevamente

## 9. Endpoints disponibles

- `POST /api/whatsapp` - Enviar mensaje
- `GET /api/whatsapp` - Verificar estado de instancia

## 10. Integración automática

El sistema ya está integrado para enviar automáticamente:
- ✅ **Confirmación de reserva** cuando se completa una reserva
- ⏰ **Recordatorios** (implementar cron job)
- 👋 **Bienvenida** (implementar en check-in)

¡Listo! Tu sistema de WhatsApp está configurado y funcionando. 🚀 