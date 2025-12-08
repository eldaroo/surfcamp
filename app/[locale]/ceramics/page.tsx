import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Palette, Heart, Sparkles, HandMetal, Check, Clock } from 'lucide-react';
import { Navigation, Footer } from '@/components/landing';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';
  return {
    title: isSpanish ? 'Ceramica en Santa Teresa | Zeneidas Surf Garden' : 'Ceramics in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Dos experiencias de ceramica: pintar piezas listas (24h) o modelar y esmaltar en dos sesiones. Disenado para viajeros y surfistas.'
      : 'Two ceramics experiences: paint ready-made pieces (24h) or shape and glaze in two sessions. Designed for travelers and surfers.',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/ceramics`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/ceramics',
        es: 'https://santateresasurfcamp.com/es/ceramics',
      },
    },
    openGraph: {
      title: isSpanish ? 'Ceramica | Zeneidas' : 'Ceramics | Zeneidas',
      description: isSpanish
        ? 'Arte creativo en Santa Teresa'
        : 'Creative arts in Santa Teresa',
      locale: isSpanish ? 'es_ES' : 'en_US',
    },
  };
}

export default function CeramicsPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';

  const content = {
    en: {
      hero: {
        title: 'Ceramics in Santa Teresa',
        subtitle: 'Two experiences: paint in 24h or shape & glaze in two sessions',
      },
      intro: {
        title: 'Hands in Clay, Feet in the Sand',
        description: 'A calm counterbalance to surfing: slow down, work with your hands, and create something that lasts. No experience needed - local instructors guide you step by step.',
        description2: 'Choose a quick creative hit (paint ready pieces and pick up in 24h) or the full journey of shaping, drying, and glazing your own pieces over two meetups.',
      },
      offerings: {
        title: 'What We Offer',
        subtitle: 'Two programs, all levels welcome',
        items: [
          {
            title: 'Ceramic Stories (paint & pick up)',
            description: 'Paint traveler-made pieces, add your style, and pick them up ~24h after firing. Leave a piece for the next traveler - art that keeps moving.',
            duration: '1 session • ready in ~24h',
          },
          {
            title: 'Shape & Shade (full immersion)',
            description: 'Session 1: hand-build with natural clay. Session 2 (within 7 days): choose glazes and paint. Kiln finishes pieces (~9 days total).',
            duration: '2 sessions • ~9-day process',
          },
        ],
      },
      benefits: {
        title: 'Why Creative Arts?',
        subtitle: 'Balance for body and mind',
        items: [
          {
            title: 'Mindfulness & Presence',
            description: 'Working with clay requires full attention, bringing you into the present moment - similar to the flow state of surfing.',
          },
          {
            title: 'Different Form of Creation',
            description: 'Shape something permanent with your hands. Unlike waves that disappear, ceramics last - a tangible reminder of your time in Santa Teresa.',
          },
          {
            title: 'Balance Intense & Calm',
            description: 'Surfing is dynamic and intense. Ceramics is slow and meditative. Together, they create a complete experience.',
          },
          {
            title: 'Take Home Your Art',
            description: 'Create functional or decorative pieces to bring home - bowls, mugs, plates, jewelry, or sculptural art.',
          },
          {
            title: 'Community & Connection',
            description: 'Meet other travelers and locals in the creative community. Art brings people together in unique ways.',
          },
          {
            title: 'No Experience Needed',
            description: 'Complete beginners welcome. Our instructors make the creative process accessible and enjoyable for everyone.',
          },
        ],
      },
      schedule: {
        title: 'Schedule & Flow',
        subtitle: 'We align with your travel dates',
        items: [
          {
            title: 'Ceramic Stories (paint)',
            frequency: 'Daily by arrangement',
            time: '1 session - pick up next day',
            description: 'Book 1 to 1.5 hours to paint. We fire overnight; pick up in ~24h or we ship.',
          },
          {
            title: 'Shape & Shade (immersion)',
            frequency: 'Session 1 + Session 2 within 7 days',
            time: 'We schedule both when you book',
            description: 'Shape on day 1. Return within a week to glaze. Kiln finishes pieces (~9 days total); pickup or shipping available.',
          },
        ],
      },
      process: {
        title: 'How It Works',
        subtitle: 'Pick your path, we handle the firings',
        steps: [
          {
            title: 'Choose Your Experience',
            description: 'Paint ready pieces (Ceramic Stories) or shape and glaze your own (Shape & Shade).',
          },
          {
            title: 'Session Time',
            description: 'Painting: 1-1.5h. Immersion: Session 1 shaping, Session 2 glazing within 7 days.',
          },
          {
            title: 'Kiln Magic',
            description: 'Painting: overnight firing (~24h). Immersion: dry + firing (~9 days).',
          },
          {
            title: 'Pickup or Shipping',
            description: 'Pick up in person or have it shipped to you.',
          },
        ],
        note: 'Traveler-friendly timing: ~24h for painting; ~9 days for shaping + glazing. We help with scheduling and shipping.',
      },
      pricing: {
        title: 'Pricing',
        workshop: 'Ceramic Stories (paint): $50 - 1 session, pickup ~24h',
        studio: 'Shape & Shade (immersion): $80 - 2 sessions, ~9-day process',
        creative: '',
        materials: 'Includes materials, glazes, and firings',
        note: 'We coordinate both sessions around your stay; shipping available.',
      },
      cta: {
        main: 'Book Your Stay & Create',
        secondary: 'Ask About Ceramics',
      },
    },
    es: {
      hero: {
        title: 'Ceramica en Santa Teresa',
        subtitle: 'Dos experiencias: pinta en 24h o modela y esmalta en dos encuentros',
      },
      intro: {
        title: 'Manos en el barro, pies en la arena',
        description: 'Un contrapeso al surf: bajar revoluciones, trabajar con las manos y crear algo que perdura. No necesitas experiencia; nuestros instructores te guian.',
        description2: 'Elegi entre una sesion rapida de pintura (piezas listas, retiras en 24h) o el recorrido completo de modelar, secar y esmaltar en dos visitas.',
      },
      offerings: {
        title: 'Que ofrecemos',
        subtitle: 'Dos programas, todos los niveles',
        items: [
          {
            title: 'Ceramic Stories (pintar y retirar)',
            description: 'Pinta piezas ya horneadas, suma tu estilo y retiralas 24h despues. Deja una pieza para el proximo viajero: arte que sigue viajando.',
            duration: '1 sesion ? listo en ~24h',
          },
          {
            title: 'Shape & Shade (inmersion)',
            description: 'Sesion 1: modelado con arcilla natural. Sesion 2 (dentro de 7 dias): elegis esmaltes y pintas. El horno termina tus piezas (~9 dias en total).',
            duration: '2 sesiones ? proceso ~9 dias',
          },
        ],
      },
      benefits: {
        title: '¿Por Qué Artes Creativas?',
        subtitle: 'Balance para cuerpo y mente',
        items: [
          {
            title: 'Mindfulness y Presencia',
            description: 'Trabajar con arcilla requiere atencion completa, llevandote al momento presente - similar al estado de flow del surf.',
          },
          {
            title: 'Forma Diferente de Creación',
            description: 'Moldea algo permanente con tus manos. A diferencia de las olas que desaparecen, la ceramica perdura - un recordatorio tangible de tu tiempo en Santa Teresa.',
          },
          {
            title: 'Balancea Intenso y Calma',
            description: 'El surf es dinámico e intenso. La cerámica es lenta y meditativa. Juntos, crean una experiencia completa.',
          },
          {
            title: 'Lleva tu Arte a Casa',
            description: 'Crea piezas funcionales o decorativas para llevar a casa - bowls, tazas, platos, joyeria o arte escultural.',
          },
          {
            title: 'Comunidad y Conexión',
            description: 'Conoce otros viajeros y locales en la comunidad creativa. El arte une a las personas de maneras únicas.',
          },
          {
            title: 'No Se Requiere Experiencia',
            description: 'Principiantes completos bienvenidos. Nuestros instructores hacen el proceso creativo accesible y disfrutable para todos.',
          },
        ],
      },
      schedule: {
        title: 'Horario y Sesiones',
        subtitle: 'Nos adaptamos a tus fechas de viaje',
        items: [
          {
            title: 'Historias de Cerámica (pintar)',
            frequency: 'Diario con cita previa',
            time: '1 sesión - recoger al día siguiente',
            description: 'Reserva 1 a 1.5 horas para pintar. Horneamos durante la noche; recoge en ~24h o enviamos.',
          },
          {
            title: 'Forma y Esmalte (inmersión)',
            frequency: 'Sesión 1 + Sesión 2 dentro de 7 días',
            time: 'Programamos ambas cuando reserves',
            description: 'Moldea el día 1. Regresa en una semana para esmaltar. El horno termina las piezas (~9 días totales); recogida o envío disponible.',
          },
        ],
      },
      process: {
        title: 'El Proceso Cerámico',
        subtitle: 'De arcilla a pieza terminada',
        steps: [
          {
            title: 'Moldea tu Pieza',
            description: 'Aprende técnicas de construcción manual o prueba el torno. Nuestros instructores te ayudan a dar vida a tu visión.',
          },
          {
            title: 'Secado y Cocción Inicial',
            description: 'Tu pieza se seca durante varios dias, luego pasa por su primera coccion para crear bisque - dura pero aun porosa.',
          },
          {
            title: 'Esmaltado',
            description: 'Elige de nuestra selección de esmaltes para agregar color y acabado. Aprende cómo diferentes esmaltes se transforman en el horno.',
          },
          {
            title: 'Cocción Final y Recogida',
            description: 'Tu pieza pasa por la cocción de esmalte. Las piezas terminadas pueden enviarse o recogerse en una visita de retorno.',
          },
        ],
        note: 'El proceso cerámico completo toma 2-3 semanas de principio a fin debido a tiempos de secado y cocción. Podemos enviar piezas terminadas internacionalmente.',
      },
      pricing: {
        title: 'Precios',
        workshop: 'Taller de Cerámica: $40 por sesión',
        studio: 'Estudio Abierto: $15/hora',
        creative: 'Sesión de Artes Creativas: $25 por sesión',
        materials: 'Todos los materiales, herramientas y cocción incluidos',
        note: 'Paquetes especiales disponibles para huéspedes con estadías de 2+ semanas',
      },
      cta: {
        main: 'Reserva tu Estadía y Crea',
        secondary: 'Pregunta sobre Cerámica',
      },
    },
  };

  const t = content[locale];
  const photos = {
    hero: '/assets/ceramica/ceramica.jpg',
    detail: '/assets/ceramica/cera%202.jpg',
    making: '/assets/ceramica/cera3.jpg',
    process: '/assets/ceramica/cera4.jpg',
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden text-white">
        <Image
          src={photos.hero}
          alt={isSpanish ? 'Ceramica en Santa Teresa' : 'Ceramics in Santa Teresa'}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/65" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Palette className="w-16 h-16 mx-auto mb-6 text-white" />
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
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              {t.intro.title}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t.intro.description}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t.intro.description2}
            </p>
          </div>
          <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden shadow-xl border border-white">
            <Image
              src={photos.detail}
              alt={isSpanish ? 'Detalle de esmaltado' : 'Glazing detail'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-[2fr_1fr] gap-10 items-center">
          <div>
            <div className="mb-10 text-left">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.offerings.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.offerings.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {t.offerings.items.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200 hover:shadow-xl transition-shadow duration-300">
                  <HandMetal className="w-12 h-12 text-amber-600 mb-4" />
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{item.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl border border-white">
            <Image
              src={photos.making}
              alt={isSpanish ? 'Modelado en clase' : 'Handbuilding in class'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.benefits.items.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                <Sparkles className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.schedule.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.schedule.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            {t.schedule.items.map((session, index) => (
              <div key={index} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-amber-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <h3 className="text-2xl font-heading font-bold text-gray-900">
                    {session.title}
                  </h3>
                  <div className="text-sm text-amber-600 font-semibold">
                    {session.frequency} • {session.time}
                  </div>
                </div>
                <p className="text-gray-700">
                  {session.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.process.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.process.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-start mb-8">
            <div className="space-y-6">
              {t.process.steps.map((step, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative h-72 md:h-full min-h-[280px] rounded-2xl overflow-hidden shadow-xl border border-white">
              <Image
                src={photos.process}
                alt={isSpanish ? 'Piezas listas para horneado' : 'Pieces ready for kiln'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>

          <p className="text-center text-gray-600 italic bg-amber-50 rounded-lg p-6">
            {t.process.note}
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
            {t.pricing.title}
          </h2>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {[t.pricing.workshop, t.pricing.studio].map((price, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{price}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 justify-center text-sm text-gray-700 mb-4">
              <Check className="w-5 h-5 text-green-600" />
              <span>{t.pricing.materials}</span>
            </div>
            <p className="text-center text-sm text-amber-600 italic">
              {t.pricing.note}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-white text-orange-700 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta.main}
            </Link>
            <Link
              href={`/${locale}/#contact`}
              className="inline-block px-8 py-4 bg-orange-700 text-white text-lg font-semibold rounded-lg hover:bg-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-white"
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
