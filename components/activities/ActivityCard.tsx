"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Activity } from "@/types";
import { useBookingStore } from "@/lib/store";
import {
  CheckCircle2,
  Sparkles,
  Users,
  Minus,
  Plus,
  Clock,
  Star,
  Flame,
  Globe,
  Timer,
  User,
  Waves,
  Snowflake,
  Wind,
  Car,
  Shield,
  HeadphonesIcon,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Quote,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const YOGA_CLASSES_RANGE = { min: 1, max: 15 } as const;

// Surf Programs - Duration-based packages (work for any level)
const SURF_PROGRAMS = {
  fundamental: {
    id: 'fundamental',
    name: { es: 'Core Surf Program', en: 'Core Surf Program' },
    tagline: {
      es: 'Inicio rápido, base sólida, coaching personalizado',
      en: 'Fast start, strong foundation, personalized coaching'
    },
    price: 450,
    sessions: 4,
    includes: {
      es: [
        '4 sesiones de surf',
        '2 sesiones de videoanálisis',
        'Equipo (tabla + lycra)',
        'Teoría del surf',
        'Sesión de fotos',
        'Plan de continuidad'
      ],
      en: [
        '4 surf sessions',
        '2 video analysis sessions',
        'Gear (board + lycra)',
        'Surf theory',
        'Photo session',
        'Continuity plan'
      ]
    },
    sessionWork: {
      es: [
        'Técnica & biomecánica: Fundamentos esenciales adaptados a tu nivel — remada, pop-up, postura y transiciones',
        'Mentalidad & confianza: Desarrollo acelerado desde seguridad básica hasta lectura de olas complejas',
        'Nutrición & recuperación: Estrategias de alimentación e hidratación para mantener energía en 4 días',
        'Feedback visual: Análisis de video en momentos clave para ajustar enfoque y maximizar resultados'
      ],
      en: [
        'Technique & biomechanics: Essential fundamentals adapted to your level — paddling, pop-up, stance, and transitions',
        'Mindset & confidence: Accelerated development from basic safety to complex wave reading',
        'Nutrition & recovery: Fueling and hydration strategies to maintain energy over 4 days',
        'Visual feedback: Video analysis at key moments to adjust focus and maximize results'
      ]
    }
  },
  progressionPlus: {
    id: 'progressionPlus',
    name: { es: 'Intensive Surf Program', en: 'Intensive Surf Program' },
    tagline: {
      es: 'Progreso consistente mediante repetición, coaching y feedback',
      en: 'Consistent progress through repetition, coaching and feedback'
    },
    price: 650,
    sessions: 6,
    includes: {
      es: [
        '6 sesiones de surf',
        '4 sesiones de videoanálisis',
        'Transporte a spots de surf cercanos',
        'Equipo (tabla + lycra)',
        'Teoría del surf',
        '1 sesión de fotos',
        'Plan de práctica final'
      ],
      en: [
        '6 surf sessions',
        '4 video analysis sessions',
        'Transport to nearby surf spots',
        'Gear (board + lycra)',
        'Surf theory',
        '1 photo session',
        'Final practice plan'
      ]
    },
    sessionWork: {
      es: [
        'Técnica & biomecánica: Refinamiento de patrones de movimiento específicos, desde fundamentos hasta maniobras intermedias',
        'Mentalidad & confianza: Desarrollo de intuición y toma de decisiones en condiciones variadas',
        'Nutrición & recuperación: Planificación nutricional personalizada para optimizar cada sesión',
        'Feedback visual: Múltiples análisis de video más plan personalizado post-campamento'
      ],
      en: [
        'Technique & biomechanics: Refinement of specific movement patterns, from fundamentals to intermediate maneuvers',
        'Mindset & confidence: Development of intuition and decision-making in varying conditions',
        'Nutrition & recovery: Personalized nutrition planning to optimize each session',
        'Visual feedback: Multiple video analyses plus personalized post-camp plan'
      ]
    }
  },
  highPerformance: {
    id: 'highPerformance',
    name: { es: 'Elite Surf Program', en: 'Elite Surf Program' },
    tagline: {
      es: 'Transformación técnica profunda y análisis de alta calidad',
      en: 'Deep technical transformation and high-quality analysis'
    },
    price: 910,
    sessions: 8,
    includes: {
      es: [
        '8 sesiones de surf',
        '5 sesiones de videoanálisis avanzado',
        'Transporte a spots de surf cercanos',
        'Equipo (tabla + lycra)',
        'Teoría del surf',
        'Sesión de fotos + drone',
        'Revisión final extendida'
      ],
      en: [
        '8 surf sessions',
        '5 advanced video analysis sessions',
        'Transport to nearby surf spots',
        'Gear (board + lycra)',
        'Surf theory',
        'Photo + drone session',
        'Extended final review'
      ]
    },
    sessionWork: {
      es: [
        'Técnica & biomecánica: Análisis biomecánico profundo para crear cambios duraderos en tus patrones específicos',
        'Mentalidad & confianza: Desarrollo de resiliencia, adaptabilidad y flow state en tu zona óptima',
        'Nutrición & recuperación: Protocolos deportivos completos con periodización y estrategias personalizadas',
        'Feedback visual: Análisis exhaustivo con drone y fotografía, más plan detallado de continuidad'
      ],
      en: [
        'Technique & biomechanics: Deep biomechanical analysis to create lasting changes in your specific patterns',
        'Mindset & confidence: Development of resilience, adaptability, and flow state in your optimal zone',
        'Nutrition & recovery: Complete sports protocols with periodization and personalized strategies',
        'Visual feedback: Comprehensive analysis with drone and photography, plus detailed continuity plan'
      ]
    }
  }
} as const;

// Ceramics Options - Two distinct creative experiences
const CERAMICS_OPTIONS = {
  stories: {
    id: 'ceramic-stories',
    name: {
      es: 'Historias de Barro',
      en: 'Ceramic Stories'
    },
    tagline: {
      es: 'Pinta, recoge en 24h',
      en: 'Paint & pickup in 24h'
    },
    price: 40,
    duration: '1-1.5 hours',
    description: {
      es: 'En esta experiencia única en nuestro estudio, pintarás piezas de cerámica creadas por viajeros anteriores y te llevarás contigo tu obra terminada. También dejarás tus propias creaciones de barro para los próximos viajeros que lleguen.',
      en: 'In this unique studio experience, you\'ll paint ceramic pieces made by past travelers and take them home! You\'ll also make and leave your own handmade creations for the next ones who arrive.'
    },
    includes: {
      es: [
        'Materiales y herramientas incluidos',
        'Piezas pre-hechas para pintar',
        'Horneado durante la noche',
        'Listo para recoger en 24 horas'
      ],
      en: [
        'Materials and tools included',
        'Pre-made pieces to paint',
        'Overnight kiln firing',
        'Ready for pickup in 24 hours'
      ]
    }
  },
  immersion: {
    id: 'ceramic-immersion',
    name: {
      es: 'Forma y Esmalte',
      en: 'Shape & Shade'
    },
    tagline: {
      es: 'Dos sesiones, proceso completo',
      en: 'Two sessions, full process'
    },
    price: 80,
    duration: '2 sessions over 7 days',
    description: {
      es: '¡Viví toda la magia de la cerámica en solo dos encuentros! Durante este taller con arcilla 100% natural, exploraremos distintas técnicas para dar forma a tus propias piezas el primer día y volverás en un plazo de 7 días para elegir esmaltes y pintarlas.',
      en: 'Experience the full magic of pottery in just two days! During this immersive workshop with natural clay, you\'ll shape your own ceramic pieces on the first day and return within 7 days to give them colour!'
    },
    includes: {
      es: [
        'Arcilla 100% natural',
        'Sesión 1: Modelado con torno o mano',
        'Sesión 2: Esmaltado y pintura (dentro de 7 días)',
        'Proceso completo: ~9 días totales'
      ],
      en: [
        '100% natural clay',
        'Session 1: Shaping (wheel or hand)',
        'Session 2: Glazing & painting (within 7 days)',
        'Full process: ~9 days total'
      ]
    }
  }
} as const;

// Our Integrated Surf Coaching Method
const COACHING_METHOD = {
  title: {
    es: 'Nuestro Método Integral de Coaching de Surf',
    en: 'Our Integrated Surf Coaching Method'
  },
  pillars: [
    {
      title: { es: 'Biomecánica & memoria muscular', en: 'Biomechanics & muscle memory' },
      description: {
        es: 'Patrones de movimiento eficientes que apoyan la progresión a largo plazo.',
        en: 'Efficient movement patterns that support long-term progression.'
      }
    },
    {
      title: { es: 'Feedback técnico basado en video', en: 'Video-based technical feedback' },
      description: {
        es: 'Análisis visual claro para entender exactamente qué mejorar.',
        en: 'Clear visual analysis to understand exactly what to improve.'
      }
    },
    {
      title: { es: 'Mentalidad, seguridad & nutrición práctica', en: 'Mindset, safety & practical nutrition' },
      description: {
        es: 'Un enfoque completo para la confianza, conocimiento del océano y alimentación inteligente.',
        en: 'A complete approach to confidence, ocean awareness and smart fueling.'
      }
    }
  ]
} as const;

type ActivityCardProps = {
  activity: Activity;
  locale: "es" | "en";
  participants: number;
  isSelected: boolean;
  price: number;
  pricePerPerson?: number;
  formatPrice: (value: number) => string;
  onToggle: () => void;
  onAutoAdvance?: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  isFirstStep?: boolean;
  isSurfMandatory?: boolean;
  yogaClasses?: number;
  onYogaClassesChange?: (value: number) => void;
  yogaUsePackDiscount?: boolean;
  onYogaPackDiscountChange?: (value: boolean) => void;
  surfProgram?: 'fundamental' | 'progressionPlus' | 'highPerformance';
  onSurfProgramChange?: (value: 'fundamental' | 'progressionPlus' | 'highPerformance') => void;
  onShowPrivateCoachingModal?: () => void;
  hasQuantitySelector?: boolean;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  hasTimeSelector?: boolean;
  timeSlot?: "7:00 AM" | "3:00 PM";
  onTimeSlotChange?: (value: "7:00 AM" | "3:00 PM") => void;
  children?: React.ReactNode;
};

const localeCopy = {
  es: {
    add: "Agregar",
    remove: "Quitar",
    included: "Incluido",
    mandatory: "Obligatorio",
    choose: "Elegir",
    chosen: "Elegido",
    skip: "Omitir",
    back: "Volver",
    perPerson: "/ persona",
    classTrack: "Clases",
    quantity: "Sesiones",
    timeSlot: "Horario preferido",
    selectPackage: "Selecciona un paquete",
    yogaClasses: "Clases de Yoga",
    class: "clase",
    classes: "clases",
    total: "Total",
    packOffer: "Obtén el pack de 10 clases por $80 (ahorra $20)",
    selectPack: "Seleccionar Pack de 10",
    packSelected: "Pack de 10 Clases Seleccionado",
    regularPrice: "Precio regular",
    chooseSurfProgram: "Elige tu Programa de Surf",
  },
  en: {
    add: "Add",
    remove: "Remove",
    included: "Included",
    mandatory: "Mandatory",
    choose: "Choose",
    chosen: "Chosen",
    skip: "Skip",
    back: "Back",
    perPerson: "/ person",
    classTrack: "Classes",
    quantity: "Sessions",
    timeSlot: "Preferred time",
    selectPackage: "Choose a package",
    yogaClasses: "Yoga Classes",
    class: "class",
    classes: "classes",
    total: "Total",
    packOffer: "Get the 10-class pack for $80 (save $20)",
    selectPack: "Select 10-Class Pack",
    packSelected: "10-Class Pack Selected",
    regularPrice: "Regular price",
    chooseSurfProgram: "Choose Your Surf Program",
  },
};

const marketingContent = {
  surf: {
    rating: {
      es: "4.9",
      en: "4.9",
    },
    reviews: {
      es: "120 reseñas",
      en: "120 reviews",
    },
    trust: {
      es: "Confiado por viajeros de más de 45 países",
      en: "Trusted by travelers from 45+ countries",
    },
  },
  yoga: {
    rating: {
      es: "4.8",
      en: "4.8",
    },
    reviews: {
      es: "95 reseñas",
      en: "95 reviews",
    },
    trust: {
      es: "Sesiones frente al mar con instructores certificados",
      en: "Oceanfront sessions with certified instructors",
    },
  },
  ice_bath: {
    rating: {
      es: "5.0",
      en: "5.0",
    },
    reviews: {
      es: "48 reseñas",
      en: "48 reviews",
    },
    trust: {
      es: "Protocolo profesional de recuperación 1:1",
      en: "Professional 1:1 recovery protocol",
    },
  },
  transport: {
    rating: {
      es: "4.9",
      en: "4.9",
    },
    reviews: {
      es: "200+ reseñas",
      en: "200+ reviews",
    },
    trust: {
      es: "Traslados certificados con seguro completo",
      en: "Certified transfers with full insurance",
    },
  },
  hosting: {
    rating: {
      es: "5.0",
      en: "5.0",
    },
    reviews: {
      es: "80 reseñas",
      en: "80 reviews",
    },
    trust: {
      es: "Atención personalizada 7 días de la semana",
      en: "Personalized attention 7 days a week",
    },
  },
  default: {
    rating: { es: "", en: "" },
    reviews: { es: "", en: "" },
    trust: { es: "", en: "" },
  },
} as const;

const sellingPointsContent = {
  surf: {
    es: [
      "Coaches certificados de alto rendimiento",
      "Video análisis + feedback personalizado",
      "Equipo completo incluido",
      "Horarios según mareas y condiciones",
    ],
    en: [
      "Certified high-performance coaches",
      "Video analysis + personalized feedback",
      "All gear included",
      "Schedule aligned with tides",
    ],
  },
} as const;

const testimonialsContent = {
  surf: {
    es: [
      {
        text: "Las clases de surf fueron exactamente lo que necesitaba. Cambiaron mi forma de pensar y me ayudaron a encontrar calma en el océano.",
        author: "Catherine Cormier",
        country: "Canadá"
      },
      {
        text: "A través de las sesiones de surf aprendí a superar mis límites, respirar y encontrar paz en las olas.",
        author: "Taryne Evans",
        country: "Sudáfrica"
      },
      {
        text: "Las clases de surf fueron increíbles. Lo que antes parecía imposible se volvió realidad con solo unos pasos y grandes instructores.",
        author: "Marcelo",
        country: "Argentina"
      },
      {
        text: "Cada sesión de surf me trajo una sensación de conexión con el mar y conmigo misma.",
        author: "Luján Sánchez",
        country: "Argentina"
      },
      {
        text: "En las olas aprendí a soltar, confiar en el océano y abrir mi corazón nuevamente.",
        author: "Eilin Annika Orgland",
        country: "Suiza"
      }
    ],
    en: [
      {
        text: "The surf lessons were exactly what I needed. They changed how I think and helped me find calm in the ocean.",
        author: "Catherine Cormier",
        country: "Canada"
      },
      {
        text: "Through the surf sessions I learned to push my limits, breathe, and find peace in the waves.",
        author: "Taryne Evans",
        country: "South Africa"
      },
      {
        text: "The surf classes were incredible. What once felt impossible became real with just a few steps and great instructors.",
        author: "Marcelo",
        country: "Argentina"
      },
      {
        text: "Each surf session brought a feeling of connection with the sea and with myself.",
        author: "Luján Sánchez",
        country: "Argentina"
      },
      {
        text: "In the waves I learned to let go, trust the ocean, and open my heart again.",
        author: "Eilin Annika Orgland",
        country: "Switzerland"
      }
    ]
  }
} as const;

const CACHE_VERSION = '20251124-2200';

const activityImages = {
  surf: {
    image: `/assets/Surf.jpg?v=${CACHE_VERSION}`,
    mobileImage: `/assets/surf-mobile.jpg?v=${CACHE_VERSION}`,
    hasImage: true,
  },
  yoga: {
    image: `/assets/Yoga.jpg?v=${CACHE_VERSION}`,
    hasImage: true,
  },
  ice_bath: {
    image: `/assets/Icebath.jpg?v=${CACHE_VERSION}`,
    hasImage: true,
  },
  ceramics: {
    image: `/assets/ceramica/ceramica.jpg?v=${CACHE_VERSION}`,
    hasImage: true,
  },
  transport: {
    gradient: "from-orange-500 via-amber-400 to-yellow-500",
    hasImage: false,
  },
  hosting: {
    image: `/assets/Host.jpg?v=${CACHE_VERSION}`,
    hasImage: true,
  },
} as const;

const descriptiveContent = {
  surf: {
    es: {
      description: "",
      features: [],
    },
    en: {
      description: "",
      features: [],
    },
  },
  yoga: {
    es: {
      description: "Sesiones de yoga para comenzar el día con energía y equilibrio.",
      features: [
        { icon: Timer, text: "60 minutos" },
        { icon: Users, text: "Grupos pequeños" },
        { icon: Waves, text: "Todos los niveles" },
      ],
    },
    en: {
      description: "Yoga sessions to start the day with energy and balance.",
      features: [
        { icon: Timer, text: "60 minutes" },
        { icon: Users, text: "Small groups" },
        { icon: Waves, text: "All levels" },
      ],
    },
  },
  ice_bath: {
    es: {
      description: "Sesión de terapia de frío 1:1 para regeneración completa. Incluye técnicas de movimiento y respiración para máxima recuperación.",
      features: [
        { icon: Snowflake, text: "45 minutos" },
        { icon: User, text: "Sesión privada" },
        { icon: Wind, text: "Recuperación post-surf" },
      ],
    },
    en: {
      description: "1:1 cold therapy session for complete regeneration. Includes movement and breathing techniques for maximum recovery.",
      features: [
        { icon: Snowflake, text: "45 minutes" },
        { icon: User, text: "Private session" },
        { icon: Wind, text: "Post-surf recovery" },
      ],
    },
  },
  transport: {
    es: {
      description: "Traslados seguros y cómodos con conductores certificados. Servicio puerta a puerta con seguimiento en tiempo real.",
      features: [
        { icon: Car, text: "Vehículos AC + WiFi" },
        { icon: Shield, text: "Seguro completo" },
        { icon: MapPin, text: "Tracking en vivo" },
      ],
    },
    en: {
      description: "Safe and comfortable transfers with certified drivers. Door-to-door service with real-time tracking.",
      features: [
        { icon: Car, text: "AC + WiFi vehicles" },
        { icon: Shield, text: "Full insurance" },
        { icon: MapPin, text: "Live tracking" },
      ],
    },
  },
  hosting: {
    es: {
      description: "Personalized support from your dedicated local host. We take care of your arrival and departure logistics, coordinate your activities with our professionals, and build a personalized schedule so your entire experience flows effortlessly. Your trusted point-person throughout your stay.",
      features: [
        { icon: Clock, text: "Personalized itinerary & daily coordination" },
        { icon: MapPin, text: "Arrival & departure support" },
        { icon: Star, text: "Activity scheduling with surf coaches, yoga, photography & transport" },
        { icon: HeadphonesIcon, text: "Continuous assistance to ensure everything goes smoothly" },
      ],
    },
    en: {
      description: "Personalized support from your dedicated local host. We take care of your arrival and departure logistics, coordinate your activities with our professionals, and build a personalized schedule so your entire experience flows effortlessly. Your trusted point-person throughout your stay.",
      features: [
        { icon: Clock, text: "Personalized itinerary & daily coordination" },
        { icon: MapPin, text: "Arrival & departure support" },
        { icon: Star, text: "Activity scheduling with surf coaches, yoga, photography & transport" },
        { icon: HeadphonesIcon, text: "Continuous assistance to ensure everything goes smoothly" },
      ],
    },
  },
} as const;

const ActivityCard = ({
  activity,
  locale,
  participants,
  isSelected,
  price,
  pricePerPerson,
  formatPrice,
  onToggle,
  onAutoAdvance,
  onSkip,
  onBack,
  isFirstStep = false,
  isSurfMandatory = true,
  yogaClasses,
  onYogaClassesChange,
  yogaUsePackDiscount,
  onYogaPackDiscountChange,
  surfProgram,
  onSurfProgramChange,
  onShowPrivateCoachingModal,
  hasQuantitySelector,
  quantity = 1,
  onQuantityChange,
  hasTimeSelector,
  timeSlot = "7:00 AM",
  onTimeSlotChange,
  children,
}: ActivityCardProps) => {
  const copy = localeCopy[locale] ?? localeCopy.es;
  const marketing = marketingContent[activity.category as keyof typeof marketingContent] ?? marketingContent.default;
  const sellingPoints = sellingPointsContent[activity.category as keyof typeof sellingPointsContent]?.[locale];
  const descriptive = descriptiveContent[activity.category as keyof typeof descriptiveContent]?.[locale];

  const ratingValue = typeof marketing.rating === "object" ? marketing.rating[locale] : "";
  const reviewsText = typeof marketing.reviews === "object" ? marketing.reviews[locale] : "";
  const trustMessage = typeof marketing.trust === "object" ? marketing.trust[locale] : "";

  const isSurf = activity.category === "surf";
  const [isChoosing, setIsChoosing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has modified selectors
  const [showTestimonialsPopup, setShowTestimonialsPopup] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentSurfImageIndex, setCurrentSurfImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isCoachingMethodExpanded, setIsCoachingMethodExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedSurfProgram, setExpandedSurfProgram] = useState<'fundamental' | 'progressionPlus' | 'highPerformance' | null>(null);
  const [hasExpandedProgram, setHasExpandedProgram] = useState(false);
  const [expandedCeramicsOption, setExpandedCeramicsOption] = useState<'stories' | 'immersion' | null>(null);

  // Set mounted state for portal (SSR safety)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure surf programs start fully collapsed
  useEffect(() => {
    setExpandedSurfProgram(null);
    setHasExpandedProgram(false);
  }, []);

  const imageData = activityImages[activity.category as keyof typeof activityImages] || {
    gradient: "from-slate-600 to-slate-800",
    hasImage: false,
  };

  const testimonials = isSurf ? testimonialsContent.surf[locale] : null;
  const setLandingSectionsHidden = useBookingStore((state) => state.setLandingSectionsHidden);

  // Surf image carousel sources (memoized to keep stable references)
  const surfImagesMobile = useMemo(
    () => [
      `/assets/Surf.jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (2) Mobile.jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (3).jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (4).jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (5).jpg?v=${CACHE_VERSION}`,
      `/assets/Surfcamp - day2 - 49.jpg?v=${CACHE_VERSION}`,
      `/assets/Surfcamp_-_day2_-_43.jpg?v=${CACHE_VERSION}`,
    ],
    []
  );

  const surfImagesDesktop = useMemo(
    () => [
      `/assets/Surf.jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (2).jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (3).jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (4).jpg?v=${CACHE_VERSION}`,
      `/assets/Surf (5).jpg?v=${CACHE_VERSION}`,
      `/assets/Surfcamp - day2 - 49.jpg?v=${CACHE_VERSION}`,
      `/assets/Surfcamp_-_day2_-_43.jpg?v=${CACHE_VERSION}`,
    ],
    []
  );

  const handleNextSurfImage = () => {
    setCurrentSurfImageIndex((prev) => (prev + 1) % surfImagesMobile.length);
  };

  const handlePrevSurfImage = () => {
    setCurrentSurfImageIndex((prev) => (prev - 1 + surfImagesMobile.length) % surfImagesMobile.length);
  };

  const handleOpenImageModal = (index: number) => {
    setModalImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  const handleNextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % surfImagesDesktop.length);
  };

  const handlePrevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + surfImagesDesktop.length) % surfImagesDesktop.length);
  };

  const handleNextTestimonial = () => {
    if (testimonials) {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }
  };

  const handlePrevTestimonial = () => {
    if (testimonials) {
      setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
  };

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    if (!isSurf || !testimonials) return;

    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isSurf, testimonials]);

  // Preload all surf images on mount to prevent loading delay
  useEffect(() => {
    if (!isSurf) return;

    // Preload mobile images
    surfImagesMobile.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    // Preload desktop images
    surfImagesDesktop.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [isSurf, surfImagesMobile, surfImagesDesktop]);

  // Auto-rotate surf carousel every 4 seconds (mobile only)
  useEffect(() => {
    if (!isSurf) return;

    const interval = setInterval(() => {
      setCurrentSurfImageIndex((prev) => (prev + 1) % surfImagesMobile.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isSurf, surfImagesMobile.length]);

  // When the image modal is open, disable pointer events on the page behind it.
useEffect(() => {
  if (!showImageModal) return;

  const originalBodyPointerEvents = document.body.style.pointerEvents;
  const originalHtmlPointerEvents = document.documentElement.style.pointerEvents;

  document.body.style.pointerEvents = 'none';
  document.documentElement.style.pointerEvents = 'none';

  return () => {
    document.body.style.pointerEvents = originalBodyPointerEvents;
    document.documentElement.style.pointerEvents = originalHtmlPointerEvents;
  };
}, [showImageModal]);

const handleChoose = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isChoosing) return;

    setIsChoosing(true);

    // Call onToggle to select the activity (or re-select if already selected)
    if (!isSelected) {
      onToggle();
    }

    // Brief visual feedback before auto-advance (600ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    setIsChoosing(false);

    // Show private coaching modal for surf activities
    if (isSurf && onShowPrivateCoachingModal) {
      onShowPrivateCoachingModal();
    }

    // Auto-advance to next activity
    if (onAutoAdvance) {
      onAutoAdvance();
    }
  };


  const handleYogaClassesChange = (newClasses: number) => {
    if (onYogaClassesChange) {
      onYogaClassesChange(newClasses);
      setHasInteracted(true);
      // Si está en 10 y tenía el descuento, quitarlo al cambiar manualmente
      if (yogaUsePackDiscount && newClasses !== 10 && onYogaPackDiscountChange) {
        onYogaPackDiscountChange(false);
      }
    }
  };

  const handleYogaPackDiscountToggle = () => {
    if (onYogaPackDiscountChange && onYogaClassesChange) {
      const newDiscountState = !yogaUsePackDiscount;
      onYogaPackDiscountChange(newDiscountState);
      // Si activa el pack, establecer en 10 clases
      if (newDiscountState) {
        onYogaClassesChange(10);
      }
      setHasInteracted(true);
    }
  };

  const handleSurfProgramChange = (programId: 'fundamental' | 'progressionPlus' | 'highPerformance') => {
    if (onSurfProgramChange) {
      onSurfProgramChange(programId);
      setHasInteracted(true);
    }
  };

  const renderYogaSelector = () => {
    if (!onYogaClassesChange || typeof yogaClasses !== "number") return null;

    const currentClasses = yogaClasses;
    const isAtPackThreshold = currentClasses === 10;

    return (
      <div className="space-y-4 md:space-y-5" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#6d5f57] block">
          {copy.yogaClasses}
        </span>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between gap-4">
            {/* Counter Section */}
            <div className="flex items-center gap-4">
              <motion.button
                type="button"
                onClick={() => handleYogaClassesChange(Math.max(YOGA_CLASSES_RANGE.min, currentClasses - 1))}
                disabled={currentClasses <= YOGA_CLASSES_RANGE.min || yogaUsePackDiscount}
                whileHover={currentClasses > YOGA_CLASSES_RANGE.min && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
                whileTap={currentClasses > YOGA_CLASSES_RANGE.min && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                currentClasses <= YOGA_CLASSES_RANGE.min || yogaUsePackDiscount
                  ? "border-gray-300 bg-white text-[#6d5f57] cursor-not-allowed"
                  : "border-gray-300 bg-white text-black hover:border-amber-300/70 hover:bg-amber-300/20"
              }`}
            >
              <Minus className="h-5 w-5" />
            </motion.button>

              <div className="flex items-baseline gap-2">
                <motion.span
                  key={currentClasses}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.1 }}
                  className="text-3xl font-bold text-[#6d5f57]"
                >
                  {currentClasses}
                </motion.span>
                <span className="text-sm text-[#6d5f57] font-medium">{currentClasses === 1 ? copy.class : copy.classes}</span>
              </div>

              <motion.button
                type="button"
                onClick={() => handleYogaClassesChange(Math.min(YOGA_CLASSES_RANGE.max, currentClasses + 1))}
                disabled={currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount}
                whileHover={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
                whileTap={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount
                  ? "border-gray-300 bg-white text-[#6d5f57] cursor-not-allowed"
                  : "border-gray-300 bg-white text-black hover:border-amber-300/70 hover:bg-amber-300/20"
              }`}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
            </div>

            {/* OR Divider */}
            <span className="text-xs text-[#6d5f57] font-medium uppercase px-2">or</span>

            {/* 10-Class Pack Option */}
            <motion.button
              type="button"
              onClick={handleYogaPackDiscountToggle}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 max-w-[250px] rounded-xl px-4 py-3 border-2 transition-all min-h-[44px] ${
                yogaUsePackDiscount || isAtPackThreshold
                  ? "border-amber-300/60 bg-gradient-to-r from-amber-400/20 to-amber-300/10"
                  : "border-gray-300 bg-white hover:border-amber-300/60 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-bold text-black">
                    {locale === 'es' ? 'Pack de 10 clases' : '10-class pack'}
                  </p>
                  <motion.p
                    animate={isAtPackThreshold && !yogaUsePackDiscount ? {
                      opacity: [1, 0.6, 1],
                      scale: [1, 1.05, 1]
                    } : {}}
                    transition={{ duration: 0.6, repeat: isAtPackThreshold && !yogaUsePackDiscount ? 2 : 0 }}
                    className="text-xs text-amber-300 font-semibold"
                  >
                    {locale === 'es' ? 'ahorra $20' : 'save $20'}
                  </motion.p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-earth-600">$80</p>
                  {yogaUsePackDiscount && (
                    <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                  )}
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="md:hidden space-y-2.5 border-2 border-gray-300 rounded-xl p-2.5 bg-white/80">
          {/* Counter Section */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              type="button"
              onClick={() => handleYogaClassesChange(Math.max(YOGA_CLASSES_RANGE.min, currentClasses - 1))}
              disabled={currentClasses <= YOGA_CLASSES_RANGE.min || yogaUsePackDiscount}
              whileHover={currentClasses > YOGA_CLASSES_RANGE.min && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
              whileTap={currentClasses > YOGA_CLASSES_RANGE.min && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
              className={`flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full border-2 transition-all ${
                currentClasses <= YOGA_CLASSES_RANGE.min || yogaUsePackDiscount
                  ? "border-[white]/50 bg-[white]/30 text-[#6d5f57] cursor-not-allowed"
                  : "border-[white]/70 bg-[white]/60 text-black hover:border-amber-300/70 hover:bg-amber-300/20"
              }`}
            >
              <Minus className="h-5 w-5" />
            </motion.button>

            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentClasses}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.1 }}
                className="text-3xl font-bold text-[#6d5f57]"
              >
                {currentClasses}
              </motion.span>
              <span className="text-sm text-[#6d5f57] font-medium">{currentClasses === 1 ? copy.class : copy.classes}</span>
            </div>

            <motion.button
              type="button"
              onClick={() => handleYogaClassesChange(Math.min(YOGA_CLASSES_RANGE.max, currentClasses + 1))}
              disabled={currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount}
              whileHover={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
              whileTap={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
              className={`flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full border-2 transition-all ${
                currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount
                  ? "border-[white]/50 bg-[white]/30 text-[#6d5f57] cursor-not-allowed"
                  : "border-[white]/70 bg-[white]/60 text-black hover:border-amber-300/70 hover:bg-amber-300/20"
              }`}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <span className="text-xs text-[#6d5f57] font-medium uppercase">or</span>
            <div className="flex-1 h-px bg-slate-700/50"></div>
          </div>

          {/* 10-Class Pack Option */}
          <motion.button
            type="button"
            onClick={handleYogaPackDiscountToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full rounded-xl px-4 py-3 border-2 transition-all min-h-[44px] ${
              yogaUsePackDiscount || isAtPackThreshold
                ? "border-amber-300/60 bg-gradient-to-r from-amber-400/20 to-amber-300/10"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-bold text-black">
                  {locale === 'es' ? 'Pack de 10 clases' : '10-class pack'}
                </p>
                <motion.p
                  animate={isAtPackThreshold && !yogaUsePackDiscount ? {
                    opacity: [1, 0.6, 1],
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ duration: 0.6, repeat: isAtPackThreshold && !yogaUsePackDiscount ? 2 : 0 }}
                  className="text-xs text-amber-300 font-semibold"
                >
                  {locale === 'es' ? 'ahorra $20' : 'save $20'}
                </motion.p>
              </div>
              <div className="text-right flex items-center gap-2">
                <p className="text-lg font-bold text-earth-600">$80</p>
                {yogaUsePackDiscount && (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  };

  const renderSurfProgramSelector = () => {
    if (!onSurfProgramChange || !surfProgram) return null;

    const programs = ['fundamental', 'progressionPlus', 'highPerformance'] as const;

    return (
        <div className="space-y-3 md:space-y-3.5 border border-gray-200 rounded-xl p-3 md:p-4 bg-white/80" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#6d5f57] block">
          {copy.chooseSurfProgram}
        </span>

        {/* Programs List - Reduced spacing */}
        <div className="space-y-2 md:space-y-2.5">
          {programs.map((programId) => {
            const program = SURF_PROGRAMS[programId];
            const isSelected = surfProgram === programId;
            const isExpanded = hasExpandedProgram && expandedSurfProgram === programId;

            return (
              <motion.button
                key={programId}
                type="button"
                onClick={() => {
                  // Toggle expansion manually
                  const willExpand = expandedSurfProgram !== programId;
                  setExpandedSurfProgram(willExpand ? programId : null);
                  setHasExpandedProgram(willExpand);
                  // Always update selection
                  if (!isSelected) {
                    handleSurfProgramChange(programId);
                  }
                }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={`w-full rounded-xl px-3.5 md:px-4 py-2 md:py-2.5 border-2 transition-all text-left cursor-pointer ${
                  isSelected
                    ? "border-amber-300 bg-[white]/40"
                    : "border-gray-200 bg-[white]/60 hover:border-amber-200 hover:bg-[white]/80"
                }`}
              >
                {/* Header: Radio + Name + Price - Reduced spacing */}
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Radio Button */}
                    <div className={`flex-shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-amber-300 bg-amber-300"
                        : "border-amber-300 bg-amber-300"
                    }`}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[white]"
                        />
                      )}
                    </div>
                    {/* Program Name */}
                    <span className="text-sm md:text-base font-extrabold text-black font-heading">
                      {program.name[locale]}
                    </span>
                  </div>
                  {/* Price - Reduced margin */}
                  <span className="text-lg md:text-xl font-bold text-[#6d5f57]">
                    ${program.price}
                  </span>
                </div>

                {/* Tagline and Features - Only show when expanded */}
                {isExpanded && (
                  <>
                    {/* Tagline */}
                    <p className="text-[11px] md:text-[13px] text-black/70 font-light italic ml-7 md:ml-7.5 mt-0.5 mb-2">
                      {program.tagline[locale]}
                    </p>

                    {/* Features List - Reduced spacing */}
                    <div className="space-y-1 ml-7 md:ml-7.5">
                      {program.includes[locale].map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-[11px] md:text-[13.5px] text-black font-light leading-tight md:leading-[1.25]">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Session Work - Only show for expanded program */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 md:mt-4 mx-auto p-3 md:p-4 border border-amber-400 rounded-xl bg-amber-400/5">
                        <div className="space-y-2.5 md:space-y-3">
                          {program.sessionWork[locale].map((item, idx) => {
                            // Split by colon to separate title from description
                            const [title, ...descParts] = item.split(':');
                            const description = descParts.join(':').trim();

                            return (
                              <div key={idx}>
                                {/* Black Title - No bullet */}
                                <p className="text-[11px] md:text-[13px] font-bold text-black mb-1">
                                  {title.trim()}
                                </p>
                                {/* Description */}
                                {description && (
                                  <p className="text-[11px] md:text-[13px] text-[#6d5f57] font-light leading-relaxed">
                                    {description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCeramicsOptions = () => {
    // Show ceramic program options for any ceramics activity card
    if (activity.category !== 'ceramics') return null;

    const options = ['stories', 'immersion'] as const;

    return (
      <div className="space-y-3 md:space-y-3.5" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#6d5f57] block">
          {locale === 'es' ? 'Elige tu experiencia' : 'Choose your experience'}
        </span>

        {/* Options List */}
        <div className="space-y-2 md:space-y-2.5">
          {options.map((optionId) => {
            const option = CERAMICS_OPTIONS[optionId];
            const isExpanded = expandedCeramicsOption === optionId;

            return (
              <motion.button
                key={optionId}
                type="button"
                onClick={() => {
                  // Toggle expansion
                  setExpandedCeramicsOption(isExpanded ? null : optionId);
                }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={`w-full rounded-xl px-3.5 md:px-4 py-2 md:py-2.5 border-2 transition-all text-left cursor-pointer ${
                  isExpanded
                    ? 'border-amber-300 bg-amber-50/70 shadow-md'
                    : 'border-[white]/50 bg-[white]/40 hover:border-amber-200 hover:bg-[white]/60'
                }`}
              >
                {/* Header: Name + Price */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm md:text-base font-extrabold text-black font-heading">
                    {option.name[locale]}
                  </span>
                  <span className="text-lg md:text-xl font-bold text-[#6d5f57]">
                    ${option.price}
                  </span>
                </div>

                {/* Tagline and Description - Only show when expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {/* Tagline */}
                      <p className="text-[11px] md:text-[13px] text-black/70 font-light italic mt-0.5 mb-2">
                        {option.tagline[locale]}
                      </p>

                      {/* Description */}
                      <p className="text-xs md:text-sm text-black/80 font-light leading-relaxed mb-3">
                        {option.description[locale]}
                      </p>

                      {/* Features List */}
                      <div className="space-y-1">
                        {option.includes[locale].map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-[11px] md:text-[13.5px] text-black font-light leading-tight md:leading-[1.25]">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Duration info */}
                      <p className="text-[10px] md:text-xs text-[#6d5f57] font-medium mt-2 italic">
                        {locale === 'es' ? 'Duración: ' : 'Duration: '}{option.duration}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(newQuantity);
      setHasInteracted(true); // Mark as interacted to show "ready to choose" state
    }
  };

  const renderQuantityControl = () => {
    if (!hasQuantitySelector || !onQuantityChange) return null;

    return (
      <div className="space-y-3 md:space-y-4" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#6d5f57] block">
          {copy.quantity}
        </span>
        <div className="flex items-center justify-center gap-4 md:gap-5">
          <motion.button
            type="button"
            onClick={() => {
              if (quantity > 1) {
                handleQuantityChange(quantity - 1);
              }
            }}
            disabled={quantity <= 1}
            whileHover={{ scale: quantity > 1 ? 1.05 : 1 }}
            whileTap={{ scale: quantity > 1 ? 0.9 : 1 }}
            className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-[white]/70 bg-[white]/60 text-black transition-all ${
              quantity > 1
                ? "hover:border-amber-300/70 hover:bg-[white]/80 active:bg-amber-300/20"
                : "cursor-not-allowed opacity-40"
            }`}
          >
            <Minus className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>
          <span className="min-w-[3rem] text-center text-xl md:text-2xl font-bold text-[#6d5f57]">
            {quantity}
          </span>
          <motion.button
            type="button"
            onClick={() => handleQuantityChange(quantity + 1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-[white]/70 bg-[white]/60 text-black transition-all hover:border-amber-300/70 hover:bg-[white]/80 active:bg-amber-300/20"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>
        </div>
      </div>
    );
  };

  const handleTimeSlotSelect = (slot: "7:00 AM" | "3:00 PM") => {
    if (onTimeSlotChange) {
      onTimeSlotChange(slot);
      setHasInteracted(true); // Mark as interacted to show "ready to choose" state
    }
  };

  const renderTimeSlot = () => {
    if (!hasTimeSelector || !onTimeSlotChange) return null;

    return (
      <div className="space-y-3 md:space-y-4" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#6d5f57] block">
          {copy.timeSlot}
        </span>
        <div className="flex gap-2 md:gap-3">
          {["7:00 AM", "3:00 PM"].map((slot) => {
            const active = timeSlot === slot;
            return (
              <motion.button
                key={slot}
                type="button"
                onClick={() => handleTimeSlotSelect(slot as "7:00 AM" | "3:00 PM")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-1 items-center justify-center gap-2 md:gap-2.5 rounded-xl border px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all ${
                  active
                    ? "border-transparent bg-gradient-to-br from-amber-300 to-amber-400 text-slate-900 shadow-xl shadow-amber-300/40"
                    : "border-[white]/60 bg-[white]/50 text-black hover:border-amber-300/60 hover:bg-[white]/80"
                }`}
              >
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                {slot}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="activity-card-main w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden border border-[white]/50 bg-[white]/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_12px_32px_rgba(251,191,36,0.25)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Compact banner - clean horizontal band */}
      <div className={`relative w-full overflow-hidden group/hero ${isSurf ? 'h-[280px] md:h-[220px]' : 'h-[220px] md:h-[180px]'}`}>
        {/* Surf Mobile Carousel */}
        {isSurf ? (
          <>
            {/* Mobile: Carousel */}
            <div className="md:hidden relative w-full h-full bg-[white]" style={{ touchAction: 'manipulation' }}>
              <motion.div
                key={currentSurfImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
                style={{ touchAction: 'manipulation' }}
              >
                <Image
                  src={surfImagesMobile[currentSurfImageIndex]}
                  alt={`Surf ${currentSurfImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                  priority={true}
                  loading="eager"
                  quality={90}
                  style={{
                    objectPosition: 'center center',
                    objectFit: 'cover',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/0 pointer-events-none"></div>

              {/* Clickable overlay - DISABLED for mobile to prevent popup */}
              {/* Desktop version still has this enabled */}

              {/* Navigation Arrows - More Visible */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePrevSurfImage();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 hover:border-amber-400/60 transition-all shadow-lg active:scale-95"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNextSurfImage();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 hover:border-amber-400/60 transition-all shadow-lg active:scale-95"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Pagination Dots - Minimal & Elegant */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-1 py-0.5 rounded-full">
                {surfImagesMobile.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentSurfImageIndex(index);
                    }}
                    style={{
                      width: index === currentSurfImageIndex ? '8px' : '4px',
                      height: '4px',
                      minWidth: '4px',
                      minHeight: '4px',
                    }}
                    className={`rounded-full transition-all ${
                      index === currentSurfImageIndex
                        ? 'bg-amber-400'
                        : 'bg-white/30'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/20">
                {currentSurfImageIndex + 1} / {surfImagesMobile.length}
              </div>
            </div>

            {/* Desktop: Carousel also visible */}
            <div className="hidden md:block relative w-full h-full bg-[white]">
              <motion.div
                key={currentSurfImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={surfImagesDesktop[currentSurfImageIndex]}
                  alt={`Surf ${currentSurfImageIndex + 1}`}
                  fill
                  className="object-cover transition-all duration-500 ease-out group-hover/hero:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                  priority={true}
                  loading="eager"
                  quality={90}
                  style={{
                    objectPosition: 'center center',
                    objectFit: 'cover'
                  }}
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/0 pointer-events-none"></div>

              {/* Non-clickable overlay - disable image click */}
              <div className="absolute inset-0 z-10 pointer-events-none" />

              {/* Navigation Arrows Desktop */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePrevSurfImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 hover:border-amber-400/60 transition-all shadow-lg active:scale-95"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNextSurfImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 hover:border-amber-400/60 transition-all shadow-lg active:scale-95"
                aria-label="Next image"
              >
                <ChevronRight className="w-7 h-7" />
              </button>

              {/* Pagination Dots Desktop (display only) */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none"
                aria-hidden="true"
              >
                {surfImagesDesktop.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: index === currentSurfImageIndex ? '12px' : '6px',
                      height: '6px',
                      minWidth: '6px',
                      minHeight: '6px',
                    }}
                    className={`rounded-full transition-all ${
                      index === currentSurfImageIndex
                        ? 'bg-amber-400'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Image Counter Desktop */}
              <div className="absolute bottom-4 right-4 z-20 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-semibold border border-white/20">
                {currentSurfImageIndex + 1} / {surfImagesDesktop.length}
              </div>
            </div>
          </>
        ) : (
          /* Non-Surf Activities */
          imageData.hasImage && 'image' in imageData ? (
            <>
              <Image
                src={imageData.image}
                alt={activity.name}
                fill
                className="object-cover transition-all duration-500 ease-out group-hover/hero:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                quality={90}
                style={{
                  objectPosition: 'center center',
                  objectFit: 'cover'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
            </>
          ) : (
            <>
              <div className={`w-full h-full bg-gradient-to-br ${'gradient' in imageData ? imageData.gradient : 'from-slate-600 to-slate-800'}`}>
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            </>
          )
        )}

        {/* Category Badge - Top Left */}
        <motion.div
          className="absolute top-4 left-4 md:top-5 md:left-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[white]/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#6d5f57] border border-[#6d5f57]/30 shadow-lg">
            <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5 text-amber-300" />
            {activity.category.replace("_", " ")}
          </span>
        </motion.div>

        {/* Title Overlay - Centered - HIDDEN ON MOBILE, only desktop */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center px-6 md:px-8">
          <motion.h2
            className={`font-heading text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${
              isSurf
                ? "text-[2.2rem] leading-[1.2]"
                : "text-[2.2rem] leading-[1.2]"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {activity.name}
          </motion.h2>
        </div>

        {/* Title Overlay - Bottom - MOBILE ONLY */}
        <div className="absolute bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-black/80 via-black/60 to-transparent px-4 py-4">
          <h2 className="text-[1.3rem] md:text-3xl font-bold text-white font-heading text-center leading-tight break-words">
            {activity.name}
          </h2>
        </div>

      </div>

      {/* Our Integrated Surf Coaching Method - Only for Surf */}
      {isSurf && onSurfProgramChange && surfProgram && (
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <div className="w-full p-4 md:p-6 bg-[white]/40 rounded-xl border-2 border-gray-200">
          {/* Title */}
          <h3 className="text-xl md:text-2xl font-heading font-bold text-black mb-3">
            {COACHING_METHOD.title[locale]}
          </h3>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-black font-light leading-relaxed">
            We work with certified high-performance surf coaches, surf champions, sports psychologists, nutrition specialists, and ISA (International Surf Association) judges - all this expertise is integrated into every session.{' '}
            <strong className="font-semibold text-black">All programs adapt to your level, no restrictions</strong>
            {' '} - sessions occur with a maximum of 2-3 people per coach.
          </p>
        </div>
      </div>
    )}

      {/* PASS 2: Further tightened */}
      <div className="flex flex-col md:flex-row md:items-start md:flex-1">

        {/* PASS 2: px-5/8 py-4/6 gap-4/5 â†’ px-4/6 py-3/4 gap-3/4 */}
        <div className={`flex flex-col flex-1 md:flex-[7] px-4 md:px-6 ${isSurf ? 'py-3 md:py-4 gap-3 md:gap-4' : 'py-2.5 md:py-3 gap-2 md:gap-3'}`}>

          {/* 1. Description */}
          {descriptive && descriptive.description && (
            <div className={activity.category === 'hosting' ? 'border border-gray-300 rounded-xl p-3 md:p-4 bg-white/80' : ''}>
              <p className="text-black/90 font-light text-[13px] leading-relaxed">
                {descriptive.description}
              </p>
            </div>
          )}

          {children}

          {/* 2. Features - Bullet Points with Golden Checkmarks (only if features exist) */}
          {descriptive && descriptive.features && descriptive.features.length > 0 && (
            <div className={isSurf ? "space-y-1.5 md:space-y-2.5" : "space-y-1 md:space-y-1.5"}>
              {descriptive.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 md:gap-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className={`text-amber-500 ${isSurf ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3.5 h-3.5 md:w-4 md:h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className={`text-black font-light ${isSurf ? 'text-sm md:text-[15px] leading-snug md:leading-relaxed' : 'text-xs md:text-sm leading-snug'}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Class/Session Selector */}
          {(renderYogaSelector() || renderSurfProgramSelector() || renderCeramicsOptions() || renderQuantityControl() || renderTimeSlot()) && (
            <div>
              {renderYogaSelector()}
              {renderSurfProgramSelector()}
              {renderCeramicsOptions()}
              {renderQuantityControl()}
              {renderTimeSlot()}
            </div>
          )}
        </div>

        {/* PASS 2: px-5/6 py-4/6 gap-3/4 â†’ px-4/5 py-3/4 gap-2.5/3 */}
        <div className={`md:flex-[3] md:border-l border-[white]/40 px-4 md:px-5 bg-[white]/10 md:bg-transparent md:flex md:flex-col md:min-h-full ${isSurf ? 'py-2.5 md:py-3.5' : 'py-2 md:py-2.5'}`}>
          <div className={`flex flex-col md:justify-center md:flex-1 ${isSurf ? 'gap-2.5 md:gap-3' : 'gap-2 md:gap-2.5'}`}>

            {/* PASS 2: gap-3/4 â†’ gap-2.5/3, space-y-1.5 â†’ space-y-1 */}
            <div className={`flex flex-col items-center ${isSurf ? 'gap-2.5 md:gap-3' : 'gap-2 md:gap-2.5'}`}>
              <div className="w-full text-center space-y-1">
                <p className="text-xs uppercase tracking-wider text-[#6d5f57] font-semibold">Total</p>
                <motion.div
                  className={`font-bold text-[#6d5f57] ${isSurf ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatPrice(price)}
                </motion.div>
                {participants > 1 && typeof pricePerPerson === "number" && (
                  <p className="text-xs text-[#6d5f57] font-medium">
                    {formatPrice(pricePerPerson)} {copy.perPerson}
                  </p>
                )}
              </div>

              <div className="w-full flex flex-col gap-1.5">
                {/* Choose Button */}
                <motion.button
                  type="button"
                  onClick={handleChoose}
                  disabled={isChoosing}
                  whileHover={!isChoosing ? { scale: 1.02 } : {}}
                  whileTap={!isChoosing ? { scale: 0.98 } : {}}
                  animate={isChoosing ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 0.15 }}
                  className={`w-full rounded-2xl text-sm md:text-base font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 ${
                    isSurf ? 'px-6 md:px-8 py-3.5 md:py-4' : 'px-5 md:px-6 py-3 md:py-3.5'
                  } ${
                    isChoosing
                      ? "bg-[#6d5f57] text-white cursor-wait shadow-md"
                      : hasInteracted
                        ? "bg-[#FDCB2E] text-slate-900 shadow-xl ring-2 ring-amber-400/60 hover:shadow-2xl hover:ring-amber-400/80"
                        : "bg-[#FDCB2E] text-slate-900 shadow-md hover:bg-[#FCD34D] hover:shadow-lg"
                  }`}
                >
                  {isChoosing ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{copy.chosen}</span>
                    </>
                  ) : (
                    <>
                      <span>{copy.choose}</span>
                      <ArrowRight className="h-4 md:h-5 w-4 md:w-5 text-white" />
                    </>
                  )}
                </motion.button>

                {/* Skip Button - Only for non-mandatory activities */}
                {(!isSurf || !isSurfMandatory) && onSkip && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSkip) onSkip();
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={`w-full rounded-2xl text-sm md:text-base font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 bg-[#6d5f57] text-white shadow-md hover:shadow-xl ${
                      isSurf ? 'px-6 md:px-8 py-3.5 md:py-4' : 'px-5 md:px-6 py-3 md:py-3.5'
                    }`}
                  >
                    <span>{copy.skip}</span>
                    <ArrowRight className="h-4 md:h-5 w-4 md:w-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Mobile Back Button - compact, bottom-left */}
            {!isFirstStep && onBack && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="md:hidden self-start mt-2 rounded-lg text-xs font-semibold text-black bg-white/90 px-3 py-1.5 shadow-md border border-black/10 hover:bg-white flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                <span className="text-black">{copy.back}</span>
              </motion.button>
            )}

            {/* PASS 2: pt-3/4 â†’ pt-2.5/3, space-y-2/3 â†’ space-y-1.5/2.5 */}
            {isSurf && ratingValue && (
              <div className="w-full mt-3 md:mt-4 p-3 md:p-4 bg-amber-400/10 border-2 border-amber-400/30 rounded-xl space-y-2 md:space-y-3">
                {/* Rating */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 md:h-5 w-4 md:w-5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm md:text-base font-bold text-black">{ratingValue}</span>
                  <span className="text-xs md:text-sm text-[#6d5f57] font-medium">({reviewsText})</span>
                </div>

                {/* Testimonial */}
                {testimonials && (
                  <div className="space-y-2.5">
                    <p className="text-xs md:text-sm leading-relaxed text-black font-light italic text-center">
                      &ldquo;{testimonials[currentTestimonialIndex].text}&rdquo;
                    </p>
                    {/* Author & Country */}
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-xs md:text-sm font-semibold text-black">
                        {testimonials[currentTestimonialIndex].author}
                      </p>
                      <p className="text-[10px] md:text-xs uppercase tracking-wider text-[#6d5f57] font-medium">
                        {testimonials[currentTestimonialIndex].country}
                      </p>
                    </div>
                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2">
                      {testimonials.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTestimonialIndex(idx);
                          }}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentTestimonialIndex
                              ? "bg-amber-400 w-6"
                              : "bg-gray-400 w-2 hover:bg-gray-500"
                          }`}
                          aria-label={`Go to testimonial ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust message */}
                {trustMessage && (
                  <p className="text-xs md:text-sm text-black/80 font-medium text-center">
                    {trustMessage}
                  </p>
                )}
              </div>
            )}


            {/* Navigation Buttons for Surf (maintains original vertical layout) */}
            {isSurf && ((!isSurfMandatory && onSkip) || onBack) && (
              <div className="hidden md:flex w-full pt-4 md:pt-5 border-t border-[white]/30 flex-col gap-3">
                {/* Back Button */}
                {!isFirstStep && onBack && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBack) onBack();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-black bg-white/80 px-4 py-2 rounded-xl shadow-md border border-black/10 hover:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4 text-black" />
                    <span className="text-black">{copy.back}</span>
                  </motion.button>
                )}

                {/* Skip Button - Only for non-mandatory activities */}
                {(!isSurf || !isSurfMandatory) && onSkip && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSkip) onSkip();
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium text-white bg-[#6d5f57] transition-all px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
                  >
                    {copy.skip}
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Footer - Navigation for non-Surf cards */}
      {(!isSurf || !isSurfMandatory) && (onSkip || onBack) && (
        <div className="hidden md:block border-t border-[white]/40 px-6 md:px-10 py-5 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button */}
            {!isFirstStep && onBack && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBack) onBack();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 text-sm font-semibold text-black bg-white/80 px-4 py-2 rounded-xl shadow-md border border-black/10 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                <span className="text-black">{copy.back}</span>
              </motion.button>
            )}

            {/* Right Side - Spacer (Choose button is in the right column above) */}
            <div />
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default ActivityCard;
