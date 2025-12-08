import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import { Coffee, Wifi, Snowflake, MapPin, Users, Home, Check, Sparkles } from 'lucide-react';
import RoomGalleryGrid from '@/components/accommodation/RoomGalleryGrid';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

// REAL accommodation data from AccommodationsShowcase.tsx
const accommodations = [
  {
    id: 'casa-playa',
    images: [
      '/assets/accomodations/shared/dorm-zeneidas-surf-g.jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (1).jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (2).jpg',
    ],
    capacity: 8,
    icon: Users,
  },
  {
    id: 'casitas-privadas',
    images: [
      '/assets/accomodations/privadas/private-zeneidas-sur.jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (1).jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (2).jpg',
    ],
    capacity: 2,
    icon: Home,
  },
  {
    id: 'casas-deluxe',
    images: [
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf.jpg',
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (1).jpg',
      '/assets/accomodations/Studio Deluxe/IMG_8534.jpg',
    ],
    capacity: 2,
    icon: Sparkles,
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';

  return {
    title: isSpanish
      ? 'Alojamiento en Santa Teresa | Zeneidas Surf Garden'
      : 'Accommodation in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Alojamiento frente al mar en Santa Teresa, Costa Rica. Habitaciones privadas y compartidas a pasos de las mejores olas. Incluye yoga, desayuno y acceso a todas las instalaciones.'
      : 'Beachfront accommodation in Santa Teresa, Costa Rica. Private and shared rooms steps from the best waves. Includes yoga, breakfast, and access to all facilities.',
    keywords: isSpanish
      ? 'alojamiento santa teresa, hospedaje costa rica, hostel playa, surf camp alojamiento, habitaciones privadas santa teresa'
      : 'accommodation santa teresa, costa rica lodging, beachfront hostel, surf camp accommodation, private rooms santa teresa',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/accommodation-santa-teresa`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/accommodation-santa-teresa',
        es: 'https://santateresasurfcamp.com/es/accommodation-santa-teresa',
      },
    },
    openGraph: {
      title: isSpanish
        ? 'Alojamiento en Santa Teresa | Zeneidas Surf Garden'
        : 'Accommodation in Santa Teresa | Zeneidas Surf Garden',
      description: isSpanish
        ? 'Alojamiento frente al mar en Santa Teresa, Costa Rica. Habitaciones privadas y compartidas a pasos de las mejores olas. Incluye yoga, desayuno y acceso a todas las instalaciones.'
        : 'Beachfront accommodation in Santa Teresa, Costa Rica. Private and shared rooms steps from the best waves. Includes yoga, breakfast, and access to all facilities.',
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: ['/assets/Host.jpg'],
      type: 'website',
    },
  };
}

export default function AccommodationPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';
  const content = {
    en: {
      hero: {
        title: 'Beachfront Accommodation',
        subtitle: 'Wake up to ocean sounds and world-class surf at your doorstep',
      },
      intro: {
        title: 'Your Surf & Yoga Home in Paradise',
        description: 'Our beachfront accommodation in Santa Teresa provides the perfect base for your Costa Rica adventure. Located steps from the beach with multiple surf breaks nearby, Zeneidas Surf Garden combines comfortable lodging with a vibrant community atmosphere. Whether you choose a private room or shared dorm, you\'ll enjoy daily yoga sessions, healthy breakfast, and access to our shared spaces.',
        description2: 'This isn\'t just a place to sleep—it\'s a complete surf and yoga experience. Every stay includes activities and amenities designed to enhance your time in Santa Teresa. From sunrise yoga on our oceanfront deck to sunset sessions in the waves, you\'re immersed in the pura vida lifestyle from day one.',
      },
      roomTypes: {
        title: 'Choose Your Perfect Space',
        subtitle: 'From social vibes to private luxury—all include daily yoga and full amenities',
        'casa-playa': {
          name: 'Beach House (Shared Room)',
          description: 'Shared beachfront house with ocean view and social vibe. Includes shared kitchen, large dining area, and hammock yard. Up to 8 guests (rooms with fan & AC).',
          features: ['Shared', 'Affordable', 'Social'],
        },
        'casitas-privadas': {
          name: 'Private Cottages',
          description: 'Independent cottages with total privacy, ideal for couples or travelers seeking tranquility. Surrounded by tropical garden with kitchen, Wi-Fi, and A/C.',
          features: ['Private', 'Quiet', 'Independent'],
        },
        'casas-deluxe': {
          name: 'Private House',
          description: 'Private house steps from the beach with kitchen, hot water bathroom, Wi-Fi, and A/C. Perfect for couples seeking comfort and privacy.',
          features: ['Private', 'Kitchen included', 'A/C + Wi-Fi'],
        },
      },
      included: {
        title: 'What\'s Included With Your Stay',
        subtitle: 'More than just accommodation—it\'s a complete experience',
        items: [
          {
            title: 'Daily Yoga Sessions',
            description: 'Daily yoga classes for guests. All levels welcome.',
            icon: 'yoga',
          },
          {
            title: 'Healthy Breakfast',
            description: 'Fresh tropical fruits, local coffee, and healthy breakfast options to fuel your morning surf session.',
            icon: 'coffee',
          },
          {
            title: 'Ice Bath Therapy',
            description: '',
            icon: 'ice',
          },
          {
            title: 'High-Speed WiFi',
            description: 'Fast, reliable internet throughout the property for remote work or staying connected.',
            icon: 'wifi',
          },
          {
            title: 'Communal Spaces',
            description: 'Shared kitchen, lounges, hammocks, and social areas to connect with fellow travelers.',
            icon: 'home',
          },
          {
            title: 'Surf Storage & Rinse',
            description: 'Secure storage for surf equipment and outdoor shower/rinse stations.',
            icon: 'storage',
          },
        ],
      },
      amenities: {
        title: 'Facilities & Amenities',
        categories: [
          {
            category: 'Wellness',
            items: ['Oceanfront yoga shala', 'Ice bath therapy pools', 'Breathwork sessions', 'Meditation spaces', 'Massage (by appointment)'],
          },
          {
            category: 'Common Areas',
            items: ['Shared kitchen (fully equipped)', 'Outdoor lounges & hammocks', 'Dining area', 'BBQ grill', 'Community bonfire pit'],
          },
          {
            category: 'Practical',
            items: ['High-speed WiFi', 'Laundry service', 'Surf equipment storage', 'Outdoor showers', '24/7 security'],
          },
          {
            category: 'Location',
            items: ['50m from beach access', '5-min walk to surf breaks', 'Restaurants nearby', 'Jungle surroundings', 'Sunset views'],
          },
        ],
      },
      location: {
        title: 'Prime Location in Santa Teresa',
        intro: 'Zeneidas Surf Garden is perfectly positioned to give you easy access to everything Santa Teresa offers while maintaining a peaceful, nature-immersed atmosphere.',
        highlights: [
          {
            title: 'Steps from the Beach',
            description: 'Just 50 meters from beach access. Walk to the ocean in under a minute. Multiple world-class surf breaks within 5-10 minutes on foot.',
          },
          {
            title: 'Surrounded by Nature',
            description: 'While close to the action, our property is nestled in jungle vegetation providing shade, privacy, and incredible bird watching. Wake to howler monkeys and tropical birds.',
          },
          {
            title: 'Walking Distance to Everything',
            description: 'Restaurants, cafes, yoga studios, and surf shops all within easy walking distance. No need for a car—though we can help arrange rentals if you want to explore further.',
          },
          {
            title: 'Peaceful Yet Connected',
            description: 'Far enough from the main strip to ensure peaceful nights, close enough to enjoy Santa Teresa\'s vibrant restaurant and nightlife scene when you want it.',
          },
        ],
      },
      community: {
        title: 'More Than Accommodation—It\'s Community',
        intro: 'What truly sets Zeneidas apart is our community. You\'re not just booking a room; you\'re joining a tribe of surfers, yogis, adventurers, and wellness enthusiasts from around the world.',
        aspects: [
          {
            title: 'Social Atmosphere',
            description: 'Daily yoga brings guests together. Shared meals, sunset sessions, and communal spaces create natural opportunities to connect. Many guests arrive solo and leave with lifelong friends.',
          },
          {
            title: 'International Vibe',
            description: 'Guests from 30+ countries create a rich cultural exchange. Practice Spanish with locals, share travel tips with Europeans, learn from experienced surfers—every day brings new connections.',
          },
          {
            title: 'Long-Term Community',
            description: 'Many guests extend their stays from days to weeks to months. Digital nomads work remotely while living the pura vida lifestyle. It\'s common to see "family reunions" as past guests return.',
          },
        ],
      },
      whyStayHere: {
        title: 'Why Choose Zeneidas Surf Garden?',
        reasons: [
          'Beachfront location—50m from ocean access',
          'Includes daily yoga and breakfast',
          'Small, intimate property (not a mega-hostel)',
          'Vibrant international community',
          'Professional surf instruction available',
          'Perfect for solo travelers—easy to make friends',
          'Couples and groups welcome',
          'Wellness-focused atmosphere',
          'Competitive pricing for what\'s included',
          'Flexible booking (1 night to months)',
        ],
      },
      cta: {
        main: 'Check Availability & Book',
        secondary: 'See Surf + Accommodation Packages',
        final: 'Ready to Book Your Santa Teresa Stay?',
        finalText: 'Secure your spot at Zeneidas Surf Garden and experience beachfront living, daily yoga, world-class surf, and an incredible community in Santa Teresa, Costa Rica.',
      },
    },
    es: {
      hero: {
        title: 'Alojamiento Frente al Mar',
        subtitle: 'Despierta con sonidos del océano y surf de clase mundial en tu puerta',
      },
      intro: {
        title: 'Tu Hogar de Surf y Yoga en el Paraíso',
        description: 'Nuestro alojamiento frente al mar en Santa Teresa proporciona la base perfecta para tu aventura en Costa Rica. Ubicado a pasos de la playa con múltiples rompientes de surf cerca, Zeneidas Surf Garden combina alojamiento cómodo con una atmósfera comunitaria vibrante. Ya sea que elijas una habitación privada o dormitorio compartido, disfrutarás de sesiones diarias de yoga, desayuno saludable, terapia de baños de hielo y acceso a todas nuestras instalaciones de bienestar.',
        description2: 'Esto no es solo un lugar para dormir—es una experiencia completa de surf y yoga. Cada estadía incluye actividades y comodidades diseñadas para mejorar tu tiempo en Santa Teresa. Desde yoga al amanecer en nuestra terraza frente al océano hasta sesiones de atardecer en las olas, estás inmerso en el estilo de vida pura vida desde el primer día.',
      },
      roomTypes: {
        title: 'Elige tu Espacio Perfecto',
        subtitle: 'Desde ambiente social hasta lujo privado—todo incluye yoga diario y comodidades completas',
        'casa-playa': {
          name: 'Casa Playa (Habitación Compartida)',
          description: 'Casa compartida frente al mar con vista al océano y ambiente social. Incluye cocina compartida, amplio comedor y jardín con hamacas. Hasta 8 huéspedes (habitaciones con ventilador y AC).',
          features: ['Compartida', 'Accesible', 'Social'],
        },
        'casitas-privadas': {
          name: 'Casitas Privadas',
          description: 'Cabañas independientes con total privacidad, ideales para parejas o viajeros que buscan tranquilidad. Rodeadas de jardín tropical con cocina, Wi-Fi y A/C.',
          features: ['Privada', 'Tranquila', 'Independiente'],
        },
        'casas-deluxe': {
          name: 'Casa Privada',
          description: 'Casa privada a pasos de la playa con cocina, baño con agua caliente, Wi-Fi y A/C. Ideal para parejas que buscan confort y privacidad.',
          features: ['Privada', 'Cocina propia', 'A/C + Wi-Fi'],
        },
      },
      included: {
        title: 'Qué Incluye tu Estadía',
        subtitle: 'Más que solo alojamiento—es una experiencia completa',
        items: [
          {
            title: 'Sesiones Diarias de Yoga',
            description: 'Dos clases de yoga frente al océano diarias (vinyasa matutino y restaurativo vespertino). Todos los niveles bienvenidos.',
            icon: 'yoga',
          },
          {
            title: 'Desayuno Saludable',
            description: 'Frutas tropicales frescas, café local y opciones de desayuno saludable para alimentar tu sesión de surf matutina.',
            icon: 'coffee',
          },
          {
            title: 'Terapia de Baños de Hielo',
            description: 'Acceso a nuestra terapia de inmersión en frío para recuperación y entrenamiento de resiliencia mental.',
            icon: 'ice',
          },
          {
            title: 'WiFi de Alta Velocidad',
            description: 'Internet rápido y confiable en toda la propiedad para trabajo remoto o mantenerse conectado.',
            icon: 'wifi',
          },
          {
            title: 'Espacios Comunes',
            description: 'Cocina compartida, salones, hamacas y áreas sociales para conectar con otros viajeros.',
            icon: 'home',
          },
          {
            title: 'Almacenamiento y Ducha para Surf',
            description: 'Almacenamiento seguro para equipo de surf y estaciones de ducha/enjuague al aire libre.',
            icon: 'storage',
          },
        ],
      },
      amenities: {
        title: 'Instalaciones y Comodidades',
        categories: [
          {
            category: 'Bienestar',
            items: ['Shala de yoga frente al océano', 'Piscinas de terapia de hielo', 'Sesiones de breathwork', 'Espacios de meditación', 'Masajes (con cita)'],
          },
          {
            category: 'Áreas Comunes',
            items: ['Cocina compartida (completamente equipada)', 'Salones al aire libre y hamacas', 'Área de comedor', 'Parrilla BBQ', 'Fogata comunitaria'],
          },
          {
            category: 'Práctico',
            items: ['WiFi de alta velocidad', 'Servicio de lavandería', 'Almacenamiento de equipo de surf', 'Duchas al aire libre', 'Seguridad 24/7'],
          },
          {
            category: 'Ubicación',
            items: ['50m del acceso a la playa', '5 min caminando a rompientes de surf', 'Restaurantes cerca', 'Rodeado de jungla', 'Vistas al atardecer'],
          },
        ],
      },
      location: {
        title: 'Ubicación Privilegiada en Santa Teresa',
        intro: 'Zeneidas Surf Garden está perfectamente posicionado para darte fácil acceso a todo lo que Santa Teresa ofrece mientras mantiene una atmósfera pacífica e inmersa en la naturaleza.',
        highlights: [
          {
            title: 'A Pasos de la Playa',
            description: 'Solo 50 metros del acceso a la playa. Camina al océano en menos de un minuto. Múltiples rompientes de surf de clase mundial a 5-10 minutos a pie.',
          },
          {
            title: 'Rodeado de Naturaleza',
            description: 'Aunque cerca de la acción, nuestra propiedad está anidada en vegetación de jungla proporcionando sombra, privacidad e increíble observación de aves. Despierta con monos aulladores y aves tropicales.',
          },
          {
            title: 'A Distancia Caminable de Todo',
            description: 'Restaurantes, cafés, estudios de yoga y tiendas de surf todos a fácil distancia caminable. No necesitas auto—aunque podemos ayudar a arreglar alquileres si quieres explorar más lejos.',
          },
          {
            title: 'Pacífico Pero Conectado',
            description: 'Suficientemente lejos de la franja principal para asegurar noches pacíficas, suficientemente cerca para disfrutar la vibrante escena de restaurantes y vida nocturna de Santa Teresa cuando lo quieras.',
          },
        ],
      },
      community: {
        title: 'Más que Alojamiento—Es Comunidad',
        intro: 'Lo que realmente distingue a Zeneidas es nuestra comunidad. No solo estás reservando una habitación; te estás uniendo a una tribu de surfistas, yoguis, aventureros y entusiastas del bienestar de todo el mundo.',
        aspects: [
          {
            title: 'Atmósfera Social',
            description: 'El yoga diario reúne a los huéspedes. Comidas compartidas, sesiones de atardecer y espacios comunes crean oportunidades naturales para conectar. Muchos huéspedes llegan solos y se van con amigos de toda la vida.',
          },
          {
            title: 'Ambiente Internacional',
            description: 'Huéspedes de más de 30 países crean un rico intercambio cultural. Practica español con locales, comparte consejos de viaje con europeos, aprende de surfistas experimentados—cada día trae nuevas conexiones.',
          },
          {
            title: 'Comunidad a Largo Plazo',
            description: 'Muchos huéspedes extienden sus estadías de días a semanas a meses. Nómadas digitales trabajan remotamente mientras viven el estilo de vida pura vida. Es común ver "reuniones familiares" cuando huéspedes pasados regresan.',
          },
        ],
      },
      whyStayHere: {
        title: '¿Por Qué Elegir Zeneidas Surf Garden?',
        reasons: [
          'Ubicación frente al mar—50m del acceso al océano',
          'Incluye yoga diario, desayuno y baños de hielo',
          'Propiedad pequeña e íntima (no un mega-hostel)',
          'Comunidad internacional vibrante',
          'Instrucción profesional de surf disponible',
          'Perfecto para viajeros solitarios—fácil hacer amigos',
          'Parejas y grupos bienvenidos',
          'Atmósfera enfocada en bienestar',
          'Precios competitivos por lo que incluye',
          'Reservas flexibles (1 noche a meses)',
        ],
      },
      cta: {
        main: 'Consultar Disponibilidad y Reservar',
        secondary: 'Ver Paquetes Surf + Alojamiento',
        final: '¿Listo para Reservar tu Estadía en Santa Teresa?',
        finalText: 'Asegura tu lugar en Zeneidas Surf Garden y experimenta vida frente al mar, yoga diario, surf de clase mundial y una increíble comunidad en Santa Teresa, Costa Rica.',
      },
    },
  };

  const t = content[locale];
  const roomCards = accommodations
    .map((acc) => {
      const roomData = t.roomTypes[acc.id as keyof typeof t.roomTypes];
      if (!roomData || typeof roomData === 'string') return null;
      return {
        id: acc.id,
        images: acc.images,
        capacity: acc.capacity,
        name: roomData.name,
        description: roomData.description,
        features: roomData.features,
        capacityLabel: locale === 'en' ? `${acc.capacity} guests` : `${acc.capacity} huéspedes`,
      };
    })
    .filter(Boolean) as {
      id: string;
      images: string[];
      capacity: number;
      name: string;
      description: string;
      features: string[];
      capacityLabel: string;
    }[];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/Host.jpg)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 drop-shadow-lg">
              {t.hero.title}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 drop-shadow-md">
              {t.hero.subtitle}
            </p>
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-white text-[#163237] text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {t.cta.main}
            </Link>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-8 text-center">
              {t.intro.title}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              {t.intro.description}
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              {t.intro.description2}
            </p>
          </div>
        </section>

        {/* Room Types Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.roomTypes.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.roomTypes.subtitle}
              </p>
            </div>

            <RoomGalleryGrid rooms={roomCards} locale={locale} />

            <div className="text-center mt-12">
              <Link
                href={`/${locale}/#personalize-experience`}
                className="inline-block px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.cta.main}
              </Link>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.included.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.included.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {t.included.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#163237] transition-all duration-300 text-slate-900"
                >
                  {item.icon === 'coffee' && <Coffee className="w-10 h-10 text-[#997146] mb-4" />}
                  {item.icon === 'ice' && <Snowflake className="w-10 h-10 text-cyan-500 mb-4" />}
                  {item.icon === 'wifi' && <Wifi className="w-10 h-10 text-blue-500 mb-4" />}
                  {item.icon === 'home' && <Home className="w-10 h-10 text-green-600 mb-4" />}
                  {item.icon === 'yoga' && <div className="w-10 h-10 text-purple-500 mb-4 text-3xl">??</div>}
                  {item.icon === 'storage' && <div className="w-10 h-10 text-orange-500 mb-4 text-3xl">??</div>}

                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-800 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Amenities Section */}
        <section className="py-20 bg-gradient-to-br from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-12 text-center">
              {t.amenities.title}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.amenities.categories.map((category, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-xl font-heading font-bold mb-4 text-cyan-300">
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-100">
                        <Check className="w-4 h-4 flex-shrink-0 mt-1 text-green-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <MapPin className="w-16 h-16 text-[#163237] mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.location.title}
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                {t.location.intro}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {t.location.highlights.map((highlight, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-300">
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                    {highlight.title}
                  </h3>
                  <p className="text-slate-800 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${locale}/#personalize-experience`}
                className="inline-block px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.cta.main}
              </Link>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <Users className="w-16 h-16 text-[#163237] mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.community.title}
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                {t.community.intro}
              </p>
            </div>

            <div className="space-y-8">
              {t.community.aspects.map((aspect, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3">
                    {aspect.title}
                  </h3>
                  <p className="text-slate-800 leading-relaxed">
                    {aspect.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Stay Here Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
              {t.whyStayHere.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {t.whyStayHere.reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800 font-medium">{reason}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${locale}/#personalize-experience`}
                className="inline-block px-10 py-4 bg-[#163237] text-white text-xl font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.cta.main}
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Home className="w-16 h-16 mx-auto mb-6 text-[#ece97f]" />
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {t.cta.final}
            </h2>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              {t.cta.finalText}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/#personalize-experience`}
                className="inline-block px-10 py-5 bg-white text-[#163237] text-xl font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                {t.cta.main}
              </Link>
              <Link
                href={`/${locale}/surf-camp`}
                className="inline-block px-10 py-5 bg-transparent border-2 border-white text-white text-xl font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                {t.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
