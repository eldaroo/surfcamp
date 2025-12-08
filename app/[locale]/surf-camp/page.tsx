import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import { Check, Users, Calendar, Award, Waves, Heart } from 'lucide-react';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';

  return {
    title: isSpanish
      ? 'Programas de Surf en Santa Teresa | Zeneidas Surf Garden'
      : 'Surf Programs in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Programas de surf de varios días en Santa Teresa, Costa Rica. Clases para todos los niveles, coaching profesional y experiencia completa de surf y yoga frente al mar.'
      : 'Multi-day surf programs in Santa Teresa, Costa Rica. All-level surf lessons, professional coaching, and complete surf & yoga beachfront experience.',
    keywords: isSpanish
      ? 'programas de surf santa teresa, surf camp costa rica, clases de surf todos los niveles, surf y yoga santa teresa'
      : 'santa teresa surf programs, surf camp costa rica, all level surf lessons, surf and yoga santa teresa',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/surf-camp`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/surf-camp',
        es: 'https://santateresasurfcamp.com/es/surf-camp',
      },
    },
    openGraph: {
      title: isSpanish
        ? 'Programas de Surf en Santa Teresa | Zeneidas Surf Garden'
        : 'Surf Programs in Santa Teresa | Zeneidas Surf Garden',
      description: isSpanish
        ? 'Programas de surf de varios días en Santa Teresa, Costa Rica. Clases para todos los niveles, coaching profesional y experiencia completa de surf y yoga frente al mar.'
        : 'Multi-day surf programs in Santa Teresa, Costa Rica. All-level surf lessons, professional coaching, and complete surf & yoga beachfront experience.',
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: ['/assets/Surf.jpg'],
      type: 'website',
    },
  };
}

export default function SurfCampPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';

  const content = {
    en: {
      hero: {
        title: 'Surf Programs in Santa Teresa',
        subtitle: 'Professional surf coaching programs with video analysis - from beginner to advanced',
      },
      intro: {
        title: 'Choose Your Surf Progression Path',
        description: 'Our surf programs in Santa Teresa, Costa Rica, use a structured coaching methodology combining in-water sessions with video analysis to accelerate your progression. Whether you\'re a complete beginner or an experienced surfer, choose the program that matches your time commitment and desired depth of improvement.',
        description2: 'All programs are designed for any skill level—from first-time surfers to advanced riders. What changes is the number of sessions, video analysis depth, and personalized coaching time. Our certified instructors adapt each program to your current abilities and goals, ensuring meaningful progress regardless of where you start.',
      },
      programs: {
        title: 'Our Three Surf Programs',
        subtitle: 'Choose based on your time and depth of improvement you want',
        options: [
          {
            duration: 'Core Surf Program',
            price: '$450',
            sessions: '4 surf sessions',
            videoAnalysis: '2 video analysis sessions',
            photoSession: 'Photo session (optional)',
            droneSession: null,
            continuityPlan: 'Continuity plan',
            nutritionPlan: 'Basic nutrition guide',
            level: 'Any Level',
            description: 'Essential surf coaching to build solid fundamentals or refine key techniques. Two video analysis sessions help you identify and correct the most important patterns. Perfect for getting started or focused improvement in a shorter timeframe.',
            ideal: 'Ideal for: Quick skill boost, limited time, trying surf coaching with video analysis',
          },
          {
            duration: 'Intensive Surf Program',
            price: '$650',
            sessions: '6 surf sessions',
            videoAnalysis: '4 video analysis sessions',
            photoSession: '1 photo session included',
            droneSession: null,
            continuityPlan: 'Final practice plan',
            nutritionPlan: 'Personalized nutrition plan',
            level: 'Any Level',
            description: 'Deeper dive into your surf progression with more water time and detailed video analysis. Four analysis sessions allow us to work on multiple aspects of your surfing and track improvement over time. Includes photo session and comprehensive practice plan.',
            ideal: 'Ideal for: Serious progression, week-long surf trips, breaking through plateaus',
          },
          {
            duration: 'Elite Surf Program',
            price: '$910',
            sessions: '8 high-performance sessions',
            videoAnalysis: '5 advanced video analysis sessions',
            photoSession: 'Photo session included',
            droneSession: 'Drone footage included',
            continuityPlan: 'Extended final review',
            nutritionPlan: 'Complete nutrition plan',
            level: 'Any Level',
            description: 'Maximum commitment to surf improvement with the most water time and deepest video analysis. Five sessions allow frame-by-frame technique refinement and comprehensive progress tracking. Includes photo + drone footage and extended final review.',
            ideal: 'Ideal for: Total transformation, extended stays, competitive surfers, serious enthusiasts',
          },
        ],
      },
      included: {
        title: 'Every Surf Program Includes',
        items: [
          'Personalized video analysis sessions (2, 4, or 5 depending on program)',
          'Surf sessions with certified ISA instructors',
          'Complete surf equipment (board, wetsuit, leash, wax)',
          'Transport to multiple surf breaks based on conditions',
          'Small group instruction (max 2-3 students per instructor)',
          'Optional photo sessions (Intensive & Elite include photo/drone)',
          'Continuity plan to keep progressing after your program',
          'Ocean safety and surf etiquette training',
          'Access to all Zeneidas facilities (yoga, ice bath, communal spaces)',
          'Progress tracking and personalized feedback',
        ],
      },
      methodology: {
        title: 'Our Integrated Surf Coaching Method',
        subtitle: 'Combining in-water practice with video analysis for faster progression',
        intro: 'Our surf programs use a proven methodology that accelerates learning through immediate feedback and structured progression. Each surf session is filmed and analyzed with you, allowing you to see exactly what you\'re doing right and what needs adjustment. This visual feedback, combined with expert coaching, helps you progress faster than traditional surf lessons.',
        aspects: [
          {
            title: 'Video Analysis Sessions',
            description: 'Every program includes dedicated video analysis sessions where we review your footage together. You\'ll see your pop-up technique, wave positioning, and turns from an outside perspective—the fastest way to identify and correct habits.',
          },
          {
            title: 'Personalized Progression Plan',
            description: 'Based on your video analysis, we create a custom progression plan focusing on the 2-3 skills that will have the biggest impact on your surfing. No generic lessons—every session is tailored to your current level.',
          },
          {
            title: 'Small Group Coaching',
            description: 'With a maximum of 2-3 students per instructor, you receive highly personalized attention while benefiting from the energy and camaraderie of a small group. Many students prefer this intimate balance over expensive 1:1 lessons.',
          },
          {
            title: 'Real Ocean Experience',
            description: 'We adapt each session to current conditions, teaching you to read waves, understand lineups, and build ocean confidence. You\'ll learn to surf in real conditions, not just perfect waves.',
          },
        ],
      },
      levels: {
        title: 'Which Program is Right for You?',
        subtitle: 'Choose based on your time and improvement goals',
        beginner: {
          title: 'Core - Quick Improvement',
          description: 'Choose Core if you want focused improvement in a shorter timeframe. Whether you\'re learning to stand up for the first time or working on a specific technique like bottom turns, 4 sessions with 2 video reviews give you solid fundamentals and clear direction. Perfect for testing our coaching method or quick skill boosts during shorter trips.',
        },
        intermediate: {
          title: 'Intensive - Serious Progression',
          description: 'Choose Intensive for meaningful transformation. Six sessions with 4 detailed video analysis allow us to work on multiple aspects—pop-up mechanics, wave reading, positioning, and basic maneuvers. Whether you\'re a beginner building a complete foundation or an intermediate breaking through plateaus, this program provides the depth needed for lasting change.',
        },
        advanced: {
          title: 'Elite - Maximum Transformation',
          description: 'Choose Elite for the deepest possible improvement. Eight sessions with 5 comprehensive video analysis sessions allow frame-by-frame technique refinement at any level. Beginners can master fundamentals and progress to riding green faces. Advanced surfers can refine competition-level maneuvers. The extended time allows for real habit change and muscle memory development.',
        },
      },
      whySantaTeresa: {
        title: 'Why Surf in Santa Teresa, Costa Rica?',
        intro: 'Santa Teresa is recognized as one of the best surf destinations in Central America, offering consistent waves year-round, warm water, and a vibrant surf culture.',
        reasons: [
          {
            title: 'Year-Round Surf',
            description: 'Consistent swells and multiple breaks mean surfable waves every day, regardless of season. The dry season (December-April) brings offshore winds and clean conditions, while the rainy season (May-November) delivers larger swells.',
          },
          {
            title: 'Variety of Breaks',
            description: 'From mellow beach breaks at Playa Carmen to the famous point break at Santa Teresa, you have access to waves for every skill level within walking distance.',
          },
          {
            title: 'Warm Water, No Wetsuit',
            description: 'Water temperatures stay between 26-29°C (79-84°F) year-round. Surf comfortably in boardshorts or a rash guard—no wetsuit needed.',
          },
          {
            title: 'Uncrowded Waves',
            description: 'While Santa Teresa is popular, the variety of breaks and kilometers of coastline mean you\'ll often find uncrowded sessions, especially at sunrise and sunset.',
          },
        ],
      },
      howItWorks: {
        title: 'How Our Surf Programs Work',
        subtitle: 'From arrival to your last session',
        steps: [
          {
            title: 'Initial Assessment',
            description: 'On day one, we assess your current level, goals, and any specific challenges. We\'ll match you with the right instructor and group for your skill level.',
          },
          {
            title: 'Surf Sessions',
            description: 'Sessions typically run 2-3 hours in the morning when conditions are best. We adapt to tides, swell, and weather to ensure you surf the right breaks for your level.',
          },
          {
            title: 'Video Analysis Reviews',
            description: 'Between surf sessions, we review your footage together in structured video analysis sessions. You\'ll see exactly what you\'re doing and receive clear action items for improvement.',
          },
          {
            title: 'Progression Planning',
            description: 'At the end of your program, you\'ll receive a personalized progression plan outlining the next skills to work on and how to continue improving after you leave.',
          },
        ],
      },
      cta: {
        main: 'Book Your Surf Program',
        secondary: 'Check Availability',
        final: 'Ready to Start Your Surf Journey?',
        finalText: 'Join us at Zeneidas Surf Garden for an unforgettable surf experience in Santa Teresa, Costa Rica. Our surf programs combine professional instruction, incredible waves, and a supportive community.',
      },
    },
    es: {
      hero: {
        title: 'Programas de Surf en Santa Teresa',
        subtitle: 'Programas profesionales de coaching de surf con videoanálisis - desde principiante hasta avanzado',
      },
      intro: {
        title: 'Elige tu Camino de Progresión en el Surf',
        description: 'Nuestros programas de surf en Santa Teresa, Costa Rica, utilizan una metodología de coaching estructurado que combina sesiones en el agua con videoanálisis para acelerar tu progresión. Ya seas un principiante completo o un surfista experimentado, elige el programa que se ajuste a tu tiempo disponible y profundidad de mejora deseada.',
        description2: 'Todos los programas están diseñados para cualquier nivel—desde surfistas primerizos hasta riders avanzados. Lo que cambia es el número de sesiones, profundidad del videoanálisis y tiempo de coaching personalizado. Nuestros instructores certificados adaptan cada programa a tus habilidades actuales y objetivos, asegurando progreso significativo sin importar dónde comiences.',
      },
      programs: {
        title: 'Nuestros Tres Programas de Surf',
        subtitle: 'Elige según tu tiempo y profundidad de mejora que buscas',
        options: [
          {
            duration: 'Core Surf Program',
            price: '$450',
            sessions: '4 sesiones de surf',
            videoAnalysis: '2 sesiones de videoanálisis',
            photoSession: 'Sesión de fotos (opcional)',
            droneSession: null,
            continuityPlan: 'Plan de continuidad',
            nutritionPlan: 'Guía nutricional básica',
            level: 'Cualquier Nivel',
            description: 'Coaching esencial de surf para construir fundamentos sólidos o refinar técnicas clave. Dos sesiones de videoanálisis te ayudan a identificar y corregir los patrones más importantes. Perfecto para comenzar o mejorar de forma enfocada en menos tiempo.',
            ideal: 'Ideal para: Impulso rápido de habilidades, tiempo limitado, probar coaching con videoanálisis',
          },
          {
            duration: 'Intensive Surf Program',
            price: '$650',
            sessions: '6 sesiones de surf',
            videoAnalysis: '4 sesiones de videoanálisis',
            photoSession: '1 sesión de fotos incluida',
            droneSession: null,
            continuityPlan: 'Plan de práctica final',
            nutritionPlan: 'Plan nutricional personalizado',
            level: 'Cualquier Nivel',
            description: 'Inmersión profunda en tu progresión con más tiempo en el agua y videoanálisis detallado. Cuatro sesiones de análisis nos permiten trabajar en múltiples aspectos de tu surf y seguir tu mejora a lo largo del tiempo. Incluye sesión de fotos y plan de práctica completo.',
            ideal: 'Ideal para: Progresión seria, viajes de una semana, superar estancamientos',
          },
          {
            duration: 'Elite Surf Program',
            price: '$910',
            sessions: '8 sesiones de alto rendimiento',
            videoAnalysis: '5 sesiones avanzadas de videoanálisis',
            photoSession: 'Sesión de fotos incluida',
            droneSession: 'Video con drone incluido',
            continuityPlan: 'Revisión final extendida',
            nutritionPlan: 'Plan nutricional completo',
            level: 'Cualquier Nivel',
            description: 'Máximo compromiso con la mejora en el surf con más tiempo en el agua y el videoanálisis más profundo. Cinco sesiones permiten refinamiento técnico cuadro por cuadro y seguimiento completo de progreso. Incluye fotos + drone y revisión final extendida.',
            ideal: 'Ideal para: Transformación total, estadías extendidas, surfistas competitivos, entusiastas serios',
          },
        ],
      },
      included: {
        title: 'Cada Programa de Surf Incluye',
        items: [
          'Sesiones personalizadas de videoanálisis (2, 4, o 5 según el programa)',
          'Sesiones de surf con instructores certificados ISA',
          'Equipo completo de surf (tabla, traje, leash, cera)',
          'Transporte a múltiples rompientes según las condiciones',
          'Instrucción en grupos pequeños (máx 2-3 estudiantes por instructor)',
          'Sesiones de fotos opcionales (Intensive & Elite incluyen foto/drone)',
          'Plan de continuidad para seguir progresando después de tu programa',
          'Entrenamiento en seguridad oceánica y etiqueta del surf',
          'Acceso a todas las instalaciones de Zeneidas (yoga, baño de hielo, espacios comunes)',
          'Seguimiento de progreso y retroalimentación personalizada',
        ],
      },
      methodology: {
        title: 'Nuestro Método Integrado de Coaching de Surf',
        subtitle: 'Combinando práctica en el agua con videoanálisis para progresión más rápida',
        intro: 'Nuestros programas de surf utilizan una metodología probada que acelera el aprendizaje a través de retroalimentación inmediata y progresión estructurada. Cada sesión de surf es filmada y analizada contigo, permitiéndote ver exactamente qué estás haciendo bien y qué necesita ajuste. Esta retroalimentación visual, combinada con coaching experto, te ayuda a progresar más rápido que las clases de surf tradicionales.',
        aspects: [
          {
            title: 'Sesiones de Videoanálisis',
            description: 'Cada programa incluye sesiones dedicadas de videoanálisis donde revisamos tu material juntos. Verás tu técnica de pop-up, posicionamiento en las olas y giros desde una perspectiva externa—la forma más rápida de identificar y corregir hábitos.',
          },
          {
            title: 'Plan de Progresión Personalizado',
            description: 'Basándonos en tu videoanálisis, creamos un plan de progresión personalizado enfocado en las 2-3 habilidades que tendrán el mayor impacto en tu surf. Sin clases genéricas—cada sesión está adaptada a tu nivel actual.',
          },
          {
            title: 'Coaching en Grupos Pequeños',
            description: 'Con un máximo de 2-3 estudiantes por instructor, recibes atención altamente personalizada mientras te beneficias de la energía y camaradería de un grupo pequeño. Muchos estudiantes prefieren este balance íntimo sobre clases 1:1 costosas.',
          },
          {
            title: 'Experiencia en Océano Real',
            description: 'Adaptamos cada sesión a las condiciones actuales, enseñándote a leer olas, entender lineups y construir confianza oceánica. Aprenderás a surfear en condiciones reales, no solo olas perfectas.',
          },
        ],
      },
      levels: {
        title: '¿Qué Programa es Adecuado para Ti?',
        subtitle: 'Elige según tu tiempo y objetivos de mejora',
        beginner: {
          title: 'Core - Mejora Rápida',
          description: 'Elige Core si buscas mejora enfocada en menos tiempo. Ya sea que estés aprendiendo a pararte por primera vez o trabajando en una técnica específica como bottom turns, 4 sesiones con 2 revisiones de video te dan fundamentos sólidos y dirección clara. Perfecto para probar nuestro método de coaching o impulsos rápidos durante viajes cortos.',
        },
        intermediate: {
          title: 'Intensive - Progresión Seria',
          description: 'Elige Intensive para transformación significativa. Seis sesiones con 4 videoanálisis detallados nos permiten trabajar en múltiples aspectos—mecánica de pop-up, lectura de olas, posicionamiento y maniobras básicas. Ya seas principiante construyendo una base completa o intermedio superando estancamientos, este programa proporciona la profundidad necesaria para cambio duradero.',
        },
        advanced: {
          title: 'Elite - Transformación Máxima',
          description: 'Elige Elite para la mejora más profunda posible. Ocho sesiones con 5 sesiones completas de videoanálisis permiten refinamiento técnico cuadro por cuadro en cualquier nivel. Principiantes pueden dominar fundamentos y progresar a surfear caras verdes. Surfistas avanzados pueden refinar maniobras de nivel competitivo. El tiempo extendido permite cambio real de hábitos y desarrollo de memoria muscular.',
        },
      },
      whySantaTeresa: {
        title: '¿Por Qué Surfear en Santa Teresa, Costa Rica?',
        intro: 'Santa Teresa es reconocida como uno de los mejores destinos de surf en América Central, ofreciendo olas consistentes todo el año, agua cálida y una vibrante cultura del surf.',
        reasons: [
          {
            title: 'Surf Todo el Año',
            description: 'Swells consistentes y múltiples rompientes significan olas surfeables todos los días, independientemente de la temporada. La temporada seca (diciembre-abril) trae vientos offshore y condiciones limpias, mientras que la temporada de lluvias (mayo-noviembre) entrega swells más grandes.',
          },
          {
            title: 'Variedad de Rompientes',
            description: 'Desde las suaves olas de playa en Playa Carmen hasta el famoso point break en Santa Teresa, tienes acceso a olas para todos los niveles de habilidad a poca distancia.',
          },
          {
            title: 'Agua Cálida, Sin Wetsuit',
            description: 'Las temperaturas del agua se mantienen entre 26-29°C (79-84°F) todo el año. Surfea cómodamente en boardshorts o licra—no se necesita wetsuit.',
          },
          {
            title: 'Olas sin Multitudes',
            description: 'Aunque Santa Teresa es popular, la variedad de rompientes y kilómetros de costa significan que a menudo encontrarás sesiones sin multitudes, especialmente al amanecer y atardecer.',
          },
        ],
      },
      howItWorks: {
        title: 'Cómo Funcionan Nuestros Programas de Surf',
        subtitle: 'Desde tu llegada hasta tu última sesión',
        steps: [
          {
            title: 'Evaluación Inicial',
            description: 'El primer día, evaluamos tu nivel actual, objetivos y cualquier desafío específico. Te emparejaremos con el instructor y grupo adecuado para tu nivel de habilidad.',
          },
          {
            title: 'Sesiones de Surf',
            description: 'Las sesiones típicamente duran 2-3 horas por la mañana cuando las condiciones son mejores. Nos adaptamos a mareas, swell y clima para asegurar que surfees en las rompientes adecuadas para tu nivel.',
          },
          {
            title: 'Revisiones de Videoanálisis',
            description: 'Entre sesiones de surf, revisamos tu material juntos en sesiones estructuradas de videoanálisis. Verás exactamente lo que estás haciendo y recibirás elementos de acción claros para mejorar.',
          },
          {
            title: 'Planificación de Progresión',
            description: 'Al final de tu programa, recibirás un plan de progresión personalizado describiendo las siguientes habilidades en las que trabajar y cómo continuar mejorando después de irte.',
          },
        ],
      },
      cta: {
        main: 'Reserva tu Programa de Surf',
        secondary: 'Consultar Disponibilidad',
        final: '¿Listo para Comenzar tu Viaje de Surf?',
        finalText: 'Únete a nosotros en Zeneidas Surf Garden para una experiencia de surf inolvidable en Santa Teresa, Costa Rica. Nuestros programas de surf combinan instrucción profesional, olas increíbles y una comunidad solidaria.',
      },
    },
  };

  const t = content[locale];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/Surf.jpg)' }}
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

        {/* Programs Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.programs.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.programs.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {t.programs.options.map((program, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-12 h-12 text-[#163237]" />
                    <span className="text-3xl font-bold text-[#163237]">{program.price}</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    {program.duration}
                  </h3>
                  <p className="text-sm text-[#997146] font-semibold mb-4">
                    {program.level}
                  </p>
                  <div className="bg-[#163237]/5 rounded-lg p-4 mb-4 space-y-2 border border-[#163237]/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-900">{program.sessions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-900">{program.videoAnalysis}</span>
                    </div>
                    {program.photoSession && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-900">{program.photoSession}</span>
                      </div>
                    )}
                    {program.droneSession && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-900">{program.droneSession}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-900">{program.continuityPlan}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-900">{program.nutritionPlan}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {program.description}
                  </p>
                  <p className="text-sm text-[#997146] font-semibold italic">
                    {program.ideal}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${locale}/#personalize-experience`}
                className="inline-block px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.cta.secondary}
              </Link>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
              {t.included.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {t.included.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="py-20 bg-gradient-to-br from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                {t.methodology.title}
              </h2>
              <p className="text-xl text-gray-200">
                {t.methodology.subtitle}
              </p>
            </div>

            <p className="text-lg text-gray-200 leading-relaxed mb-12 max-w-4xl mx-auto text-center">
              {t.methodology.intro}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.methodology.aspects.map((aspect, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                  <h3 className="text-xl font-heading font-bold mb-3">
                    {aspect.title}
                  </h3>
                  <p className="text-gray-200 leading-relaxed">
                    {aspect.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Levels Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.levels.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.levels.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                  {t.levels.beginner.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t.levels.beginner.description}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
                <Waves className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                  {t.levels.intermediate.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t.levels.intermediate.description}
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-8 border-2 border-purple-200">
                <Award className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                  {t.levels.advanced.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t.levels.advanced.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Santa Teresa Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-8 text-center">
              {t.whySantaTeresa.title}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-12 text-center">
              {t.whySantaTeresa.intro}
            </p>

            <div className="space-y-8">
              {t.whySantaTeresa.reasons.map((reason, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3">
                    {reason.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.howItWorks.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.howItWorks.subtitle}
              </p>
            </div>

            <div className="space-y-6">
              {t.howItWorks.steps.map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-colors duration-200 border-l-4 border-[#163237]">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#163237] text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3">
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
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Heart className="w-16 h-16 mx-auto mb-6 text-[#ece97f]" />
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {t.cta.final}
            </h2>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              {t.cta.finalText}
            </p>
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-10 py-5 bg-white text-[#163237] text-xl font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              {t.cta.main}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
