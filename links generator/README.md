# WeTravel Links Generator

Proyecto independiente para generar links de pago de WeTravel con una interfaz mínima.

## Qué hace

- Calcula el monto a cobrar con la misma lógica principal del proyecto grande:
  - diferencia de programa de surf
  - 10% del alojamiento
  - coaching 1:1
  - fallback a 10% del total si no hay programas detectados
- Genera el `payment_link` directo contra la API de WeTravel.
- No depende de Supabase, webhooks ni LobbyPMS.

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```bash
WETRAVEL_API_KEY=your_wetravel_api_key
```

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3010`.

## Campos de la interfaz

- Tipo de operación: reserva nueva o agregar cobro a una reserva existente
- Cliente: nombre, apellido, email
- Fechas, huéspedes, idioma
- Tipo de habitación o etiqueta del viaje
- Total completo
- Total de alojamiento
- Participantes con programa de surf y coaching

## Notas

- Para `existing reservation`, el sistema envía fechas futuras a WeTravel si las fechas originales ya no sirven para crear el link.
- El proyecto no guarda nada en base de datos.
- La API key queda siempre del lado servidor.
