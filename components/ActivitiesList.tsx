"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { getLocalizedActivities } from "@/lib/activities";
import { Activity } from "@/types";
import ActivityCard from "./activities/ActivityCard";
import { useBookingStore } from "@/lib/store";
import { calculatePrivateCoachingUpgrade } from "@/lib/prices";
import PrivateCoachingUpsellModal from "./activities/PrivateCoachingUpsellModal";
import {
  Plus,
  X,
  Play,
  Sparkles,
  Droplets,
  Waves,
  Snowflake,
  PenSquare,
  HandHeart,
} from "lucide-react";

type CartItem = {
  activity: Activity;
  quantity: number;
};

const thumbMap: Record<Activity["id"], { src: string; type: "image" | "video" }> = {
  "surf-package": { src: "/assets/Reel 1.mp4", type: "video" },
  "yoga-package": { src: "/assets/videos/Videos%20de%20Actividades/Yoga.mp4", type: "video" },
  "ice-bath-session": { src: "/assets/videos/Videos%20de%20Actividades/Hielo.mp4", type: "video" },
  "ceramic-stories": { src: "/assets/videos/Videos%20de%20Actividades/Ceramica.mp4", type: "video" },
  "ceramic-immersion": { src: "/assets/videos/Videos%20de%20Actividades/Ceramica.mp4", type: "video" },
  "hosting-service": { src: "/assets/Host.jpg?v=20251124-2200", type: "image" },
  "transport-airport": { src: "/assets/transport.jpg", type: "image" },
};

const SURF_PROGRAM_PRICES: Record<'fundamental' | 'progressionPlus' | 'highPerformance', number> = {
  fundamental: 450,
  progressionPlus: 650,
  highPerformance: 910,
};

const SURF_PROGRAM_LABELS: Record<
  'fundamental' | 'progressionPlus' | 'highPerformance',
  { en: string; es: string }
> = {
  fundamental: {
    en: "Core Surf Program (2 video analysis sessions)",
    es: "Core Surf Program (2 sesiones de videoanálisis)",
  },
  progressionPlus: {
    en: "Intensive Surf Program (4 video analysis sessions)",
    es: "Intensive Surf Program (4 sesiones de videoanálisis)",
  },
  highPerformance: {
    en: "Elite Surf Program (5 video analysis sessions)",
    es: "Elite Surf Program (5 sesiones de videoanálisis)",
  },
};

const iconForCategory = (category: Activity["category"]) => {
  switch (category) {
    case "surf":
      return Waves;
    case "yoga":
      return HandHeart;
    case "ice_bath":
      return Snowflake;
    case "ceramics":
      return PenSquare;
    case "hosting":
      return Sparkles;
    default:
      return Droplets;
  }
};

const chipsForActivity = (activity: Activity, locale: "es" | "en") => {
  switch (activity.category) {
    case "surf":
      return locale === "es" ? ["4–10 clases", "2–3 por coach"] : ["4–10 sessions", "2–3 per coach"];
    case "yoga":
      return locale === "es" ? ["60 minutos", "Todos los niveles"] : ["60 minutes", "All levels"];
    case "ice_bath":
      return locale === "es" ? ["1:1 sesión", "45 minutos"] : ["1:1 session", "45 minutes"];
    case "ceramics":
      return locale === "es" ? ["2 formatos", "Arcilla natural"] : ["2 formats", "Natural clay"];
    case "hosting":
      return locale === "es"
        ? ["Itinerario y coordinación", "Soporte dedicado"]
        : ["Itinerary & coordination", "Dedicated host"];
    default:
      return [];
  }
};

const formatCurrency = (value: number) => `$${value}`;

type ActivitiesListProps = {
  onChooseAccommodation?: () => void;
  hasSurfSelected?: boolean;
  helperText?: string;
};

