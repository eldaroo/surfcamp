"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useBookingStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getLocalizedActivities } from "@/lib/activities";
import { getActivityTotalPrice, calculateSurfPrice, calculateYogaPrice, calculatePrivateCoachingUpgrade } from "@/lib/prices";
import { formatCurrency } from "@/lib/utils";
import { Activity } from "@/types";
import ActivityCard from "./ActivityCard";
import HeaderPersonalization from "./HeaderPersonalization";
import OverviewSummary from "./OverviewSummary";
import ActiveParticipantBanner from "../ActiveParticipantBanner";
import PrivateCoachingUpsellModal from "./PrivateCoachingUpsellModal";
import { ArrowRight, Users, Copy, Waves, User, Snowflake, Car, Home, CheckCircle2, Edit2, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SurfPackage = '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes';

const quantityCategories = new Set<Activity["category"]>(["ice_bath", "transport"]);
const perGuestCategories = new Set<Activity["category"]>(["yoga", "surf", "transport"]);
const timeSlotCategories = new Set<Activity["category"]>(["transport"]);

const DEFAULT_SURF_PROGRAM: 'fundamental' | 'progressionPlus' | 'highPerformance' = 'fundamental';
const DEFAULT_SURF_CLASSES = 4;
const DEFAULT_SURF_PACKAGE: SurfPackage = '4-classes';
const DEFAULT_YOGA_PACKAGE = "1-class" as const;

// Surf program names
const SURF_PROGRAMS = {
  fundamental: {
    name: { es: 'Core Surf Program (2 sesiones de videoanálisis)', en: 'Core Surf Program (2 video analysis sessions)' },
  },
  progressionPlus: {
    name: { es: 'Intensive Surf Program (4 sesiones de videoanálisis)', en: 'Intensive Surf Program (4 video analysis sessions)' },
  },
  highPerformance: {
    name: { es: 'Elite Surf Program (5 sesiones de videoanálisis)', en: 'Elite Surf Program (5 video analysis sessions)' },
  },
} as const;

// Map surf classes to programs
const surfClassesToProgram = (classes: number): 'fundamental' | 'progressionPlus' | 'highPerformance' => {
  if (classes <= 4) return 'fundamental';
  if (classes <= 6) return 'progressionPlus';
  return 'highPerformance';
};

// Map programs to surf classes
const surfProgramToClasses = (program: 'fundamental' | 'progressionPlus' | 'highPerformance'): number => {
  switch (program) {
    case 'fundamental': return 4;
    case 'progressionPlus': return 6;
    case 'highPerformance': return 8;
  }
};

const ActivitiesPage = () => {
  const { locale, t } = useI18n();
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
    isPrivateUpgrade,
    setIsPrivateUpgrade,
    setActivityQuantity,
    setSelectedTimeSlot,
    setCurrentStep,
    landingSectionsHidden,
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

  const { selectedActivities, yogaClasses, yogaUsePackDiscount, selectedYogaPackages, selectedSurfPackages, selectedSurfClasses, activityQuantities, selectedTimeSlots, hasPrivateCoaching } = useMemo(() => {
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
      hasPrivateCoaching: activeParticipant?.hasPrivateCoaching ?? false,
    };
  }, [storeParticipants, activeParticipantId]);

  const heroTitle = t("landing.hero.title");
  const [heroMainTitleRaw, heroBrandTitleRaw] = (heroTitle ?? "").split("\n");
  const heroMainTitle = heroMainTitleRaw?.trim() || heroTitle;
  const heroBrandTitle = heroBrandTitleRaw?.trim();
  const heroSubtitle = t("landing.hero.subtitle");
  const landingActivities = useMemo(
    () => [
      { id: "surf", key: "surfProgram", video: "/assets/Reel 1.mp4", icon: "🏄‍♂️" },
      { id: "yoga", key: "yoga", video: "/assets/videos/Videos%20de%20Actividades/Yoga.mp4", icon: "🧘" },
      { id: "iceBath", key: "iceBath", video: "/assets/videos/Videos%20de%20Actividades/Hielo.mp4", icon: "❄️" },
      { id: "breathwork", key: "breathwork", video: "/assets/videos/Videos%20de%20Actividades/Respiraciones.mp4", icon: "🌬️" },
      { id: "clay", key: "creativeArts", video: "/assets/videos/Videos%20de%20Actividades/Ceramica.mp4", icon: "🎨" },
    ],
    []
  );
  const [landingVideoId, setLandingVideoId] = useState<string | null>(null);
  const [landingCarouselIndex, setLandingCarouselIndex] = useState(0);
  const visibleLandingActivities = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const idx = (landingCarouselIndex + i) % landingActivities.length;
        return landingActivities[idx];
      }),
    [landingActivities, landingCarouselIndex]
  );

  const [showOverview, setShowOverview] = useState(false);
  const [completionName, setCompletionName] = useState("");
  const [showTravelingWithModal, setShowTravelingWithModal] = useState(false);
  const [nextStepAfterTraveling, setNextStepAfterTraveling] = useState<
    'dates' | 'accommodation' | 'activities' | 'contact' | 'confirmation' | 'payment' | 'success' | 'find-reservation' | null
  >(null);
  const [hasShownReservationTravelingModal, setHasShownReservationTravelingModal] = useState(false);
  const [needsAccommodation] = useState(true); // Accommodation is now mandatory
  const [isClient, setIsClient] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(
    storeParticipants[0]?.id || null
  );
  const [addPersonChoice, setAddPersonChoice] = useState<'copy' | 'customize'>('copy');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPrivateCoachingModal, setShowPrivateCoachingModal] = useState(false);
  const [selectedCeramicId, setSelectedCeramicId] = useState<string | null>(null);
  const [expandedCeramicIds, setExpandedCeramicIds] = useState<string[]>([]);
  const [returnToCompleteAfterEdit, setReturnToCompleteAfterEdit] = useState(false);
  const markTravelingModalShown = useCallback(() => {
    setHasShownReservationTravelingModal(true);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load the current participant's name when showing completion screen
  const participantCount = Math.max(
    storeParticipants.length,
    bookingData.guests && bookingData.guests > 0 ? bookingData.guests : 1
  );
  const localizedActivities = useMemo(
    () => getLocalizedActivities((locale as "es" | "en") || "es"),
    [locale]
  );
  const ceramicOptions = useMemo(
    () => localizedActivities.filter((activity) => activity.category === 'ceramics'),
    [localizedActivities]
  );

  useEffect(() => {
    const existingCeramic = selectedActivities.find((activity) => activity.category === 'ceramics');
    if (existingCeramic) {
      setSelectedCeramicId(existingCeramic.id);
      return;
    }

    if (!selectedCeramicId && ceramicOptions.length > 0) {
      setSelectedCeramicId(ceramicOptions[0].id);
    }
  }, [ceramicOptions, selectedActivities, selectedCeramicId, setSelectedCeramicId]);

  useEffect(() => {
    const ceramicSelections = selectedActivities.filter((activity) => activity.category === 'ceramics');
    if (ceramicSelections.length <= 1) return;

    const targetId = selectedCeramicId || ceramicSelections[0].id;
    const chosenActivity =
      ceramicOptions.find((activity) => activity.id === targetId) ||
      ceramicSelections[0];

    const cleanedActivities = [
      ...selectedActivities.filter((activity) => activity.category !== 'ceramics'),
      chosenActivity,
    ];

    setSelectedActivities(cleanedActivities);
  }, [ceramicOptions, selectedActivities, selectedCeramicId, setSelectedActivities]);

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
      const isAlreadySelected = selectedActivities.some((item) => item.id === activity.id);

      // Surf is mandatory only for the first participant - can be selected but not deselected
      const activeParticipant = storeParticipants.find(p => p.id === activeParticipantId);
      const isFirstParticipant = activeParticipant?.isYou || storeParticipants.findIndex(p => p.id === activeParticipantId) === 0;

      if (activity.category === "surf" && isAlreadySelected && isFirstParticipant) {
        return;
      }

      if (isAlreadySelected) {
        const updated = selectedActivities.filter((item) => item.id !== activity.id);
        setSelectedActivities(updated);
        return;
      }

      // Ensure default configs
      if (activity.category === "yoga" && !yogaClasses[activity.id]) {
        setYogaClasses(activity.id, 1); // Default to 1 class
        setYogaUsePackDiscount(activity.id, false);
      }
      if (quantityCategories.has(activity.category) && !activityQuantities[activity.id]) {
        setActivityQuantity(activity.id, 1);
      }
      if (timeSlotCategories.has(activity.category) && !selectedTimeSlots[activity.id]) {
        setSelectedTimeSlot(activity.id, "7:00 AM");
      }

      const updatedActivities = [...selectedActivities, activity];
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
      storeParticipants,
    ]
  );

  const handleCeramicsProgramChange = useCallback(
    (activityId: string) => {
      setSelectedCeramicId(activityId);
      setExpandedCeramicIds((prev) =>
        prev.includes(activityId) ? prev : [...prev, activityId]
      );
      const chosenActivity = ceramicOptions.find((activity) => activity.id === activityId);
      if (!chosenActivity) return;

      const activitiesWithoutCeramics = selectedActivities.filter((activity) => activity.category !== 'ceramics');
      const hasCeramicsSelected = activitiesWithoutCeramics.length !== selectedActivities.length;

      if (hasCeramicsSelected) {
        setSelectedActivities([...activitiesWithoutCeramics, chosenActivity]);
      }
    },
    [ceramicOptions, selectedActivities, setSelectedActivities, setSelectedCeramicId]
  );

  const handleToggleCeramics = useCallback(() => {
    const chosenActivity =
      ceramicOptions.find((activity) => activity.id === selectedCeramicId) ??
      ceramicOptions[0];

    if (!chosenActivity) return;

    const activitiesWithoutCeramics = selectedActivities.filter((activity) => activity.category !== 'ceramics');
    const hasCeramicsSelected = activitiesWithoutCeramics.length !== selectedActivities.length;
    const updatedActivities = hasCeramicsSelected
      ? activitiesWithoutCeramics
      : [...activitiesWithoutCeramics, chosenActivity];

    setSelectedActivities(updatedActivities);
  }, [ceramicOptions, selectedActivities, selectedCeramicId, setSelectedActivities]);

  const toggleCeramicDetails = useCallback((activityId: string) => {
    setExpandedCeramicIds((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]
    );
  }, []);

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

  const handleShowPrivateCoachingModal = useCallback(() => {
    setShowPrivateCoachingModal(true);
  }, []);

  const showTravelingModalOnce = useCallback(
    (nextStep: 'dates' | 'accommodation' | 'activities' | 'contact' | 'confirmation' | 'payment' | 'success' | 'find-reservation' | null) => {
      markTravelingModalShown();
      setNextStepAfterTraveling(nextStep);
      setShowTravelingWithModal(true);
    },
    [markTravelingModalShown]
  );

  const handleAcceptPrivateCoaching = useCallback(() => {
    setIsPrivateUpgrade(true);
  }, [setIsPrivateUpgrade]);

  const handleClosePrivateCoachingModal = useCallback(() => {
    setShowPrivateCoachingModal(false);
  }, []);

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

  const handleSurfProgramChange = useCallback(
    (activityId: string, program: 'fundamental' | 'progressionPlus' | 'highPerformance') => {
      const classes = surfProgramToClasses(program);
      setSelectedSurfClasses(activityId, classes);
      setSelectedSurfPackage(activityId, `${classes}-classes` as SurfPackage);
      // Reset private coaching so we can ask again for the new program
      setIsPrivateUpgrade(false);
    },
    [setSelectedSurfClasses, setSelectedSurfPackage, setIsPrivateUpgrade]
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
        const basePrice = calculateSurfPrice(classes);
        // Add private coaching upgrade if selected (Core: $90, Intensive: $110, Elite: $130)
        const upgradePrice = calculatePrivateCoachingUpgrade(classes);
        return hasPrivateCoaching ? basePrice + upgradePrice : basePrice;
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
      hasPrivateCoaching,
    ]
  );

  // Prepare participants data for tabs
  const participantTabsData = storeParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    isYou: p.isYou,
    activitiesCount: p.selectedActivities.length,
  }));

  const handleParticipantChange = (participantId: string) => {
    setActiveParticipant(participantId);
  };

  const handleEditActivity = useCallback(
    (activity: Activity) => {
      const categoryToStep: Record<Activity["category"], 'surf' | 'yoga' | 'ice-bath' | 'ceramics' | 'hosting' | null> = {
        surf: 'surf',
        yoga: 'yoga',
        ice_bath: 'ice-bath',
        transport: null,
        hosting: 'hosting',
        ceramics: 'ceramics',
        other: null,
      };
      const step = categoryToStep[activity.category];
      if (step) {
        setReturnToCompleteAfterEdit(true);
        goToActivityStep(step);
      }
    },
    [goToActivityStep]
  );

  const handleEditAllActivities = useCallback(
    (participantId: string) => {
      setActiveParticipant(participantId);
      setReturnToCompleteAfterEdit(false);
      goToActivityStep('surf');
    },
    [setActiveParticipant, goToActivityStep]
  );

  const handleAutoAdvance = useCallback(() => {
    if (returnToCompleteAfterEdit) {
      setReturnToCompleteAfterEdit(false);
      goToActivityStep('complete');
      return;
    }
    nextActivityStep();
  }, [nextActivityStep, returnToCompleteAfterEdit, goToActivityStep]);

  const handleSkipActivity = useCallback(() => {
    if (returnToCompleteAfterEdit) {
      setReturnToCompleteAfterEdit(false);
      goToActivityStep('complete');
      return;
    }
    skipCurrentActivity();
  }, [returnToCompleteAfterEdit, goToActivityStep, skipCurrentActivity]);

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
      case 'ceramics':
        // Return first ceramic activity (will show all ceramics in the UI)
        return localizedActivities.find(a => a.category === 'ceramics');
      case 'hosting':
        return localizedActivities.find(a => a.category === 'hosting');
      default:
        return null;
    }
  };

  const getCurrentStepActivities = () => {
    if (activityFlowStep === 'ceramics') {
      // For ceramics, return all ceramic workshops
      return localizedActivities.filter(a => a.category === 'ceramics');
    }
    const single = getCurrentStepActivity();
    return single ? [single] : [];
  };

  const currentActivity = getCurrentStepActivity();
  const currentStepActivities = getCurrentStepActivities();

  const handleAddPerson = () => {
    // Safety check: don't add if we already have 2 participants
    if (storeParticipants.length >= 2) {
      return;
    }

    // Save the participant name if provided
    if (completionName.trim() && activeParticipantId) {
      updateParticipantName(activeParticipantId, completionName.trim());
    }
    addParticipant();
    resetActivityFlow();
  };

  const handleCompleteAndContinue = () => {
    const shouldPromptTraveling = storeParticipants.length < 2 && !hasShownReservationTravelingModal;
    if (shouldPromptTraveling) {
      showTravelingModalOnce(null);
      return;
    }
    handleContinue();
  };

  const handleSkipAddPerson = () => {
    setShowTravelingWithModal(false);
    if (nextStepAfterTraveling) {
      const targetStep = nextStepAfterTraveling;
      setNextStepAfterTraveling(null);
      setCurrentStep(targetStep);
    } else {
      // Accommodation is now mandatory, so continue directly
      handleContinue();
    }
  };

  const handleConfirmAddPerson = () => {
    setShowTravelingWithModal(false);

    // Safety check: don't add if we already have 2 participants
    if (storeParticipants.length >= 2) {
      // Accommodation is now mandatory, so continue directly
      if (nextStepAfterTraveling) {
        const targetStep = nextStepAfterTraveling;
        setNextStepAfterTraveling(null);
        setCurrentStep(targetStep);
      } else {
        handleContinue();
      }
      return;
    }

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
      if (nextStepAfterTraveling) {
        const targetStep = nextStepAfterTraveling;
        setNextStepAfterTraveling(null);
        setCurrentStep(targetStep);
      }
    } else {
      // Customize - add participant and start from scratch
      addParticipant();
      resetActivityFlow();
      if (nextStepAfterTraveling) {
        const targetStep = nextStepAfterTraveling;
        setNextStepAfterTraveling(null);
        setCurrentStep(targetStep);
      }
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
      const basePrice = calculateSurfPrice(classes);
      // Add private coaching upgrade if selected (Core: $90, Intensive: $110, Elite: $130)
      const upgradePrice = calculatePrivateCoachingUpgrade(classes);
      return participant.hasPrivateCoaching ? basePrice + upgradePrice : basePrice;
    }

    const quantity = quantityCategories.has(activity.category)
      ? participant.activityQuantities[activity.id] ?? 1
      : 1;

    const perGuest = perGuestCategories.has(activity.category) ? 1 : 1;
    return activity.price * quantity * perGuest;
  };

  // Calculate base price for display (without upgrade)
  const computeActivityBasePriceForParticipant = (
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
      return calculateSurfPrice(classes); // Base price only
    }

    const quantity = quantityCategories.has(activity.category)
      ? participant.activityQuantities[activity.id] ?? 1
      : 1;

    const perGuest = perGuestCategories.has(activity.category) ? 1 : 1;
    return activity.price * quantity * perGuest;
  };

  // Calculate private coaching upgrade for a participant
  const computePrivateCoachingUpgradeForParticipant = (
    participant: typeof storeParticipants[0]
  ): number => {
    if (!participant.hasPrivateCoaching) return 0;

    let total = 0;
    participant.selectedActivities.forEach(activity => {
      if (activity.category === 'surf') {
        const classes = participant.selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES;
        total += calculatePrivateCoachingUpgrade(classes);
      }
    });
    return total;
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
      // Don't show class count - program name will be shown as main title
      return "";
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

  // Check if any modal is open
  const isAnyModalOpen = deleteConfirmId !== null || showTravelingWithModal || showPrivateCoachingModal;

  // When a modal is open, disable pointer events on the page behind it.
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalBodyPointerEvents = document.body.style.pointerEvents;
    const originalHtmlPointerEvents = document.documentElement.style.pointerEvents;

    document.body.style.pointerEvents = 'none';
    document.documentElement.style.pointerEvents = 'none';

    return () => {
      document.body.style.pointerEvents = originalBodyPointerEvents;
      document.documentElement.style.pointerEvents = originalHtmlPointerEvents;
    };
  }, [isAnyModalOpen]);

  return (
    <div className="relative bg-white rounded-3xl shadow-xl">
      {/* Solid white background - minimalist design */}
      <div className="absolute inset-0 bg-white rounded-3xl -z-10"></div>

      <div
        className="mx-auto max-w-7xl px-0 md:px-4 pb-3 md:pb-4"
        style={{
          pointerEvents: isAnyModalOpen ? 'none' : 'auto'
        }}
      >
        {!landingSectionsHidden && (
          <>
            <div className="hidden lg:block text-center mb-5 lg:mb-7">
              <h1 className="text-3xl lg:text-[2.35rem] xl:text-[2.85rem] font-heading font-bold leading-tight text-gray-900 whitespace-nowrap">
                {heroMainTitle}
                {heroBrandTitle && (
                  <span
                    className="block text-xs leading-5 lg:text-[2rem] lg:leading-[3rem] font-normal font-body tracking-normal text-amber-700 mt-3 capitalize"
                  >
                    {heroBrandTitle}
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm md:text-lg text-[#6d5f57] max-w-3xl mx-auto text-center leading-relaxed mb-6">
              Just steps from the ocean in Santa Teresa, we offer a space to discover, learn, and shape your own experience.
            </p>
          </>
        )}
        {/* Desktop activities carousel removed per request - videos now live inside the Activities List */}
        <div className={landingSectionsHidden ? "hidden md:block" : ""}>
          <HeaderPersonalization
            name={personalizationName}
            participants={participantCount}
            locale={(locale as "es" | "en") || "es"}
            onNameChange={setPersonalizationName}
            onParticipantsChange={(value) => setBookingData({ guests: value })}
          />
        </div>

      {false && (
      <AnimatePresence mode="wait">
        {activityFlowStep === 'complete' ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-300/20 to-amber-500/20 border-b border-amber-400/30 px-6 md:px-8 py-6 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-400/30 border border-amber-500/40">
                  <CheckCircle2 className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black font-heading">
                    {locale === "es" ? "Actividades completadas" : "Activities completed"}
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 mt-1">
                    {locale === "es"
                      ? "Revisa y confirma la seleccion de cada participante"
                      : "Review and confirm each participant's selection"}
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-8 space-y-5 md:space-y-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                  {locale === "es"
                    ? "Si algo no se ve bien, expandi el viajero y ajusta antes de continuar."
                    : "If something looks off, expand the traveler and adjust before continuing."}
                </div>

                <div className="space-y-3">
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
                        transition={{ delay: 0.1 + participantIndex * 0.08, duration: 0.35 }}
                        className={`rounded-2xl border bg-gray-50 shadow-sm overflow-hidden transition-all ${
                          isExpanded ? 'border-amber-300 shadow-md' : 'border-gray-200 hover:border-amber-200'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedParticipantId(isExpanded ? null : participant.id)}
                          className="w-full px-4 py-3 md:py-3.5 border-b border-gray-200 bg-white flex items-center justify-between hover:bg-amber-50/40 transition-colors cursor-pointer gap-2 md:gap-0"
                          style={{ width: 'calc(100% + 12px)', marginLeft: '-6px', marginRight: '-6px' }}
                        >
                          <div className="flex items-center gap-2.5 md:gap-3.5">
                            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-amber-100 text-amber-700 font-semibold flex-shrink-0">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="text-left flex-1">
                              <h3 className="text-base md:text-lg font-bold text-gray-900">
                                {participant.name}
                                {participant.isYou && (
                                  <span className="ml-2 text-sm md:text-xs text-gray-600">
                                    ({locale === "es" ? "Tu" : "You"})
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {participant.selectedActivities.length}{" "}
                                {participant.selectedActivities.length === 1
                                  ? (locale === "es" ? "actividad" : "activity")
                                  : (locale === "es" ? "actividades" : "activities")}
                                {" - "}
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(participantTotal)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAllActivities(participant.id);
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] md:text-sm font-semibold text-amber-700 bg-amber-100/70 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 shadow-sm min-h-0"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                              <span className="text-amber-700">{locale === "es" ? "Editar todo" : "Edit all"}</span>
                            </button>
                            <span className="text-xs md:text-sm font-semibold text-gray-600 hidden md:inline">
                              {isExpanded
                                ? (locale === "es" ? "Cerrar" : "Close")
                                : (locale === "es" ? "Ver detalle" : "See details")}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="py-4 md:px-5 md:py-5 bg-gray-50"
                            >
                              <div className="space-y-3">
                                {participant.selectedActivities.map((activity) => {
                                  const isSurf = activity.category === "surf";
                                  const isYoga = activity.category === "yoga";
                                  const isCeramics = activity.category === "ceramics";
                                  const showQuantity = quantityCategories.has(activity.category);
                                  const showTime = timeSlotCategories.has(activity.category);
                                  const activityTotal = computeActivityPriceForParticipant(activity, participant);

                                  return (
                                    <div
                                      key={activity.id}
                                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 md:px-4 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-wrap"
                                    >
                                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-nowrap">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold uppercase flex-shrink-0">
                                          {activity.name.slice(0, 2)}
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
                                          <p className="text-sm md:text-base font-semibold text-gray-900">{activity.name}</p>
                                          <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-600 leading-tight flex-wrap md:mt-0">
                                            {isSurf && (
                                              <>
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                                                  {locale === "es" ? "Clases" : "Classes"}: {selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hidden md:inline-flex">
                                                  {locale === "es" ? "Programa" : "Program"}: {SURF_PROGRAMS[surfClassesToProgram(selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES)].name[locale as "es" | "en"]}
                                                </span>
                                              </>
                                            )}
                                            {isYoga && (
                                              <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                                                {locale === "es" ? "Yoga" : "Yoga"}: {yogaClasses[activity.id] ?? 1}
                                              </span>
                                            )}
                                            {/* Ceramics badge removed to avoid repeating the title */}
                                            {showTime && (
                                              <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hidden md:inline-flex">
                                                {selectedTimeSlots[activity.id] ?? "7:00 AM"}
                                              </span>
                                            )}
                                            {showQuantity && (
                                              <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                                                {locale === "es" ? "Sesiones" : "Sessions"}: {activityQuantities[activity.id] ?? 1}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 text-left md:w-auto w-full justify-end">
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                          <div className="text-left flex-1">
                                            <p className="text-base font-bold text-gray-900">{formatCurrency(activityTotal)}</p>
                                            <p className="text-xs text-gray-500">
                                              {perGuestCategories.has(activity.category)
                                                ? (locale === "es" ? "por persona" : "per person")
                                                : (locale === "es" ? "total" : "total")}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleEditActivity(activity)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors ml-auto min-h-0"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            {locale === "es" ? "Editar" : "Edit"}
                                          </button>
                                        </div>
                                      </div>
                                      {isSurf && participant.hasPrivateCoaching && (
                                        <div className="w-full flex items-center justify-between text-xs text-gray-700 mt-1">
                                          <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                                            {locale === "es" ? "Upgrade 1:1 coaching" : "1:1 coaching upgrade"}
                                          </span>
                                          <span className="font-semibold text-gray-900">
                                            {formatCurrency(calculatePrivateCoachingUpgrade(selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES))}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex flex-col md:flex-row gap-3 justify-end pt-2">
                  {(() => {
                    const shouldSkipTravelingModal = hasShownReservationTravelingModal || storeParticipants.length >= 2;
                    return (
                      <>
                      <button
                        type="button"
                        onClick={() => {
                          if (shouldSkipTravelingModal) {
                            setNextStepAfterTraveling(null);
                            handleContinue();
                          } else {
                            showTravelingModalOnce(null);
                          }
                        }}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 font-bold shadow-lg hover:from-amber-200 hover:to-amber-300 transition-all"
                      >
                        {locale === "es" ? "Continuar con la reserva" : "Continue with reservation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (shouldSkipTravelingModal) {
                            setCurrentStep('find-reservation');
                          } else {
                            showTravelingModalOnce('find-reservation');
                          }
                        }}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-semibold"
                      >
                        {locale === "es" ? "Ya tengo mi reserva" : "I already have a reservation"}
                      </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activityFlowStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        {activityFlowStep === 'ceramics' ? (
          (() => {
            const ceramicPrograms = currentStepActivities;
            if (!ceramicPrograms.length) return null;
            const selectedOption =
              ceramicPrograms.find((a) => a.id === selectedCeramicId) || ceramicPrograms[0];
            const isSelected = selectedActivities.some((item) => item.category === 'ceramics');

            return (
              <ActivityCard
                key="ceramics-card"
                activity={selectedOption}
                locale={(locale as "es" | "en") || "es"}
                participants={1}
                isSelected={isSelected}
                onToggle={handleToggleCeramics}
                onAutoAdvance={handleAutoAdvance}
                onSkip={handleSkipActivity}
                onBack={handleBackStep}
                isFirstStep={false}
                isSurfMandatory={false}
                price={selectedOption?.price ?? 0}
                pricePerPerson={undefined}
                formatPrice={formatCurrency}
              >
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-gray-700">
                    {locale === "es"
                      ? "Elegí el formato que prefieras. Coordinamos fechas y horarios según tu agenda."
                      : "Choose the format you prefer. We'll align dates and times with your schedule."}
                  </p>
                  <div className="space-y-3">
                    {ceramicPrograms.map((activity) => {
                      const isOptionChosen = selectedCeramicId === activity.id;
                      const isOptionActive = selectedActivities.some((item) => item.id === activity.id);
                      const ceramicBullets =
                        activity.id === 'ceramic-stories'
                          ? locale === 'es'
                            ? [
                                'Pinta piezas creadas por otros viajeros y agrega tu estilo.',
                                'Deja tu propia pieza para el siguiente viajero.',
                                'Horneado en ~24h; luego la retiras.',
                              ]
                            : [
                                'Paint traveler-made pieces and add your style.',
                                'Leave your creation for the next traveler.',
                                'Kiln-fired in ~24h; ready for pickup.',
                              ]
                          : locale === 'es'
                            ? [
                                'Día 1: modelado con arcilla natural.',
                                'Día 2 (dentro de 7 días): esmaltar y pintar.',
                                'Horneado y listo en ~9 días en total.',
                              ]
                            : [
                                'Day 1: hand-build with natural clay.',
                                'Day 2 (within 7 days): glaze and paint.',
                                'Kiln finished in ~9 days total.',
                              ];
                      return (
                        <label
                          key={activity.id}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm cursor-pointer transition-all ${
                            isOptionChosen
                              ? 'border-amber-300 bg-amber-50/70 shadow-md'
                              : 'border-gray-200 bg-white hover:border-amber-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="ceramic-program"
                            className="mt-1 h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                            checked={isOptionChosen}
                            onChange={() => handleCeramicsProgramChange(activity.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{activity.name}</span>
                                {isOptionActive && (
                                  <span className="rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold px-2 py-0.5">
                                    {locale === "es" ? "Seleccionado" : "Selected"}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(activity.price)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {ceramicBullets.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                  <span className="text-sm text-gray-700 leading-snug">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    {locale === "es"
                      ? "Un programa por persona. Ajustamos detalles contigo luego de la reserva."
                      : "One program per person. We'll confirm details with you after booking."}
                  </p>
                </div>
              </ActivityCard>
            );
          })()
        ) : currentActivity ? (
          (() => {
                const activity = currentActivity;
                if (!activity) return null;
                const isSelected = selectedActivities.some((item) => item.id === activity.id);
                const individualPrice = computeActivityPrice(activity);
                const isYoga = activity.category === "yoga";
                const isSurf = activity.category === "surf";
                const supportsQuantity = quantityCategories.has(activity.category);
                const supportsTime = timeSlotCategories.has(activity.category);
                const surfDisplayPrice = isSurf
                  ? calculateSurfPrice(selectedSurfClasses[activity.id] ?? DEFAULT_SURF_CLASSES)
                  : individualPrice;

                // Determine if surf is mandatory for this participant
                const isFirstParticipant = activeParticipant?.isYou || storeParticipants.findIndex(p => p.id === activeParticipantId) === 0;
                const isSurfMandatory = isFirstParticipant;

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
                            <span className="ml-1 text-[10px] opacity-80">({locale === "es" ? "Tu" : "You"})</span>
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
                      onAutoAdvance={handleAutoAdvance}
                      onSkip={handleSkipActivity}
                      onBack={handleBackStep}
                      isFirstStep={activityFlowStep === 'surf'}
                      isSurfMandatory={isSurfMandatory}
                      price={surfDisplayPrice}
                      pricePerPerson={undefined}
                      formatPrice={formatCurrency}
                      yogaClasses={isYoga ? yogaClasses[currentActivity.id] ?? 1 : undefined}
                      onYogaClassesChange={isYoga ? (classes) => handleYogaClassesChange(currentActivity.id, classes) : undefined}
                      yogaUsePackDiscount={isYoga ? yogaUsePackDiscount[currentActivity.id] ?? false : undefined}
                      onYogaPackDiscountChange={isYoga ? (useDiscount) => handleYogaPackDiscountChange(currentActivity.id, useDiscount) : undefined}
                      surfProgram={isSurf ? surfClassesToProgram(selectedSurfClasses[currentActivity.id] ?? DEFAULT_SURF_CLASSES) : undefined}
                      onSurfProgramChange={isSurf ? (program) => handleSurfProgramChange(currentActivity.id, program) : undefined}
                      onShowPrivateCoachingModal={isSurf ? handleShowPrivateCoachingModal : undefined}
                      hasQuantitySelector={supportsQuantity}
                      quantity={supportsQuantity ? activityQuantities[currentActivity.id] ?? 1 : undefined}
                      onQuantityChange={supportsQuantity ? (value) => handleQuantityChange(currentActivity.id, value) : undefined}
                      hasTimeSelector={supportsTime}
                      timeSlot={supportsTime ? selectedTimeSlots[currentActivity.id] ?? "7:00 AM" : undefined}
                      onTimeSlotChange={supportsTime ? (slot) => handleTimeSlotChange(currentActivity.id, slot) : undefined}
                    />
                  </div>
                );
              })()
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
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
              style={{ pointerEvents: 'auto' }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[white] rounded-2xl border border-[white] shadow-2xl p-6 md:p-8 max-w-md mx-4"
              >
                <div className="flex flex-col gap-4">
                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    {locale === "es" ? "¿Estás seguro?" : "Are you sure?"}
                  </h3>

                  {/* Message */}
                  <p className="text-black text-sm md:text-base">
                    {locale === "es"
                      ? "¿Deseas eliminar a este participante? Esta acción no se puede deshacer."
                      : "Do you want to remove this participant? This action cannot be undone."}
                  </p>

                  {/* Participant name */}
                  {deleteConfirmId && (
                    <div className="bg-[white]/50 rounded-lg px-4 py-3 border border-[white]/50">
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
                      className="flex-1 px-4 py-3 rounded-xl bg-[white] border border-[white] text-black hover:bg-[white] hover:border-[white] transition-all font-semibold"
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
              style={{ pointerEvents: 'auto' }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[white] rounded-2xl border border-[white] shadow-2xl p-6 md:p-8 max-w-md mx-4"
              >
                <div className="flex flex-col gap-6">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30">
                      <Users className="h-8 w-8 text-amber-300" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-black text-center">
                    {storeParticipants.length > 1
                      ? (locale === "es" ? "¿Agregar otro viajero?" : "Add another traveler?")
                      : (locale === "es" ? "¿Viajas con alguien?" : "Are you traveling with someone?")}
                  </h3>

                  {/* Description */}
                  <p className="text-black text-sm md:text-base text-center">
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
                          : 'border-[white] bg-[white]/30 hover:border-[white]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addPersonChoice"
                        value="copy"
                        checked={addPersonChoice === 'copy'}
                        onChange={(e) => setAddPersonChoice('copy')}
                        className="mt-1 w-4 h-4 text-amber-400 border-[white] focus:ring-amber-400 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Copy className="h-4 w-4 text-amber-300" />
                          <span className="font-semibold text-black">
                            {locale === "es" ? "Copiar mis actividades" : "Copy my activities"}
                          </span>
                        </div>
                        <p className="text-xs text-[#6d5f57] mt-1">
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
                          : 'border-[white] bg-[white]/30 hover:border-[white]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addPersonChoice"
                        value="customize"
                        checked={addPersonChoice === 'customize'}
                        onChange={(e) => setAddPersonChoice('customize')}
                        className="mt-1 w-4 h-4 text-amber-400 border-[white] focus:ring-amber-400 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Edit2 className="h-4 w-4 text-amber-300" />
                          <span className="font-semibold text-black">
                            {locale === "es" ? "Personalizar actividades" : "Customize activities"}
                          </span>
                        </div>
                        <p className="text-xs text-[#6d5f57] mt-1">
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3.5 rounded-xl border border-[white] text-[#6d5f57] hover:bg-[white]/20 transition-all font-medium shadow-md hover:shadow-lg"
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

      {/* Private Coaching Upsell Modal */}
      <PrivateCoachingUpsellModal
        isOpen={showPrivateCoachingModal}
        onClose={handleClosePrivateCoachingModal}
        onAccept={handleAcceptPrivateCoaching}
        locale={(locale as "es" | "en") || "es"}
        upgradePrice={(() => {
          const surfActivity = localizedActivities.find((activity) => activity.category === "surf");
          if (!surfActivity) return 90;
          const classes = selectedSurfClasses[surfActivity.id] ?? DEFAULT_SURF_CLASSES;
          return calculatePrivateCoachingUpgrade(classes);
        })()}
      />
      </div>
    </div>
  );
};

export default ActivitiesPage;
