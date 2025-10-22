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
import { ArrowRight, Users, Copy, Waves, User, Snowflake, Car, Home, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SurfPackage = '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes';

const quantityCategories = new Set<Activity["category"]>(["ice_bath", "transport"]);
const perGuestCategories = new Set<Activity["category"]>(["yoga", "surf", "transport"]);
const timeSlotCategories = new Set<Activity["category"]>(["transport"]);

const DEFAULT_SURF_CLASSES = 4;
const DEFAULT_SURF_PACKAGE: SurfPackage = '4-classes';
const DEFAULT_YOGA_PACKAGE = "1-class" as const;

const ActivitiesPage = () => {
  const { locale } = useI18n();
  const {
    bookingData,
    setBookingData,
    personalizationName,
    setPersonalizationName,
    setSelectedActivities,
    setSelectedYogaPackage,
    setSelectedSurfPackage,
    setSelectedSurfClasses,
    setActivityQuantity,
    setSelectedTimeSlot,
    setCurrentStep,
    // Multi-participant state
    participants: storeParticipants,
    activeParticipantId,
    setActiveParticipant,
    updateParticipantName,
    addParticipant,
    removeParticipant,
    copyChoicesToAll,
    syncParticipantsWithGuests,
    // Activity flow state
    activityFlowStep,
    activityFlowDirection,
    nextActivityStep,
    previousActivityStep,
    skipCurrentActivity,
    resetActivityFlow,
  } = useBookingStore();

  const { selectedActivities, selectedYogaPackages, selectedSurfPackages, selectedSurfClasses, activityQuantities, selectedTimeSlots } = useMemo(() => {
    const activeParticipant = storeParticipants.find(p => p.id === activeParticipantId);
    return {
      selectedActivities: activeParticipant?.selectedActivities ?? [],
      selectedYogaPackages: activeParticipant?.selectedYogaPackages ?? {},
      selectedSurfPackages: activeParticipant?.selectedSurfPackages ?? {},
      selectedSurfClasses: activeParticipant?.selectedSurfClasses ?? {},
      activityQuantities: activeParticipant?.activityQuantities ?? {},
      selectedTimeSlots: activeParticipant?.selectedTimeSlots ?? {},
    };
  }, [storeParticipants, activeParticipantId]);

  console.log('[ActivitiesPage] Component rendered', {
    activeParticipantId,
    participantsCount: storeParticipants.length,
    selectedActivitiesCount: selectedActivities.length,
    storeParticipants: storeParticipants.map(p => ({
      id: p.id,
      name: p.name,
      activitiesCount: p.selectedActivities.length,
    })),
  });

  const [showOverview, setShowOverview] = useState(false);
  const [completionName, setCompletionName] = useState("");

  // Load the current participant's name when showing completion screen
  useEffect(() => {
    if (activityFlowStep === 'complete' && activeParticipantId) {
      const currentParticipant = storeParticipants.find(p => p.id === activeParticipantId);
      if (currentParticipant) {
        setCompletionName(currentParticipant.name);
      }
    }
  }, [activityFlowStep, activeParticipantId, storeParticipants]);

  const participantCount = Math.max(
    storeParticipants.length,
    bookingData.guests && bookingData.guests > 0 ? bookingData.guests : 1
  );
  const localizedActivities = useMemo(
    () => getLocalizedActivities((locale as "es" | "en") || "es"),
    [locale]
  );

  // Sync participants with guest count
  useEffect(() => {
    const enforcedGuests = Math.max(participantCount, bookingData.guests || 0);
    if (!bookingData.guests || bookingData.guests !== enforcedGuests) {
      setBookingData({ guests: enforcedGuests });
      return;
    }
    syncParticipantsWithGuests(enforcedGuests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.guests, participantCount]);

  // Auto-scroll disabled per user request
  // useEffect(() => {
  //   const scrollToTop = () => {
  //     const activityContainer = document.querySelector('[data-activity-card-container]');
  //     if (activityContainer) {
  //       activityContainer.scrollIntoView({
  //         behavior: 'smooth',
  //         block: 'start',
  //       });
  //     } else {
  //       window.scrollTo({
  //         top: 0,
  //         behavior: 'smooth'
  //       });
  //     }
  //   };
  //   const timeoutId = setTimeout(scrollToTop, 100);
  //   return () => clearTimeout(timeoutId);
  // }, [activityFlowStep, activeParticipantId]);

  // Initialize surf for the active participant
  useEffect(() => {
    const surfActivity = localizedActivities.find((activity) => activity.category === "surf");
    if (!surfActivity) return;

    const activeParticipant = storeParticipants.find(p => p.id === activeParticipantId);
    if (!activeParticipant) return;

    // Check if the active participant has surf configured
    const hasSurfClasses = activeParticipant.selectedSurfClasses[surfActivity.id] !== undefined;
    const hasSurfPackage = activeParticipant.selectedSurfPackages[surfActivity.id] !== undefined;
    const hasSurfActivity = activeParticipant.selectedActivities.some(a => a.id === surfActivity.id);

    // Initialize surf configuration (classes and package) for this participant if not already done
    if (!hasSurfClasses) {
      setSelectedSurfClasses(surfActivity.id, DEFAULT_SURF_CLASSES);
    }
    if (!hasSurfPackage) {
      setSelectedSurfPackage(surfActivity.id, DEFAULT_SURF_PACKAGE);
    }
    // Don't auto-select surf - let user choose it via the "Choose" button
    // This provides a consistent UX flow across all activities
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizedActivities, activeParticipantId]);

  const handleToggleActivity = useCallback(
    (activity: Activity) => {
      console.log('[ActivitiesPage] handleToggleActivity called', {
        activityId: activity.id,
        activityName: activity.name,
        activeParticipantId,
        currentSelectedActivities: selectedActivities.map(a => a.name),
      });

      const isAlreadySelected = selectedActivities.some((item) => item.id === activity.id);

      // Surf is mandatory - can be selected but not deselected
      if (activity.category === "surf" && isAlreadySelected) {
        console.log('[ActivitiesPage] handleToggleActivity - surf is mandatory, cannot deselect');
        return;
      }

      if (isAlreadySelected) {
        const updated = selectedActivities.filter((item) => item.id !== activity.id);
        console.log('[ActivitiesPage] handleToggleActivity - deselecting', {
          updated: updated.map(a => a.name),
        });
        setSelectedActivities(updated);
        return;
      }

      // Ensure default configs
      if (activity.category === "yoga" && !selectedYogaPackages[activity.id]) {
        console.log('[ActivitiesPage] handleToggleActivity - setting default yoga package');
        setSelectedYogaPackage(activity.id, DEFAULT_YOGA_PACKAGE);
      }
      if (quantityCategories.has(activity.category) && !activityQuantities[activity.id]) {
        console.log('[ActivitiesPage] handleToggleActivity - setting default quantity');
        setActivityQuantity(activity.id, 1);
      }
      if (timeSlotCategories.has(activity.category) && !selectedTimeSlots[activity.id]) {
        console.log('[ActivitiesPage] handleToggleActivity - setting default time slot');
        setSelectedTimeSlot(activity.id, "7:00 AM");
      }

      const updatedActivities = [...selectedActivities, activity];
      console.log('[ActivitiesPage] handleToggleActivity - selecting activity', {
        updatedActivities: updatedActivities.map(a => a.name),
      });
      setSelectedActivities(updatedActivities);
    },
    [
      selectedActivities,
      setSelectedActivities,
      selectedYogaPackages,
      setSelectedYogaPackage,
      activityQuantities,
      setActivityQuantity,
      selectedTimeSlots,
      setSelectedTimeSlot,
      activeParticipantId,
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
  const participantTabsData: Participant[] = storeParticipants.map((p) => {
    console.log('[ActivitiesPage] Building participant tab data', {
      id: p.id,
      name: p.name,
      selectedActivities: p.selectedActivities,
      activitiesCount: p.selectedActivities.length,
    });
    return {
      id: p.id,
      name: p.name,
      isYou: p.isYou,
      activitiesCount: p.selectedActivities.length,
    };
  });

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

  // Filter activities by current step
  const getCurrentStepActivity = () => {
    switch (activityFlowStep) {
      case 'surf':
        return localizedActivities.find(a => a.category === 'surf');
      case 'yoga':
        return localizedActivities.find(a => a.category === 'yoga');
      case 'ice-bath':
        return localizedActivities.find(a => a.category === 'ice_bath');
      default:
        return null;
    }
  };

  const currentActivity = getCurrentStepActivity();

  const handleAddPerson = () => {
    // Save the participant name if provided
    if (completionName.trim() && activeParticipantId) {
      updateParticipantName(activeParticipantId, completionName.trim());
    }
    addParticipant();
    resetActivityFlow();
  };

  const handleCompleteAndContinue = () => {
    // Save the participant name if provided
    if (completionName.trim() && activeParticipantId) {
      updateParticipantName(activeParticipantId, completionName.trim());
    }
    handleContinue();
  };

  const handleBackStep = () => {
    previousActivityStep();
  };

  // Get activity icon by category
  const getActivityIcon = (category: string) => {
    switch (category) {
      case "surf":
        return Waves;
      case "yoga":
        return User;
      case "ice_bath":
        return Snowflake;
      case "transport":
        return Car;
      case "hosting":
        return Home;
      default:
        return CheckCircle2;
    }
  };

  // Get activity details text
  const getActivityDetails = (activity: Activity) => {
    if (activity.category === "surf") {
      const classes = selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
      return locale === "es"
        ? `${classes} ${classes === 1 ? 'clase' : 'clases'}`
        : `${classes} ${classes === 1 ? 'class' : 'classes'}`;
    }

    if (activity.category === "yoga") {
      const pkg = selectedYogaPackages[activity.id] ?? DEFAULT_YOGA_PACKAGE;
      const count = pkg.replace("-classes", "").replace("-class", "");
      return locale === "es"
        ? `${count} ${count === "1" ? 'sesión' : 'sesiones'}`
        : `${count} ${count === "1" ? 'session' : 'sessions'}`;
    }

    if (quantityCategories.has(activity.category)) {
      const qty = activityQuantities[activity.id] ?? 1;
      return locale === "es"
        ? `${qty} ${qty === 1 ? 'sesión' : 'sesiones'}`
        : `${qty} ${qty === 1 ? 'session' : 'sessions'}`;
    }

    return "";
  };

  // Calculate total for current participant
  const calculateParticipantTotal = () => {
    let total = 0;
    selectedActivities.forEach((activity) => {
      const price = computeActivityPrice(activity);
      total += price;
    });
    return total;
  };

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6 md:py-8">
      <HeaderPersonalization
        name={personalizationName}
        participants={participantCount}
        locale={(locale as "es" | "en") || "es"}
        onNameChange={setPersonalizationName}
        onParticipantsChange={(value) => setBookingData({ guests: value })}
        participantTabs={participantTabsData}
        activeParticipantId={activeParticipantId}
        onParticipantChange={handleParticipantChange}
        onParticipantNameChange={updateParticipantName}
        onRemoveParticipant={removeParticipant}
        onCopyChoicesToAll={participantTabsData.length > 1 ? handleCopyChoices : undefined}
      />

      <AnimatePresence mode="wait">
        {activityFlowStep === 'complete' ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30 mb-4"
              >
                <CheckCircle2 className="h-8 w-8 text-amber-300" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-50 font-heading mb-2">
                {locale === "es" ? "¡Actividades completadas!" : "Activities completed!"}
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                {locale === "es"
                  ? "Revisa tu selección y personaliza el nombre del participante"
                  : "Review your selection and customize the participant name"}
              </p>
            </div>

            {/* Activities Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-3xl border border-slate-700/50 bg-slate-900/70 shadow-xl overflow-hidden mb-6"
            >
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
                <h3 className="text-lg font-bold text-slate-200">
                  {locale === "es" ? "Actividades seleccionadas" : "Selected activities"}
                </h3>
              </div>

              <div className="p-6 space-y-3">
                {selectedActivities.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    {locale === "es" ? "No hay actividades seleccionadas" : "No activities selected"}
                  </p>
                ) : (
                  selectedActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.category);
                    const details = getActivityDetails(activity);
                    const price = computeActivityPrice(activity);

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-all"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-300/10 border border-amber-300/20">
                          <Icon className="h-6 w-6 text-amber-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-100 truncate">
                            {activity.name}
                          </h4>
                          {details && (
                            <p className="text-sm text-slate-400 mt-0.5">{details}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-300">
                            {formatCurrency(price)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Total */}
              {selectedActivities.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-200">
                      {locale === "es" ? "Total" : "Total"}
                    </span>
                    <span className="text-2xl font-bold text-amber-300">
                      {formatCurrency(calculateParticipantTotal())}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Participant Name Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="rounded-3xl border border-slate-700/50 bg-slate-900/70 shadow-xl p-6 mb-6"
            >
              <label className="block text-sm font-bold text-slate-300 mb-3">
                {locale === "es" ? "Nombre del participante" : "Participant name"}
              </label>
              <input
                type="text"
                value={completionName}
                onChange={(e) => setCompletionName(e.target.value)}
                placeholder={locale === "es" ? "ej. Claire Caffrey" : "e.g. Claire Caffrey"}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500 mt-2">
                {locale === "es"
                  ? "Opcional: deja este campo vacío para usar el nombre por defecto"
                  : "Optional: leave empty to use the default name"}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <motion.button
                onClick={handleAddPerson}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-[#0F1C2E] text-white rounded-2xl font-bold text-base hover:shadow-md hover:border-slate-500 ring-2 ring-slate-600/60 shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Users className="h-5 w-5" />
                {locale === "es" ? "Agregar persona" : "Add person"}
              </motion.button>
              <motion.button
                onClick={handleCompleteAndContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-[#FDCB2E] text-slate-900 rounded-2xl font-bold text-base shadow-xl hover:bg-[#FCD34D] hover:shadow-2xl transition-all duration-150 flex items-center justify-center gap-2"
              >
                {locale === "es" ? "Continuar" : "Continue"}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        ) : currentActivity ? (
          <motion.div
            key={`${activeParticipantId}-${activityFlowStep}`}
            data-activity-card-container
            initial={{
              opacity: 0,
              x: activityFlowDirection === 'forward' ? 30 : -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: activityFlowDirection === 'forward' ? -120 : 120,
            }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.3 }
            }}
            className="space-y-4 md:space-y-3.5"
          >
            {(() => {
              const isSelected = selectedActivities.some((item) => item.id === currentActivity.id);
              const individualPrice = computeActivityPrice(currentActivity);
              const isYoga = currentActivity.category === "yoga";
              const isSurf = currentActivity.category === "surf";
              const supportsQuantity = quantityCategories.has(currentActivity.category);
              const supportsTime = timeSlotCategories.has(currentActivity.category);

              return (
                <ActivityCard
                  key={currentActivity.id}
                  activity={currentActivity}
                  locale={(locale as "es" | "en") || "es"}
                  participants={1}
                  isSelected={isSelected}
                  onToggle={() => handleToggleActivity(currentActivity)}
                  onAutoAdvance={nextActivityStep}
                  onSkip={skipCurrentActivity}
                  onBack={handleBackStep}
                  isFirstStep={activityFlowStep === 'surf'}
                  price={individualPrice}
                  pricePerPerson={undefined}
                  formatPrice={formatCurrency}
                  selectedYogaPackage={isYoga ? selectedYogaPackages[currentActivity.id] : undefined}
                  onYogaPackageChange={isYoga ? (pkg) => handleYogaPackageChange(currentActivity.id, pkg) : undefined}
                  surfClasses={isSurf ? selectedSurfClasses[currentActivity.id] ?? DEFAULT_SURF_CLASSES : undefined}
                  onSurfClassesChange={isSurf ? (classes) => handleSurfClassesChange(currentActivity.id, classes) : undefined}
                  hasQuantitySelector={supportsQuantity}
                  quantity={supportsQuantity ? activityQuantities[currentActivity.id] ?? 1 : undefined}
                  onQuantityChange={supportsQuantity ? (value) => handleQuantityChange(currentActivity.id, value) : undefined}
                  hasTimeSelector={supportsTime}
                  timeSlot={supportsTime ? selectedTimeSlots[currentActivity.id] ?? "7:00 AM" : undefined}
                  onTimeSlotChange={supportsTime ? (slot) => handleTimeSlotChange(currentActivity.id, slot) : undefined}
                />
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>

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