export default function ActivitiesList({
  onChooseAccommodation,
  hasSurfSelected,
  helperText,
}: ActivitiesListProps) {
  const { locale } = useI18n();
  const {
    selectedActivities: storeActivities,
    setSelectedActivities,
    selectedSurfClasses,
    setSelectedSurfClasses,
    setSelectedSurfPackage,
    isPrivateUpgrade,
    setIsPrivateUpgrade,
  } = useBookingStore();
  const activities = useMemo(() => {
    const list = getLocalizedActivities((locale as "es" | "en") || "es").filter(
      (activity) => !["transport-airport", "ceramic-immersion"].includes(activity.id)
    );

    // Move hosting to the end of the list
    return list.sort((a, b) => {
      const aHosting = a.category === "hosting" ? 1 : 0;
      const bHosting = b.category === "hosting" ? 1 : 0;
      return aHosting - bHosting;
    });
  }, [locale]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ src: string; title: string } | null>(null);
  const [isVideoClosing, setIsVideoClosing] = useState(false);
  const [surfProgram, setSurfProgram] = useState<'fundamental' | 'progressionPlus' | 'highPerformance'>('fundamental');
  const [yogaClasses, setYogaClasses] = useState<number>(1);
  const [yogaUsePackDiscount, setYogaUsePackDiscount] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [showPrivateCoachingModal, setShowPrivateCoachingModal] = useState(false);
  const [hasPromptedPrivateCoaching, setHasPromptedPrivateCoaching] = useState(false);

  const SURF_PROGRAM_TO_CLASSES: Record<typeof surfProgram, number> = {
    fundamental: 4,
    progressionPlus: 6,
    highPerformance: 8,
  };

  useEffect(() => {
    const surfActivity = storeActivities.find((activity) => activity.category === "surf");
    if (!surfActivity) return;

    const currentClasses = selectedSurfClasses[surfActivity.id];
    if (!currentClasses) return;

    const derivedProgram =
      currentClasses <= 4 ? "fundamental" : currentClasses <= 6 ? "progressionPlus" : "highPerformance";

    if (derivedProgram !== surfProgram) {
      setSurfProgram(derivedProgram);
    }
  }, [selectedSurfClasses, storeActivities, surfProgram]);

  const handleAdd = (activity: Activity) => {
    const unitPrice = getEffectiveUnitPrice(activity);
    setCart((prev) => {
      const current = prev[activity.id];
      const nextQty = current ? current.quantity + 1 : 1;
      return { ...prev, [activity.id]: { activity: { ...activity, price: unitPrice }, quantity: nextQty } };
    });

    // Save activity to store (for all activities)
    const exists = storeActivities.some((a) => a.id === activity.id);
    if (!exists) {
      setSelectedActivities([...storeActivities, activity]);
    }

    // Set surf-specific config
    if (activity.category === "surf") {
      const classes = SURF_PROGRAM_TO_CLASSES[surfProgram] ?? SURF_PROGRAM_TO_CLASSES.fundamental;
      setSelectedSurfClasses(activity.id, classes);
      setSelectedSurfPackage(activity.id, `${classes}-classes` as any);
    }

    setToast(locale === "es" ? "Agregado a tu plan" : "Added to your plan");
    setTimeout(() => setToast(null), 1800);
  };

  const resetModalState = (activity: Activity) => {
    setSurfProgram('fundamental');
    setYogaClasses(1);
    setYogaUsePackDiscount(false);
    setQuantity(1);
  };

  const selectedItems = Object.values(cart);
  const surfActivity = useMemo(
    () => storeActivities.find((activity) => activity.category === "surf"),
    [storeActivities]
  );
  const surfClassCount =
    (surfActivity && selectedSurfClasses[surfActivity.id]) ?? SURF_PROGRAM_TO_CLASSES[surfProgram];
  const privateCoachingUpgradePrice = useMemo(() => {
    if (!isPrivateUpgrade || !surfActivity) return 0;
    return calculatePrivateCoachingUpgrade(surfClassCount);
  }, [isPrivateUpgrade, surfActivity, surfClassCount]);
  const total =
    selectedItems.reduce((sum, item) => sum + item.activity.price * item.quantity, 0) +
    privateCoachingUpgradePrice;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const getEffectiveUnitPrice = (activity: Activity) => {
    if (activity.category === "surf") {
      return SURF_PROGRAM_PRICES[surfProgram] ?? activity.price;
    }
    return activity.price;
  };

  // Reset closing state when opening a new video
  useEffect(() => {
    if (activeVideo) {
      setIsVideoClosing(false);
    }
  }, [activeVideo]);

  const handleCloseVideo = () => {
    if (isVideoClosing) return;
    setIsVideoClosing(true);
    setTimeout(() => {
      setActiveVideo(null);
      setIsVideoClosing(false);
    }, 200);
  };

  return (
    <div className="rounded-3xl border border-amber-200 bg-white shadow-2xl">
      {/* Activities list */}
      <div className="px-0 py-4 md:p-6 space-y-3">
        {activities.map((activity) => {
          const thumb = thumbMap[activity.id];
          const Icon = iconForCategory(activity.category);
          const chips = chipsForActivity(activity, locale as "es" | "en");
          const cartEntry = cart[activity.id];
          const isSelected = !!cartEntry || storeActivities.some((a) => a.id === activity.id);

          const selectionLabel = (() => {
            if (!cartEntry) return null;
            if (activity.category === "yoga") {
              return locale === "es" ? `Yoga: ${cartEntry.quantity}` : `Yoga: ${cartEntry.quantity}`;
            }
            if (activity.category === "ice_bath") {
              return locale === "es" ? `Sesiones: ${cartEntry.quantity}` : `Sessions: ${cartEntry.quantity}`;
            }
            if (activity.category === "surf") {
              const label = SURF_PROGRAM_LABELS[surfProgram]?.[locale as "es" | "en"];
              if (label) {
                return locale === "es" ? `Programa: ${label}` : `Program: ${label}`;
              }
              return locale === "es" ? "Programa seleccionado" : "Program selected";
            }
            return locale === "es"
              ? `${cartEntry.quantity} seleccionadas`
              : `${cartEntry.quantity} selected`;
          })();
          return (
            <div
              key={activity.id}
              className="relative flex items-start md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border border-amber-100 bg-white hover:border-amber-200 hover:bg-amber-50 transition cursor-pointer shadow-sm"
              onClick={() => {
                resetModalState(activity);
                setActiveActivity(activity);
              }}
            >
              <div
                className="relative w-32 h-32 md:w-72 md:h-48 rounded-xl overflow-hidden bg-black/40 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (thumb?.type === "video") {
                    setActiveVideo({ src: thumb.src, title: activity.name });
                  }
                }}
              >
                {thumb?.type === "video" ? (
                  <video
                    src={thumb.src}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVideo({ src: thumb.src, title: activity.name });
                    }}
                  />
                ) : (
                  <Image
                    src={thumb?.src || "/assets/Host.jpg"}
                    alt={activity.name}
                    fill
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 240px"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                <div
                  className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (thumb?.type === "video") {
                      setActiveVideo({ src: thumb.src, title: activity.name });
                    }
                  }}
                >
                  <Play className="h-3 w-3" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start md:items-start gap-2 pt-0 md:pt-0">
                  <Icon className="h-4 w-4 md:h-6 md:w-6 text-amber-500" />
                  <p className="text-base md:text-2xl font-semibold text-gray-900">
                    {activity.name}
                  </p>
                </div>
                {selectionLabel && (
                  <p className="text-xs md:text-sm font-semibold text-amber-700 mt-1 md:mt-1">
                    {selectionLabel}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-2 py-0.5 md:px-3 md:py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs md:text-sm text-gray-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end pt-2 md:pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetModalState(activity);
                      setActiveActivity(activity);
                    }}
                    className="w-[110px] md:w-[150px] rounded-xl px-4 py-2 md:px-6 md:py-3 font-bold text-[11px] md:text-sm transition-all shadow-lg bg-gradient-to-r from-amber-300 to-amber-400 text-black hover:from-amber-200 hover:to-amber-300 shadow-amber-300/40 min-h-0"
                  >
                    {isSelected ? (locale === "es" ? "Elegido" : "Chosen") : locale === "es" ? "Ver detalle" : "View details"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {activeActivity && portalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-6"
            onClick={() => {
              setActiveActivity(null);
              setActiveVideo(null);
            }}
          >
            <div
              className="relative w-full max-w-5xl max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveActivity(null);
                  setActiveVideo(null);
                }}
                className="absolute top-3 right-3 z-50 rounded-full bg-black/80 text-white p-2 hover:bg-black/90"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-full">
                <ActivityCard
                  activity={activeActivity}
                  locale={(locale as "es" | "en") || "es"}
                  participants={1}
                  isSelected={false}
                  price={
                    activeActivity.category === "ice_bath"
                      ? activeActivity.price * quantity
                      : getEffectiveUnitPrice(activeActivity)
                  }
                  formatPrice={formatCurrency}
                  onToggle={() => {
                    const qtyToAdd = quantity || 1;
                    const unitPrice = getEffectiveUnitPrice(activeActivity);
                  setCart((prev) => {
                    const current = prev[activeActivity.id];
                    const nextQty = current ? current.quantity + qtyToAdd : qtyToAdd;
                    return {
                      ...prev,
                      [activeActivity.id]: { activity: { ...activeActivity, price: unitPrice }, quantity: nextQty },
                    };
                  });
                  // Save activity to store (for all activities, not just surf)
                  const exists = storeActivities.some((a) => a.id === activeActivity.id);
                  if (!exists) {
                    setSelectedActivities([...storeActivities, activeActivity]);
                  }
                  setActiveActivity(null);
                  setToast(locale === "es" ? "Agregado a tu plan" : "Added to your plan");
                  setTimeout(() => setToast(null), 1800);
                }}
                  onAutoAdvance={() => setActiveActivity(null)}
                  onSkip={() => setActiveActivity(null)}
                  isFirstStep={false}
                  isSurfMandatory={activeActivity.category === "surf"}
                  yogaClasses={activeActivity.category === "yoga" ? yogaClasses : undefined}
                  onYogaClassesChange={
                    activeActivity.category === "yoga" ? (val) => setYogaClasses(val) : undefined
                  }
                  yogaUsePackDiscount={
                    activeActivity.category === "yoga" ? yogaUsePackDiscount : undefined
                  }
                  onYogaPackDiscountChange={
                    activeActivity.category === "yoga" ? (val) => setYogaUsePackDiscount(val) : undefined
                  }
                  surfProgram={activeActivity.category === "surf" ? surfProgram : undefined}
                  onSurfProgramChange={
                    activeActivity.category === "surf"
                      ? (val) => {
                          setSurfProgram(val);
                          const classes = SURF_PROGRAM_TO_CLASSES[val] ?? SURF_PROGRAM_TO_CLASSES.fundamental;
                          setSelectedSurfClasses(activeActivity.id, classes);
                          setSelectedSurfPackage(activeActivity.id, `${classes}-classes` as any);
                        }
                      : undefined
                  }
                  hasQuantitySelector={activeActivity.category === "ice_bath"}
                  quantity={activeActivity.category === "ice_bath" ? quantity : undefined}
                  onQuantityChange={
                    activeActivity.category === "ice_bath" ? (val) => setQuantity(val) : undefined
                  }
                />
              </div>
            </div>
          </div>,
          portalTarget
        )}

      {/* Video Modal */}
      {activeVideo && portalTarget &&
        createPortal(
          <div
            className={`fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${isVideoClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleCloseVideo}
          >
            <div
              className={`relative w-full max-w-3xl md:max-w-4xl transition-transform duration-200 ${isVideoClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseVideo}
                className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
                aria-label="Close video"
              >
                <X className="w-8 h-8" />
              </button>
              <video
                key={activeVideo.src}
                src={activeVideo.src}
                controls
                autoPlay
                loop
                className="w-full max-h-[70vh] rounded-2xl shadow-2xl object-cover"
              />
              <p className="text-white text-lg font-semibold mt-3">{activeVideo.title}</p>
            </div>
          </div>,
          portalTarget
        )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
      {/* Total summary */}
      <div className="px-4 pb-4 md:px-6 md:pb-6">
        <div className="rounded-2xl border border-amber-200 bg-white shadow-lg p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 text-amber-700 font-semibold text-sm border border-amber-200">
              {locale === "es" ? "Total" : "Total"}
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-600">{locale === "es" ? "Actividades" : "Activities"}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3 text-center md:text-left text-sm">
            <button
              type="button"
              disabled={!hasSurfSelected}
              onClick={() => {
                if (!hasSurfSelected) return;
                if (surfActivity && !isPrivateUpgrade && !hasPromptedPrivateCoaching) {
                  setHasPromptedPrivateCoaching(true);
                  setShowPrivateCoachingModal(true);
                  return;
                }
                onChooseAccommodation?.();
              }}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-3 md:px-7 md:py-3.5 font-semibold text-base md:text-lg shadow-md transition ${
                hasSurfSelected
                  ? "bg-gradient-to-r from-amber-300 to-amber-400 text-black hover:from-amber-200 hover:to-amber-300 shadow-amber-300/50"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {locale === "es" ? "Choose accommodation" : "Choose accommodation"}
            </button>
            {!hasSurfSelected && (
              <span className="text-amber-700 font-semibold order-2 md:order-1 md:ml-2">
                {helperText ??
                  (locale === "es"
                    ? "Elegí un programa de surf para habilitar el alojamiento."
                    : "Choose a surf program to unlock accommodation.")}
              </span>
            )}
            {isPrivateUpgrade && surfActivity && (
              <span className="text-amber-700 font-semibold order-3 md:order-1 md:ml-2">
                {locale === "es"
                  ? `Incluye coaching 1:1 (+${formatCurrency(privateCoachingUpgradePrice)})`
                  : `Includes 1:1 coaching (+${formatCurrency(privateCoachingUpgradePrice)})`}
              </span>
            )}
          </div>
        </div>
      </div>
      <PrivateCoachingUpsellModal
        isOpen={showPrivateCoachingModal}
        onClose={() => {
          setShowPrivateCoachingModal(false);
          onChooseAccommodation?.();
        }}
        onAccept={() => {
          setIsPrivateUpgrade(true);
          setShowPrivateCoachingModal(false);
          setToast(locale === "es" ? "Coaching 1:1 agregado" : "Added 1:1 coaching");
          setTimeout(() => setToast(null), 1800);
          onChooseAccommodation?.();
        }}
        locale={(locale as "es" | "en") || "es"}
        upgradePrice={calculatePrivateCoachingUpgrade(surfClassCount)}
      />
    </div>
  );
}
