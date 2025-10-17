"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBookingStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getLocalizedActivities } from "@/lib/activities";
import { getActivityTotalPrice, calculateSurfPrice } from "@/lib/prices";
import { formatCurrency } from "@/lib/utils";
import { Activity } from "@/types";
import ActivityCard from "./ActivityCard";
import HeaderPersonalization, { Participant } from "./HeaderPersonalization";
import OverviewSummary from "./OverviewSummary";
import { ArrowRight, Users, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Multi-participant state
    participants: storeParticipants,
    activeParticipantId,
    setActiveParticipant,
    updateParticipantName,
    addParticipant,
    copyChoicesToAll,
    syncParticipantsWithGuests,
  } = useBookingStore();

  const [showOverview, setShowOverview] = useState(false);

  const participants = bookingData.guests && bookingData.guests > 0 ? bookingData.guests : 1;
  const localizedActivities = useMemo(
    () => getLocalizedActivities((locale as "es" | "en") || "es"),
    [locale]
  );

  // Sync participants with guest count
  useEffect(() => {
    if (!bookingData.guests || bookingData.guests < 1) {
      setBookingData({ guests: 1 });
    } else {
      syncParticipantsWithGuests(bookingData.guests);
    }
  }, [bookingData.guests, setBookingData, syncParticipantsWithGuests]);

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
      // Price is now per participant (individual pricing)
      if (activity.category === "yoga") {
        const packageType = selectedYogaPackages[activity.id] ?? DEFAULT_YOGA_PACKAGE;
        // Get price for 1 person only since selections are per participant
        return getActivityTotalPrice("yoga", packageType, 1);
      }

      if (activity.category === "surf") {
        const classes = selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
        // Price per person only
        return calculateSurfPrice(classes);
      }

      const quantity = quantityCategories.has(activity.category)
        ? activityQuantities[activity.id] ?? 1
        : 1;

      // For per-guest activities, price is for this individual participant
      const perGuest = perGuestCategories.has(activity.category) ? 1 : 1;

      return activity.price * quantity * perGuest;
    },
    [
      activityQuantities,
      selectedSurfClasses,
      selectedYogaPackages,
    ]
  );

  // Prepare participants data for tabs
  const participantTabsData: Participant[] = storeParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    isYou: p.isYou,
    activitiesCount: p.selectedActivities.length,
  }));

  const handleParticipantChange = (participantId: string) => {
    setActiveParticipant(participantId);
  };

  const handleCopyChoices = () => {
    copyChoicesToAll(activeParticipantId);
  };

  const handleShowOverview = () => {
    setShowOverview(true);
  };

  const handleCloseOverview = () => {
    setShowOverview(false);
  };

  const handleContinueFromOverview = () => {
    setShowOverview(false);
    handleContinue();
  };

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
      viewOverview: "Ver resumen de selecciones",
    },
    en: {
      continue: "Continue",
      viewOverview: "View selections overview",
    },
  };

  const currentCopy = copy[(locale as "es" | "en") || "es"];

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6 md:py-8">
      <HeaderPersonalization
        name={personalizationName}
        participants={participants}
        locale={(locale as "es" | "en") || "es"}
        onNameChange={setPersonalizationName}
        onParticipantsChange={(value) => setBookingData({ guests: value })}
        participantTabs={participantTabsData}
        activeParticipantId={activeParticipantId}
        onParticipantChange={handleParticipantChange}
        onParticipantNameChange={updateParticipantName}
        onCopyChoicesToAll={participantTabsData.length > 1 ? handleCopyChoices : undefined}
      />

      <style jsx>{`
        .activity-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .activity-cards-grid > * {
          height: 420px;
          min-height: 420px;
        }
        @media (min-width: 768px) {
          .activity-cards-grid {
            display: grid;
            grid-template-columns: 1fr;
            grid-auto-rows: 340px;
            gap: 1.5rem;
          }
          .activity-cards-grid > * {
            height: 340px;
            min-height: 340px;
          }
        }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeParticipantId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="activity-cards-grid"
        >
          {localizedActivities
            .filter((activity) => activity.category !== "transport")
            .map((activity) => {
            const isSelected = selectedActivities.some((item) => item.id === activity.id);
            const individualPrice = computeActivityPrice(activity);
            const isYoga = activity.category === "yoga";
            const isSurf = activity.category === "surf";
            const supportsQuantity = quantityCategories.has(activity.category);
            const supportsTime = timeSlotCategories.has(activity.category);

            return (
              <ActivityCard
              key={activity.id}
              activity={activity}
              locale={(locale as "es" | "en") || "es"}
              participants={1}
              isSelected={isSelected}
              onToggle={() => handleToggleActivity(activity)}
              price={individualPrice}
              pricePerPerson={undefined}
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
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
        {/* View Overview Button - Only show if multiple participants */}
        {participantTabsData.length > 1 && (
          <button
            onClick={handleShowOverview}
            className="group flex items-center gap-2 md:gap-3 rounded-2xl bg-slate-800/50 border-2 border-slate-700 px-5 md:px-6 py-3 text-sm md:text-base font-medium text-slate-300 shadow-md transition-all hover:bg-slate-700/50 hover:border-cyan-400/50 hover:text-white w-full sm:w-auto"
          >
            <Users className="h-4 md:h-5 w-4 md:w-5" />
            <span>{currentCopy.viewOverview}</span>
          </button>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="group flex items-center gap-2 md:gap-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-slate-900 shadow-lg shadow-amber-300/40 transition-all hover:from-amber-200 hover:to-amber-300 hover:shadow-amber-300/60 w-full sm:w-auto"
        >
          <span>{currentCopy.continue}</span>
          <ArrowRight className="h-4 md:h-5 w-4 md:w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Mobile Floating Copy Button */}
      {participantTabsData.length > 1 && (
        <motion.button
          onClick={handleCopyChoices}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-400/50"
          aria-label={currentCopy.viewOverview}
        >
          <Copy className="h-6 w-6" />
        </motion.button>
      )}

      {/* Overview Summary Modal */}
      <AnimatePresence>
        {showOverview && (
          <OverviewSummary
            participants={storeParticipants.map(p => ({
              id: p.id,
              name: p.name,
              isYou: p.isYou,
              selectedActivities: p.selectedActivities,
              activityQuantities: p.activityQuantities,
              selectedYogaPackages: p.selectedYogaPackages,
              selectedSurfClasses: p.selectedSurfClasses,
            }))}
            onClose={handleCloseOverview}
            onContinue={handleContinueFromOverview}
            locale={(locale as "es" | "en") || "es"}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivitiesPage;
