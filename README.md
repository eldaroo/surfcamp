# 🏄‍♂️ Surf Camp - Sistema de Reservas

Sistema completo de cotización y reservas personalizadas para un surf camp con integración a LobbyPMS y Stripe.

## 🌊 Características

- **Selección de fechas y huéspedes** con validación en tiempo real
- **Actividades personalizables**: surf, yoga, baños de hielo
- **Cotización dinámica** con precios actualizados al instante
- **Verificación de disponibilidad** mediante LobbyPMS API
- **Proceso de pago seguro** con Stripe
- **Interfaz moderna y responsive** con animaciones fluidas
- **Validaciones completas** de datos y disponibilidad

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 14** con App Router
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **React Hook Form** para formularios
- **Zustand** para gestión de estado

### Backend
- **Next.js API Routes** para endpoints
- **LobbyPMS API** para gestión hotelera
- **Stripe** para procesamiento de pagos
- **Axios** para llamadas HTTP

## 📦 Instalación

1. **Clona el repositorio**:
```bash
git clone <url-del-repositorio>
cd surfcamp
```

2. **Instala las dependencias**:
```bash
npm install
```

3. **Configura las variables de entorno**:
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# LobbyPMS Configuration
LOBBYPMS_API_URL=https://api.lobbypms.com/api/v1
LOBBYPMS_API_KEY=JNjeoLeXxTHFQSwUPQCgwBnCZktRVv7pfQ48uz2tyoNu6K9dW6D2US1cN9Mu

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**⚠️ IMPORTANTE**: Asegúrate de que tu IP esté autorizada en el panel de administración de LobbyPMS.

4. **Ejecuta el servidor de desarrollo**:
```bash
npm run dev
```

