"use client";

import { motion } from "framer-motion";
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

  const renderYogaPackages = () => {
    if (!onYogaPackageChange) return null;

    return (
      <div>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>
            {surfClasses} {copy.classTrack}
          </span>
          <span className="flex items-center gap-1 text-amber-200">
            <Users className="h-3 w-3" aria-hidden="true" />
            {participants}
          </span>
        </div>
        <input
          type="range"
          min={SURF_CLASSES_RANGE.min}
          max={SURF_CLASSES_RANGE.max}
          value={surfClasses}
          onChange={(event) => onSurfClassesChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer rounded-full bg-slate-700 accent-amber-300"
        />
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-slate-500">
          <span>{SURF_CLASSES_RANGE.min}</span>
          <span>{SURF_CLASSES_RANGE.max}</span>
        </div>
      </div>
    );
  };

  const renderQuantityControl = () => {
    if (!hasQuantitySelector || !onQuantityChange) return null;

    return (
      <div className="space-y-3">
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
      <div className="space-y-3">
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
    <motion.div
      layout
      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-700/60 bg-slate-900/70 px-6 py-7 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {activity.category.replace("_", " ")}
            </span>
            <h3 className="mt-5 text-xl font-bold text-slate-100">{activity.name}</h3>

            {isSurf && ratingValue && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-300 text-amber-300"
                    />
                  ))}
                  <span className="ml-1 text-sm font-bold text-slate-100">
                    {ratingValue}
                  </span>
                  <span className="text-xs text-slate-400">({reviewsText})</span>
                </div>
                {trustMessage && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Globe className="h-3.5 w-3.5 text-amber-300" />
                    <span>{trustMessage}</span>
                  </div>
                )}
              </div>
            )}

            {isSurf && sellingPoints && sellingPoints.length > 0 ? (
              <ul className="mt-5 space-y-1.5 text-sm text-slate-200">
                {sellingPoints.map((point, index) => (
                  <li
                    key={`${activity.id}-point-${index}`}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            ) : !isSurf && descriptive ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  {descriptive.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {descriptive.features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 text-xs text-slate-300"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-amber-300" />
                        <span>{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          {isSelected && (
            <CheckCircle2 className="h-8 w-8 text-amber-300" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-5">
          {renderYogaPackages()}
          {renderSurfSelector()}
          {renderQuantityControl()}
          {renderTimeSlot()}
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-slate-400">Total</span>
          <div className="mt-1 text-2xl font-bold text-slate-100">
            {formatPrice(price)}
          </div>
          {participants > 1 && typeof pricePerPerson === "number" && (
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {formatPrice(pricePerPerson)} {copy.perPerson}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
            isSelected
              ? "bg-slate-800/90 text-amber-200 hover:bg-slate-800"
              : "bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 text-slate-900 shadow-lg shadow-amber-300/40 hover:from-amber-200 hover:to-amber-300"
          }`}
        >
          {isSelected ? copy.remove : copy.add}
        </button>
      </div>
    </motion.div>
  );
};

export default ActivityCard;
