'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import BackButton from './BackButton';

export default function AccommodationSelector() {
  const { t, locale } = useI18n();
  const {
    bookingData,
    setBookingData,
    setCurrentStep,
    setLoading,
    setError,
    error,
    availableRooms,
    setAvailableRooms,
    selectedRoom,
    setSelectedRoom
  } = useBookingStore();

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

  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      setAvailableRooms(null);
      setSelectedRoom(null);
      fetchAvailableRooms();
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.guests]);

  const fetchAvailableRooms = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.guests) {
      return;
    }

    setLoadingRooms(true);
    setError(null);

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
          setError(null);
          return;
        }
        throw new Error(data.error || 'Error getting available rooms');
      }

      if (!data.available || !data.availableRooms?.length) {
        setAvailableRooms([]);
        setError(null);
        return;
      }

      setAvailableRooms(data.availableRooms);
      setError(null);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Error getting available rooms. Please try again.');
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (room: RoomFromAPI) => {
    if (room.availableRooms > 0) {
      setSelectedRoom(room);
      setBookingData({ roomTypeId: room.roomTypeId });
    }
  };

  const handleContinue = () => {
    if (!selectedRoom) {
      setError(t('accommodation.selectAccommodation'));
      return;
    }

    setError(null);
    setCurrentStep('contact');
  };

  const handleKeyDown = (event: React.KeyboardEvent, room: RoomFromAPI) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRoomSelect(room);
    }
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

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

  if (loadingRooms) {
    return (
      <div className="min-h-screen py-6 px-4" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center space-x-4 mb-8">
            <BackButton variant="minimal" />
            <div>
              <h1 className="text-[28px] font-bold text-white font-heading">{t('accommodation.title')}</h1>
              <p className="text-[15px] text-[var(--brand-text-dim)]">{t('accommodation.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'var(--brand-gold)' }}></div>
            <p className="text-[var(--brand-text)] text-[15px]">{t('accommodation.searchingRooms')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-[28px] font-bold text-white font-heading">{t('accommodation.title')}</h1>
            <p className="text-[15px] text-[var(--brand-text-dim)]">{t('accommodation.subtitle')}</p>
          </div>
        </div>

        {/* Summary Bar - Single hue family */}
        <div
          className="flex flex-wrap items-center gap-3 mb-8 px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--brand-surface)',
            borderColor: 'var(--brand-border)'
          }}
        >
          <div className="text-[var(--brand-text)] text-[15px]">
            <strong>{bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'}</strong> →
            <strong className="ml-2">{bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'}</strong>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: 'var(--brand-border)' }}></div>
          <div className="text-[var(--brand-text)] text-[15px]">
            <strong>{bookingData.guests}</strong> {bookingData.guests === 1 ? t('dates.guest') : t('dates.guests_plural')}
          </div>
          <div className="w-px h-4" style={{ backgroundColor: 'var(--brand-border)' }}></div>
          <div className="text-[var(--brand-text)] text-[15px]">
            <strong>{nights}</strong> {nights === 1 ? 'night' : 'nights'}
          </div>
          <button
            onClick={() => setCurrentStep('dates')}
            className="ml-auto text-[12px] font-medium px-3 py-1 rounded-full border bg-transparent hover:bg-[color-mix(in_srgb,var(--brand-gold)_10%,transparent)] transition-colors"
            style={{
              color: 'var(--brand-gold)',
              borderColor: 'var(--brand-gold)'
            }}
          >
            {t('accommodation.changeDates')}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-lg border"
            style={{ backgroundColor: '#7f1d1d', borderColor: '#dc2626' }}
          >
            <p className="text-red-300 text-[15px]">{error}</p>
          </motion.div>
        )}

        {/* Room Cards Grid - Radio Group */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          role="radiogroup"
          aria-labelledby="accommodation-selection-heading"
        >
          {availableRooms?.map((room: RoomFromAPI) => {
            const features = getRoomFeatures(room.roomTypeId);
            const visibleFeatures = features.slice(0, 3);
            const hiddenCount = features.length - 3;
            const isSelected = selectedRoom?.roomTypeId === room.roomTypeId;
            const isUnavailable = room.availableRooms === 0;
            const roomPrice = room.isSharedRoom ? room.pricePerNight * (bookingData.guests || 1) : room.pricePerNight;
            const totalPrice = room.isSharedRoom
              ? room.pricePerNight * nights * (bookingData.guests || 1)
              : room.pricePerNight * nights;

            return (
              <article
                key={room.roomTypeId}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isUnavailable ? -1 : 0}
                onKeyDown={(e) => !isUnavailable && handleKeyDown(e, room)}
                onClick={() => !isUnavailable && handleRoomSelect(room)}
                className={`
                  rounded-2xl p-6 border shadow-none transition-all duration-200
                  grid grid-rows-[auto,1fr,auto] h-full
                  focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-aqua)_40%,transparent)] focus-visible:outline-none
                  ${isUnavailable
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'cursor-pointer'
                      : 'cursor-pointer hover:-translate-y-0.5 hover:ring-1 hover:ring-[color-mix(in_srgb,var(--brand-gold)_25%,transparent)]'
                  }
                `}
                style={{
                  backgroundColor: 'var(--brand-surface)',
                  borderColor: 'var(--brand-border)',
                  boxShadow: isSelected
                    ? '0 14px 36px -14px rgba(242,193,78,0.32)'
                    : !isUnavailable
                      ? undefined
                      : 'none',
                  ...(isSelected && {
                    '--tw-ring-width': '2px',
                    '--tw-ring-color': 'color-mix(in srgb, var(--brand-gold) 50%, transparent)',
                    boxShadow: '0 0 0 var(--tw-ring-width) var(--tw-ring-color), 0 14px 36px -14px rgba(242,193,78,0.32)',
                  }),
                  ...((!isUnavailable && !isSelected) && {
                    ':hover': {
                      boxShadow: '0 10px 28px -12px rgba(242,193,78,0.25)'
                    }
                  })
                }}
                onMouseEnter={(e) => {
                  if (!isUnavailable && !isSelected) {
                    e.currentTarget.style.boxShadow = '0 10px 28px -12px rgba(242,193,78,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUnavailable && !isSelected) {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Header Row - Title + Price Badge */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[22px] font-bold text-white font-heading pr-3">
                    {room.roomTypeName}
                  </h3>
                  <div
                    className="rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap"
                    style={{ backgroundColor: 'var(--brand-gold)', color: '#1a1a1a' }}
                  >
                    ${roomPrice}
                    <span className="font-medium" style={{ color: '#1f1f1f' }}> / night</span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="space-y-4">
                  {/* Availability + Capacity Row */}
                  <div className="flex items-center justify-between">
                    <div
                      className="rounded-full px-3 py-1 text-white text-xs font-medium border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--brand-aqua) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--brand-aqua) 40%, transparent)'
                      }}
                    >
                      {room.availableRooms} {room.availableRooms === 1 ? 'available' : 'available'}
                    </div>

                    <div className="flex items-center text-[var(--brand-text-dim)] text-[12px] font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {room.maxGuests} {room.maxGuests === 1 ? t('accommodation.guest') : t('accommodation.guestsPlural')}
                    </div>
                  </div>

                  {/* Feature Tags - Max 3 visible */}
                  <div className="flex flex-wrap gap-2">
                    {visibleFeatures.map((feature, index) => (
                      <span
                        key={index}
                        className={getFeatureChipStyle(feature.color)}
                      >
                        {feature.label}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: 'color-mix(in srgb, white 5%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--brand-border) 60%, transparent)',
                          color: 'color-mix(in srgb, white 80%, transparent)'
                        }}
                      >
                        +{hiddenCount}
                      </span>
                    )}
                  </div>

                  {/* Room Description - Clamped to 2 lines */}
                  <p
                    className="text-[15px] leading-relaxed overflow-hidden"
                    style={{
                      color: 'var(--brand-text-dim)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {t(`accommodation.roomDescriptions.${room.roomTypeId}`)}
                  </p>
                </div>

                {/* Price Block - Aligned Bottom */}
                <div className="mt-5">
                  {/* Meta Row */}
                  <div className="flex justify-between text-[12px] text-[var(--brand-text-dim)] mb-2">
                    <span>per night</span>
                    <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>

                  {/* Total Row */}
                  <div
                    className="border-t pt-3 flex justify-between items-center"
                    style={{ borderColor: 'color-mix(in srgb, var(--brand-border) 60%, transparent)' }}
                  >
                    <span className="text-sm text-[var(--brand-text-dim)]">Total</span>
                    <span className="text-[20px] font-bold text-[var(--brand-gold)]">
                      ${totalPrice}
                    </span>
                  </div>

                  {/* In-card Action Button */}
                  <div className="mt-3">
                    {isSelected ? (
                      <button
                        className="w-full rounded-full px-5 py-2 font-semibold hover:shadow-lg transition-all"
                        style={{
                          backgroundColor: 'var(--brand-gold)',
                          color: 'black'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        ✓ Selected
                      </button>
                    ) : (
                      <button
                        className="w-full rounded-full px-5 py-2 font-semibold border bg-transparent transition-all"
                        style={{
                          borderColor: 'var(--brand-gold)',
                          color: 'var(--brand-gold)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--brand-gold) 10%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          !isUnavailable && handleRoomSelect(room);
                        }}
                        disabled={isUnavailable}
                      >
                        {isUnavailable ? 'Unavailable' : 'Select Room'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* No rooms available */}
        {(!availableRooms || availableRooms.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-[22px] font-bold text-white mb-3 font-heading">
              {t('accommodation.noRoomsAvailable')}
            </h3>
            <p className="text-[15px] text-[var(--brand-text-dim)] mb-6 max-w-md mx-auto">
              {t('accommodation.noAvailableMessage')}
            </p>
            <button
              onClick={() => setCurrentStep('dates')}
              className="rounded-full px-6 py-2 font-semibold transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'var(--brand-gold)',
                color: 'black'
              }}
            >
              {t('accommodation.changeDates')}
            </button>
          </div>
        )}

        {/* Global CTA */}
        {availableRooms && availableRooms.length > 0 && (
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
    </div>
  );
}