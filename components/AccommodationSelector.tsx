'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

// Definir el tipo Room localmente para evitar conflictos
interface Room {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
}

export default function AccommodationSelector() {
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

  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    // Cargar habitaciones disponibles desde la API real
    if (!availableRooms && bookingData.checkIn && bookingData.checkOut) {
      fetchAvailableRooms();
    }
  }, [bookingData.checkIn, bookingData.checkOut, availableRooms]);

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
        throw new Error(data.error || 'Error obteniendo habitaciones disponibles');
      }

      if (!data.available || !data.availableRooms?.length) {
        setError('No hay habitaciones disponibles para las fechas seleccionadas.');
        return;
      }

      setAvailableRooms(data.availableRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Error obteniendo habitaciones disponibles. Por favor intenta de nuevo.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (room: Room) => {
    // Only allow selection if room has available rooms
    if (room.availableRooms > 0) {
      setSelectedRoom(room);
      setBookingData({ roomTypeId: room.roomTypeId });
    }
  };

  const handleContinue = () => {
    if (!selectedRoom) {
      setError('Por favor selecciona una opción de alojamiento');
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
        <p className="text-white">Buscando habitaciones disponibles...</p>
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
          <h2 className="text-2xl font-bold text-white font-heading">Selecciona tu Alojamiento</h2>
          <p className="text-yellow-300">Elige el tipo de habitación para tu estadía</p>
        </div>
      </div>

      {/* Stay Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-yellow-300 mb-2">Resumen de tu búsqueda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-white">Entrada:</span>
            <p className="font-semibold text-blue-300">
              {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-white">Salida:</span>
            <p className="font-semibold text-blue-300">
              {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-white">Huéspedes:</span>
            <p className="font-semibold text-blue-300">{bookingData.guests} {bookingData.guests === 1 ? 'persona' : 'personas'}</p>
          </div>
          <div>
            <span className="text-white">Noches:</span>
            <p className="font-semibold text-blue-300">{nights} {nights === 1 ? 'noche' : 'noches'}</p>
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
                  {room.roomTypeId === 'casa-playa' && 'Habitación compartida con vista al mar y ambiente social'}
                  {room.roomTypeId === 'casitas-privadas' && 'Casita privada con jardín independiente'}
                  {room.roomTypeId === 'casas-deluxe' && 'Studio privado a 2 pasos del océano con cocina y baño privado'}
                </p>
                
                {/* Room Features */}
                <div className="flex flex-row flex-wrap gap-2 mb-3">
                  {room.roomTypeId === 'casa-playa' && (
                    <>
                      <span className="tag-feature primary">
                        Cuarto Compartido
                      </span>
                      <span className="tag-feature accent">
                        Vista al Mar
                      </span>
                      <span className="tag-feature secondary">
                        Ambiente Social
                      </span>
                    </>
                  )}
                  {room.roomTypeId === 'casitas-privadas' && (
                    <>
                      <span className="tag-feature primary">
                        Privacidad Total
                      </span>
                      <span className="tag-feature accent">
                        Jardín Privado
                      </span>
                      <span className="tag-feature secondary">
                        Ambiente Íntimo
                      </span>
                      <span className="tag-feature primary">
                        Casa Independiente
                      </span>
                    </>
                  )}
                  {room.roomTypeId === 'casas-deluxe' && (
                    <>
                      <span className="tag-feature accent">
                        Beach Studio
                      </span>
                      <span className="tag-feature primary">
                        Cocina Privada
                      </span>
                      <span className="tag-feature secondary">
                        Baño con Agua Caliente
                      </span>
                      <span className="tag-feature primary">
                        Wi-Fi & AC
                      </span>
                    </>
                  )}
                </div>

                {/* Total Price */}
                {!('available' in room && room.available === false) && room.availableRooms > 0 && nights > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <div className="text-lg font-semibold text-yellow-300">
                      Total: ${room.pricePerNight * nights}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right ml-4">
                {(('available' in room && room.available === false) || room.availableRooms === 0) ? (
                  <div className="text-2xl font-bold text-red-400">
                    No disponible
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-400">
                      ${room.pricePerNight}
                    </div>
                    <div className="text-sm text-white">por noche</div>
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
            No hay habitaciones disponibles
          </h3>
          <p className="text-blue-300 mb-4">
            No encontramos habitaciones disponibles para las fechas seleccionadas.
          </p>
          <button
            onClick={() => setCurrentStep('dates')}
            className="px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Cambiar fechas
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {availableRooms && availableRooms.length > 0 && (
        <div className="flex justify-between pt-6 border-t border-white/20">
          <button
            onClick={() => setCurrentStep('dates')}
            className="px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Cambiar fechas
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedRoom}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Continuar</span>
            <span>→</span>
          </button>
        </div>
      )}
    </motion.div>
  );
} 