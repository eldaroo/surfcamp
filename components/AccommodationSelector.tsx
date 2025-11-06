'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import BackButton from './BackButton';
import AccommodationCard from './AccommodationCard';

export default function AccommodationSelector() {
  const { t, locale, raw } = useI18n();
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
    roomsNeeded?: number;
    requiresMultipleRooms?: boolean;
  };

  const [loadingRooms, setLoadingRooms] = useState(false);
  const { checkIn, checkOut, guests } = bookingData;

  // Redirect to dates if no dates are selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      console.log('[AccommodationSelector] No dates selected, redirecting to dates');
      setCurrentStep('dates');
    }
  }, [checkIn, checkOut, setCurrentStep]);

  const fetchAvailableRooms = useCallback(async () => {
    if (!checkIn || !checkOut || !guests) {
      return;
    }

    setLoadingRooms(true);
    setError(null);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guests,
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
  }, [checkIn, checkOut, guests, setAvailableRooms, setError]);

  useEffect(() => {
    if (checkIn && checkOut) {
      setAvailableRooms(null);
      setSelectedRoom(null);
      fetchAvailableRooms();
    }
  }, [checkIn, checkOut, fetchAvailableRooms, setAvailableRooms, setSelectedRoom]);

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

        {/* Room Cards - One per row, centered with reduced width */}
        <div
          className="space-y-2 mb-8 flex flex-col items-center"
          role="radiogroup"
          aria-labelledby="accommodation-selection-heading"
        >
          {availableRooms?.map((room: RoomFromAPI) => {
            const features = getRoomFeatures(room.roomTypeId);
            const isSelected = selectedRoom?.roomTypeId === room.roomTypeId;
            const isUnavailable = room.availableRooms === 0;

            const roomsNeeded = room.roomsNeeded || 1;

            // Calculate price based on room type and number of rooms needed
            let roomPrice;
            let totalPrice;

            if (room.isSharedRoom) {
              // Shared room: price per person per night
              roomPrice = room.pricePerNight * (bookingData.guests || 1);
              totalPrice = roomPrice * nights;
            } else {
              // Private rooms: price per room per night, multiplied by number of rooms needed
              roomPrice = room.pricePerNight * roomsNeeded;
              totalPrice = roomPrice * nights;
            }

            // Get room descriptions directly from translations
            const roomDescriptions = raw<Record<string, { desktop: string; mobile: string }>>('accommodation.roomDescriptions') || {};
            const description = roomDescriptions[room.roomTypeId] ?? {
              desktop: room.roomTypeName,
              mobile: room.roomTypeName
            };

            return (
              <div key={room.roomTypeId} className="w-[92%] mx-auto">
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
                description={description}
                locale={locale}
                onSelect={() => handleRoomSelect(room)}
                getFeatureChipStyle={getFeatureChipStyle}
              />
              </div>
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
