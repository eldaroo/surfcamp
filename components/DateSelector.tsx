'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice, calculateSurfPrice } from '@/lib/prices';
import CustomDatePicker from '@/components/CustomDatePicker';
import BackButton from './BackButton';
import AccommodationCard from './AccommodationCard';

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

// Get activity price with package info for a specific participant
const getActivityDetailsForParticipant = (activity: any, participant: any) => {
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
    price = calculateSurfPrice(classes);
    packageInfo = `${classes} classes`;
  } else {
    price = activity.price || 0;
  }

  return { price, packageInfo };
};

export default function DateSelector() {
  const { t, locale } = useI18n();
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
    participants
  } = useBookingStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Usar fechas del store global para mantener sincronización
  const checkInDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null;
  const checkOutDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null;

  // Usar guests directamente del store en lugar de estado local
  const guests = bookingData.guests || 1;

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  const fetchAvailableRooms = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.guests) {
      return;
    }

    setLoadingRooms(true);
    setGlobalError(null);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && data.error && data.error.includes('suficientes camas')) {
          setAvailableRooms([]);
          setGlobalError(null);
          return;
        }
        throw new Error(data.error || 'Error getting available rooms');
      }

      if (!data.available || !data.availableRooms?.length) {
        setAvailableRooms([]);
        setGlobalError(null);
        return;
      }

      setAvailableRooms(data.availableRooms);
      setGlobalError(null);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setGlobalError('Error getting available rooms. Please try again.');
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch rooms when dates or guests change
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && bookingData.guests) {
      setAvailableRooms(null);
      setSelectedRoom(null);
      fetchAvailableRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.guests]);

  const handleRoomSelect = (room: RoomFromAPI) => {
    if (room.availableRooms > 0) {
      setSelectedRoom(room);
      setBookingData({ roomTypeId: room.roomTypeId });
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

    participants.forEach(participant => {
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
  }, [participants]);

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
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: 'var(--brand-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <BackButton variant="minimal" />
          <div>
            <h1 className="text-[28px] font-bold text-white font-heading">{t('dates.title')}</h1>
            <p className="text-[15px] text-[var(--brand-text-dim)]">{t('dates.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 mb-12" lang={locale === 'en' ? 'en-US' : 'es-ES'}>
          {/* Columna izquierda - Selector de fechas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="card"
          >
            <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('dates.checkIn')} *
            </label>
            <CustomDatePicker
              selected={checkInDate}
              onChange={(date) => {
                setBookingData({ ...bookingData, checkIn: date || undefined });
              }}
              placeholderText={t('dates.checkIn')}
              minDate={new Date()}
              maxDate={checkOutDate || undefined}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('dates.checkOut')} *
            </label>
            <CustomDatePicker
              selected={checkOutDate}
              onChange={(date) => {
                setBookingData({ ...bookingData, checkOut: date || undefined });
              }}
              placeholderText={t('dates.checkOut')}
              minDate={checkInDate || new Date()}
            />
          </div>
        </div>

        {/* Guests Counter */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {t('dates.guests')}
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                const newGuests = Math.max(1, guests - 1);
                setBookingData({ guests: newGuests });
              }}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="text-white">-</span>
            </button>
            <span className="text-2xl font-bold text-blue-400 w-12 text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => {
                const newGuests = Math.min(5, guests + 1);
                setBookingData({ guests: newGuests });
              }}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="text-white">+</span>
            </button>
            <span className="text-yellow-300">
              {guests === 1 ? t('dates.guest') : t('dates.guests')}
            </span>
          </div>
        </div>

        {/* Summary */}
        {(bookingData.checkIn || bookingData.checkOut) && (
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-yellow-300 mb-2 font-heading">{t('dates.summary.title')}</h3>
            <div className="space-y-1 text-sm">
              {bookingData.checkIn && (
                <div>
                  <span className="text-white">{t('dates.summary.checkIn')}:</span>
                  <span className="ml-2 font-medium text-blue-300">
                    {new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {bookingData.checkOut && (
                <div>
                  <span className="text-white">{t('dates.summary.checkOut')}:</span>
                  <span className="ml-2 font-medium text-blue-300">
                    {new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-white">{t('dates.summary.guests')}:</span>
                <span className="ml-2 font-medium text-blue-300">{bookingData.guests || guests}</span>
              </div>
              {nights > 0 && (
                <div className="mt-2 text-sm text-yellow-300">
                  {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

            </div>
          </motion.div>

          {/* Columna derecha - Compact Price Summary (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:block lg:w-80"
          >
            <div
              className="rounded-xl p-4 border sticky top-6"
              style={{
                backgroundColor: 'var(--brand-surface)',
                borderColor: 'var(--brand-border)',
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <h3
                className="text-[16px] font-semibold mb-4 font-heading"
                style={{ color: 'var(--brand-text)' }}
              >
                {locale === 'es' ? 'Resumen' : 'Price Summary'}
              </h3>

              {/* Stay Summary - Compact */}
              {bookingData.checkIn && bookingData.checkOut && (
                <>
                  <div className="space-y-2 mb-4 text-[13px]">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--brand-text-dim)' }}>
                        {new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ color: 'var(--brand-text-dim)' }}>→</span>
                      <span style={{ color: 'var(--brand-text-dim)' }}>
                        {new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--brand-text-dim)' }}>
                        {bookingData.guests} {pluralize(bookingData.guests || 1, 'guest', 'guests')}
                      </span>
                      <span style={{ color: 'var(--brand-text-dim)' }}>•</span>
                      <span style={{ color: 'var(--brand-text-dim)' }}>
                        {nights} {pluralize(nights, 'night', 'nights')}
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-px mb-4"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
                  />
                </>
              )}

              {/* Line Items */}
              <div className="space-y-3 mb-4">
                {/* Accommodation */}
                {selectedRoom && nights > 0 && (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--brand-text)' }}
                        >
                          {selectedRoom.roomTypeName}
                        </div>
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: 'var(--brand-text-dim)' }}
                        >
                          {nights} × {formatCurrency(selectedRoom.pricePerNight, locale)}
                        </div>
                      </div>
                      <div
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        {formatCurrency(accommodationTotal, locale)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {allActivitySelections.map((selection, index) => {
                  const { activity, participant, price, packageInfo } = selection;
                  const showParticipantName = participants.length > 1;

                  return (
                    <div key={`${participant.id}-${activity.id}-${index}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <div
                            className="text-[13px] font-medium"
                            style={{ color: 'var(--brand-text)' }}
                          >
                            {activity.name}
                          </div>
                          {showParticipantName && (
                            <div
                              className="text-[11px] mt-0.5"
                              style={{ color: 'var(--brand-text-dim)' }}
                            >
                              {participant.name}
                            </div>
                          )}
                        </div>
                        <div
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--brand-text)' }}
                        >
                          {formatCurrency(price, locale)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              {(accommodationTotal > 0 || activitiesTotal > 0) && (
                <>
                  <div
                    className="h-px mb-3"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
                  />
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className="text-[15px] font-semibold"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {locale === 'es' ? 'Total' : 'Total'}
                    </span>
                    <span
                      className="text-[20px] font-bold"
                      style={{ color: 'var(--brand-gold)' }}
                    >
                      {formatCurrency(total, locale)}
                    </span>
                  </div>
                </>
              )}

              {/* CTA Button - Compact */}
              {(accommodationTotal > 0 || activitiesTotal > 0) && (
                <button
                  disabled={!selectedRoom}
                  onClick={() => {
                    if (selectedRoom) {
                      setCurrentStep('contact');
                    }
                  }}
                  className={`
                    w-full px-4 py-2.5 rounded-lg text-[14px] font-semibold
                    transition-all duration-200
                    ${selectedRoom
                      ? 'hover:shadow-lg'
                      : 'cursor-not-allowed opacity-60'
                    }
                  `}
                  style={{
                    backgroundColor: selectedRoom ? 'var(--brand-gold)' : 'var(--brand-border)',
                    color: selectedRoom ? 'black' : 'var(--brand-text-dim)'
                  }}
                >
                  {selectedRoom
                    ? (locale === 'es' ? 'Continuar' : 'Continue')
                    : (locale === 'es' ? 'Completa la selección' : 'Complete Selection')
                  }
                </button>
              )}

              {/* Empty State */}
              {!bookingData.checkIn && !bookingData.checkOut && activitiesTotal === 0 && (
                <div className="text-center py-6">
                  <div className="text-[28px] mb-2">📅</div>
                  <p
                    className="text-[12px]"
                    style={{ color: 'var(--brand-text-dim)' }}
                  >
                    {locale === 'es' ? 'Selecciona fechas para ver precios' : 'Select dates to see pricing'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Mobile Price Summary - Collapsible */}
        {(bookingData.checkIn || bookingData.checkOut || activitiesTotal > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:hidden mb-8"
          >
            <button
              onClick={() => setShowMobileSummary(!showMobileSummary)}
              className="w-full rounded-xl p-4 border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--brand-surface)',
                borderColor: 'var(--brand-border)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div className="text-left">
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--brand-text)' }}>
                    {locale === 'es' ? 'Resumen de Precios' : 'Price Summary'}
                  </div>
                  {(accommodationTotal > 0 || activitiesTotal > 0) && (
                    <div className="text-[18px] font-bold" style={{ color: 'var(--brand-gold)' }}>
                      {formatCurrency(total, locale)}
                    </div>
                  )}
                </div>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${showMobileSummary ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: 'var(--brand-text-dim)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMobileSummary && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-b-xl p-4 border border-t-0"
                  style={{
                    backgroundColor: 'var(--brand-surface)',
                    borderColor: 'var(--brand-border)'
                  }}
                >
                  {/* Stay Summary - Compact */}
                  {bookingData.checkIn && bookingData.checkOut && (
                    <>
                      <div className="space-y-2 mb-4 text-[13px]">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--brand-text-dim)' }}>
                            {new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{ color: 'var(--brand-text-dim)' }}>→</span>
                          <span style={{ color: 'var(--brand-text-dim)' }}>
                            {new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--brand-text-dim)' }}>
                            {bookingData.guests} {pluralize(bookingData.guests || 1, 'guest', 'guests')}
                          </span>
                          <span style={{ color: 'var(--brand-text-dim)' }}>•</span>
                          <span style={{ color: 'var(--brand-text-dim)' }}>
                            {nights} {pluralize(nights, 'night', 'nights')}
                          </span>
                        </div>
                      </div>

                      <div
                        className="h-px mb-4"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
                      />
                    </>
                  )}

                  {/* Line Items */}
                  <div className="space-y-3 mb-4">
                    {/* Accommodation */}
                    {selectedRoom && nights > 0 && (
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <div
                              className="text-[13px] font-medium"
                              style={{ color: 'var(--brand-text)' }}
                            >
                              {selectedRoom.roomTypeName}
                            </div>
                            <div
                              className="text-[11px] mt-0.5"
                              style={{ color: 'var(--brand-text-dim)' }}
                            >
                              {nights} × {formatCurrency(selectedRoom.pricePerNight, locale)}
                            </div>
                          </div>
                          <div
                            className="text-[13px] font-medium"
                            style={{ color: 'var(--brand-text)' }}
                          >
                            {formatCurrency(accommodationTotal, locale)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {allActivitySelections.map((selection, index) => {
                      const { activity, participant, price, packageInfo } = selection;
                      const showParticipantName = participants.length > 1;

                      return (
                        <div key={`mobile-${participant.id}-${activity.id}-${index}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <div
                                className="text-[13px] font-medium"
                                style={{ color: 'var(--brand-text)' }}
                              >
                                {activity.name}
                              </div>
                              {showParticipantName && (
                                <div
                                  className="text-[11px] mt-0.5"
                                  style={{ color: 'var(--brand-text-dim)' }}
                                >
                                  {participant.name}
                                </div>
                              )}
                            </div>
                            <div
                              className="text-[13px] font-medium"
                              style={{ color: 'var(--brand-text)' }}
                            >
                              {formatCurrency(price, locale)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Button */}
                  {(accommodationTotal > 0 || activitiesTotal > 0) && (
                    <button
                      disabled={!selectedRoom}
                      onClick={() => {
                        if (selectedRoom) {
                          setCurrentStep('contact');
                        }
                      }}
                      className={`
                        w-full px-4 py-2.5 rounded-lg text-[14px] font-semibold
                        transition-all duration-200
                        ${selectedRoom
                          ? 'hover:shadow-lg'
                          : 'cursor-not-allowed opacity-60'
                        }
                      `}
                      style={{
                        backgroundColor: selectedRoom ? 'var(--brand-gold)' : 'var(--brand-border)',
                        color: selectedRoom ? 'black' : 'var(--brand-text-dim)'
                      }}
                    >
                      {selectedRoom
                        ? (locale === 'es' ? 'Continuar' : 'Continue')
                        : (locale === 'es' ? 'Completa la selección' : 'Complete Selection')
                      }
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Accommodation Section - Below date selector */}
        {checkInDate && checkOutDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-white font-heading mb-2">
                {t('accommodation.title')}
              </h2>
              <p className="text-[15px] text-[var(--brand-text-dim)]">
                {t('accommodation.subtitle')}
              </p>
            </div>

            {/* Error Message */}
            {globalError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 rounded-lg border"
                style={{ backgroundColor: '#7f1d1d', borderColor: '#dc2626' }}
              >
                <p className="text-red-300 text-[15px]">{globalError}</p>
              </motion.div>
            )}

            {/* Loading State */}
            {loadingRooms && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'var(--brand-gold)' }}></div>
                <p className="text-[var(--brand-text)] text-[15px]">{t('accommodation.searchingRooms')}</p>
              </div>
            )}

            {/* Room Cards */}
            {!loadingRooms && availableRooms && availableRooms.length > 0 && (
              <>
                <style jsx>{`
                  .accommodation-cards-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                  }
                  .accommodation-cards-grid > * {
                    height: 480px;
                    min-height: 480px;
                  }
                `}</style>
                <div className="accommodation-cards-grid mb-8">
                {availableRooms.map((room: RoomFromAPI) => {
                  const features = getRoomFeatures(room.roomTypeId);
                  const isSelected = selectedRoom?.roomTypeId === room.roomTypeId;
                  const isUnavailable = room.availableRooms === 0;
                  const roomPrice = room.isSharedRoom ? room.pricePerNight * (bookingData.guests || 1) : room.pricePerNight;
                  const totalPrice = room.isSharedRoom
                    ? room.pricePerNight * nights * (bookingData.guests || 1)
                    : room.pricePerNight * nights;

                  return (
                    <AccommodationCard
                      key={room.roomTypeId}
                      room={room}
                      isSelected={isSelected}
                      isUnavailable={isUnavailable}
                      nights={nights}
                      guests={bookingData.guests || 1}
                      roomPrice={roomPrice}
                      totalPrice={totalPrice}
                      features={features}
                      description={t(`accommodation.roomDescriptions.${room.roomTypeId}`)}
                      locale={locale}
                      onSelect={() => handleRoomSelect(room)}
                      getFeatureChipStyle={getFeatureChipStyle}
                    />
                  );
                })}
                </div>
              </>
            )}

            {/* No rooms available */}
            {!loadingRooms && (!availableRooms || availableRooms.length === 0) && checkInDate && checkOutDate && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-[22px] font-bold text-white mb-3 font-heading">
                  {t('accommodation.noRoomsAvailable')}
                </h3>
                <p className="text-[15px] text-[var(--brand-text-dim)] mb-6 max-w-md mx-auto">
                  {t('accommodation.noAvailableMessage')}
                </p>
              </div>
            )}

            {/* Continue Button */}
            {!loadingRooms && availableRooms && availableRooms.length > 0 && (
              <div className="flex justify-center">
                <motion.button
                  onClick={handleContinue}
                  disabled={!selectedRoom}
                  whileHover={selectedRoom ? { scale: 1.02 } : {}}
                  whileTap={selectedRoom ? { scale: 0.98 } : {}}
                  className={`
                    max-w-md w-full md:w-auto px-8 py-4 rounded-full text-[18px] font-semibold
                    transition-all duration-300
                    ${!selectedRoom && 'cursor-not-allowed'}
                  `}
                  style={{
                    backgroundColor: selectedRoom ? 'var(--brand-gold)' : 'var(--brand-border)',
                    color: selectedRoom ? 'black' : 'white'
                  }}
                >
                  {selectedRoom ? 'Continue to Book' : 'Select an Accommodation'}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 