5. **Abre tu navegador** en [http://localhost:3000](http://localhost:3000)

## 🏗️ Estructura del Proyecto

```
surfcamp/
├── app/
│   ├── api/                    # API Routes
│   │   ├── activities/         # Endpoint de actividades
│   │   ├── availability/       # Verificación de disponibilidad
│   │   ├── payment/           # Procesamiento de pagos
│   │   ├── quote/             # Cotizaciones
│   │   └── reserve/           # Creación de reservas
│   ├── globals.css            # Estilos globales
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Página principal
├── components/                 # Componentes React
│   ├── ActivitySelector.tsx   # Selector de actividades
│   ├── BookingConfirmation.tsx # Confirmación de reserva
│   ├── BookingSteps.tsx       # Indicador de pasos
│   ├── DateSelector.tsx       # Selector de fechas
│   ├── Header.tsx             # Encabezado
│   ├── PaymentSection.tsx     # Sección de pago
│   ├── PriceSummary.tsx       # Resumen de precios
│   └── SuccessPage.tsx        # Página de éxito
├── lib/                       # Utilidades y configuración
│   ├── activities.ts          # Configuración de actividades
│   ├── store.ts               # Store global (Zustand)
│   └── utils.ts               # Funciones utilitarias
├── types/
│   └── index.ts               # Definiciones de TypeScript
└── package.json
```

## 🔧 Configuración

### LobbyPMS API

La integración con LobbyPMS está configurada y lista para usar:

1. **API URL**: `https://api.lobbypms.com/api/v1`
2. **API Token**: Ya configurado en el código
3. **Endpoints disponibles**:
   - `GET /rooms` - Consultar habitaciones disponibles
   - `GET /bookings` - Consultar reservas
   - `POST /bookings` - Crear nuevas reservas
   - `GET /rates` - Consultar tarifas
   - `GET /products` - Consultar productos/servicios
   - `GET /clients` - Consultar información de huéspedes

**Requisitos de LobbyPMS**:
- El token API debe estar activo
- Tu IP debe estar autorizada en el panel de LobbyPMS
- Los endpoints deben estar disponibles en tu instancia

**Funcionalidades implementadas**:
- ✅ Verificación de disponibilidad de habitaciones
- ✅ Creación de reservas
- ✅ Manejo de errores (IP no autorizada, token inválido)
- ✅ Fallback a datos mock si la API no está disponible

### Stripe

Para configurar Stripe:

1. **Crea una cuenta** en [Stripe](https://stripe.com)
2. **Obtén las claves** del dashboard (modo test)
3. **Configura las variables** de entorno
4. **Personaliza los métodos** de pago según tus necesidades

## 🎨 Personalización

### Actividades

Edita `lib/activities.ts` para modificar las actividades disponibles:

```typescript
export const AVAILABLE_ACTIVITIES: Activity[] = [
  {
    id: 'nueva-actividad',
    name: 'Nueva Actividad',
    description: 'Descripción de la actividad',
    price: 50,
    duration: 120,
    maxParticipants: 10,
    category: 'surf', // 'surf' | 'yoga' | 'ice_bath' | 'other'
  },
  // ... más actividades
];
```

### Precios

Modifica los precios base en `app/api/quote/route.ts`:

```typescript
const accommodationPricePerNight = 120; // Precio base por persona/noche
const taxRate = 0.21; // 21% IVA
```

### Estilos

El sistema usa Tailwind CSS con colores personalizados:

- **Ocean**: Tonos azules para el tema de surf
- **Sand**: Tonos dorados para acentos
- **Componentes predefinidos**: `.btn-primary`, `.card`, `.input-field`

## 📱 Componentes Principales

### `<DateSelector />`
Permite seleccionar fechas de entrada/salida y número de huéspedes con validaciones.

### `<ActivitySelector />`
Muestra actividades organizadas por categorías con precios dinámicos.

### `<BookingConfirmation />`
Formulario de información de contacto con verificación final de disponibilidad.

### `<PaymentSection />`
Procesamiento de pagos con integración a Stripe (modo demo incluido).

### `<PriceSummary />`
Resumen de precios en tiempo real que se actualiza automáticamente.

## 🔌 API Endpoints

### `POST /api/quote`
Calcula cotización en tiempo real.

**Request:**
```json
{
  "checkIn": "2024-01-15T00:00:00.000Z",
  "checkOut": "2024-01-20T00:00:00.000Z", 
  "guests": 2,
  "activityIds": ["surf-beginner", "yoga-morning"]
}
```

### `POST /api/availability`
Verifica disponibilidad con LobbyPMS.

### `POST /api/reserve`
Crea reserva en LobbyPMS.

### `POST /api/payment/create-intent`
Crea payment intent en Stripe.

## 🧪 Modo Demo

El sistema incluye un modo demo que funciona sin configuración:

- **LobbyPMS**: Respuestas mock cuando no hay API configurada
- **Stripe**: Simulación de pagos sin procesar cargos reales
- **Datos de prueba**: Actividades y precios predefinidos

## 📋 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter de código
```

## 🌐 Despliegue

### Vercel (Recomendado)

1. **Conecta tu repositorio** a Vercel
2. **Configura las variables** de entorno en el dashboard
3. **Despliega automáticamente** con cada push

### Otros Proveedores

El proyecto es compatible con cualquier proveedor que soporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Seguridad

- **Variables de entorno** para credenciales sensibles
- **Validaciones** en frontend y backend
- **Encriptación SSL** para pagos
- **Sanitización** de inputs del usuario

## 🎯 Roadmap

- [ ] Integración completa con Stripe Elements
- [ ] Panel de administración
- [ ] Notificaciones por email
- [ ] Calendario de disponibilidad visual
- [ ] Multi-idioma
- [ ] App móvil con React Native

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- **Email**: soporte@surfcamp.com
- **Documentación**: Ver los comentarios en el código
- **Issues**: Crea un issue en el repositorio

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**¡Desarrollado con ❤️ para la comunidad de surf!** 🏄‍♀️🌊 