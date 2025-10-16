"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useBookingStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getLocalizedActivities } from "@/lib/activities";
import { getActivityTotalPrice, calculateSurfPrice } from "@/lib/prices";
import { formatCurrency } from "@/lib/utils";
import { Activity } from "@/types";
import ActivityCard from "./ActivityCard";
import HeaderPersonalization from "./HeaderPersonalization";
import { ArrowRight } from "lucide-react";

type SurfPackage = '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes';

const quantityCategories = new Set<Activity["category"]>(["ice_bath", "transport"]);
const perGuestCategories = new Set<Activity["category"]>(["yoga", "surf", "transport"]);
const timeSlotCategories = new Set<Activity["category"]>(["transport"]);

const DEFAULT_SURF_CLASSES = 4;
const DEFAULT_SURF_PACKAGE: SurfPackage = '4-classes';
const DEFAULT_YOGA_PACKAGE = "3-classes" as const;

const ActivitiesPage = () => {
  const { locale } = useI18n();
  const {
    bookingData,
    setBookingData,
    personalizationName,
    setPersonalizationName,
    selectedActivities,
    setSelectedActivities,
    selectedYogaPackages,
    setSelectedYogaPackage,
    selectedSurfPackages,
    setSelectedSurfPackage,
    selectedSurfClasses,
    setSelectedSurfClasses,
    activityQuantities,
    setActivityQuantity,
    selectedTimeSlots,
    setSelectedTimeSlot,
    setCurrentStep,
  } = useBookingStore();

  const participants = bookingData.guests && bookingData.guests > 0 ? bookingData.guests : 1;
  const localizedActivities = useMemo(
    () => getLocalizedActivities((locale as "es" | "en") || "es"),
    [locale]
  );

  useEffect(() => {
    if (!bookingData.guests || bookingData.guests < 1) {
      setBookingData({ guests: 1 });
    }
  }, [bookingData.guests, setBookingData]);

  useEffect(() => {
    const surfActivity = localizedActivities.find((activity) => activity.category === "surf");
    if (!surfActivity) return;

    if (!selectedSurfClasses[surfActivity.id]) {
      setSelectedSurfClasses(surfActivity.id, DEFAULT_SURF_CLASSES);
    }
    if (!selectedSurfPackages[surfActivity.id]) {
      setSelectedSurfPackage(surfActivity.id, DEFAULT_SURF_PACKAGE);
    }
    if (!selectedActivities.some((activity) => activity.id === surfActivity.id)) {
      setSelectedActivities([...selectedActivities, surfActivity]);
    }
  }, [localizedActivities, selectedActivities, selectedSurfClasses, selectedSurfPackages, setSelectedActivities, setSelectedSurfClasses, setSelectedSurfPackage]);

  const handleToggleActivity = useCallback(
    (activity: Activity) => {
      const isAlreadySelected = selectedActivities.some((item) => item.id === activity.id);

      if (isAlreadySelected) {
        const updated = selectedActivities.filter((item) => item.id !== activity.id);
        setSelectedActivities(updated);
        return;
      }

      // Ensure default configs
      if (activity.category === "yoga" && !selectedYogaPackages[activity.id]) {
        setSelectedYogaPackage(activity.id, DEFAULT_YOGA_PACKAGE);
      }
      if (activity.category === "surf") {
        if (!selectedSurfClasses[activity.id]) {
          setSelectedSurfClasses(activity.id, DEFAULT_SURF_CLASSES);
        }
        if (!selectedSurfPackages[activity.id]) {
          setSelectedSurfPackage(activity.id, DEFAULT_SURF_PACKAGE);
        }
      }
      if (quantityCategories.has(activity.category) && !activityQuantities[activity.id]) {
        setActivityQuantity(activity.id, 1);
      }
      if (timeSlotCategories.has(activity.category) && !selectedTimeSlots[activity.id]) {
        setSelectedTimeSlot(activity.id, "7:00 AM");
      }

      setSelectedActivities([...selectedActivities, activity]);
    },
    [
      selectedActivities,
      setSelectedActivities,
      selectedYogaPackages,
      setSelectedYogaPackage,
      selectedSurfClasses,
      setSelectedSurfClasses,
      selectedSurfPackages,
      setSelectedSurfPackage,
      activityQuantities,
      setActivityQuantity,
      selectedTimeSlots,
      setSelectedTimeSlot,
    ]
  );

  const handleYogaPackageChange = useCallback(
    (activityId: string, packageType: "1-class" | "3-classes" | "10-classes") => {
      setSelectedYogaPackage(activityId, packageType);
      if (!selectedActivities.some((activity) => activity.id === activityId)) {
        const baseActivity = localizedActivities.find((activity) => activity.id === activityId);
        if (baseActivity) {
          setSelectedActivities([...selectedActivities, baseActivity]);
        }
      }
    },
    [localizedActivities, selectedActivities, setSelectedActivities, setSelectedYogaPackage]
  );

  const handleSurfClassesChange = useCallback(
    (activityId: string, classes: number) => {
      const normalizedClasses = Math.min(10, Math.max(3, Math.round(classes)));
      setSelectedSurfClasses(activityId, normalizedClasses);
      setSelectedSurfPackage(activityId, `${normalizedClasses}-classes` as SurfPackage);
    },
    [setSelectedSurfClasses, setSelectedSurfPackage]
  );

  const handleQuantityChange = useCallback(
    (activityId: string, value: number) => {
      const normalized = Math.max(1, Math.round(value));
      setActivityQuantity(activityId, normalized);
      if (!selectedActivities.some((activity) => activity.id === activityId)) {
        const baseActivity = localizedActivities.find((activity) => activity.id === activityId);
        if (baseActivity) {
          setSelectedActivities([...selectedActivities, baseActivity]);
        }
      }
    },
    [localizedActivities, selectedActivities, setActivityQuantity, setSelectedActivities]
  );

  const handleTimeSlotChange = useCallback(
    (activityId: string, slot: "7:00 AM" | "3:00 PM") => {
      setSelectedTimeSlot(activityId, slot);
    },
    [setSelectedTimeSlot]
  );

  const computeActivityPrice = useCallback(
    (activity: Activity): number => {
      if (activity.category === "yoga") {
        const packageType = selectedYogaPackages[activity.id] ?? DEFAULT_YOGA_PACKAGE;
        return getActivityTotalPrice("yoga", packageType, participants);
      }

      if (activity.category === "surf") {
        const classes = selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
        return calculateSurfPrice(classes) * participants;
      }

      const quantity = quantityCategories.has(activity.category)
        ? activityQuantities[activity.id] ?? 1
        : 1;

      const perGuest = perGuestCategories.has(activity.category) ? participants : 1;

      return activity.price * quantity * perGuest;
    },
    [
      activityQuantities,
      participants,
      selectedSurfClasses,
      selectedYogaPackages,
    ]
  );

  const handleContinue = () => {
    // Verificar si ya tenemos fechas y alojamiento seleccionados
    const { checkIn, checkOut } = bookingData;
    const hasSelectedRoom = !!useBookingStore.getState().selectedRoom;

    // Si faltan fechas, ir a dates
    if (!checkIn || !checkOut) {
      setCurrentStep("dates");
    }
    // Si tenemos fechas pero falta alojamiento, ir a accommodation
    else if (!hasSelectedRoom) {
      setCurrentStep("accommodation");
    }
    // Si tenemos todo, ir a contact
    else {
      setCurrentStep("contact");
    }
  };

  const copy = {
    es: {
      continue: "Continuar",
    },
    en: {
      continue: "Continue",
    },
  };

  const currentCopy = copy[(locale as "es" | "en") || "es"];

  return (
    <div className="card mx-auto max-w-7xl px-4 py-8">
      <HeaderPersonalization
        name={personalizationName}
        participants={participants}
        locale={(locale as "es" | "en") || "es"}
        onNameChange={setPersonalizationName}
        onParticipantsChange={(value) => setBookingData({ guests: value })}
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {localizedActivities.map((activity) => {
          const isSelected = selectedActivities.some((item) => item.id === activity.id);
          const totalPrice = computeActivityPrice(activity);
          const perPerson = participants > 1 ? totalPrice / participants : undefined;
          const isYoga = activity.category === "yoga";
          const isSurf = activity.category === "surf";
          const supportsQuantity = quantityCategories.has(activity.category);
          const supportsTime = timeSlotCategories.has(activity.category);

          return (
            <ActivityCard
              key={activity.id}
              activity={activity}
              locale={(locale as "es" | "en") || "es"}
              participants={participants}
              isSelected={isSelected}
              onToggle={() => handleToggleActivity(activity)}
              price={totalPrice}
              pricePerPerson={perPerson}
              formatPrice={formatCurrency}
              selectedYogaPackage={isYoga ? selectedYogaPackages[activity.id] : undefined}
              onYogaPackageChange={isYoga ? (pkg) => handleYogaPackageChange(activity.id, pkg) : undefined}
              surfClasses={isSurf ? selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES : undefined}
              onSurfClassesChange={isSurf ? (classes) => handleSurfClassesChange(activity.id, classes) : undefined}
              hasQuantitySelector={supportsQuantity}
              quantity={supportsQuantity ? activityQuantities[activity.id] ?? 1 : undefined}
              onQuantityChange={supportsQuantity ? (value) => handleQuantityChange(activity.id, value) : undefined}
              hasTimeSelector={supportsTime}
              timeSlot={supportsTime ? selectedTimeSlots[activity.id] ?? "7:00 AM" : undefined}
              onTimeSlotChange={supportsTime ? (slot) => handleTimeSlotChange(activity.id, slot) : undefined}
            />
          );
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={handleContinue}
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-amber-300/40 transition-all hover:from-amber-200 hover:to-amber-300 hover:shadow-amber-300/60"
        >
          <span>{currentCopy.continue}</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default ActivitiesPage;
