import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Sun, Moon, Waves, Wind, Check } from 'lucide-react';
import { Navigation, Footer } from '@/components/landing';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';
  return {
    title: isSpanish ? 'Yoga en Santa Teresa | Zeneidas Surf Garden' : 'Yoga in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Sesiones diarias de yoga frente al mar en Santa Teresa, Costa Rica. Todos los días: 7:30am Ashtanga y 9:00am Vinyasa, diseñadas para surfistas.'
      : 'Daily oceanfront yoga sessions in Santa Teresa, Costa Rica. Every day: 7:30am Ashtanga and 9:00am Vinyasa, designed for surfers.',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/yoga`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/yoga',
        es: 'https://santateresasurfcamp.com/es/yoga',
      },
    },
    openGraph: {
      title: isSpanish ? 'Yoga en Santa Teresa | Zeneidas' : 'Yoga in Santa Teresa | Zeneidas',
      description: isSpanish
        ? 'Sesiones diarias de yoga frente al mar en Santa Teresa'
        : 'Daily oceanfront yoga sessions in Santa Teresa',
      locale: isSpanish ? 'es_ES' : 'en_US',
    },
  };
}

export default function YogaPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';
  const yogaImages = [
    { src: '/assets/yogabanner.jpg', alt: isSpanish ? 'Práctica de yoga frente al mar' : 'Oceanfront yoga practice' },
    { src: '/assets/yoga2.jpeg', alt: isSpanish ? 'Instructora guiando clase' : 'Instructor guiding class' },
    { src: '/assets/yoga3.jpeg', alt: isSpanish ? 'Grupo en la plataforma de yoga' : 'Group on the yoga deck' },
    { src: '/assets/yoga4.jpg', alt: isSpanish ? 'Postura de equilibrio al amanecer' : 'Balance pose at sunrise' },
    { src: '/assets/yoga5.jpg', alt: isSpanish ? 'Estiramientos post-surf' : 'Post-surf stretching' },
    { src: '/assets/yoga6.jpg', alt: isSpanish ? 'Shavasana con vista al mar' : 'Shavasana with ocean view' },
  ];

  const content = {
    en: {
      hero: {
        title: 'Yoga in Santa Teresa',
        subtitle: 'Daily oceanfront yoga sessions designed for surfers and wellness seekers',
      },
      intro: {
        title: 'Yoga for Surfers & Ocean Lovers',
        description: 'Our daily yoga sessions in Santa Teresa are specifically designed to complement your surf practice and enhance your overall well-being. Practice on our oceanfront deck with the sound of waves and tropical breezes, led by experienced instructors who understand the unique needs of surfers.',
        description2: 'Whether you\'re looking to improve flexibility for surfing, recover from intense sessions, or simply find balance during your Costa Rica adventure, our yoga classes provide the perfect complement to your Santa Teresa experience.',
      },
      sessions: {
        title: 'Our Daily Yoga Sessions',
        subtitle: 'Two morning sessions daily, all levels welcome',
        morning: {
          title: 'Ashtanga — 7:30 AM',
          time: '7:30 AM',
          duration: '75 minutes',
          description: 'A grounded, breath-driven sequence to build heat, strength, and focus before you hit the waves. Expect deliberate pacing, mindful holds, and a stable foundation to protect shoulders, hips, and lower back.',
          benefits: 'Strength + focus, joint protection, breath control, pre-surf activation',
        },
        evening: {
          title: 'Vinyasa — 9:00 AM',
          time: '9:00 AM',
          duration: '75 minutes',
          description: 'Fluid, creative flow to open hips, hamstrings, and shoulders after dawn patrol. Dynamic sequencing with options for all levels so you leave warmed up, loose, and ready for the rest of the day.',
          benefits: 'Mobility, circulation, balanced effort, mindful energy for the day',
        },
      },
      benefits: {
        title: 'Benefits of Yoga for Surfers',
        subtitle: 'Why every surfer should practice yoga',
        items: [
          {
            title: 'Enhanced Flexibility',
            description: 'Increase your range of motion for better pop-ups, duck dives, and maneuvers.',
          },
          {
            title: 'Core Strength',
            description: 'Build the core stability essential for balance and power in your surfing.',
          },
          {
            title: 'Breath Control',
            description: 'Develop pranayama techniques that help you stay calm during hold-downs and challenging conditions.',
          },
          {
            title: 'Injury Prevention',
            description: 'Strengthen stabilizing muscles and improve body awareness to reduce surf-related injuries.',
          },
          {
            title: 'Faster Recovery',
            description: 'Gentle stretching and breathwork accelerate muscle recovery between surf sessions.',
          },
          {
            title: 'Mental Focus',
            description: 'Cultivate the mindfulness and presence that improve wave reading and decision-making.',
          },
        ],
      },
      included: {
        title: 'What\'s Included',
        items: [
          'Two daily yoga sessions (morning Ashtanga & Vinyasa)',
          'All yoga mats and props provided',
          'Experienced instructors',
          'Oceanfront yoga deck',
          'Small class sizes for personalized attention',
          'Modifications for all levels',
          'Access to ice bath and communal spaces',
        ],
      },
      pricing: {
        title: 'Pricing & Access',
        drop_in: 'Drop-in: $14 per class (non-guests)',
        included: 'Zeneidas guests: $10 per class',
        note: 'Surf program guests also pay $10 per class',
      },
      cta: {
        main: 'Book Your Stay with Yoga',
        secondary: 'Learn About Accommodation',
      },
    },
    es: {
      hero: {
        title: 'Yoga en Santa Teresa',
        subtitle: 'Sesiones diarias de yoga frente al mar diseñadas para surfistas y buscadores de bienestar',
      },
      intro: {
        title: 'Yoga para Surfistas y Amantes del Océano',
        description: 'Nuestras sesiones diarias de yoga en Santa Teresa están específicamente diseñadas para complementar tu práctica de surf y mejorar tu bienestar general. Practica en nuestro deck frente al mar con el sonido de las olas y brisas tropicales, guiado por instructores experimentados que entienden las necesidades únicas de los surfistas.',
        description2: 'Ya sea que busques mejorar flexibilidad para el surf, recuperarte de sesiones intensas, o simplemente encontrar balance durante tu aventura en Costa Rica, nuestras clases de yoga proporcionan el complemento perfecto para tu experiencia en Santa Teresa.',
      },
      sessions: {
        title: 'Nuestras Sesiones Diarias de Yoga',
        subtitle: 'Dos sesiones matutinas todos los días, todos los niveles',
        morning: {
          title: 'Ashtanga — 7:30 AM',
          time: '7:30 AM',
          duration: '75 minutos',
          description: 'Secuencia guiada y con respiración consciente para generar calor, fuerza y enfoque antes de entrar al mar. Ritmo deliberado, posturas estables y cuidado de hombros, caderas y zona lumbar.',
          benefits: 'Fuerza + enfoque, protección articular, control de la respiración, activación pre-surf',
        },
        evening: {
          title: 'Vinyasa — 9:00 AM',
          time: '9:00 AM',
          duration: '75 minutos',
          description: 'Flujo creativo para abrir caderas, isquios y hombros después del dawn patrol. Secuencias dinámicas con opciones para todos los niveles: sales calentado, suelto y listo para el día.',
          benefits: 'Movilidad, circulación, esfuerzo equilibrado, energía consciente para el día',
        },
      },
      benefits: {
        title: 'Beneficios del Yoga para Surfistas',
        subtitle: 'Por qué cada surfista debería practicar yoga',
        items: [
          {
            title: 'Flexibilidad Mejorada',
            description: 'Aumenta tu rango de movimiento para mejores pop-ups, duck dives y maniobras.',
          },
          {
            title: 'Fuerza del Core',
            description: 'Construye la estabilidad del core esencial para balance y potencia en tu surf.',
          },
          {
            title: 'Control de la Respiración',
            description: 'Desarrolla técnicas de pranayama que te ayudan a mantener la calma durante revolcones y condiciones desafiantes.',
          },
          {
            title: 'Prevención de Lesiones',
            description: 'Fortalece músculos estabilizadores y mejora conciencia corporal para reducir lesiones relacionadas con el surf.',
          },
          {
            title: 'Recuperación Más Rápida',
            description: 'Estiramientos suaves y trabajo de respiración aceleran la recuperación muscular entre sesiones de surf.',
          },
          {
            title: 'Enfoque Mental',
            description: 'Cultiva la atención plena y presencia que mejoran la lectura de olas y toma de decisiones.',
          },
        ],
      },
      included: {
        title: 'Qué Incluye',
        items: [
          'Dos sesiones diarias de yoga (Ashtanga y Vinyasa en la mañana)',
          'Todos los mats y props de yoga provistos',
          'Instructores experimentados',
          'Deck de yoga frente al mar',
          'Clases pequeñas para atención personalizada',
          'Modificaciones para todos los niveles',
          'Acceso a baño de hielo y espacios comunes',
        ],
      },
      pricing: {
        title: 'Precios y Acceso',
        drop_in: 'Clase suelta: $14 (no huéspedes)',
        included: 'Huéspedes de Zeneidas: $10 por clase',
        note: 'Huéspedes con programa de surf: $10 por clase',
      },
      cta: {
        main: 'Reserva tu Estadía con Yoga',
        secondary: 'Conoce Nuestro Alojamiento',
      },
    },
  };

  const t = content[locale];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden text-white">
        <Image
          src="/assets/yogabanner.jpg"
          alt={isSpanish ? 'Práctica de yoga frente al mar' : 'Oceanfront yoga practice'}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/65" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Heart className="w-16 h-16 mx-auto mb-6 text-[#997146]" />
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 drop-shadow-lg">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-100 drop-shadow">
            {t.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6 text-center">
            {t.intro.title}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            {t.intro.description}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t.intro.description2}
          </p>
          <div className="mt-10">
            <Image
              src={yogaImages[0].src}
              alt={yogaImages[0].alt}
              width={1600}
              height={900}
              className="w-full h-auto rounded-2xl shadow-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Sessions Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.sessions.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.sessions.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-8 border-2 border-orange-200">
              <Sun className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                {t.sessions.morning.title}
              </h3>
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span className="font-semibold">{t.sessions.morning.time}</span>
                <span>•</span>
                <span>{t.sessions.morning.duration}</span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {t.sessions.morning.description}
              </p>
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Benefits:</p>
                <p className="text-sm text-gray-700">{t.sessions.morning.benefits}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border-2 border-indigo-200">
              <Moon className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                {t.sessions.evening.title}
              </h3>
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span className="font-semibold">{t.sessions.evening.time}</span>
                <span>•</span>
                <span>{t.sessions.evening.duration}</span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {t.sessions.evening.description}
              </p>
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Benefits:</p>
                <p className="text-sm text-gray-700">{t.sessions.evening.benefits}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              {isSpanish ? 'Yoga en acción' : 'Yoga in action'}
            </h2>
            <p className="text-lg text-gray-600 mt-2">
              {isSpanish
                ? 'Imágenes reales de nuestras sesiones diarias en el deck frente al mar.'
                : 'Real moments from our daily sessions on the oceanfront deck.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yogaImages.slice(1).map((img, idx) => (
              <div key={img.src} className="overflow-hidden rounded-xl shadow-lg bg-white">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1200}
                  height={900}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading={idx > 1 ? 'lazy' : 'eager'}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.benefits.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.benefits.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.benefits.items.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Waves className="w-10 h-10 text-[#163237] mb-4" />
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
            {t.included.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {t.included.items.map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-[#163237] to-[#0f2328] text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8">
            {t.pricing.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20">
              <p className="text-2xl font-bold mb-2">{t.pricing.drop_in}</p>
              <p className="text-gray-300">Perfect for locals and day visitors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20">
              <p className="text-2xl font-bold mb-2">{t.pricing.included}</p>
              <p className="text-gray-300">Unlimited yoga during your stay</p>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-12 italic">
            {t.pricing.note}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-[#997146] text-white text-lg font-semibold rounded-lg hover:bg-[#7a5a37] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta.main}
            </Link>
            <Link
              href={`/${locale}/accommodation-santa-teresa`}
              className="inline-block px-8 py-4 bg-white text-[#163237] text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
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
