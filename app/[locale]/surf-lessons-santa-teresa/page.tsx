import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import { Users, Clock, Target, Video, MapPin, Trophy } from 'lucide-react';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';

  return {
    title: isSpanish
      ? 'Clases de Surf en Santa Teresa | Zeneidas Surf Garden'
      : 'Surf Lessons in Santa Teresa | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Clases de surf individuales en Santa Teresa, Costa Rica. Coaching personalizado para todos los niveles con instructores certificados en las mejores olas.'
      : 'Individual surf lessons in Santa Teresa, Costa Rica. Personalized coaching for all levels with certified instructors in world-class waves.',
    keywords: isSpanish
      ? 'clases de surf santa teresa, surf lessons costa rica, aprender a surfear santa teresa, instructor de surf privado'
      : 'surf lessons santa teresa, learn to surf costa rica, private surf coaching, santa teresa surf instructor',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/surf-lessons-santa-teresa`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/surf-lessons-santa-teresa',
        es: 'https://santateresasurfcamp.com/es/surf-lessons-santa-teresa',
      },
    },
    openGraph: {
      title: isSpanish
        ? 'Clases de Surf en Santa Teresa | Zeneidas Surf Garden'
        : 'Surf Lessons in Santa Teresa | Zeneidas Surf Garden',
      description: isSpanish
        ? 'Clases de surf individuales en Santa Teresa, Costa Rica. Coaching personalizado para todos los niveles con instructores certificados en las mejores olas.'
        : 'Individual surf lessons in Santa Teresa, Costa Rica. Personalized coaching for all levels with certified instructors in world-class waves.',
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: ['/assets/Surf.jpg'],
      type: 'website',
    },
  };
}

export default function SurfLessonsPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';

  const content = {
    en: {
      hero: {
        title: 'Surf Lessons in Santa Teresa',
        subtitle: 'Individual surf coaching tailored to your skill level and goals',
      },
      intro: {
        title: 'Learn to Surf in Costa Rica\'s Best Waves',
        description: 'Our surf lessons in Santa Teresa provide personalized instruction for surfers of all abilities. Whether you\'re taking your first paddle out or working on advanced techniques, our certified surf instructors deliver focused coaching that accelerates your progression in some of Costa Rica\'s most consistent and beautiful waves.',
        description2: 'Each surf lesson is customized to your current ability, learning style, and goals. With small group sizes (maximum 6 students per instructor) or private sessions available, you receive the individual attention needed to build solid fundamentals and advance your surfing safely and confidently.',
      },
      lessonTypes: {
        title: 'Choose Your Lesson Format',
        subtitle: 'Flexible options to match your learning style and schedule',
        options: [
          {
            title: 'Group Lessons',
            duration: '2.5 hours',
            groupSize: '4-6 students',
            description: 'Join a small group of like-minded surfers for an energetic and social learning experience. Our instructors maintain low student-to-teacher ratios to ensure everyone gets personalized feedback.',
            bestFor: 'Best for: Budget-conscious surfers, social learners, first-timers',
          },
          {
            title: 'Semi-Private Lessons',
            duration: '2.5 hours',
            groupSize: '2-3 students',
            description: 'Share your lesson with a friend or small group while receiving more individualized coaching. Perfect for couples, families, or friends who want to learn together.',
            bestFor: 'Best for: Couples, families, friends traveling together',
          },
          {
            title: 'Private Lessons',
            duration: '2 hours',
            groupSize: '1-on-1',
            description: 'Receive undivided attention from your surf coach with fully personalized instruction. We tailor every aspect of the lesson to your specific needs and goals for maximum progression.',
            bestFor: 'Best for: Rapid improvement, specific technique work, flexible scheduling',
          },
        ],
      },
      whatToExpect: {
        title: 'What to Expect in Your Surf Lesson',
        subtitle: 'A structured approach to learning',
        intro: 'Every surf lesson in Santa Teresa follows a proven teaching methodology designed to build confidence and competence in the water. Here\'s what a typical lesson includes:',
        steps: [
          {
            title: 'Beach Theory & Warm-Up (20 min)',
            description: 'We start on the beach with ocean awareness training, surf etiquette, and equipment introduction. Learn to read waves, identify rip currents, and understand lineup dynamics. Dynamic stretching prepares your body for surfing.',
          },
          {
            title: 'Pop-Up Practice & Technique Drills (15 min)',
            description: 'On the sand, we practice the proper pop-up technique, stance, and balance fundamentals. Repetition on land builds muscle memory before entering the water.',
          },
          {
            title: 'In-Water Instruction (90 min)',
            description: 'Your instructor guides you into the waves, demonstrating wave selection and timing. Beginners start in whitewater; intermediates and advanced surfers paddle out to the lineup. We provide hands-on assistance and real-time coaching throughout.',
          },
          {
            title: 'Video Review & Feedback (20 min)',
            description: 'Many sessions include video analysis where you watch footage of your surfing and receive specific tips for improvement. This accelerates learning by showing you exactly what to adjust.',
          },
        ],
      },
      instructors: {
        title: 'Our Certified Surf Instructors',
        subtitle: 'Learn from experienced local coaches',
        intro: 'All surf lessons at Zeneidas Surf Garden are taught by certified instructors with years of teaching experience and deep knowledge of Santa Teresa\'s surf breaks. Our instructors are not just skilled surfers—they\'re passionate teachers who understand how to break down complex movements into learnable steps.',
        qualities: [
          'CPR and first aid certified',
          'Ocean lifeguard training',
          'Multilingual (English, Spanish, Portuguese)',
          'Years of experience teaching all levels',
          'Local knowledge of Santa Teresa surf spots',
          'Patient, encouraging teaching style',
        ],
      },
      progression: {
        title: 'Your Surf Progression Path',
        subtitle: 'From first wave to advanced maneuvers',
        levels: [
          {
            level: 'Lesson 1-3',
            title: 'Foundation Building',
            focus: 'Pop-up technique, whitewater riding, balance, ocean awareness',
            achievement: 'Stand up and ride whitewater waves to shore',
          },
          {
            level: 'Lesson 4-8',
            title: 'Green Wave Transition',
            focus: 'Paddling technique, wave selection, timing, angling on unbroken waves',
            achievement: 'Catch and ride unbroken green waves',
          },
          {
            level: 'Lesson 9-15',
            title: 'Technique Refinement',
            focus: 'Bottom turns, generating speed, cutbacks, reading the lineup',
            achievement: 'Link multiple turns, surf different breaks',
          },
          {
            level: 'Lesson 15+',
            title: 'Advanced Coaching',
            focus: 'Barrel riding, aerials, critical sections, competition coaching',
            achievement: 'Master advanced maneuvers and bigger waves',
          },
        ],
      },
      whyChooseUs: {
        title: 'Why Choose Our Surf Lessons?',
        reasons: [
          {
            title: 'Perfect Learning Conditions',
            description: 'Santa Teresa offers warm water (no wetsuit needed), gentle beach breaks for beginners, and challenging point breaks for advanced surfers—all within walking distance. Year-round consistent surf means ideal learning conditions every day.',
          },
          {
            title: 'Small Group Sizes',
            description: 'We maintain a maximum 6:1 student-to-instructor ratio in group lessons, ensuring you get personal feedback and aren\'t lost in a crowd. Many surf schools in Costa Rica have 10+ students per instructor.',
          },
          {
            title: 'Video Analysis Included',
            description: 'We film your sessions and review the footage with you, pointing out areas for improvement. Seeing yourself surf is one of the fastest ways to correct technique and accelerate learning.',
          },
          {
            title: 'Top-Quality Equipment',
            description: 'All lessons include surfboards, leashes, rash guards, and wax. We have a wide range of board sizes and types to match your skill level and the day\'s conditions.',
          },
          {
            title: 'Flexible Scheduling',
            description: 'Book single lessons or multi-lesson packages. We surf when conditions are best—often early morning or late afternoon—and adjust schedules based on tides and swell.',
          },
          {
            title: 'Beyond Just Surfing',
            description: 'Combine your surf lessons with yoga, ice baths, and our beachfront community. Many students book accommodation with us to create a complete surf and wellness experience.',
          },
        ],
      },
      booking: {
        title: 'Ready to Book Your Surf Lesson?',
        subtitle: 'Flexible packages to fit your schedule',
        intro: 'Whether you want a single lesson to try surfing or a multi-day package to build solid skills, we have options for every goal and budget.',
        packages: [
          'Single lesson (group or private)',
          '3-lesson package (save 10%)',
          '5-lesson package (save 15%)',
          '10-lesson package (save 20%)',
        ],
        note: 'All lessons include equipment, video analysis, and expert instruction. Accommodation packages available.',
      },
      cta: {
        main: 'Book Your Surf Lesson',
        secondary: 'Check Lesson Schedule',
        final: 'Start Your Surf Journey Today',
        finalText: 'Join hundreds of satisfied students who learned to surf at Zeneidas Surf Garden. Our surf lessons in Santa Teresa combine expert instruction, perfect waves, and an unforgettable Costa Rica experience.',
      },
    },
    es: {
      hero: {
        title: 'Clases de Surf en Santa Teresa',
        subtitle: 'Coaching de surf individual adaptado a tu nivel de habilidad y objetivos',
      },
      intro: {
        title: 'Aprende a Surfear en las Mejores Olas de Costa Rica',
        description: 'Nuestras clases de surf en Santa Teresa proporcionan instrucción personalizada para surfistas de todas las habilidades. Ya sea que estés dando tu primera remada o trabajando en técnicas avanzadas, nuestros instructores certificados de surf entregan coaching enfocado que acelera tu progresión en algunas de las olas más consistentes y hermosas de Costa Rica.',
        description2: 'Cada clase de surf se personaliza según tu habilidad actual, estilo de aprendizaje y objetivos. Con tamaños de grupo pequeños (máximo 6 estudiantes por instructor) o sesiones privadas disponibles, recibes la atención individual necesaria para construir fundamentos sólidos y avanzar tu surf de manera segura y con confianza.',
      },
      lessonTypes: {
        title: 'Elige el Formato de tu Clase',
        subtitle: 'Opciones flexibles para tu estilo de aprendizaje y horario',
        options: [
          {
            title: 'Clases Grupales',
            duration: '2.5 horas',
            groupSize: '4-6 estudiantes',
            description: 'Únete a un pequeño grupo de surfistas con intereses similares para una experiencia de aprendizaje energética y social. Nuestros instructores mantienen proporciones bajas de estudiantes por maestro para asegurar que todos reciban feedback personalizado.',
            bestFor: 'Mejor para: Surfistas conscientes del presupuesto, aprendices sociales, primerizos',
          },
          {
            title: 'Clases Semi-Privadas',
            duration: '2.5 horas',
            groupSize: '2-3 estudiantes',
            description: 'Comparte tu clase con un amigo o grupo pequeño mientras recibes coaching más individualizado. Perfecto para parejas, familias o amigos que quieren aprender juntos.',
            bestFor: 'Mejor para: Parejas, familias, amigos viajando juntos',
          },
          {
            title: 'Clases Privadas',
            duration: '2 horas',
            groupSize: '1-a-1',
            description: 'Recibe atención total de tu coach de surf con instrucción completamente personalizada. Adaptamos cada aspecto de la clase a tus necesidades y objetivos específicos para máxima progresión.',
            bestFor: 'Mejor para: Mejora rápida, trabajo de técnica específico, horarios flexibles',
          },
        ],
      },
      whatToExpect: {
        title: 'Qué Esperar en tu Clase de Surf',
        subtitle: 'Un enfoque estructurado para el aprendizaje',
        intro: 'Cada clase de surf en Santa Teresa sigue una metodología de enseñanza probada diseñada para construir confianza y competencia en el agua. Esto es lo que incluye una clase típica:',
        steps: [
          {
            title: 'Teoría en Playa y Calentamiento (20 min)',
            description: 'Comenzamos en la playa con entrenamiento de conciencia oceánica, etiqueta del surf e introducción al equipo. Aprende a leer olas, identificar corrientes y entender la dinámica del lineup. El estiramiento dinámico prepara tu cuerpo para surfear.',
          },
          {
            title: 'Práctica de Pop-Up y Ejercicios de Técnica (15 min)',
            description: 'En la arena, practicamos la técnica apropiada del pop-up, postura y fundamentos de equilibrio. La repetición en tierra construye memoria muscular antes de entrar al agua.',
          },
          {
            title: 'Instrucción en el Agua (90 min)',
            description: 'Tu instructor te guía hacia las olas, demostrando selección y timing de olas. Los principiantes comienzan en espuma; los intermedios y avanzados reman hacia el lineup. Proporcionamos asistencia práctica y coaching en tiempo real durante toda la clase.',
          },
          {
            title: 'Revisión de Video y Feedback (20 min)',
            description: 'Muchas sesiones incluyen análisis de video donde ves filmación de tu surf y recibes consejos específicos para mejorar. Esto acelera el aprendizaje al mostrarte exactamente qué ajustar.',
          },
        ],
      },
      instructors: {
        title: 'Nuestros Instructores Certificados de Surf',
        subtitle: 'Aprende de coaches locales experimentados',
        intro: 'Todas las clases de surf en Zeneidas Surf Garden son impartidas por instructores certificados con años de experiencia enseñando y conocimiento profundo de las rompientes de Santa Teresa. Nuestros instructores no son solo surfistas hábiles—son maestros apasionados que entienden cómo desglosar movimientos complejos en pasos aprendibles.',
        qualities: [
          'Certificados en CPR y primeros auxilios',
          'Entrenamiento de salvavidas oceánico',
          'Multilingües (inglés, español, portugués)',
          'Años de experiencia enseñando todos los niveles',
          'Conocimiento local de spots de surf de Santa Teresa',
          'Estilo de enseñanza paciente y alentador',
        ],
      },
      progression: {
        title: 'Tu Camino de Progresión en Surf',
        subtitle: 'Desde la primera ola hasta maniobras avanzadas',
        levels: [
          {
            level: 'Clase 1-3',
            title: 'Construcción de Fundamentos',
            focus: 'Técnica de pop-up, surf en espuma, equilibrio, conciencia oceánica',
            achievement: 'Pararse y surfear olas de espuma hasta la orilla',
          },
          {
            level: 'Clase 4-8',
            title: 'Transición a Olas Verdes',
            focus: 'Técnica de remada, selección de olas, timing, ángulo en olas sin romper',
            achievement: 'Atrapar y surfear olas verdes sin romper',
          },
          {
            level: 'Clase 9-15',
            title: 'Refinamiento de Técnica',
            focus: 'Bottom turns, generar velocidad, cutbacks, leer el lineup',
            achievement: 'Enlazar múltiples giros, surfear diferentes rompientes',
          },
          {
            level: 'Clase 15+',
            title: 'Coaching Avanzado',
            focus: 'Barrel riding, aéreos, secciones críticas, coaching de competencia',
            achievement: 'Dominar maniobras avanzadas y olas más grandes',
          },
        ],
      },
      whyChooseUs: {
        title: '¿Por Qué Elegir Nuestras Clases de Surf?',
        reasons: [
          {
            title: 'Condiciones Perfectas para Aprender',
            description: 'Santa Teresa ofrece agua cálida (no se necesita wetsuit), suaves olas de playa para principiantes, y desafiantes point breaks para surfistas avanzados—todo a distancia caminable. El surf consistente todo el año significa condiciones ideales de aprendizaje cada día.',
          },
          {
            title: 'Grupos Pequeños',
            description: 'Mantenemos una proporción máxima de 6:1 estudiantes por instructor en clases grupales, asegurando que recibas feedback personal y no te pierdas en la multitud. Muchas escuelas de surf en Costa Rica tienen más de 10 estudiantes por instructor.',
          },
          {
            title: 'Análisis de Video Incluido',
            description: 'Filmamos tus sesiones y revisamos el material contigo, señalando áreas de mejora. Verte surfear es una de las formas más rápidas de corregir técnica y acelerar el aprendizaje.',
          },
          {
            title: 'Equipo de Alta Calidad',
            description: 'Todas las clases incluyen tablas de surf, leashes, licras y cera. Tenemos una amplia gama de tamaños y tipos de tabla para igualar tu nivel de habilidad y las condiciones del día.',
          },
          {
            title: 'Horarios Flexibles',
            description: 'Reserva clases individuales o paquetes de múltiples clases. Surfeamos cuando las condiciones son mejores—a menudo temprano en la mañana o tarde en la tarde—y ajustamos horarios según mareas y oleaje.',
          },
          {
            title: 'Más Allá del Surf',
            description: 'Combina tus clases de surf con yoga, baños de hielo y nuestra comunidad frente al mar. Muchos estudiantes reservan alojamiento con nosotros para crear una experiencia completa de surf y bienestar.',
          },
        ],
      },
      booking: {
        title: '¿Listo para Reservar tu Clase de Surf?',
        subtitle: 'Paquetes flexibles para tu horario',
        intro: 'Ya sea que quieras una clase individual para probar el surf o un paquete de varios días para construir habilidades sólidas, tenemos opciones para cada objetivo y presupuesto.',
        packages: [
          'Clase individual (grupal o privada)',
          'Paquete de 3 clases (ahorra 10%)',
          'Paquete de 5 clases (ahorra 15%)',
          'Paquete de 10 clases (ahorra 20%)',
        ],
        note: 'Todas las clases incluyen equipo, análisis de video e instrucción experta. Paquetes de alojamiento disponibles.',
      },
      cta: {
        main: 'Reserva tu Clase de Surf',
        secondary: 'Consultar Horario de Clases',
        final: 'Comienza tu Viaje de Surf Hoy',
        finalText: 'Únete a cientos de estudiantes satisfechos que aprendieron a surfear en Zeneidas Surf Garden. Nuestras clases de surf en Santa Teresa combinan instrucción experta, olas perfectas y una experiencia inolvidable de Costa Rica.',
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

        {/* Lesson Types Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.lessonTypes.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.lessonTypes.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {t.lessonTypes.options.map((option, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <Users className="w-12 h-12 text-[#163237] mb-4" />
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {option.duration}
                    </span>
                    <span>•</span>
                    <span>{option.groupSize}</span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {option.description}
                  </p>
                  <p className="text-sm text-[#997146] font-semibold">
                    {option.bestFor}
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

        {/* What to Expect Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.whatToExpect.title}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {t.whatToExpect.subtitle}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t.whatToExpect.intro}
              </p>
            </div>

            <div className="space-y-8">
              {t.whatToExpect.steps.map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#163237] text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {index + 1}
                    </div>
                    <div>
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
          </div>
        </section>

        {/* Instructors Section */}
        <section className="py-20 bg-gradient-to-br from-[#163237] to-[#0f2328] text-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                {t.instructors.title}
              </h2>
              <p className="text-xl text-gray-200">
                {t.instructors.subtitle}
              </p>
            </div>

            <p className="text-lg text-gray-200 leading-relaxed mb-10 text-center">
              {t.instructors.intro}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {t.instructors.qualities.map((quality, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Trophy className="w-6 h-6 text-[#ece97f] flex-shrink-0" />
                  <span className="text-white">{quality}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Progression Path Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.progression.title}
              </h2>
              <p className="text-xl text-gray-600">
                {t.progression.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {t.progression.levels.map((level, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#163237] transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-[#997146]" />
                    <div>
                      <div className="text-sm font-semibold text-[#997146] uppercase tracking-wide">
                        {level.level}
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-gray-900">
                        {level.title}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-1">
                        {locale === 'en' ? 'Focus' : 'Enfoque'}
                      </div>
                      <p className="text-gray-700">{level.focus}</p>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-1">
                        {locale === 'en' ? 'Achievement' : 'Logro'}
                      </div>
                      <p className="text-gray-900 font-semibold">{level.achievement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-12 text-center">
              {t.whyChooseUs.title}
            </h2>

            <div className="space-y-8">
              {t.whyChooseUs.reasons.map((reason, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-[#163237]" />
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

        {/* Booking Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                {t.booking.title}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {t.booking.subtitle}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-10">
                {t.booking.intro}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-10 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                {t.booking.packages.map((pkg, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-800">
                    <Video className="w-6 h-6 text-[#163237] flex-shrink-0" />
                    <span className="text-lg font-medium">{pkg}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-6 italic text-center">
                {t.booking.note}
              </p>
            </div>

            <div className="text-center">
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
            <Trophy className="w-16 h-16 mx-auto mb-6 text-[#ece97f]" />
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
