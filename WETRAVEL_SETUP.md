# Configuración de WeTravel

## Descripción
Este proyecto ahora utiliza WeTravel como sistema de pagos externo. WeTravel genera links de pago seguros que redirigen a los usuarios a su plataforma para completar las transacciones.

## Configuración

### 1. Variables de Entorno (Opcional)
La API key de WeTravel ya está configurada por defecto. Si quieres usar una API key diferente, crea un archivo `.env.local` en la raíz del proyecto con:

```bash
WETRAVEL_API_KEY=tu_api_key_de_wetravel_aqui
```

### 2. Obtener API Key de WeTravel
1. Regístrate en [WeTravel](https://wetravel.com)
2. Ve a tu dashboard de desarrollador
3. Genera una nueva API key
4. Copia la key y agrégala a tu archivo `.env.local`

### 3. Configuración de la API
La API de WeTravel está configurada en:
- **Endpoint de Autenticación**: `https://api.wetravel.com/v2/auth/tokens/access`
- **Endpoint de Payment Links**: `https://api.wetravel.com/v2/payment_links`
- **Método**: POST para ambos endpoints
- **Autenticación**: Flujo en dos pasos (API Key → Access Token → API Calls)

## Flujo de Autenticación

### 1. Obtención del Token de Acceso
Antes de hacer cualquier llamada a la API de WeTravel:
1. Se envía la API key al endpoint de autenticación
2. Se recibe un token de acceso temporal
3. Este token se usa para todas las llamadas posteriores

## Flujo de Pago

### 1. Generación del Link
Cuando un usuario selecciona "WeTravel" como método de pago:
1. Se recopilan todos los datos de la reserva
2. Se obtiene un token de acceso usando la API key de WeTravel
3. Se crea un payload con el formato requerido por WeTravel
4. Se envía la solicitud a la API de WeTravel usando el token de acceso
5. Se recibe la URL de pago generada

### 2. Redirección del Usuario
- El usuario es redirigido a la URL de pago de WeTravel
- Completa el pago en la plataforma de WeTravel
- WeTravel maneja la seguridad y el procesamiento del pago

### 3. Datos Enviados a WeTravel
```json
{
  "data": {
    "trip": {
      "title": "Surf & Yoga Retreat – Santa Teresa",
      "start_date": "2025-10-12",
      "end_date": "2025-10-19",
      "currency": "USD",
      "participant_fees": "all"
    },
    "pricing": {
      "price": 149900,
      "payment_plan": {
        "allow_auto_payment": false,
        "allow_partial_payment": false,
        "deposit": 0,
        "installments": [
          { "price": 149900, "days_before_departure": 7 }
        ]
      }
    },
    "metadata": {
      "trip_id": "st-2025-10",
      "customer_id": "cus_123"
    }
  }
}
```

**Nota importante:** `days_before_departure` se calcula dinámicamente para asegurar que la fecha de vencimiento del pago sea siempre futura respecto a la fecha actual.

## Archivos Modificados

### Componentes
- `components/PaymentSection.tsx` - Integración principal con WeTravel

### API Routes
- `app/api/wetravel-payment/route.ts` - Endpoint para generar links de pago

### Configuración
- `lib/config.ts` - Configuración de API keys
- `lib/i18n.tsx` - Traducciones para WeTravel

### Traducciones
- **Español**: "WeTravel" - "Pago seguro con tarjeta de crédito/débito"
- **Inglés**: "WeTravel" - "Secure payment with credit/debit card"

## Testing

### Modo Demo
El sistema incluye un modo demo que permite probar el flujo sin generar pagos reales:
- Selecciona "Pago Demo" como método de pago
- Simula el proceso de pago
- No genera links de WeTravel

### Modo WeTravel
- Selecciona "WeTravel" como método de pago
- Genera un link de pago real
- Redirige al usuario a WeTravel

## Notas Importantes

1. **API Key**: La API key de WeTravel ya está configurada por defecto
2. **Autenticación**: El sistema obtiene automáticamente un token de acceso antes de cada llamada
3. **Precios**: WeTravel espera los precios en centavos (multiplicados por 100)
4. **Redirección**: Los usuarios son redirigidos a WeTravel en una nueva pestaña
5. **Metadata**: Se incluyen todos los datos de la reserva para referencia
6. **Seguridad**: WeTravel maneja toda la seguridad del pago

## Solución de Problemas

### Error: "WeTravel API key not configured"
- La API key ya está configurada por defecto
- Si quieres usar una API key diferente, crea un archivo `.env.local` con `WETRAVEL_API_KEY=tu_nueva_key`
- Reinicia el servidor después de agregar la variable

### Error: "WeTravel API error"
- Verifica que tu API key sea válida
- Revisa los logs del servidor para más detalles
- Contacta a WeTravel si el problema persiste

### Link de pago no se genera
- Verifica que todos los campos requeridos estén presentes
- Revisa el formato de las fechas (YYYY-MM-DD)
- Verifica que el precio sea un número válido
