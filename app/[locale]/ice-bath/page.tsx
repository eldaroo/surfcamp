import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Snowflake, Zap, Heart, Brain, Shield, TrendingUp, Check } from 'lucide-react';
import { Navigation, Footer } from '@/components/landing';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';
  return {
    title: isSpanish ? 'Baños de Hielo en Santa Teresa | Zeneidas Surf Garden' : 'Ice Bath in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Terapia de frío guiada para surfistas en Santa Teresa, Costa Rica. Acelera recuperación, fortalece sistema inmune y mejora claridad mental.'
      : 'Guided cold therapy for surfers in Santa Teresa, Costa Rica. Accelerate recovery, strengthen immunity, and enhance mental clarity.',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/ice-bath`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/ice-bath',
        es: 'https://santateresasurfcamp.com/es/ice-bath',
      },
    },
    openGraph: {
      title: isSpanish ? 'Baños de Hielo | Zeneidas' : 'Ice Bath | Zeneidas',
      description: isSpanish
        ? 'Terapia de frío para surfistas en Santa Teresa'
        : 'Cold therapy for surfers in Santa Teresa',
      locale: isSpanish ? 'es_ES' : 'en_US',
    },
  };
}

export default function IceBathPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';
  const photos = {
    hero: '/assets/Hielo/DSC09542.jpg',
    detail: '/assets/Hielo/DSC09559.jpg',
    moment1: '/assets/Hielo/Surfcamp%20-%20day2%20-%2011.jpg',
    moment2: '/assets/Hielo/Surfcamp%20-%20day2%20-%2023.jpg',
  };

  const content = {
    en: {
      hero: {
        title: 'Ice Bath Therapy',
        subtitle: 'Guided cold immersion for physical recovery and mental resilience',
      },
      intro: {
        title: 'Why Cold Therapy for Surfers?',
        description: 'Ice bath therapy has become an essential recovery tool for athletes and surfers worldwide. Our supervised cold plunge sessions help your body recover faster from intense surf sessions, reduce inflammation, and build mental toughness. The cold exposure triggers powerful physiological responses that enhance both physical performance and mental clarity.',
        description2: 'At Zeneidas, we provide guided ice bath sessions with proper protocols to ensure safety and maximize benefits. Whether you\'re a first-timer or experienced with cold exposure, our trained staff will help you get the most from your practice.',
      },
      benefits: {
        title: 'Benefits of Ice Bath Therapy',
        subtitle: 'Science-backed advantages of cold immersion',
        items: [
          {
            icon: 'zap',
            title: 'Accelerated Physical Recovery',
            description: 'Reduces inflammation and muscle soreness after intense surf sessions. Cold exposure constricts blood vessels, then causes a rush of fresh blood when you warm up—flushing metabolic waste and delivering nutrients to tired muscles.',
          },
          {
            icon: 'brain',
            title: 'Enhanced Mental Resilience',
            description: 'Training your nervous system to stay calm under stress. The cold creates a controlled stressor that builds mental toughness, directly applicable to challenging surf conditions and hold-downs.',
          },
          {
            icon: 'heart',
            title: 'Improved Circulation & Immunity',
            description: 'Regular cold exposure strengthens your cardiovascular system and boosts white blood cell production, helping you stay healthy during extended surf trips.',
          },
          {
            icon: 'trending',
            title: 'Mood Enhancement & Clarity',
            description: 'Cold immersion triggers endorphin and dopamine release, creating natural feelings of euphoria and mental clarity. Many surfers report improved focus and decision-making in the water.',
          },
          {
            icon: 'shield',
            title: 'Reduced Inflammation',
            description: 'Cold therapy decreases inflammatory markers throughout the body, supporting faster healing from surf-related strain and minor injuries.',
          },
          {
            icon: 'zap',
            title: 'Better Sleep Quality',
            description: 'Evening cold plunges help regulate body temperature and activate the parasympathetic nervous system, promoting deeper, more restorative sleep.',
          },
        ],
      },
      protocol: {
        title: 'Our Ice Bath Protocol',
        subtitle: 'Safe, effective, and supervised',
        steps: [
          {
            title: 'Breathwork Preparation',
            description: 'Begin with 5-10 minutes of guided breathwork to activate your parasympathetic nervous system and prepare for cold exposure.',
          },
          {
            title: 'Gradual Entry',
            description: 'Enter the cold plunge slowly, allowing your body to acclimate. Water temperature is maintained between 10-15°C (50-59°F).',
          },
          {
            title: 'Controlled Exposure',
            description: 'Stay immersed for 2-5 minutes depending on your experience level. Focus on controlled breathing and staying calm.',
          },
          {
            title: 'Gradual Warming',
            description: 'Exit slowly and allow your body to warm naturally. Avoid hot showers immediately after—let your metabolism do the work.',
          },
        ],
        note: 'All sessions are supervised by trained staff. First-timers receive detailed instruction and can start with shorter exposures.',
      },
      schedule: {
        title: 'When to Do Ice Bath',
        subtitle: 'Timing matters for optimal benefits',
        morning: {
          title: 'Morning Session',
          time: 'After yoga (7:30 AM)',
          benefits: 'Energizing start to your day, mental clarity before surfing, enhanced focus',
        },
        afternoon: {
          title: 'Post-Surf Session',
          time: 'After surfing (2:00 PM)',
          benefits: 'Immediate recovery, reduced muscle soreness, inflammation control',
        },
        evening: {
          title: 'Evening Session',
          time: 'Before dinner (5:30 PM)',
          benefits: 'Relaxation, better sleep quality, parasympathetic activation',
        },
      },
      included: {
        title: 'What\'s Included',
        items: [
          'Supervised cold plunge sessions',
          'Guided breathwork preparation',
          'Temperature-controlled ice bath (10-15°C)',
          'Towels and warm-up area',
          'Experienced staff guidance',
          'Safety protocols and monitoring',
          'Unlimited access with accommodation',
        ],
      },
      safety: {
        title: 'Safety First',
        description: 'Ice bath therapy is not recommended for everyone. Please consult with our staff if you have any medical conditions, particularly heart conditions, high blood pressure, or are pregnant. We provide full safety briefings before your first session.',
      },
      cta: {
        main: 'Book Your Stay with Ice Bath Access',
        secondary: 'Learn About Accommodation',
      },
    },
    es: {
      hero: {
        title: 'Terapia de Baños de Hielo',
        subtitle: 'Inmersión en frío guiada para recuperación física y resiliencia mental',
      },
      intro: {
        title: '¿Por Qué Terapia de Frío para Surfistas?',
        description: 'La terapia de baños de hielo se ha convertido en una herramienta esencial de recuperación para atletas y surfistas en todo el mundo. Nuestras sesiones supervisadas de inmersión en frío ayudan a tu cuerpo a recuperarse más rápido de sesiones intensas de surf, reducen inflamación y construyen fortaleza mental. La exposición al frío desencadena respuestas fisiológicas poderosas que mejoran tanto el rendimiento físico como la claridad mental.',
        description2: 'En Zeneidas, proporcionamos sesiones guiadas de baño de hielo con protocolos adecuados para asegurar seguridad y maximizar beneficios. Ya seas principiante o experimentado con exposición al frío, nuestro personal entrenado te ayudará a obtener lo máximo de tu práctica.',
      },
      benefits: {
        title: 'Beneficios de la Terapia de Baños de Hielo',
        subtitle: 'Ventajas respaldadas por la ciencia de la inmersión en frío',
        items: [
          {
            icon: 'zap',
            title: 'Recuperación Física Acelerada',
            description: 'Reduce inflamación y dolor muscular después de sesiones intensas de surf. La exposición al frío contrae vasos sanguíneos, luego causa una oleada de sangre fresca al calentarte—eliminando desechos metabólicos y entregando nutrientes a músculos cansados.',
          },
          {
            icon: 'brain',
            title: 'Resiliencia Mental Mejorada',
            description: 'Entrena tu sistema nervioso para mantener la calma bajo estrés. El frío crea un estresor controlado que construye fortaleza mental, directamente aplicable a condiciones de surf desafiantes y revolcones.',
          },
          {
            icon: 'heart',
            title: 'Circulación e Inmunidad Mejoradas',
            description: 'La exposición regular al frío fortalece tu sistema cardiovascular y aumenta la producción de glóbulos blancos, ayudándote a mantenerte saludable durante viajes de surf extendidos.',
          },
          {
            icon: 'trending',
            title: 'Mejora del Estado de Ánimo y Claridad',
            description: 'La inmersión en frío desencadena liberación de endorfinas y dopamina, creando sensaciones naturales de euforia y claridad mental. Muchos surfistas reportan mejor enfoque y toma de decisiones en el agua.',
          },
          {
            icon: 'shield',
            title: 'Inflamación Reducida',
            description: 'La terapia de frío disminuye marcadores inflamatorios en todo el cuerpo, apoyando curación más rápida de tensión relacionada con el surf y lesiones menores.',
          },
          {
            icon: 'zap',
            title: 'Mejor Calidad de Sueño',
            description: 'Los baños de hielo vespertinos ayudan a regular la temperatura corporal y activan el sistema nervioso parasimpático, promoviendo sueño más profundo y restaurador.',
          },
        ],
      },
      protocol: {
        title: 'Nuestro Protocolo de Baño de Hielo',
        subtitle: 'Seguro, efectivo y supervisado',
        steps: [
          {
            title: 'Preparación con Respiración',
            description: 'Comienza con 5-10 minutos de respiración guiada para activar tu sistema nervioso parasimpático y prepararte para la exposición al frío.',
          },
          {
            title: 'Entrada Gradual',
            description: 'Entra al baño de hielo lentamente, permitiendo que tu cuerpo se aclimate. La temperatura del agua se mantiene entre 10-15°C (50-59°F).',
          },
          {
            title: 'Exposición Controlada',
            description: 'Permanece sumergido durante 2-5 minutos dependiendo de tu nivel de experiencia. Enfócate en respiración controlada y mantener la calma.',
          },
          {
            title: 'Calentamiento Gradual',
            description: 'Sale lentamente y permite que tu cuerpo se caliente naturalmente. Evita duchas calientes inmediatamente después—deja que tu metabolismo haga el trabajo.',
          },
        ],
        note: 'Todas las sesiones son supervisadas por personal entrenado. Los principiantes reciben instrucción detallada y pueden comenzar con exposiciones más cortas.',
      },
      schedule: {
        title: 'Cuándo Hacer Baño de Hielo',
        subtitle: 'El timing importa para beneficios óptimos',
        morning: {
          title: 'Sesión Matutina',
          time: 'Después del yoga (7:30 AM)',
          benefits: 'Inicio energizante del día, claridad mental antes de surfear, enfoque mejorado',
        },
        afternoon: {
          title: 'Sesión Post-Surf',
          time: 'Después de surfear (2:00 PM)',
          benefits: 'Recuperación inmediata, dolor muscular reducido, control de inflamación',
        },
        evening: {
          title: 'Sesión Vespertina',
          time: 'Antes de la cena (5:30 PM)',
          benefits: 'Relajación, mejor calidad de sueño, activación parasimpática',
        },
      },
      included: {
        title: 'Qué Incluye',
        items: [
          'Sesiones supervisadas de inmersión en frío',
          'Preparación con respiración guiada',
          'Baño de hielo con temperatura controlada (10-15°C)',
          'Toallas y área de calentamiento',
          'Guía de personal experimentado',
          'Protocolos de seguridad y monitoreo',
          'Acceso ilimitado con alojamiento',
        ],
      },
      safety: {
        title: 'Seguridad Primero',
        description: 'La terapia de baños de hielo no es recomendada para todos. Por favor consulta con nuestro personal si tienes condiciones médicas, particularmente condiciones cardíacas, presión alta, o estás embarazada. Proporcionamos briefings completos de seguridad antes de tu primera sesión.',
      },
      cta: {
        main: 'Reserva tu Estadía con Acceso a Baño de Hielo',
        secondary: 'Conoce Nuestro Alojamiento',
      },
    },
  };

  const t = content[locale];

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      zap: Zap,
      brain: Brain,
      heart: Heart,
      trending: TrendingUp,
      shield: Shield,
    };
    return icons[iconName] || Zap;
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
            {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden text-white">
        <Image
          src={photos.hero}
          alt={isSpanish ? 'Sesion de hielo en Zeneidas' : 'Ice bath session at Zeneidas'}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/70 to-cyan-900/80" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Snowflake className="w-16 h-16 mx-auto mb-6 text-cyan-200" />
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-cyan-50">
            {t.hero.subtitle}
          </p>
        </div>
      </section>

{/* Intro Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
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
            <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <Image
                src={photos.detail}
                alt={isSpanish ? 'Detalle del ice bath en Zeneidas' : 'Ice bath setup at Zeneidas'}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-cyan-800/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.benefits.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.benefits.subtitle}
            </p>
          </div>

          <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden border border-cyan-100 shadow-lg mb-12">
            <Image
              src={photos.moment1}
              alt={isSpanish ? 'Participante usando el ice bath' : 'Guest using the ice bath'}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white font-semibold drop-shadow-md">
              {isSpanish ? 'Sesiones guiadas en nuestro patio' : 'Guided sessions in our garden space'}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.benefits.items.map((benefit, index) => {
              const IconComponent = getIcon(benefit.icon);
              return (
                <div key={index} className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200 hover:shadow-xl transition-shadow duration-300">
                  <IconComponent className="w-10 h-10 text-cyan-600 mb-4" />
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Protocol Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
              {t.protocol.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.protocol.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              {t.protocol.steps.map((step, index) => (
                <div key={index} className="bg-white rounded-xl p-6 border-l-4 border-cyan-500 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex-shrink-0">
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

              <p className="text-center text-gray-600 italic bg-blue-50 rounded-lg p-6">
                {t.protocol.note}
              </p>
            </div>

            <div className="relative h-80 md:h-[420px] rounded-2xl overflow-hidden shadow-xl border border-cyan-100">
              <Image
                src={photos.moment2}
                alt={isSpanish ? 'Respiraciones guiadas antes del bano de hielo' : 'Guided breathwork before the ice bath'}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-900/5 to-transparent" />
            </div>
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

          <div className="grid md:grid-cols-3 gap-6">
            {[t.schedule.morning, t.schedule.afternoon, t.schedule.evening].map((session, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-cyan-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                  {session.title}
                </h3>
                <p className="text-sm text-cyan-600 font-semibold mb-4">{session.time}</p>
                <p className="text-sm text-gray-700">{session.benefits}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
            {t.included.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {t.included.items.map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200">
                <Check className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800">{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-6 h-6 text-yellow-600" />
              {t.safety.title}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t.safety.description}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-white text-cyan-700 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta.main}
            </Link>
            <Link
              href={`/${locale}/accommodation-santa-teresa`}
              className="inline-block px-8 py-4 bg-cyan-700 text-white text-lg font-semibold rounded-lg hover:bg-cyan-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-white"
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
