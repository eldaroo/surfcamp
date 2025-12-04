# Testing Mode - Pagos de $0

## Cómo habilitar pagos de $0 para testing

Para habilitar pagos de $0 en WeTravel (solo para testing), necesitas agregar esta variable de entorno:

### En desarrollo local (.env.local):

```bash
ENABLE_ZERO_PAYMENT_TESTING=true
```

### En producción (servidor):

1. Conectarse al servidor:
   ```bash
   ssh root@surfcampwidget.duckdns.org
   ```

2. Editar el archivo `.env.local`:
   ```bash
   nano /root/surfcamp/.env.local
   ```

3. Agregar la línea:
   ```bash
   ENABLE_ZERO_PAYMENT_TESTING=true
   ```

4. Guardar (Ctrl+O, Enter, Ctrl+X)

5. Reiniciar la aplicación:
   ```bash
   pm2 restart surfcamp
   ```

6. Verificar que se aplicó:
   ```bash
   pm2 logs surfcamp --lines 50
   ```

## Cómo funciona

Cuando `ENABLE_ZERO_PAYMENT_TESTING=true`:

1. **Sin `wetravelData` en el payload**: El sistema usará precio $0 por defecto
2. **Con `wetravelData.pricing.price = 0`**: El sistema respetará ese valor y usará $0
3. **Con `wetravelData.pricing.price > 0`**: El sistema usará el precio especificado

### Ejemplo de payload con $0:

```json
{
  "checkIn": "2025-12-10",
  "checkOut": "2025-12-15",
  "guests": 2,
  "roomTypeId": "casa-playa",
  "contactInfo": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+506 1234 5678"
  },
  "wetravelData": {
    "pricing": {
      "price": 0
    }
  }
}
```

## Logs para verificar

Cuando hagas una reserva, verás en los logs:

```
🧪 Zero payment testing enabled: true
💰 Price from payload: 0
🧪 [TESTING MODE] Using $0 payment for testing
💰 WeTravel Deposit: $0 (0 cents)
```

## ⚠️ IMPORTANTE

- Esta opción es SOLO para testing
- NO la dejes habilitada en producción con usuarios reales
- Cuando termines de testear, cambia el valor a `false` o elimina la variable
- WeTravel aún creará el trip/booking, pero con precio $0

## Desactivar modo testing

Para desactivar:

1. Cambiar a:
   ```bash
   ENABLE_ZERO_PAYMENT_TESTING=false
   ```

2. O eliminar la línea completamente del `.env.local`

3. Reiniciar la app:
   ```bash
   pm2 restart surfcamp
   ```
