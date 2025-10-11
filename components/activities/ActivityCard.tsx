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
    rating: "4.9 \u2605 Experiencias verificadas",
    limited: "Cupos reducidos diario",
    highlight: "Incluye videoan\u00e1lisis premium",
  },
  yoga: {
    rating: "Sesiones frente al mar",
    limited: "Grupos peque\u00f1os guiados",
    highlight: "Mats y props incluidos",
  },
  ice_bath: {
    rating: "1:1 Recovery Pro",
    limited: "S\u00f3lo 6 turnos al d\u00eda",
    highlight: "Respiraci\u00f3n guiada + coaching",
  },
  transport: {
    rating: "Traslados certificados",
    limited: "Reserva con 24h de anticipaci\u00f3n",
    highlight: "Pick-up puerta a puerta",
  },
  hosting: {
    rating: "Concierge dedicado",
    limited: "Atenci\u00f3n personalizada",
    highlight: "Agenda ideal seg\u00fan clima y mareas",
  },
  default: {
    rating: "",
    limited: "",
    highlight: "",
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

  const renderYogaPackages = () => {
    if (!onYogaPackageChange) return null;

    return (
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {copy.selectPackage}
        </span>
        <div className="mt-2 grid grid-cols-3 gap-2">
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
      <div className="space-y-2">
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
      <div className="space-y-2">
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
      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20"
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {activity.category.replace("_", " ")}
            </span>
            <h3 className="mt-4 text-xl font-bold text-slate-100">{activity.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
              {marketing.rating && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 font-semibold text-amber-200">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  {marketing.rating}
                </span>
              )}
              {marketing.limited && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 px-3 py-1 font-semibold text-amber-200">
                  <Flame className="h-4 w-4 text-amber-300" />
                  {marketing.limited}
                </span>
              )}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {marketing.highlight && (
                <li className="flex items-start gap-3 leading-relaxed before:mt-1 before:text-lg before:text-amber-200 before:content-['\2022']">
                  <span>{marketing.highlight}</span>
                </li>
              )}
              <li className="flex items-start gap-3 leading-relaxed before:mt-1 before:text-lg before:text-amber-200 before:content-['\2022']">
                <span>{activity.description}</span>
              </li>
            </ul>
          </div>
          {isSelected && (
            <CheckCircle2 className="h-8 w-8 text-amber-300" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-4">
          {renderYogaPackages()}
          {renderSurfSelector()}
          {renderQuantityControl()}
          {renderTimeSlot()}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
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
