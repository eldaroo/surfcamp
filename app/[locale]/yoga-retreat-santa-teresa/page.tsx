import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import { Heart, Wind, Snowflake, Sun, Moon, Waves } from 'lucide-react';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';

  return {
    title: isSpanish
      ? 'Retiro de Yoga en Santa Teresa | Zeneidas Surf Garden'
      : 'Yoga Retreat in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Retiro de yoga, respiración y baños de hielo en Santa Teresa, Costa Rica. Sesiones diarias de yoga frente al mar, breathwork y terapia de frío en un paraíso tropical.'
      : 'Yoga, breathwork, and ice bath retreat in Santa Teresa, Costa Rica. Daily oceanfront yoga sessions, breathwork, and cold therapy in a tropical paradise.',
    keywords: isSpanish
      ? 'retiro de yoga santa teresa, yoga costa rica, baños de hielo, breathwork, yoga frente al mar'
      : 'yoga retreat santa teresa, yoga costa rica, ice baths, breathwork, oceanfront yoga',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/yoga-retreat-santa-teresa`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/yoga-retreat-santa-teresa',
        es: 'https://santateresasurfcamp.com/es/yoga-retreat-santa-teresa',
      },
    },
    openGraph: {
      title: isSpanish
        ? 'Retiro de Yoga en Santa Teresa | Zeneidas Surf Garden'
        : 'Yoga Retreat in Santa Teresa | Zeneidas Surf Garden',
      description: isSpanish
        ? 'Retiro de yoga, respiración y baños de hielo en Santa Teresa, Costa Rica. Sesiones diarias de yoga frente al mar, breathwork y terapia de frío en un paraíso tropical.'
        : 'Yoga, breathwork, and ice bath retreat in Santa Teresa, Costa Rica. Daily oceanfront yoga sessions, breathwork, and cold therapy in a tropical paradise.',
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: ['/assets/Yoga.jpg'],
      type: 'website',
    },
  };
}

export default function YogaRetreatPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';

  const content = {
    en: {
      hero: {
        title: 'Yoga Retreat in Santa Teresa',
        subtitle: 'Oceanfront yoga, breathwork, and ice bath therapy in Costa Rica\'s tropical paradise',
      },
      intro: {
        title: 'Transform Mind, Body & Spirit',
        description: 'Our yoga retreat in Santa Teresa offers a holistic wellness experience combining daily oceanfront yoga sessions, guided breathwork practices, and therapeutic ice baths. Set against the backdrop of Costa Rica\'s pristine beaches and jungle landscapes, our yoga programs provide the perfect environment for deep healing, stress release, and personal transformation.',
        description2: 'Whether you\'re new to yoga or a seasoned practitioner, our experienced instructors guide you through practices designed to enhance flexibility, build strength, calm the mind, and restore your connection to yourself. Each yoga session is complemented by breathwork and optional ice bath therapy, creating a complete wellness journey.',
      },
      yogaPrograms: {
        title: 'Daily Yoga Sessions',
        subtitle: 'Morning and evening practices for all levels',
        intro: 'We offer two yoga sessions daily—energizing morning flows and restorative evening sessions—both held in our open-air oceanfront shala with the sound of waves as your soundtrack.',
        sessions: [
          {
            title: 'Morning Vinyasa Flow',
            time: '6:30 AM',
            duration: '75 minutes',
            description: 'Start your day with an energizing vinyasa flow that builds heat, strength, and flexibility. Our morning yoga sessions focus on sun salutations, standing sequences, and core work to prepare your body and mind for the day ahead. Perfect for surfers seeking to improve their performance.',
            benefits: 'Increased energy, improved flexibility, mental clarity, surf preparation',
          },
          {
            title: 'Evening Restorative Yoga',
            time: '4:30 PM',
            duration: '60 minutes',
            description: 'Wind down with a gentle restorative practice focused on deep stretching, hip openers, and relaxation. Our evening yoga sessions incorporate yin yoga, gentle flows, and extended savasana to release tension accumulated during the day and prepare your body for recovery.',
            benefits: 'Stress release, deep relaxation, improved sleep, physical recovery',
          },
        ],
      },
      breathwork: {
        title: 'Breathwork Training',
        subtitle: 'Harness the power of conscious breathing',
        intro: 'Breathwork is a core component of our yoga retreat in Santa Teresa. Through guided breathing techniques, you\'ll learn to regulate your nervous system, increase lung capacity, manage stress, and access deeper states of consciousness.',
        techniques: [
          {
            title: 'Pranayama Fundamentals',
            description: 'Learn classical yogic breathing techniques including Ujjayi (victorious breath), Kapalabhati (skull-shining breath), and Nadi Shodhana (alternate nostril breathing). These foundational practices enhance yoga sessions and daily life.',
          },
          {
            title: 'Wim Hof Method',
            description: 'Experience the powerful breathing pattern developed by Wim Hof, which alkalizes the blood, increases energy, and prepares the body for ice bath immersion. This technique has been shown to boost immunity and reduce inflammation.',
          },
          {
            title: 'Breath Holds for Surfers',
            description: 'Specific training to increase CO2 tolerance and breath-hold capacity—essential skills for surfers. Learn to stay calm in challenging wave situations and improve your confidence in bigger surf.',
          },
          {
            title: 'Stress Release Breathing',
            description: 'Therapeutic breathwork sessions designed to release stored emotional tension, reduce anxiety, and promote deep relaxation. Many participants report profound emotional releases and clarity.',
          },
        ],
      },
      iceBath: {
        title: 'Ice Bath Therapy',
        subtitle: 'Cold immersion for recovery and resilience',
        intro: 'Ice bath therapy is a cornerstone of our wellness offerings at Zeneidas Surf Garden. Daily cold plunges (optional but highly encouraged) provide powerful physical and mental benefits that complement your yoga and surf practice.',
        benefits: {
          title: 'Benefits of Ice Bath Therapy',
          items: [
            {
              title: 'Accelerated Physical Recovery',
              description: 'Cold immersion reduces inflammation, speeds muscle recovery after surfing, and alleviates soreness. Perfect for active retreats combining surf and yoga.',
            },
            {
              title: 'Enhanced Mental Resilience',
              description: 'Voluntary discomfort training strengthens your mind. Regular ice baths build mental toughness, stress tolerance, and the ability to stay calm under pressure—skills that transfer to surfing and daily life.',
            },
            {
              title: 'Improved Circulation & Immunity',
              description: 'Cold therapy stimulates circulation, boosts white blood cell production, and strengthens immune function. Many practitioners experience fewer illnesses and increased energy.',
            },
            {
              title: 'Mood Enhancement & Clarity',
              description: 'Cold exposure triggers endorphin and dopamine release, creating natural highs and improved mood. The mental clarity following ice baths is profound and long-lasting.',
            },
          ],
        },
        protocol: {
          title: 'Our Ice Bath Protocol',
          description: 'We follow a safe, gradual approach to cold therapy. Sessions begin with Wim Hof breathwork to prepare the nervous system, followed by 2-4 minute cold plunges at approximately 10-12°C (50-54°F). Our instructors guide you through the entire process, ensuring safety and proper technique.',
        },
      },
      whyYogaHere: {
        title: 'Why Practice Yoga in Santa Teresa?',
        intro: 'Santa Teresa, Costa Rica, provides the ideal setting for a transformative yoga retreat. The natural environment amplifies the benefits of your practice.',
        reasons: [
          {
            title: 'Oceanfront Yoga Shala',
            description: 'Practice yoga steps from the Pacific Ocean in our open-air shala. The sound of waves, ocean breeze, and panoramic views create a meditative atmosphere impossible to replicate in a studio. Sunrise and sunset sessions are particularly magical.',
          },
          {
            title: 'Pura Vida Energy',
            description: 'Costa Rica\'s "pura vida" lifestyle supports your wellness journey. The slower pace, warm climate, and nature-centric culture help you disconnect from stress and reconnect with yourself. Santa Teresa\'s beach-jungle setting is healing in itself.',
          },
          {
            title: 'Combination with Surfing',
            description: 'Yoga and surfing are perfectly complementary. Yoga improves surf performance through better balance, flexibility, and breath control. Surfing adds playfulness and ocean connection to your yoga retreat. Our location allows you to seamlessly combine both.',
          },
          {
            title: 'Year-Round Perfect Weather',
            description: 'Santa Teresa\'s tropical climate means you can practice yoga outdoors year-round. Warm temperatures (25-30°C / 77-86°F), sunshine, and ocean breezes create ideal conditions for movement and recovery.',
          },
        ],
      },
      dailySchedule: {
        title: 'Sample Daily Schedule',
        subtitle: 'A day of wellness in paradise',
        timeline: [
          { time: '6:00 AM', activity: 'Wake up to jungle sounds and ocean breeze' },
          { time: '6:30 AM', activity: 'Morning Vinyasa Flow (75 min)' },
          { time: '8:00 AM', activity: 'Healthy breakfast with fresh tropical fruits' },
          { time: '9:00 AM', activity: 'Surf session or free time at the beach' },
          { time: '12:00 PM', activity: 'Lunch (on your own), relax, explore' },
          { time: '3:30 PM', activity: 'Breathwork session (30 min)' },
          { time: '4:00 PM', activity: 'Ice bath therapy (optional, 15 min)' },
          { time: '4:30 PM', activity: 'Evening Restorative Yoga (60 min)' },
          { time: '6:00 PM', activity: 'Sunset watching, community time' },
          { time: '7:00 PM', activity: 'Dinner (many healthy local restaurants)' },
        ],
        note: 'Schedule is flexible. All yoga and breathwork sessions are included with accommodation. Surf lessons can be added separately.',
      },
      whoIsThisFor: {
        title: 'Who Is This Yoga Retreat For?',
        audiences: [
          {
            title: 'Beginners Welcome',
            description: 'Never done yoga? Perfect! Our instructors excel at teaching fundamentals and making yoga accessible. We provide modifications for all poses and create a non-judgmental space for learning.',
          },
          {
            title: 'Experienced Yogis',
            description: 'Deepen your practice in an inspiring environment. Our experienced instructors offer advanced variations, alignment refinement, and the opportunity to explore challenging poses safely.',
          },
          {
            title: 'Surfers Seeking Balance',
            description: 'Yoga is the ideal complement to surfing. Improve your flexibility, core strength, balance, and breath control while accelerating recovery from surf sessions. Many pro surfers credit yoga for their longevity.',
          },
          {
            title: 'Wellness Enthusiasts',
            description: 'If you\'re into holistic health, breathwork, ice baths, and natural living, our yoga retreat in Santa Teresa offers the complete package. Experience cutting-edge wellness practices in a supportive community.',
          },
        ],
      },
      cta: {
        main: 'Book Your Yoga Retreat',
        secondary: 'Explore Yoga + Surf Packages',
        final: 'Begin Your Transformation',
        finalText: 'Join us at Zeneidas Surf Garden for a life-changing yoga retreat in Santa Teresa, Costa Rica. Daily oceanfront yoga, breathwork, ice baths, and an incredible community await you in paradise.',
      },
    },
    es: {
      hero: {
        title: 'Retiro de Yoga en Santa Teresa',
        subtitle: 'Yoga frente al océano, breathwork y terapia de baños de hielo en el paraíso tropical de Costa Rica',
      },
      intro: {
        title: 'Transforma Mente, Cuerpo y Espíritu',
        description: 'Nuestro retiro de yoga en Santa Teresa ofrece una experiencia holística de bienestar que combina sesiones diarias de yoga frente al océano, prácticas guiadas de respiración y baños de hielo terapéuticos. Con el telón de fondo de las playas prístinas y paisajes de jungla de Costa Rica, nuestros programas de yoga proporcionan el ambiente perfecto para sanación profunda, liberación de estrés y transformación personal.',
        description2: 'Ya seas nuevo en yoga o un practicante experimentado, nuestros instructores experimentados te guían a través de prácticas diseñadas para mejorar la flexibilidad, construir fuerza, calmar la mente y restaurar tu conexión contigo mismo. Cada sesión de yoga se complementa con breathwork y terapia opcional de baños de hielo, creando un viaje completo de bienestar.',
      },
      yogaPrograms: {
        title: 'Sesiones Diarias de Yoga',
        subtitle: 'Prácticas matutinas y vespertinas para todos los niveles',
        intro: 'Ofrecemos dos sesiones de yoga diarias—flows matutinos energizantes y sesiones vespertinas restaurativas—ambas realizadas en nuestra shala al aire libre frente al océano con el sonido de las olas como banda sonora.',
        sessions: [
          {
            title: 'Vinyasa Flow Matutino',
            time: '6:30 AM',
            duration: '75 minutos',
            description: 'Comienza tu día con un flow vinyasa energizante que genera calor, fuerza y flexibilidad. Nuestras sesiones de yoga matutinas se enfocan en saludos al sol, secuencias de pie y trabajo de core para preparar tu cuerpo y mente para el día. Perfecto para surfistas que buscan mejorar su rendimiento.',
            benefits: 'Mayor energía, flexibilidad mejorada, claridad mental, preparación para el surf',
          },
          {
            title: 'Yoga Restaurativo Vespertino',
            time: '4:30 PM',
            duration: '60 minutos',
            description: 'Relájate con una práctica suave y restaurativa enfocada en estiramientos profundos, aperturas de cadera y relajación. Nuestras sesiones de yoga vespertinas incorporan yin yoga, flows suaves y savasana extendido para liberar tensión acumulada durante el día y preparar tu cuerpo para la recuperación.',
            benefits: 'Liberación de estrés, relajación profunda, mejor sueño, recuperación física',
          },
        ],
      },
      breathwork: {
        title: 'Entrenamiento de Respiración',
        subtitle: 'Aprovecha el poder de la respiración consciente',
        intro: 'El breathwork es un componente central de nuestro retiro de yoga en Santa Teresa. A través de técnicas guiadas de respiración, aprenderás a regular tu sistema nervioso, aumentar la capacidad pulmonar, manejar el estrés y acceder a estados más profundos de conciencia.',
        techniques: [
          {
            title: 'Fundamentos de Pranayama',
            description: 'Aprende técnicas clásicas de respiración yóguica incluyendo Ujjayi (respiración victoriosa), Kapalabhati (respiración brillante del cráneo) y Nadi Shodhana (respiración alterna de fosas nasales). Estas prácticas fundamentales mejoran las sesiones de yoga y la vida diaria.',
          },
          {
            title: 'Método Wim Hof',
            description: 'Experimenta el poderoso patrón de respiración desarrollado por Wim Hof, que alcaliniza la sangre, aumenta la energía y prepara el cuerpo para la inmersión en baños de hielo. Esta técnica ha demostrado fortalecer la inmunidad y reducir la inflamación.',
          },
          {
            title: 'Aguante de Respiración para Surfistas',
            description: 'Entrenamiento específico para aumentar la tolerancia al CO2 y la capacidad de aguantar la respiración—habilidades esenciales para surfistas. Aprende a mantener la calma en situaciones desafiantes de olas y mejora tu confianza en surf más grande.',
          },
          {
            title: 'Respiración para Liberar Estrés',
            description: 'Sesiones terapéuticas de breathwork diseñadas para liberar tensión emocional almacenada, reducir la ansiedad y promover relajación profunda. Muchos participantes reportan liberaciones emocionales profundas y claridad.',
          },
        ],
      },
      iceBath: {
        title: 'Terapia de Baños de Hielo',
        subtitle: 'Inmersión en frío para recuperación y resiliencia',
        intro: 'La terapia de baños de hielo es una piedra angular de nuestras ofertas de bienestar en Zeneidas Surf Garden. Las inmersiones en frío diarias (opcionales pero muy recomendadas) proporcionan poderosos beneficios físicos y mentales que complementan tu práctica de yoga y surf.',
        benefits: {
          title: 'Beneficios de la Terapia de Baños de Hielo',
          items: [
            {
              title: 'Recuperación Física Acelerada',
              description: 'La inmersión en frío reduce la inflamación, acelera la recuperación muscular después del surf y alivia el dolor. Perfecto para retiros activos que combinan surf y yoga.',
            },
            {
              title: 'Resiliencia Mental Mejorada',
              description: 'El entrenamiento de incomodidad voluntaria fortalece tu mente. Los baños de hielo regulares construyen fortaleza mental, tolerancia al estrés y la capacidad de mantener la calma bajo presión—habilidades que se transfieren al surf y la vida diaria.',
            },
            {
              title: 'Circulación e Inmunidad Mejoradas',
              description: 'La terapia de frío estimula la circulación, aumenta la producción de glóbulos blancos y fortalece la función inmune. Muchos practicantes experimentan menos enfermedades y mayor energía.',
            },
            {
              title: 'Mejora del Estado de Ánimo y Claridad',
              description: 'La exposición al frío desencadena la liberación de endorfinas y dopamina, creando euforia natural y mejor estado de ánimo. La claridad mental después de los baños de hielo es profunda y duradera.',
            },
          ],
        },
        protocol: {
          title: 'Nuestro Protocolo de Baños de Hielo',
          description: 'Seguimos un enfoque seguro y gradual de terapia de frío. Las sesiones comienzan con breathwork Wim Hof para preparar el sistema nervioso, seguido de inmersiones en frío de 2-4 minutos a aproximadamente 10-12°C (50-54°F). Nuestros instructores te guían a través de todo el proceso, asegurando seguridad y técnica apropiada.',
        },
      },
      whyYogaHere: {
        title: '¿Por Qué Practicar Yoga en Santa Teresa?',
        intro: 'Santa Teresa, Costa Rica, proporciona el escenario ideal para un retiro de yoga transformador. El ambiente natural amplifica los beneficios de tu práctica.',
        reasons: [
          {
            title: 'Shala de Yoga Frente al Océano',
            description: 'Practica yoga a pasos del Océano Pacífico en nuestra shala al aire libre. El sonido de las olas, la brisa del océano y las vistas panorámicas crean una atmósfera meditativa imposible de replicar en un estudio. Las sesiones de amanecer y atardecer son particularmente mágicas.',
          },
          {
            title: 'Energía Pura Vida',
            description: 'El estilo de vida "pura vida" de Costa Rica apoya tu viaje de bienestar. El ritmo más lento, clima cálido y cultura centrada en la naturaleza te ayudan a desconectarte del estrés y reconectarte contigo mismo. El entorno playa-jungla de Santa Teresa es sanador en sí mismo.',
          },
          {
            title: 'Combinación con Surf',
            description: 'Yoga y surf son perfectamente complementarios. El yoga mejora el rendimiento del surf a través de mejor equilibrio, flexibilidad y control de respiración. El surf agrega diversión y conexión con el océano a tu retiro de yoga. Nuestra ubicación te permite combinar ambos sin problemas.',
          },
          {
            title: 'Clima Perfecto Todo el Año',
            description: 'El clima tropical de Santa Teresa significa que puedes practicar yoga al aire libre todo el año. Temperaturas cálidas (25-30°C / 77-86°F), sol y brisas del océano crean condiciones ideales para movimiento y recuperación.',
          },
        ],
      },
      dailySchedule: {
        title: 'Horario Diario de Ejemplo',
        subtitle: 'Un día de bienestar en el paraíso',
        timeline: [
          { time: '6:00 AM', activity: 'Despertar con sonidos de la jungla y brisa del océano' },
          { time: '6:30 AM', activity: 'Vinyasa Flow Matutino (75 min)' },
          { time: '8:00 AM', activity: 'Desayuno saludable con frutas tropicales frescas' },
          { time: '9:00 AM', activity: 'Sesión de surf o tiempo libre en la playa' },
          { time: '12:00 PM', activity: 'Almuerzo (por tu cuenta), relajarse, explorar' },
          { time: '3:30 PM', activity: 'Sesión de breathwork (30 min)' },
          { time: '4:00 PM', activity: 'Terapia de baño de hielo (opcional, 15 min)' },
          { time: '4:30 PM', activity: 'Yoga Restaurativo Vespertino (60 min)' },
          { time: '6:00 PM', activity: 'Ver el atardecer, tiempo comunitario' },
          { time: '7:00 PM', activity: 'Cena (muchos restaurantes saludables locales)' },
        ],
        note: 'El horario es flexible. Todas las sesiones de yoga y breathwork están incluidas con el alojamiento. Las clases de surf se pueden agregar por separado.',
      },
      whoIsThisFor: {
        title: '¿Para Quién es Este Retiro de Yoga?',
        audiences: [
          {
            title: 'Principiantes Bienvenidos',
            description: '¿Nunca has hecho yoga? ¡Perfecto! Nuestros instructores destacan enseñando fundamentos y haciendo el yoga accesible. Proporcionamos modificaciones para todas las posturas y creamos un espacio sin juicios para aprender.',
          },
          {
            title: 'Yoguis Experimentados',
            description: 'Profundiza tu práctica en un ambiente inspirador. Nuestros instructores experimentados ofrecen variaciones avanzadas, refinamiento de alineación y la oportunidad de explorar posturas desafiantes de manera segura.',
          },
          {
            title: 'Surfistas Buscando Balance',
            description: 'El yoga es el complemento ideal para el surf. Mejora tu flexibilidad, fuerza del core, equilibrio y control de respiración mientras aceleras la recuperación de las sesiones de surf. Muchos surfistas profesionales atribuyen al yoga su longevidad.',
          },
          {
            title: 'Entusiastas del Bienestar',
            description: 'Si te interesa la salud holística, breathwork, baños de hielo y vida natural, nuestro retiro de yoga en Santa Teresa ofrece el paquete completo. Experimenta prácticas de bienestar de vanguardia en una comunidad solidaria.',
          },
        ],
      },
      cta: {
        main: 'Reserva tu Retiro de Yoga',
        secondary: 'Explorar Paquetes Yoga + Surf',
        final: 'Comienza tu Transformación',
        finalText: 'Únete a nosotros en Zeneidas Surf Garden para un retiro de yoga que cambiará tu vida en Santa Teresa, Costa Rica. Yoga diario frente al océano, breathwork, baños de hielo y una increíble comunidad te esperan en el paraíso.',
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
            style={{ backgroundImage: 'url(/assets/Yoga.jpg)' }}
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

        {/* Yoga Programs Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.yogaPrograms.title}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {t.yogaPrograms.subtitle}
              </p>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                {t.yogaPrograms.intro}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {t.yogaPrograms.sessions.map((session, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {index === 0 ? (
                    <Sun className="w-12 h-12 text-orange-500 mb-4" />
                  ) : (
                    <Moon className="w-12 h-12 text-indigo-500 mb-4" />
                  )}
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    {session.title}
                  </h3>
                  <div className="text-[#997146] font-semibold mb-4">
                    {session.time} • {session.duration}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {session.description}
                  </p>
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      {locale === 'en' ? 'Benefits' : 'Beneficios'}
                    </div>
                    <p className="text-gray-700 text-sm">{session.benefits}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Breathwork Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <Wind className="w-16 h-16 text-[#163237] mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.breathwork.title}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {t.breathwork.subtitle}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                {t.breathwork.intro}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {t.breathwork.techniques.map((technique, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                    {technique.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {technique.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ice Bath Section */}
        <section className="py-20 bg-gradient-to-br from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <Snowflake className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                {t.iceBath.title}
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                {t.iceBath.subtitle}
              </p>
              <p className="text-lg text-gray-200 leading-relaxed max-w-3xl mx-auto">
                {t.iceBath.intro}
              </p>
            </div>

            <div className="mb-12">
              <h3 className="text-3xl font-heading font-bold mb-8 text-center">
                {t.iceBath.benefits.title}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {t.iceBath.benefits.items.map((benefit, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                    <h4 className="text-xl font-heading font-bold mb-3 text-cyan-300">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-200 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-heading font-bold mb-4 text-center">
                {t.iceBath.protocol.title}
              </h3>
              <p className="text-gray-200 leading-relaxed text-center">
                {t.iceBath.protocol.description}
              </p>
            </div>
          </div>
        </section>

        {/* Why Yoga Here Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-8 text-center">
              {t.whyYogaHere.title}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-12 text-center">
              {t.whyYogaHere.intro}
            </p>

            <div className="space-y-8">
              {t.whyYogaHere.reasons.map((reason, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-colors duration-300">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3 flex items-center gap-3">
                    <Waves className="w-6 h-6 text-[#163237]" />
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

        {/* Daily Schedule Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.dailySchedule.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.dailySchedule.subtitle}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {t.dailySchedule.timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-6 bg-white rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="text-[#163237] font-bold text-lg whitespace-nowrap">
                    {item.time}
                  </div>
                  <div className="text-gray-700 text-lg">
                    {item.activity}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-600 italic text-center">
              {t.dailySchedule.note}
            </p>
          </div>
        </section>

        {/* Who Is This For Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
              {t.whoIsThisFor.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {t.whoIsThisFor.audiences.map((audience, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#163237] transition-colors duration-300">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                    {audience.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {audience.description}
                  </p>
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
