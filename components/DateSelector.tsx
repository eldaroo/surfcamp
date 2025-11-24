'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice, calculateSurfPrice, calculatePrivateCoachingUpgrade } from '@/lib/prices';
import CustomDatePicker from '@/components/CustomDatePicker';
import BackButton from './BackButton';
import AccommodationCard from './AccommodationCard';
import PriceSummary from './PriceSummary'; // Import PriceSummary
import Modal from './Modal'; // Import Modal
import { DollarSign, ReceiptText } from 'lucide-react'; // Import icons

// Tipo para las habitaciones que vienen de la API
type RoomFromAPI = {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
  maxGuests: number;
  totalCapacity?: number;
  canAccommodateRequestedGuests?: boolean;
  isSharedRoom?: boolean;
};

// Helper function for currency formatting
const formatCurrency = (amount: number, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function for pluralization
const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

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

// Map surf classes to program ID
const surfClassesToProgram = (classes: number): 'fundamental' | 'progressionPlus' | 'highPerformance' => {
  if (classes <= 4) return 'fundamental';
  if (classes <= 6) return 'progressionPlus';
  return 'highPerformance';
};

export default function DateSelector() {
  const { t, locale, raw } = useI18n();
  const {
    bookingData,
    setBookingData,
    setCurrentStep,
    availableRooms,
    setAvailableRooms,
    selectedRoom,
    setSelectedRoom,
    setError: setGlobalError,
    error: globalError,
    priceBreakdown,
    participants: participantList,
    isPrivateUpgrade
  } = useBookingStore();

  // Get activity price with package info for a specific participant
  const getActivityDetailsForParticipant = useCallback((activity: any, participant: any) => {
    let price = 0;
    let packageInfo = '';

    if (activity.category === 'yoga') {
      const yogaPackage = participant.selectedYogaPackages[activity.id];
      if (yogaPackage) {
        price = getActivityTotalPrice('yoga', yogaPackage);
        packageInfo = yogaPackage;
      }
    } else if (activity.category === 'surf') {
      const surfClasses = participant.selectedSurfClasses[activity.id];
      const classes = surfClasses !== undefined ? surfClasses : 4;
      const basePrice = calculateSurfPrice(classes);
      // Add upgrade price based on program (Core: $90, Intensive: $110, Elite: $130)
      const upgradePrice = calculatePrivateCoachingUpgrade(classes);
      price = isPrivateUpgrade ? basePrice + upgradePrice : basePrice;
      packageInfo = ''; // Will show program name as activity name
    } else {
      price = activity.price || 0;
    }

    return { price, packageInfo };
  }, [isPrivateUpgrade]);

  console.log('🏠 [DateSelector] Render - availableRooms:', availableRooms);
  console.log('🏠 [DateSelector] Render - availableRooms length:', availableRooms?.length);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showPriceSummaryModal, setShowPriceSummaryModal] = useState(false);
  const [isPriceSummaryCollapsed, setIsPriceSummaryCollapsed] = useState(false);
  const [hasRequestedAvailability, setHasRequestedAvailability] = useState(false);
  const [isDateSelectorCollapsed, setIsDateSelectorCollapsed] = useState(false);

  console.log('🏠 [DateSelector] State:', {
    hasRequestedAvailability,
    loadingRooms,
    availableRoomsExists: !!availableRooms,
    availableRoomsLength: availableRooms?.length
  });

  // Usar fechas del store global para mantener sincronización
  const checkInDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null;
  const checkOutDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null;

  // Guests are constrained by the number of participants selected in activities
  const participantCount = Math.max(1, participantList.length);
  const guests = Math.max(participantCount, bookingData.guests ?? participantCount);

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  // Effect to close modal and reset collapse state when dates are cleared
  useEffect(() => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      setIsPriceSummaryCollapsed(false);
      setShowPriceSummaryModal(false);
      setIsDateSelectorCollapsed(false);
    }
  }, [bookingData.checkIn, bookingData.checkOut]);

  const clearAvailabilityResults = () => {
    setAvailableRooms(null);
    setSelectedRoom(null);
  };

  const markAvailabilityAsStale = () => {
    setHasRequestedAvailability(false);
    clearAvailabilityResults();
    setGlobalError(null);
    setError('');
    setIsDateSelectorCollapsed(false);
  };

  const fetchAvailableRooms = async () => {
    const guestsToUse = bookingData.guests ?? guests;

    console.log('🔄 [DateSelector fetchAvailableRooms] Starting...', {
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guestsToUse
    });

    if (!bookingData.checkIn || !bookingData.checkOut || !guestsToUse) {
      console.log('❌ [DateSelector fetchAvailableRooms] Missing required data');
      return;
    }

    console.log('📞 [DateSelector fetchAvailableRooms] Calling API...');
    setLoadingRooms(true);
    setGlobalError(null);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: guestsToUse,
        }),
      });

      console.log('📡 [DateSelector fetchAvailableRooms] Response:', response.status, response.ok);

      const data = await response.json();
      console.log('📋 [DateSelector fetchAvailableRooms] Data:', data);

      if (!response.ok) {
        console.log('❌ [DateSelector fetchAvailableRooms] Response not OK');
        if (response.status === 404 && data.error && data.error.includes('suficientes camas')) {
          console.log('🛏️ [DateSelector fetchAvailableRooms] Not enough beds - setting empty array');
          setAvailableRooms([]);
          setGlobalError(null);
          return;
        }
        throw new Error(data.error || 'Error getting available rooms');
      }

      if (!data.available || !data.availableRooms?.length) {
        console.log('⚠️ [DateSelector fetchAvailableRooms] No rooms available or empty array');
        setAvailableRooms([]);
        setGlobalError(null);
        return;
      }

      console.log('✅ [DateSelector fetchAvailableRooms] Setting rooms:', data.availableRooms);
      setAvailableRooms(data.availableRooms);
      setGlobalError(null);
    } catch (error) {
      console.error('❌ [DateSelector fetchAvailableRooms] Error:', error);
      setGlobalError('Error getting available rooms. Please try again.');
      setAvailableRooms([]);
    } finally {
      console.log('🏁 [DateSelector fetchAvailableRooms] Setting loadingRooms to false');
      setLoadingRooms(false);
    }
  };

  const handleAvailabilitySearch = async () => {
    console.log('🔍 [DateSelector handleAvailabilitySearch] Starting...', {
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests
    });

    if (!bookingData.checkIn || !bookingData.checkOut) {
      console.log('❌ [DateSelector handleAvailabilitySearch] Missing dates');
      setError(t('dates.validation.selectDates'));
      setHasRequestedAvailability(false);
      return;
    }

    console.log('✅ [DateSelector handleAvailabilitySearch] Setting hasRequestedAvailability = true');
    setError('');
    setGlobalError(null);
    setHasRequestedAvailability(true);
    setLoadingRooms(true);
    setBookingData({ guests });
    clearAvailabilityResults();

    // Collapse price summary and date selector when search button is pressed
    setIsPriceSummaryCollapsed(true);
    setIsDateSelectorCollapsed(true);

    console.log('📞 [DateSelector handleAvailabilitySearch] Calling fetchAvailableRooms...');
    await fetchAvailableRooms();
    console.log('🏁 [DateSelector handleAvailabilitySearch] Completed');
  };

  const handleRoomSelect = (room: RoomFromAPI) => {
    if (room.availableRooms > 0) {
      setSelectedRoom(room);
      setBookingData({ roomTypeId: room.roomTypeId });
      setCurrentStep('contact');
    }
  };

  const handleContinue = () => {
    if (!selectedRoom) {
      setGlobalError(t('accommodation.selectAccommodation'));
      return;
    }

    setGlobalError(null);
    setCurrentStep('contact');
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRoomFeatures = (roomTypeId: string) => {
    const features: { label: string; color: 'aqua' | 'gold' | 'orange' }[] = [];

    if (roomTypeId === 'casa-playa') {
      features.push(
        { label: t('accommodation.features.sharedRoom'), color: 'orange' },
        { label: t('accommodation.features.oceanView'), color: 'aqua' },
        { label: t('accommodation.features.socialEnvironment'), color: 'gold' }
      );
    } else if (roomTypeId === 'casitas-privadas') {
      features.push(
        { label: t('accommodation.features.totalPrivacy'), color: 'aqua' },
        { label: t('accommodation.features.privateGarden'), color: 'gold' },
        { label: t('accommodation.features.intimateEnvironment'), color: 'orange' },
        { label: t('accommodation.features.independentHouse'), color: 'aqua' }
      );
    } else if (roomTypeId === 'casas-deluxe') {
      features.push(
        { label: t('accommodation.features.beachStudio'), color: 'gold' },
        { label: t('accommodation.features.privateKitchen'), color: 'orange' },
        { label: t('accommodation.features.hotWaterBathroom'), color: 'aqua' },
        { label: t('accommodation.features.wifiAC'), color: 'aqua' }
      );
    }

    return features;
  };

  const getFeatureChipStyle = (color: 'aqua' | 'gold' | 'orange') => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium text-white";

    switch (color) {
      case 'aqua':
        return `${baseClasses} bg-[color-mix(in_srgb,var(--brand-aqua)_25%,transparent)] border border-[color-mix(in_srgb,var(--brand-aqua)_40%,transparent)]`;
      case 'gold':
        return `${baseClasses} bg-[color-mix(in_srgb,var(--brand-gold)_25%,transparent)] border border-[color-mix(in_srgb,var(--brand-gold)_40%,transparent)]`;
      case 'orange':
        return `${baseClasses} bg-[color-mix(in_srgb,var(--brand-orange)_25%,transparent)] border border-[color-mix(in_srgb,var(--brand-orange)_40%,transparent)]`;
    }
  };

  const nights = calculateNights();

  // Build list of all activity selections grouped by participant
  const allActivitySelections = useMemo(() => {
    const selections: Array<{
      activity: any;
      participant: any;
      price: number;
      packageInfo: string;
    }> = [];

    participantList.forEach(participant => {
      participant.selectedActivities.forEach((activity: any) => {
        const details = getActivityDetailsForParticipant(activity, participant);
        selections.push({
          activity,
          participant,
          ...details
        });
      });
    });

    return selections;
  }, [participantList, getActivityDetailsForParticipant]);

  // Calculate totals
  const accommodationTotal = selectedRoom && nights > 0
    ? (selectedRoom.isSharedRoom
        ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
        : selectedRoom.pricePerNight * nights)
    : 0;

  const activitiesTotal = allActivitySelections.reduce((sum, selection) => {
    return sum + selection.price;
  }, 0);

  const subtotal = accommodationTotal + activitiesTotal;
  const fees = priceBreakdown?.tax || 0;
  const total = subtotal + fees;

  return (
    <div className="relative">
      {/* Overlay behind widget */}
      <div className="absolute inset-0 bg-black/75 rounded-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Section */}
          {!(hasRequestedAvailability && availableRooms && availableRooms.length > 0) && (
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <BackButton variant="minimal" />
              </div>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30 mb-2.5"
                >
                  <svg className="h-6 w-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </motion.div>
                <h1 className="text-xl md:text-2xl font-bold text-white font-heading mb-1.5">{t('dates.title')}</h1>
                <p className="text-[#8c8179] text-sm md:text-base">{t('dates.subtitle')}</p>
              </div>
            </div>
          )}

          {/* Main Content Container */}
          <div className={`rounded-3xl border border-[white]/50 bg-[white]/70 shadow-xl overflow-visible mb-3 ${!isDateSelectorCollapsed ? 'min-h-[420px] md:min-h-[336px]' : ''}`}>
            <div className={`grid grid-cols-1 ${isPriceSummaryCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-0 transition-all duration-300 ease-in-out ${!isDateSelectorCollapsed ? 'min-h-[420px] md:min-h-[336px]' : ''}`} lang={locale === 'en' ? 'en-US' : 'es-ES'}>
              {/* Columna izquierda - Selector de fechas */}
              {!isDateSelectorCollapsed ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`p-4 md:p-6 ${!isDateSelectorCollapsed ? 'min-h-[420px] md:min-h-[336px]' : ''} ${!isPriceSummaryCollapsed ? 'border-r border-[white]/50' : ''}`}
                >
                  <div className="space-y-4">
                    {/* Date Pickers Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Check-in Date */}
                      <div className="relative z-30">
                        <label className="block text-xs font-semibold text-black/70 uppercase tracking-wider mb-2">
                          {t('dates.checkIn')} *
                        </label>
                        <CustomDatePicker
                          selected={checkInDate}
                          onChange={(date) => {
                            markAvailabilityAsStale();
                            setBookingData({ checkIn: date || undefined });
                          }}
                          placeholderText={t('dates.checkIn')}
                          minDate={new Date()}
                        />
                      </div>

                      {/* Check-out Date */}
                      <div className="relative z-20">
                        <label className="block text-xs font-semibold text-black/70 uppercase tracking-wider mb-2">
                          {t('dates.checkOut')} *
                        </label>
                        <CustomDatePicker
                          selected={checkOutDate}
                          onChange={(date) => {
                            markAvailabilityAsStale();
                            setBookingData({ checkOut: date || undefined });
                          }}
                          placeholderText={t('dates.checkOut')}
                          minDate={checkInDate || new Date()}
                        />
                      </div>
                    </div>

                    {/* Guests Counter + Search Button Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Guests Counter */}
                      <div>
                        <label className="block text-xs font-semibold text-black/70 uppercase tracking-wider mb-2">
                          {t('dates.guests')}
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            disabled={guests <= participantCount}
                            onClick={() => {
                              const newGuests = Math.max(participantCount, guests - 1);
                              markAvailabilityAsStale();
                              setBookingData({ guests: newGuests });
                            }}
                            className={`w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all shadow-sm ${
                              guests <= participantCount ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/70 hover:border-amber-400/50'
                            }`}
                          >
                            <span className="text-black text-lg font-bold">-</span>
                          </button>
                          <span className="text-2xl font-bold text-amber-400 w-12 text-center">
                            {guests}
                          </span>
                          <button
                            type="button"
                            disabled={guests >= 2}
                            onClick={() => {
                              const newGuests = Math.min(2, guests + 1);
                              markAvailabilityAsStale();
                              setBookingData({ guests: newGuests });
                            }}
                            className={`w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all shadow-sm ${
                              guests >= 2 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/70 hover:border-amber-400/50'
                            }`}
                          >
                            <span className="text-black text-lg font-bold">+</span>
                          </button>
                          <span className="text-black font-medium text-sm">
                            {guests === 1 ? t('dates.guest') : t('dates.guests')}
                          </span>
                        </div>
                      </div>

                      {/* Check Availability Button */}
                      <div className="flex flex-col justify-end">
                        <motion.button
                          type="button"
                          onClick={handleAvailabilitySearch}
                          disabled={loadingRooms || !bookingData.checkIn || !bookingData.checkOut}
                          whileHover={{ scale: loadingRooms || !bookingData.checkIn || !bookingData.checkOut ? 1 : 1.02 }}
                          whileTap={{ scale: loadingRooms || !bookingData.checkIn || !bookingData.checkOut ? 1 : 0.98 }}
                          className={`w-full rounded-xl px-6 py-3 font-bold transition-all shadow-lg ${
                            loadingRooms
                              ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                              : !bookingData.checkIn || !bookingData.checkOut
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-300 to-amber-400 text-black hover:from-amber-200 hover:to-amber-300 shadow-amber-300/40'
                          }`}
                        >
                          {loadingRooms ? (
                            <span className="flex items-center justify-center gap-2 text-sm">
                              <span className="inline-flex h-4 w-4 items-center justify-center">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                              </span>
                              {t('dates.searchingAvailability')}
                            </span>
                          ) : (
                            <span className="whitespace-nowrap">{t('dates.searchAvailability')}</span>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Summary */}
                    {(bookingData.checkIn || bookingData.checkOut) && (
                      <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/40 relative">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-black mb-2 font-heading text-sm">{t('dates.summary.title')}</h3>
                            <div className="space-y-1.5 text-sm">
                              {bookingData.checkIn && (
                                <div className="flex items-center gap-2">
                                  <span className="text-black/70 font-medium text-xs">{t('dates.summary.checkIn')}:</span>
                                  <span className="font-semibold text-black">
                                    {new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                              {bookingData.checkOut && (
                                <div className="flex items-center gap-2">
                                  <span className="text-black/70 font-medium text-xs">{t('dates.summary.checkOut')}:</span>
                                  <span className="font-semibold text-black">
                                    {new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-black/70 font-medium text-xs">{t('dates.summary.guests')}:</span>
                                <span className="font-semibold text-black">{guests}</span>
                              </div>
                              {nights > 0 && (
                                <div className="mt-2 text-sm text-amber-600 font-bold">
                                  {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              markAvailabilityAsStale();
                              setBookingData({ checkIn: undefined, checkOut: undefined, guests: participantCount });
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 bg-amber-100 hover:bg-amber-200 transition-colors"
                          >
                            {t('common.edit')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                        <p className="text-red-900 text-sm font-medium">{error}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Collapsed Date Selector - Compact Version */
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 md:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black/70 font-semibold uppercase tracking-wider">{t('dates.checkIn')}:</span>
                        <span className="text-sm font-bold text-black">
                          {bookingData.checkIn && new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black/70 font-semibold uppercase tracking-wider">{t('dates.checkOut')}:</span>
                        <span className="text-sm font-bold text-black">
                          {bookingData.checkOut && new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black/70 font-semibold uppercase tracking-wider">{t('dates.guests')}:</span>
                        <span className="text-sm font-bold text-black">{guests}</span>
                      </div>
                      {nights > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-600 font-bold">
                            {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDateSelectorCollapsed(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 bg-amber-100 hover:bg-amber-200 transition-colors whitespace-nowrap"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Right Column - Full Price Summary (Desktop only, when not collapsed) */}
              {!isPriceSummaryCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="hidden lg:block w-full p-4 md:p-6 bg-white/10"
                >
                  <PriceSummary showContainer={false} />
                </motion.div>
              )}
            </div>
          </div>

          {/* Accommodation Section - Below date selector */}
          {checkInDate && checkOutDate && (hasRequestedAvailability || loadingRooms) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-3"
            >
              {/* Accommodation Header */}
              {availableRooms && availableRooms.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <BackButton variant="minimal" />
                  </div>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30 mb-2.5"
                    >
                      <svg className="h-6 w-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </motion.div>
                    <h2 className="text-xl md:text-2xl font-bold text-white font-heading mb-1.5">
                      {t('accommodation.title')}
                    </h2>
                    <p className="text-[#8c8179] text-sm md:text-base">
                      {t('accommodation.subtitle')}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {hasRequestedAvailability && globalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-4 rounded-2xl bg-red-500/20 border border-red-400/30"
                >
                  <p className="text-red-900 font-medium text-sm">{globalError}</p>
                </motion.div>
              )}

              {/* Loading State */}
              {hasRequestedAvailability && loadingRooms && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4"></div>
                  <p className="text-white font-medium text-base">{t('accommodation.searchingRooms')}</p>
                </div>
              )}

            {/* Room Cards */}
            {(() => {
              console.log('🏠 [DateSelector] Room Cards condition check:', {
                hasRequestedAvailability,
                loadingRooms,
                availableRooms,
                availableRoomsLength: availableRooms?.length,
                shouldShowRooms: hasRequestedAvailability && !loadingRooms && availableRooms && availableRooms.length > 0
              });
              return null;
            })()}
            {hasRequestedAvailability && !loadingRooms && availableRooms && availableRooms.length > 0 && (
              <>

                <div className="accommodation-cards-grid mb-6 flex flex-col gap-4" style={{ overflow: 'visible' }}>
                {availableRooms.map((room: RoomFromAPI) => {
                  console.log('🏠 [DateSelector] Rendering room:', room);

                  const features = getRoomFeatures(room.roomTypeId);
                  const isSelected = selectedRoom?.roomTypeId === room.roomTypeId;
                  const isUnavailable = room.availableRooms === 0;
                  const roomPrice = room.isSharedRoom ? room.pricePerNight * (bookingData.guests || 1) : room.pricePerNight;
                  const totalPrice = room.isSharedRoom
                    ? room.pricePerNight * nights * (bookingData.guests || 1)
                    : room.pricePerNight * nights;
                  const roomDescriptions = raw<Record<string, { desktop: string; mobile: string }>>('accommodation.roomDescriptions') || {};
                  const description = roomDescriptions[room.roomTypeId] ?? {
                    desktop: room.roomTypeName,
                    mobile: room.roomTypeName
                  };

                  return (
                    <div key={room.roomTypeId} className="mb-2 md:mb-0">
                      <AccommodationCard
                        room={room}
                        isSelected={isSelected}
                        isUnavailable={isUnavailable}
                        nights={nights}
                        guests={bookingData.guests || 1}
                        roomPrice={roomPrice}
                        totalPrice={totalPrice}
                        features={features}
                        description={description}
                        locale={locale}
                        onSelect={() => handleRoomSelect(room)}
                        getFeatureChipStyle={getFeatureChipStyle}
                      />
                    </div>
                  );
                })}
                </div>
              </>
            )}

              {/* No rooms available */}
              {hasRequestedAvailability && !loadingRooms && (!availableRooms || availableRooms.length === 0) && checkInDate && checkOutDate && (
                <div className="text-center py-8 bg-[white]/70 backdrop-blur-md rounded-3xl p-8 border border-[white]/50 shadow-xl">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-xl md:text-2xl font-bold text-black mb-3 font-heading">
                    {t('accommodation.noRoomsAvailable')}
                  </h3>
                  <p className="text-sm md:text-base text-[#8c8179] mb-6 max-w-md mx-auto">
                    {t('accommodation.noAvailableMessage')}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Collapsed Price Summary (Desktop) */}
      {isPriceSummaryCollapsed && (bookingData.checkIn && bookingData.checkOut) && (
        <motion.button
          type="button"
          onClick={() => setShowPriceSummaryModal(true)}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="hidden lg:flex fixed top-4 right-4 z-40 items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-300/40 hover:from-amber-200 hover:to-amber-300 transition-all duration-300 ease-in-out"
        >
          <ReceiptText className="h-5 w-5 text-black" />
          <span className="text-black">{t('prices.total')}: {formatCurrency(total, locale)}</span>
        </motion.button>
      )}

      {/* Collapsed Price Summary (Mobile) */}
      {isPriceSummaryCollapsed && (bookingData.checkIn && bookingData.checkOut) && (
        <motion.button
          type="button"
          onClick={() => setShowPriceSummaryModal(true)}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="lg:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-4 text-base font-bold shadow-lg shadow-amber-300/40 hover:from-amber-200 hover:to-amber-300 transition-all duration-300 ease-in-out"
        >
          <div className="flex items-center gap-3">
            <ReceiptText className="h-6 w-6 text-black" />
            <span className="text-black font-bold">{t('prices.summary')}</span>
          </div>
          <span className="text-black font-bold">{formatCurrency(total, locale)}</span>
        </motion.button>
      )}

      {/* Price Summary Modal */}
      <Modal isOpen={showPriceSummaryModal} onClose={() => setShowPriceSummaryModal(false)} title={t('prices.summary')}>
        <PriceSummary isCollapsed={false} showContainer={false} />
      </Modal>
    </div>
  );
} 

