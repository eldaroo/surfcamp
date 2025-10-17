"use client";

import { useState } from "react";
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
} from "lucide-react";

const YOGA_PACKAGES = ["1-class", "3-classes", "10-classes"] as const;
const SURF_CLASSES_RANGE = { min: 3, max: 10 } as const;

type YogaPackage = (typeof YOGA_PACKAGES)[number];

type ActivityCardProps = {
  activity: Activity;
  locale: "es" | "en";
  participants: number;
  isSelected: boolean;
  price: number;
  pricePerPerson?: number;
  formatPrice: (value: number) => string;
  onToggle: () => void;
  selectedYogaPackage?: YogaPackage;
  onYogaPackageChange?: (value: YogaPackage) => void;
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
    perPerson: "/ persona",
    classTrack: "Clases",
    quantity: "Sesiones",
    timeSlot: "Horario preferido",
    selectPackage: "Selecciona un paquete",
  },
  en: {
    add: "Add",
    remove: "Remove",
    perPerson: "/ person",
    classTrack: "Classes",
    quantity: "Sessions",
    timeSlot: "Preferred time",
    selectPackage: "Choose a package",
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

const activityImages = {
  surf: {
    image: "/assets/Surf.jpg",
    hasImage: true,
  },
  yoga: {
    image: "/assets/Yoga.jpg",
    hasImage: true,
  },
  ice_bath: {
    image: "/assets/Icebath.jpg",
    hasImage: true,
  },
  transport: {
    gradient: "from-orange-500 via-amber-400 to-yellow-500",
    hasImage: false,
  },
  hosting: {
    gradient: "from-green-500 via-emerald-400 to-teal-500",
    hasImage: false,
  },
} as const;

const descriptiveContent = {
  yoga: {
    es: {
      description: "Sesiones de yoga al amanecer para comenzar el día con energía y equilibrio.",
      features: [
        { icon: Timer, text: "60 minutos" },
        { icon: Users, text: "Grupos pequeños" },
        { icon: Waves, text: "Todos los niveles" },
      ],
    },
    en: {
      description: "Sunrise yoga sessions to start the day with energy and balance.",
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
  selectedYogaPackage,
  onYogaPackageChange,
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
  const [isFlipped, setIsFlipped] = useState(false);
  const imageData = activityImages[activity.category as keyof typeof activityImages] || {
    gradient: "from-slate-600 to-slate-800",
    hasImage: false,
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const renderYogaPackages = () => {
    if (!onYogaPackageChange) return null;

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {copy.selectPackage}
        </span>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {YOGA_PACKAGES.map((pkg) => {
            const isActive = selectedYogaPackage === pkg;
            return (
              <button
                key={pkg}
                type="button"
                onClick={() => onYogaPackageChange(pkg)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-transparent bg-amber-300 text-slate-900 shadow-lg shadow-amber-300/30"
                    : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70"
                }`}
              >
                {pkg.replace("-classes", "").replace("-class", " clase")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSurfSelector = () => {
    if (!onSurfClassesChange || typeof surfClasses !== "number") return null;

    return (
      <div className="relative space-y-2 md:space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>
            {surfClasses} {copy.classTrack}
          </span>
          <span className="flex items-center gap-1 text-amber-200">
            <Users className="h-3 w-3" aria-hidden="true" />
            {participants}
          </span>
        </div>
        <div className="px-1">
          <input
            type="range"
            min={SURF_CLASSES_RANGE.min}
            max={SURF_CLASSES_RANGE.max}
            value={surfClasses}
            onChange={(event) => onSurfClassesChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer rounded-full bg-slate-700 accent-amber-300"
          />
        </div>
        <div className="flex justify-between text-[10px] md:text-[11px] uppercase tracking-wider text-slate-500 px-1">
          <span>{SURF_CLASSES_RANGE.min}</span>
          <span>{SURF_CLASSES_RANGE.max}</span>
        </div>
      </div>
    );
  };

  const renderQuantityControl = () => {
    if (!hasQuantitySelector || !onQuantityChange) return null;

    return (
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {copy.quantity}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-800/80 text-slate-200 transition hover:border-amber-300/70"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2rem] text-center text-lg font-semibold text-slate-100">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-800/80 text-slate-200 transition hover:border-amber-300/70"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderTimeSlot = () => {
    if (!hasTimeSelector || !onTimeSlotChange) return null;

    return (
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {copy.timeSlot}
        </span>
        <div className="flex gap-2">
          {["7:00 AM", "3:00 PM"].map((slot) => {
            const active = timeSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotChange(slot as "7:00 AM" | "3:00 PM")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-transparent bg-amber-300 text-slate-900 shadow-lg shadow-amber-300/30"
                    : "border-slate-600/70 bg-slate-800/60 text-slate-200 hover:border-amber-300/70"
                }`}
              >
                <Clock className="h-4 w-4" />
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flip-card w-full h-full min-h-[280px] md:min-h-[320px]" style={{ perspective: '1000px' }}>
      <motion.div
        className="flip-card-inner w-full h-full min-h-[280px] md:min-h-[320px] relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 25
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face - Image */}
        <div
          className="flip-card-face flip-card-front absolute w-full h-full rounded-3xl overflow-hidden cursor-pointer group/card"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
        >
          <div className="w-full h-full relative min-h-[280px]">
            {imageData.hasImage && 'image' in imageData ? (
              <>
                <Image
                  src={imageData.image}
                  alt={activity.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  style={{ objectPosition: 'center 65%' }}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 transition-opacity duration-300 group-hover/card:opacity-80"></div>
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover/card:bg-white/10"></div>
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${'gradient' in imageData ? imageData.gradient : 'from-slate-600 to-slate-800'}`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover/card:bg-white/10"></div>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {activity.name}
                </h2>
                <p className="text-base md:text-xl text-white/90 uppercase tracking-wider drop-shadow-md">
                  {activity.category.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-semibold">
              {locale === "es" ? "Toca para ver detalles" : "Tap to see details"}
            </div>
          </div>
        </div>

        {/* Back Face - Details */}
        <div
          className="flip-card-face flip-card-back absolute w-full h-full rounded-3xl cursor-pointer"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={handleFlip}
        >
          <div className="group flex w-full h-full flex-col md:flex-row items-stretch rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20 overflow-y-auto md:overflow-visible">
            <div className="flex flex-1 flex-col px-4 md:px-6 py-4 md:py-7 gap-4 md:gap-5">
              <div className="flex items-start justify-between flex-shrink-0">
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-200">
                    <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5 text-amber-300" />
                    {activity.category.replace("_", " ")}
                  </span>
                  <h3 className="mt-3 md:mt-4 text-xl md:text-2xl font-bold text-slate-100">{activity.name}</h3>

                  {/* Rating for mobile only */}
                  {isSurf && ratingValue && (
                    <div className="mt-3 space-y-1.5 md:hidden">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-amber-300 text-amber-300"
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-slate-100">
                          {ratingValue}
                        </span>
                        <span className="text-[10px] text-slate-400">({reviewsText})</span>
                      </div>
                      {trustMessage && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                          <Globe className="h-3 w-3 text-amber-300" />
                          <span>{trustMessage}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isSurf && sellingPoints && sellingPoints.length > 0 ? (
                    <ul className="mt-3 md:mt-5 space-y-1 md:space-y-1.5 text-xs md:text-sm text-slate-200">
                      {sellingPoints.map((point, index) => (
                        <li
                          key={`${activity.id}-point-${index}`}
                          className="flex items-start gap-1.5 md:gap-2"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0 text-amber-300" />
                          <span className="leading-snug">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : !isSurf && descriptive ? (
                    <div className="mt-3 md:mt-4 space-y-2 md:space-y-4">
                      <p className="text-xs md:text-sm leading-relaxed text-slate-300">
                        {descriptive.description}
                      </p>
                      <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1.5 md:gap-y-2">
                        {descriptive.features.map((feature, index) => {
                          const Icon = feature.icon;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-300"
                            >
                              <Icon className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0 text-amber-300" />
                              <span>{feature.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-6 md:h-8 w-6 md:w-8 text-amber-300" aria-hidden="true" />
                )}
              </div>

              {(renderYogaPackages() || renderSurfSelector() || renderQuantityControl() || renderTimeSlot()) && (
                <div className="space-y-3 md:space-y-4">
                  {renderYogaPackages()}
                  {renderSurfSelector()}
                  {renderQuantityControl()}
                  {renderTimeSlot()}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between items-center gap-3 md:gap-4 border-t md:border-t-0 md:border-l border-slate-700/60 bg-slate-800/30 px-4 md:px-6 py-4 md:py-6 md:min-w-[280px]" onClick={(e) => e.stopPropagation()}>

              {/* Rating section for desktop only */}
              {isSurf && ratingValue && (
                <div className="hidden md:block w-full pb-4 border-b border-slate-700/40">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-300 text-amber-300"
                        />
                      ))}
                      <span className="ml-1.5 text-sm font-bold text-slate-100">
                        {ratingValue}
                      </span>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 uppercase tracking-wide">
                      ({reviewsText})
                    </p>
                    {trustMessage && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-300 pt-1">
                        <Globe className="h-3 w-3 text-amber-300 flex-shrink-0" />
                        <span className="text-center leading-tight">{trustMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center w-full">
                <span className="text-xs md:text-sm font-medium uppercase tracking-wide text-slate-400 block mb-1 md:mb-2">Total</span>
                <div className="text-2xl md:text-3xl font-bold text-slate-100">
                  {formatPrice(price)}
                </div>
                {participants > 1 && typeof pricePerPerson === "number" && (
                  <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">
                    {formatPrice(pricePerPerson)} {copy.perPerson}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className={`w-full rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold transition ${
                  isSelected
                    ? "bg-slate-800/90 text-amber-200 hover:bg-slate-800"
                    : "bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 text-slate-900 shadow-lg shadow-amber-300/40 hover:from-amber-200 hover:to-amber-300"
                }`}
              >
                {isSelected ? copy.remove : copy.add}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityCard;
