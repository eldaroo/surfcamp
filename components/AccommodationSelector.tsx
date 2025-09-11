'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

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
    // Limpiar habitaciones disponibles y cargar nuevas desde la API
    if (bookingData.checkIn && bookingData.checkOut) {
      setAvailableRooms(null); // Limpiar datos previos
      setSelectedRoom(null);   // Limpiar selección previa
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
        // Solo lanzar error si es un error real de la API, no por falta de disponibilidad
        if (response.status === 404 && data.error && data.error.includes('suficientes camas')) {
          // No es un error, es que no hay habitaciones disponibles para esa capacidad
          console.log('🔍 No hay habitaciones disponibles por capacidad insuficiente, limpiando error');
          setAvailableRooms([]);
          setError(null); // Limpiar cualquier error previo
          return;
        }
        throw new Error(data.error || 'Error getting available rooms');
      }

      if (!data.available || !data.availableRooms?.length) {
        // No hay habitaciones disponibles, pero no es un error
        console.log('🔍 No hay habitaciones disponibles, limpiando error');
        setAvailableRooms([]);
        setError(null); // Limpiar cualquier error previo
        return;
      }

      setAvailableRooms(data.availableRooms);
      setError(null); // Limpiar cualquier error previo cuando hay habitaciones disponibles
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Error getting available rooms. Please try again.');
      setAvailableRooms([]); // Limpiar habitaciones cuando hay error
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (room: RoomFromAPI) => {
    // Only allow selection if room has available rooms
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

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  if (loadingRooms) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center py-12"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">{t('accommodation.searchingRooms')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card"
    >
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">{t('accommodation.title')}</h2>
          <p className="text-yellow-300">{t('accommodation.subtitle')}</p>
        </div>
      </div>

      {/* Stay Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-yellow-300 mb-2">{t('accommodation.searchSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-white">{t('accommodation.checkIn')}:</span>
            <p className="font-semibold text-blue-300">
              {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-white">{t('accommodation.checkOut')}:</span>
            <p className="font-semibold text-blue-300">
              {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-white">{t('accommodation.guests')}:</span>
            <p className="font-semibold text-blue-300">{bookingData.guests} {bookingData.guests === 1 ? t('dates.guest') : t('dates.guests_plural')}</p>
          </div>
          <div>
            <span className="text-white">{t('accommodation.nights')}:</span>
            <p className="font-semibold text-blue-300">{nights} {nights === 1 ? t('dates.night') : t('dates.nights')}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border border-red-400/30 rounded-lg p-4 mb-6"
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Available Rooms */}
      <div className="space-y-4 mb-8">
        {availableRooms?.map((room) => (
          <motion.div
            key={room.roomTypeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 rounded-lg p-6 transition-all ${
              room.availableRooms === 0
                ? 'border-white/20 cursor-not-allowed opacity-60'
                : selectedRoom?.roomTypeId === room.roomTypeId
                ? 'border-yellow-400 bg-white/5 cursor-pointer'
                : 'border-white/20 hover:border-white/40 cursor-pointer'
            }`}
            onClick={() => handleRoomSelect(room)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {room.roomTypeName}
                </h3>
                <p className="text-white mb-6">
                  {t(`accommodation.roomDescriptions.${room.roomTypeId}`)}
                </p>
                
                {/* Room Features */}
                <div className="flex flex-row flex-wrap gap-2 mb-3">
                  {room.roomTypeId === 'casa-playa' && (
                    <>
                      <span className="tag-feature primary">
                        {t('accommodation.features.sharedRoom')}
                      </span>
                      <span className="tag-feature accent">
                        {t('accommodation.features.oceanView')}
                      </span>
                      <span className="tag-feature secondary">
                        {t('accommodation.features.socialEnvironment')}
                      </span>
                    </>
                  )}
                  {room.roomTypeId === 'casitas-privadas' && (
                    <>
                      <span className="tag-feature primary">
                        {t('accommodation.features.totalPrivacy')}
                      </span>
                      <span className="tag-feature accent">
                        {t('accommodation.features.privateGarden')}
                      </span>
                      <span className="tag-feature secondary">
                        {t('accommodation.features.intimateEnvironment')}
                      </span>
                      <span className="tag-feature primary">
                        {t('accommodation.features.independentHouse')}
                      </span>
                    </>
                  )}
                  {room.roomTypeId === 'casas-deluxe' && (
                    <>
                      <span className="tag-feature accent">
                        {t('accommodation.features.beachStudio')}
                      </span>
                      <span className="tag-feature primary">
                        {t('accommodation.features.privateKitchen')}
                      </span>
                      <span className="tag-feature secondary">
                        {t('accommodation.features.hotWaterBathroom')}
                      </span>
                      <span className="tag-feature primary">
                        {t('accommodation.features.wifiAC')}
                      </span>
                    </>
                  )}
                </div>

                {/* Capacity Information */}
                <div className="mt-3 mb-3 text-sm text-blue-300">
                  <span className="font-medium">{t('accommodation.capacity')}:</span> 
                  {(room as any).isSharedRoom ? (
                    <span> {t('accommodation.sharedRoomBeds')} {room.maxGuests} {t('accommodation.totalBeds')}</span>
                  ) : room.roomTypeId === 'casas-deluxe' || room.roomTypeId === 'casitas-privadas' ? (
                    <span> {t('accommodation.kingSizeBed')}</span>
                  ) : (
                    <span> {room.availableRooms} {room.availableRooms !== 1 ? t('accommodation.rooms') : t('accommodation.room')} × {room.maxGuests} {room.maxGuests !== 1 ? t('accommodation.guestsPlural') : t('accommodation.guest')} = {room.availableRooms * room.maxGuests} {t('accommodation.guestsPlural')} {t('accommodation.total')}</span>
                  )}
                </div>

                {/* Total Price */}
                {!('available' in room && room.available === false) && room.availableRooms > 0 && nights > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <div className="text-lg font-semibold text-yellow-300">
                      {t('accommodation.total')}: ${room.isSharedRoom 
                        ? room.pricePerNight * nights * (bookingData.guests || 1)  // Casa de Playa: precio por persona
                        : room.pricePerNight * nights  // Privadas/Deluxe: precio por habitación (ya ajustado por backend)
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right ml-4">
                {(('available' in room && room.available === false) || room.availableRooms === 0) ? (
                  <div className="text-2xl font-bold text-red-400">
                    {t('accommodation.notAvailable')}
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-400">
                      ${room.isSharedRoom 
                        ? room.pricePerNight * (bookingData.guests || 1)  // Casa de Playa: precio por persona
                        : room.pricePerNight  // Privadas/Deluxe: precio por habitación (ya ajustado por backend)
                      }
                    </div>
                    <div className="text-sm text-white">{t('accommodation.perNight')}</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No rooms available */}
      {(!availableRooms || availableRooms.length === 0) && (
        <div className="text-center py-8">
          <span className="text-white text-4xl">🏠</span>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('accommodation.noRoomsAvailable')}
          </h3>
          <p className="text-blue-300 mb-4">
            {t('accommodation.noAvailableFor')} {bookingData.guests} {t('accommodation.guestsFrom')} {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'} {t('accommodation.to')} {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES') : '-'}, {t('accommodation.noAvailableMessage')}
          </p>
          <div className="space-y-3 mb-6">
            <div className="text-sm text-yellow-300">
              💡 <strong>{t('accommodation.suggestions')}:</strong>
            </div>
            <div className="text-sm text-blue-300 space-y-1">
              • {t('accommodation.reducePlease')}
              • {t('accommodation.selectDifferentDates')}
              • {t('accommodation.contactSurfcamp')}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setCurrentStep('dates')}
              className="px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {t('accommodation.changeDates')}
            </button>
            <button
              onClick={() => setCurrentStep('dates')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {t('accommodation.changeGuests')}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {availableRooms && availableRooms.length > 0 && (
        <div className="flex justify-between pt-6 border-t border-white/20">
          <button
            onClick={() => setCurrentStep('dates')}
            className="px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {t('accommodation.changeDates')}
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedRoom}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>{t('common.continue')}</span>
            <span>→</span>
          </button>
        </div>
      )}
    </motion.div>
  );
} 