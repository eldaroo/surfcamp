"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Activity } from "@/types";
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

const SURF_CLASSES_RANGE = { min: 3, max: 10 } as const;
const YOGA_CLASSES_RANGE = { min: 1, max: 15 } as const;

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
  yogaClasses?: number;
  onYogaClassesChange?: (value: number) => void;
  yogaUsePackDiscount?: boolean;
  onYogaPackDiscountChange?: (value: boolean) => void;
  surfClasses?: number;
  onSurfClassesChange?: (value: number) => void;
  hasQuantitySelector?: boolean;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  hasTimeSelector?: boolean;
  timeSlot?: "7:00 AM" | "3:00 PM";
  onTimeSlotChange?: (value: "7:00 AM" | "3:00 PM") => void;
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
      es: "Confiado por viajeros de más de 15 países",
      en: "Trusted by travelers from 15+ countries",
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
      "Coaches certificados según tu nivel",
      "Video análisis + feedback personalizado",
      "Equipo completo incluido",
      "Horarios según mareas y condiciones",
    ],
    en: [
      "Certified coaches for your level",
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

const CACHE_VERSION = '20251017-1900';

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
      description: "Aprende a surfear o mejora tu técnica con coaches certificados. Cada sesión incluye video análisis personalizado.",
      features: [
        { icon: Users, text: "Análisis de video personalizado" },
        { icon: Users, text: "Todo el equipo incluido - tablas, rashguards y transporte" },
        { icon: Users, text: "Surfea los mejores points locales con tu coach" },
        { icon: Users, text: "Grupos pequeños (máx. 2 por instructor) para un progreso rápido" },
        { icon: Users, text: "Coaches de surf certificados enfocados en tu técnica" },
      ],
    },
    en: {
      description: "Learn to surf or improve your technique with certified coaches. Each session includes personalized video analysis.",
      features: [
        { icon: Users, text: "Personalized video analysis" },
        { icon: Users, text: "All gear included - boards, rashguards & transport" },
        { icon: Users, text: "Surf top local breaks with your coach" },
        { icon: Users, text: "Small groups (max 2 per instructor) for fast progress" },
        { icon: Users, text: "Certified surf coaches focused on your technique" },
      ],
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
      description: "Atención personalizada con concierge local dedicado. Planificamos tu experiencia completa según tus preferencias.",
      features: [
        { icon: HeadphonesIcon, text: "Disponible 7 días" },
        { icon: Star, text: "Reservas prioritarias" },
        { icon: Clock, text: "Soporte 24/7" },
      ],
    },
    en: {
      description: "Personalized attention with dedicated local concierge. We plan your complete experience according to your preferences.",
      features: [
        { icon: HeadphonesIcon, text: "Available 7 days" },
        { icon: Star, text: "Priority bookings" },
        { icon: Clock, text: "24/7 support" },
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
  yogaClasses,
  onYogaClassesChange,
  yogaUsePackDiscount,
  onYogaPackDiscountChange,
  surfClasses,
  onSurfClassesChange,
  hasQuantitySelector,
  quantity = 1,
  onQuantityChange,
  hasTimeSelector,
  timeSlot = "7:00 AM",
  onTimeSlotChange,
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
  const imageData = activityImages[activity.category as keyof typeof activityImages] || {
    gradient: "from-slate-600 to-slate-800",
    hasImage: false,
  };

  const testimonials = isSurf ? testimonialsContent.surf[locale] : null;

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

  const renderYogaSelector = () => {
    if (!onYogaClassesChange || typeof yogaClasses !== "number") return null;

    const currentClasses = yogaClasses;
    const isAtPackThreshold = currentClasses === 10;

    return (
      <div className="space-y-4 md:space-y-5" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 block">
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
                    ? "border-slate-700/50 bg-slate-800/30 text-slate-600 cursor-not-allowed"
                    : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70 hover:bg-amber-300/20"
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
                  className="text-3xl font-bold text-slate-50"
                >
                  {currentClasses}
                </motion.span>
                <span className="text-sm text-slate-400 font-medium">{currentClasses === 1 ? copy.class : copy.classes}</span>
              </div>

              <motion.button
                type="button"
                onClick={() => handleYogaClassesChange(Math.min(YOGA_CLASSES_RANGE.max, currentClasses + 1))}
                disabled={currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount}
                whileHover={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
                whileTap={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                  currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount
                    ? "border-slate-700/50 bg-slate-800/30 text-slate-600 cursor-not-allowed"
                    : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70 hover:bg-amber-300/20"
                }`}
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </div>

            {/* OR Divider */}
            <span className="text-xs text-slate-500 font-medium uppercase px-2">or</span>

            {/* 10-Class Pack Option */}
            <motion.button
              type="button"
              onClick={handleYogaPackDiscountToggle}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 max-w-[250px] rounded-xl px-4 py-3 border-2 transition-all min-h-[44px] ${
                yogaUsePackDiscount || isAtPackThreshold
                  ? "border-amber-300/60 bg-gradient-to-r from-amber-400/20 to-amber-300/10"
                  : "border-slate-600/50 bg-slate-800/40 hover:border-amber-300/40 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-200">
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
                  <p className="text-lg font-bold text-amber-300">$80</p>
                  {yogaUsePackDiscount && (
                    <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                  )}
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="md:hidden space-y-3">
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
                  ? "border-slate-700/50 bg-slate-800/30 text-slate-600 cursor-not-allowed"
                  : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70 hover:bg-amber-300/20"
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
                className="text-3xl font-bold text-slate-50"
              >
                {currentClasses}
              </motion.span>
              <span className="text-sm text-slate-400 font-medium">{currentClasses === 1 ? copy.class : copy.classes}</span>
            </div>

            <motion.button
              type="button"
              onClick={() => handleYogaClassesChange(Math.min(YOGA_CLASSES_RANGE.max, currentClasses + 1))}
              disabled={currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount}
              whileHover={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 1.05 } : {}}
              whileTap={currentClasses < YOGA_CLASSES_RANGE.max && !yogaUsePackDiscount ? { scale: 0.95 } : {}}
              className={`flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full border-2 transition-all ${
                currentClasses >= YOGA_CLASSES_RANGE.max || yogaUsePackDiscount
                  ? "border-slate-700/50 bg-slate-800/30 text-slate-600 cursor-not-allowed"
                  : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70 hover:bg-amber-300/20"
              }`}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <span className="text-xs text-slate-500 font-medium uppercase">or</span>
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
                : "border-slate-600/50 bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-200">
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
                <p className="text-lg font-bold text-amber-300">$80</p>
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

  const handleSurfClassesChange = (newClasses: number) => {
    if (onSurfClassesChange) {
      onSurfClassesChange(newClasses);
      setHasInteracted(true); // Mark as interacted to show "ready to choose" state
    }
  };

  const renderSurfSelector = () => {
    if (!onSurfClassesChange || typeof surfClasses !== "number") return null;

    return (
      <div className="relative space-y-3 md:space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400">
            {copy.classTrack}
          </span>
          <span className="text-base md:text-lg font-bold text-amber-300">
            {surfClasses}
          </span>
        </div>
        <div className="px-1">
          <input
            type="range"
            min={SURF_CLASSES_RANGE.min}
            max={SURF_CLASSES_RANGE.max}
            value={surfClasses}
            onChange={(event) => handleSurfClassesChange(Number(event.target.value))}
            className="h-2.5 md:h-3 w-full cursor-pointer rounded-full bg-slate-700/70 accent-amber-400 transition-all hover:accent-amber-300"
            style={{
              background: `linear-gradient(to right, rgb(251 191 36) 0%, rgb(251 191 36) ${((surfClasses - SURF_CLASSES_RANGE.min) / (SURF_CLASSES_RANGE.max - SURF_CLASSES_RANGE.min)) * 100}%, rgb(51 65 85 / 0.7) ${((surfClasses - SURF_CLASSES_RANGE.min) / (SURF_CLASSES_RANGE.max - SURF_CLASSES_RANGE.min)) * 100}%, rgb(51 65 85 / 0.7) 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
          <span>{SURF_CLASSES_RANGE.min}</span>
          <span>{SURF_CLASSES_RANGE.max}</span>
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
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 block">
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
            className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-slate-600/70 bg-slate-800/60 text-slate-200 transition-all ${
              quantity > 1
                ? "hover:border-amber-300/70 hover:bg-slate-700/80 active:bg-amber-300/20"
                : "cursor-not-allowed opacity-40"
            }`}
          >
            <Minus className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>
          <span className="min-w-[3rem] text-center text-xl md:text-2xl font-bold text-slate-50">
            {quantity}
          </span>
          <motion.button
            type="button"
            onClick={() => handleQuantityChange(quantity + 1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-slate-600/70 bg-slate-800/60 text-slate-200 transition-all hover:border-amber-300/70 hover:bg-slate-700/80 active:bg-amber-300/20"
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
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 block">
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
                    : "border-slate-600/60 bg-slate-800/50 text-slate-200 hover:border-amber-300/60 hover:bg-slate-800/70"
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
      className="w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden border border-slate-700/50 bg-slate-900/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_12px_32px_rgba(251,191,36,0.25)] hover:scale-[1.01]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Visual Section - Top */}
      <div className="relative w-full h-[180px] md:h-[275px] overflow-hidden group/hero">
        {imageData.hasImage && 'image' in imageData ? (
          <>
            <div
              className="activity-card-bg absolute inset-0 bg-no-repeat transition-all duration-500 ease-out group-hover/hero:scale-110"
              style={{
                backgroundImage: `url(${imageData.image})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
            <style jsx>{`
              .activity-card-bg {
                background-size: cover;
                background-position: center 65%;
              }

              /* Mobile responsive positioning for better framing */
              @media (max-width: 768px) {
                .activity-card-bg {
                  background-size: cover;
                  background-position: ${isSurf ? 'center 40%' : activity.category === 'yoga' ? 'center 35%' : 'center 40%'};
                  ${isSurf && 'mobileImage' in imageData ? `background-image: url(${imageData.mobileImage}) !important;` : ''}
                }
              }

              /* Desktop - keep current behavior */
              @media (min-width: 769px) {
                .activity-card-bg {
                  background-size: cover;
                  background-position: ${isSurf ? 'center 60%' : 'center 65%'};
                }
              }
            `}</style>
          </>
        ) : (
          <>
            <div className={`w-full h-full bg-gradient-to-br ${'gradient' in imageData ? imageData.gradient : 'from-slate-600 to-slate-800'}`}>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          </>
        )}

        {/* Category Badge - Top Left */}
        <motion.div
          className="absolute top-4 left-4 md:top-5 md:left-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-amber-200 border border-amber-300/30 shadow-lg">
            <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5 text-amber-300" />
            {activity.category.replace("_", " ")}
          </span>
        </motion.div>

        {/* Title Overlay - Centered */}
        <div className="absolute inset-0 flex items-center justify-center px-6 md:px-8">
          <motion.h2
            className="text-[1.5rem] md:text-[2rem] leading-tight font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] font-heading text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {activity.name}
          </motion.h2>
        </div>

      </div>

      {/* Information Section - Two Column Layout */}
      <div className="flex flex-col md:flex-row md:items-start md:flex-1">

        {/* Left Column (65-70%) - Information */}
        <div className="flex flex-col flex-1 md:flex-[7] px-6 md:px-10 py-5 md:py-8 gap-5 md:gap-7">

          {/* 1. Description */}
          {descriptive && (
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-300/90 font-light">
              {descriptive.description}
            </p>
          )}

          {/* 2. Features - Bullet Points with Golden Checkmarks */}
          {descriptive && (
            <div className="space-y-1.5 md:space-y-2.5">
              {descriptive.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 md:gap-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="text-sm md:text-[15px] text-slate-200 font-light leading-snug md:leading-relaxed">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Class/Session Selector */}
          {(renderYogaSelector() || renderSurfSelector() || renderQuantityControl() || renderTimeSlot()) && (
            <div>
              {renderYogaSelector()}
              {renderSurfSelector()}
              {renderQuantityControl()}
              {renderTimeSlot()}
            </div>
          )}
        </div>

        {/* Right Column (30-35%) - Action Block */}
        <div className="md:flex-[3] md:border-l border-slate-700/40 px-6 md:px-8 py-5 md:py-8 bg-slate-800/10 md:bg-transparent">
          <div className="flex flex-col gap-4 md:gap-6 md:sticky md:top-8 h-full">

            {/* Top Section - Price and Choose Button */}
            <div className="flex flex-col items-center gap-4 md:gap-6">
              {/* Price */}
              <div className="w-full text-center space-y-2">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total</p>
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-slate-50"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatPrice(price)}
                </motion.div>
                {participants > 1 && typeof pricePerPerson === "number" && (
                  <p className="text-xs text-slate-400 font-medium">
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
                  className={`w-full rounded-2xl px-6 md:px-8 py-3.5 md:py-4 text-sm md:text-base font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 ${
                    isChoosing
                      ? "bg-[#164F3E] text-slate-50 cursor-wait shadow-md"
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
                      <ArrowRight className="h-4 md:h-5 w-4 md:w-5" />
                    </>
                  )}
                </motion.button>

                {/* Skip Button - Only for non-mandatory activities */}
                {!isSurf && onSkip && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSkip) onSkip();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="w-full rounded-2xl px-6 md:px-8 py-3.5 md:py-4 text-sm md:text-base font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-2 bg-slate-700/50 text-slate-200 shadow-md hover:bg-slate-600/70 hover:shadow-lg"
                  >
                    <span>{copy.skip}</span>
                    <ArrowRight className="h-4 md:h-5 w-4 md:w-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Social Proof (Surf only) - Moved here, below Choose button */}
            {isSurf && ratingValue && (
              <div className="w-full pt-4 md:pt-5 border-t border-slate-700/30 space-y-3 md:space-y-4">
                {/* Rating */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 md:h-4 w-3.5 md:w-4 fill-amber-300 text-amber-300"
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-100">{ratingValue}</span>
                  <span className="text-[10px] md:text-xs text-slate-400">({reviewsText})</span>
                </div>

                {/* Testimonial */}
                {testimonials && (
                  <div className="space-y-2.5">
                    <p className="text-xs md:text-sm leading-relaxed text-slate-200/80 font-light italic text-center line-clamp-2">
                      &ldquo;{testimonials[currentTestimonialIndex].text}&rdquo;
                    </p>
                    {/* Author & Country */}
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-[11px] md:text-xs font-semibold text-amber-300/90">
                        {testimonials[currentTestimonialIndex].author}
                      </p>
                      <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                        {testimonials[currentTestimonialIndex].country}
                      </p>
                    </div>
                    {/* Dots */}
                    <div className="flex items-center justify-center gap-1.5">
                      {testimonials.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTestimonialIndex(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentTestimonialIndex
                              ? "bg-amber-300 w-4"
                              : "bg-slate-600 w-1.5 hover:bg-slate-500"
                          }`}
                          aria-label={`Go to testimonial ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust message */}
                {trustMessage && (
                  <p className="text-xs md:text-sm text-slate-300/80 font-medium text-center">
                    {trustMessage}
                  </p>
                )}
              </div>
            )}


            {/* Navigation Buttons for Surf (maintains original vertical layout) */}
            {isSurf && (onSkip || onBack) && (
              <div className="hidden md:flex w-full pt-4 md:pt-5 border-t border-slate-700/30 flex-col gap-3">
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
                    className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{copy.back}</span>
                  </motion.button>
                )}

                {/* Skip Button - Only for non-mandatory activities */}
                {!isSurf && onSkip && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSkip) onSkip();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
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
      {!isSurf && (onSkip || onBack) && (
        <div className="hidden md:block border-t border-slate-700/40 px-6 md:px-10 py-5 md:py-6">
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
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{copy.back}</span>
              </motion.button>
            )}

            {/* Right Side - Spacer (Choose button is in the right column above) */}
            <div />
          </div>
        </div>
      )}

      {/* Navigation Buttons (Skip/Back) - Mobile only */}
      {(onSkip || onBack) && (
        <div className="md:hidden border-t border-slate-700/40 bg-slate-800/10 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            {!isFirstStep && onBack ? (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBack) onBack();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{copy.back}</span>
              </motion.button>
            ) : (
              <div />
            )}

            {/* Skip Button - Only for non-mandatory activities */}
            {!isSurf && onSkip && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSkip) onSkip();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copy.skip}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Testimonials Popup */}
      {showTestimonialsPopup && testimonials && (
        <motion.div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowTestimonialsPopup(false)}
        >
          <motion.div
            className="w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-x border-slate-700/50 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                {locale === "es" ? "Testimonios" : "Testimonials"}
              </h3>
              <motion.button
                type="button"
                onClick={() => setShowTestimonialsPopup(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
              >
                <X className="h-5 w-5 text-slate-300" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              <div className="relative bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <Quote className="absolute top-4 left-4 h-8 w-8 text-amber-300/20" />

                <div className="space-y-5 pt-3">
                  {/* Stars */}
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-amber-300 text-amber-300"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-sm leading-relaxed text-slate-200 italic text-center min-h-[100px] flex items-center justify-center">
                    &ldquo;{testimonials[currentTestimonialIndex].text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="text-center pt-3 border-t border-slate-700/30">
                    <p className="text-sm font-bold text-amber-300">
                      {testimonials[currentTestimonialIndex].author}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                      {testimonials[currentTestimonialIndex].country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <motion.button
                  type="button"
                  onClick={handlePrevTestimonial}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors border border-slate-700/40"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-300" />
                </motion.button>

                <div className="flex gap-2">
                  {testimonials.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentTestimonialIndex
                          ? "bg-amber-300 w-6"
                          : "bg-slate-600 w-2"
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  type="button"
                  onClick={handleNextTestimonial}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors border border-slate-700/40"
                >
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default ActivityCard;
