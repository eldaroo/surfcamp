"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useBookingStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getLocalizedActivities } from "@/lib/activities";
import { getActivityTotalPrice, calculateSurfPrice, calculateYogaPrice } from "@/lib/prices";
import { formatCurrency } from "@/lib/utils";
import { Activity } from "@/types";
import ActivityCard from "./ActivityCard";
import HeaderPersonalization, { Participant } from "./HeaderPersonalization";
import OverviewSummary from "./OverviewSummary";
import ActiveParticipantBanner from "../ActiveParticipantBanner";
import { ArrowRight, Users, Copy, Waves, User, Snowflake, Car, Home, CheckCircle2, Edit2, Trash2 } from "lucide-react";
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
    setYogaClasses,
    setYogaUsePackDiscount,
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
    copyChoicesToParticipant,
    syncParticipantsWithGuests,
    // Activity flow state
    activityFlowStep,
    activityFlowDirection,
    nextActivityStep,
    previousActivityStep,
    skipCurrentActivity,
    resetActivityFlow,
    goToActivityStep,
  } = useBookingStore();

  const { selectedActivities, yogaClasses, yogaUsePackDiscount, selectedYogaPackages, selectedSurfPackages, selectedSurfClasses, activityQuantities, selectedTimeSlots } = useMemo(() => {
    const activeParticipant = storeParticipants.find(p => p.id === activeParticipantId);
    return {
      selectedActivities: activeParticipant?.selectedActivities ?? [],
      yogaClasses: activeParticipant?.yogaClasses ?? {},
      yogaUsePackDiscount: activeParticipant?.yogaUsePackDiscount ?? {},
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
  const [showTravelingWithModal, setShowTravelingWithModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(
    storeParticipants[0]?.id || null
  );
  const [addPersonChoice, setAddPersonChoice] = useState<'copy' | 'customize'>('copy');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      if (activity.category === "yoga" && !yogaClasses[activity.id]) {
        console.log('[ActivitiesPage] handleToggleActivity - setting default yoga classes');
        setYogaClasses(activity.id, 1); // Default to 1 class
        setYogaUsePackDiscount(activity.id, false);
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
      yogaClasses,
      setYogaClasses,
      setYogaUsePackDiscount,
      activityQuantities,
      setActivityQuantity,
      selectedTimeSlots,
      setSelectedTimeSlot,
      activeParticipantId,
    ]
  );

  const handleYogaClassesChange = useCallback(
    (activityId: string, classes: number) => {
      setYogaClasses(activityId, classes);
      if (!selectedActivities.some((activity) => activity.id === activityId)) {
        const baseActivity = localizedActivities.find((activity) => activity.id === activityId);
        if (baseActivity) {
          setSelectedActivities([...selectedActivities, baseActivity]);
        }
      }
    },
    [localizedActivities, selectedActivities, setSelectedActivities, setYogaClasses]
  );

  const handleYogaPackDiscountChange = useCallback(
    (activityId: string, useDiscount: boolean) => {
      setYogaUsePackDiscount(activityId, useDiscount);
      if (!selectedActivities.some((activity) => activity.id === activityId)) {
        const baseActivity = localizedActivities.find((activity) => activity.id === activityId);
        if (baseActivity) {
          setSelectedActivities([...selectedActivities, baseActivity]);
        }
      }
    },
    [localizedActivities, selectedActivities, setSelectedActivities, setYogaUsePackDiscount]
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
        const classes = yogaClasses[activity.id] ?? 1;
        const useDiscount = yogaUsePackDiscount[activity.id] ?? false;
        return calculateYogaPrice(classes, useDiscount);
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
      yogaClasses,
      yogaUsePackDiscount,
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
      case 'hosting':
        return localizedActivities.find(a => a.category === 'hosting');
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
    // Show modal asking if traveling with someone
    setShowTravelingWithModal(true);
  };

  const handleSkipAddPerson = () => {
    setShowTravelingWithModal(false);
    handleContinue();
  };

  const handleConfirmAddPerson = () => {
    setShowTravelingWithModal(false);

    if (addPersonChoice === 'copy') {
      // Save current participant's ID before adding a new one
      const currentParticipantId = activeParticipantId;
      // Calculate what the new participant's ID will be
      const newParticipantId = `participant-${storeParticipants.length + 1}`;
      // Add new participant (this will make the new participant active)
      addParticipant();
      // Copy current participant's choices ONLY to the new participant
      copyChoicesToParticipant(currentParticipantId, newParticipantId);
      // Expand the new participant in the accordion
      setExpandedParticipantId(newParticipantId);
      // Go directly to the complete step to show all participants
      goToActivityStep('complete');
    } else {
      // Customize - add participant and start from scratch
      addParticipant();
      resetActivityFlow();
    }
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

  // Calculate price for a specific activity of a specific participant
  const computeActivityPriceForParticipant = (
    activity: Activity,
    participant: typeof storeParticipants[0]
  ): number => {
    if (activity.category === "yoga") {
      const classes = participant.yogaClasses[activity.id] ?? 1;
      const useDiscount = participant.yogaUsePackDiscount[activity.id] ?? false;
      return calculateYogaPrice(classes, useDiscount);
    }

    if (activity.category === "surf") {
      const classes = participant.selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
      return calculateSurfPrice(classes);
    }

    const quantity = quantityCategories.has(activity.category)
      ? participant.activityQuantities[activity.id] ?? 1
      : 1;

    const perGuest = perGuestCategories.has(activity.category) ? 1 : 1;
    return activity.price * quantity * perGuest;
  };

  // Get details for a specific activity of a specific participant
  const getActivityDetailsForParticipant = (
    activity: Activity,
    participant: typeof storeParticipants[0]
  ): string => {
    if (activity.category === "yoga") {
      const classes = participant.yogaClasses[activity.id] ?? 1;
      const packageKey = participant.selectedYogaPackages[activity.id];
      if (packageKey) {
        return `${classes} ${classes === 1 ? (locale === "es" ? "clase" : "class") : (locale === "es" ? "clases" : "classes")}`;
      }
      return `${classes} ${classes === 1 ? (locale === "es" ? "clase" : "class") : (locale === "es" ? "clases" : "classes")}`;
    }

    if (activity.category === "surf") {
      const classes = participant.selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
      return `${classes} ${classes === 1 ? (locale === "es" ? "clase" : "class") : (locale === "es" ? "clases" : "classes")}`;
    }

    if (quantityCategories.has(activity.category)) {
      const quantity = participant.activityQuantities[activity.id] ?? 1;
      return `${quantity}x`;
    }

    if (timeSlotCategories.has(activity.category)) {
      const timeSlot = participant.selectedTimeSlots[activity.id];
      return timeSlot ?? "";
    }

    return "";
  };

  // Calculate total for all participants
  const calculateGrandTotal = () => {
    return storeParticipants.reduce((total, participant) => {
      const participantTotal = participant.selectedActivities.reduce((sum, activity) => {
        return sum + computeActivityPriceForParticipant(activity, participant);
      }, 0);
      return total + participantTotal;
    }, 0);
  };

  // Get active participant info
  const activeParticipant = storeParticipants.find(p => p.id === activeParticipantId);

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6 md:py-8">
      <HeaderPersonalization
        name={personalizationName}
        participants={participantCount}
        locale={(locale as "es" | "en") || "es"}
        onNameChange={setPersonalizationName}
        onParticipantsChange={(value) => setBookingData({ guests: value })}
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
                  ? "Revisa la selección de todos los participantes"
                  : "Review the selection for all participants"}
              </p>
            </div>

            {/* All Participants Summary - Accordion Style */}
            <div className="space-y-3 mb-6">
              {storeParticipants.map((participant, participantIndex) => {
                const participantTotal = participant.selectedActivities.reduce((sum, activity) => {
                  return sum + computeActivityPriceForParticipant(activity, participant);
                }, 0);
                const isExpanded = expandedParticipantId === participant.id;

                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + participantIndex * 0.1, duration: 0.4 }}
                    className={`rounded-3xl border bg-slate-900/70 shadow-xl overflow-hidden transition-all ${
                      isExpanded
                        ? 'border-amber-400/50'
                        : 'border-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    {/* Participant Header - Clickable */}
                    <button
                      onClick={() => setExpandedParticipantId(isExpanded ? null : participant.id)}
                      className="w-full px-6 py-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
                          isExpanded
                            ? 'bg-amber-300/20 border-amber-400/30'
                            : 'bg-cyan-500/20 border-cyan-400/30'
                        }`}>
                          <User className={`h-5 w-5 transition-colors ${
                            isExpanded ? 'text-amber-300' : 'text-cyan-300'
                          }`} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-slate-200">
                            {participant.name}
                            {participant.isYou && (
                              <span className="ml-2 text-sm text-cyan-400">
                                ({locale === "es" ? "Tú" : "You"})
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {participant.selectedActivities.length}{" "}
                            {participant.selectedActivities.length === 1
                              ? (locale === "es" ? "actividad" : "activity")
                              : (locale === "es" ? "actividades" : "activities")}
                            {" • "}
                            <span className="text-amber-300 font-semibold">
                              {formatCurrency(participantTotal)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveParticipant(participant.id);
                            resetActivityFlow();
                          }}
                          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-amber-300"
                          title={locale === "es" ? "Editar actividades" : "Edit activities"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {storeParticipants.length > 1 && participantIndex > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(participant.id);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-slate-400 hover:text-red-400 group"
                            title={locale === "es" ? "Eliminar participante" : "Remove participant"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-slate-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </button>

                    {/* Participant Activities - Collapsible */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 space-y-3">
                            {participant.selectedActivities.length === 0 ? (
                              <p className="text-slate-400 text-center py-4">
                                {locale === "es" ? "No hay actividades seleccionadas" : "No activities selected"}
                              </p>
                            ) : (
                              participant.selectedActivities.map((activity, index) => {
                                const Icon = getActivityIcon(activity.category);
                                const details = getActivityDetailsForParticipant(activity, participant);
                                const price = computeActivityPriceForParticipant(activity, participant);

                                return (
                                  <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
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

                          {/* Participant Total */}
                          {participant.selectedActivities.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-slate-200">
                                  {locale === "es" ? "Subtotal" : "Subtotal"}
                                </span>
                                <span className="text-xl font-bold text-amber-300">
                                  {formatCurrency(participantTotal)}
                                </span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Grand Total - Only show if multiple participants */}
            {storeParticipants.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="rounded-3xl border-2 border-amber-400/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl overflow-hidden mb-6"
              >
                <div className="px-6 py-5 flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {locale === "es" ? "Total General" : "Grand Total"}
                  </span>
                  <span className="text-3xl font-bold text-amber-300">
                    {formatCurrency(calculateGrandTotal())}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex justify-center"
            >
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
                <div className="relative">
                  {/* Active Participant Badge - Top Right */}
                  {storeParticipants.length > 1 && activeParticipant && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/90 to-blue-500/90 border border-cyan-400/60 shadow-xl backdrop-blur-md"
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 border border-white/30">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        {activeParticipant.name}
                        {activeParticipant.isYou && (
                          <span className="ml-1 text-[10px] opacity-80">({locale === "es" ? "Tú" : "You"})</span>
                        )}
                      </span>
                    </motion.div>
                  )}

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
                  yogaClasses={isYoga ? yogaClasses[currentActivity.id] ?? 1 : undefined}
                  onYogaClassesChange={isYoga ? (classes) => handleYogaClassesChange(currentActivity.id, classes) : undefined}
                  yogaUsePackDiscount={isYoga ? yogaUsePackDiscount[currentActivity.id] ?? false : undefined}
                  onYogaPackDiscountChange={isYoga ? (useDiscount) => handleYogaPackDiscountChange(currentActivity.id, useDiscount) : undefined}
                  surfClasses={isSurf ? selectedSurfClasses[currentActivity.id] ?? DEFAULT_SURF_CLASSES : undefined}
                  onSurfClassesChange={isSurf ? (classes) => handleSurfClassesChange(currentActivity.id, classes) : undefined}
                  hasQuantitySelector={supportsQuantity}
                  quantity={supportsQuantity ? activityQuantities[currentActivity.id] ?? 1 : undefined}
                  onQuantityChange={supportsQuantity ? (value) => handleQuantityChange(currentActivity.id, value) : undefined}
                  hasTimeSelector={supportsTime}
                  timeSlot={supportsTime ? selectedTimeSlots[currentActivity.id] ?? "7:00 AM" : undefined}
                  onTimeSlotChange={supportsTime ? (slot) => handleTimeSlotChange(currentActivity.id, slot) : undefined}
                />
                </div>
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

      {/* Delete Confirmation Modal */}
      {isClient && createPortal(
        <AnimatePresence>
          {deleteConfirmId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 md:p-8 max-w-md mx-4"
              >
                <div className="flex flex-col gap-4">
                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    {locale === "es" ? "¿Estás seguro?" : "Are you sure?"}
                  </h3>

                  {/* Message */}
                  <p className="text-slate-300 text-sm md:text-base">
                    {locale === "es"
                      ? "¿Deseas eliminar a este participante? Esta acción no se puede deshacer."
                      : "Do you want to remove this participant? This action cannot be undone."}
                  </p>

                  {/* Participant name */}
                  {deleteConfirmId && (
                    <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50">
                      <p className="text-cyan-400 font-semibold">
                        {storeParticipants.find(p => p.id === deleteConfirmId)?.name}
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 mt-2">
                    <motion.button
                      onClick={() => setDeleteConfirmId(null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-all font-semibold"
                    >
                      {locale === "es" ? "Cancelar" : "Cancel"}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (deleteConfirmId) {
                          removeParticipant(deleteConfirmId);
                          setDeleteConfirmId(null);
                          setExpandedParticipantId(null);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500/70 transition-all font-semibold"
                    >
                      {locale === "es" ? "Eliminar" : "Delete"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          {showTravelingWithModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTravelingWithModal(false)}
              className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 md:p-8 max-w-md mx-4"
              >
                <div className="flex flex-col gap-6">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30">
                      <Users className="h-8 w-8 text-amber-300" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-white text-center">
                    {storeParticipants.length > 1
                      ? (locale === "es" ? "¿Agregar otro viajero?" : "Add another traveler?")
                      : (locale === "es" ? "¿Viajas con alguien?" : "Are you traveling with someone?")}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-300 text-sm md:text-base text-center">
                    {storeParticipants.length > 1
                      ? (locale === "es"
                          ? "Puedes seguir agregando viajeros con las mismas actividades o personalizarlas."
                          : "You can keep adding travelers with the same activities or customize them.")
                      : (locale === "es"
                          ? "Puedes agregar más personas con las mismas actividades o personalizarlas individualmente."
                          : "You can add more people with the same activities or customize them individually.")}
                  </p>

                  {/* Radio Options */}
                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        addPersonChoice === 'copy'
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addPersonChoice"
                        value="copy"
                        checked={addPersonChoice === 'copy'}
                        onChange={(e) => setAddPersonChoice('copy')}
                        className="mt-1 w-4 h-4 text-amber-400 border-slate-600 focus:ring-amber-400 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Copy className="h-4 w-4 text-amber-300" />
                          <span className="font-semibold text-slate-100">
                            {locale === "es" ? "Copiar mis actividades" : "Copy my activities"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {locale === "es"
                            ? "El nuevo viajero tendrá las mismas actividades seleccionadas"
                            : "The new traveler will have the same activities selected"}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        addPersonChoice === 'customize'
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addPersonChoice"
                        value="customize"
                        checked={addPersonChoice === 'customize'}
                        onChange={(e) => setAddPersonChoice('customize')}
                        className="mt-1 w-4 h-4 text-amber-400 border-slate-600 focus:ring-amber-400 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Edit2 className="h-4 w-4 text-amber-300" />
                          <span className="font-semibold text-slate-100">
                            {locale === "es" ? "Personalizar actividades" : "Customize activities"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {locale === "es"
                            ? "Elige actividades diferentes para el nuevo viajero"
                            : "Choose different activities for the new traveler"}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <motion.button
                      onClick={handleConfirmAddPerson}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 font-bold hover:from-amber-200 hover:to-amber-300 transition-all shadow-lg"
                    >
                      {locale === "es" ? "Confirmar" : "Confirm"}
                    </motion.button>
                    <motion.button
                      onClick={handleSkipAddPerson}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all font-medium"
                    >
                      {locale === "es" ? "Saltar" : "Skip"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ActivitiesPage;

