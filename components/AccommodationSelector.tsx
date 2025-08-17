'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Users, ChevronRight, Check } from 'lucide-react';
import { useBookingStore } from '@/lib/store';

interface Room {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
  available?: boolean;
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
    // Only allow selection if room is available
    if (!(('available' in room && room.available === false) || room.availableRooms === 0)) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Buscando habitaciones disponibles...</p>
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
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center">
          <Home className="w-5 h-5 text-ocean-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selecciona tu Alojamiento</h2>
          <p className="text-gray-600">Elige el tipo de habitación para tu estadía</p>
        </div>
      </div>

      {/* Stay Summary */}
      <div className="bg-ocean-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-ocean-800 mb-2">Resumen de tu búsqueda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Entrada:</span>
            <p className="font-semibold">
              {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Salida:</span>
            <p className="font-semibold">
              {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Huéspedes:</span>
            <p className="font-semibold">{bookingData.guests} {bookingData.guests === 1 ? 'persona' : 'personas'}</p>
          </div>
          <div>
            <span className="text-gray-600">Noches:</span>
            <p className="font-semibold">{nights} {nights === 1 ? 'noche' : 'noches'}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-warm-50 border border-warm-200 rounded-lg p-4 mb-6"
        >
          <p className="text-warm-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Available Rooms */}
      <div className="space-y-4 mb-8">
        {availableRooms?.map((room) => (
          <motion.div
            key={room.roomTypeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 rounded-lg p-6 transition-all card-hover-gold ${
              (('available' in room && room.available === false) || room.availableRooms === 0)
                ? 'border-warm-200 bg-warm-50 cursor-not-allowed opacity-60'
                : selectedRoom?.roomTypeId === room.roomTypeId
                ? 'selected-gold cursor-pointer'
                : 'border-warm-200 hover:border-warm-300 hover:bg-warm-25 cursor-pointer'
            }`}
            onClick={() => handleRoomSelect(room)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-warm-900 mb-2">
                  {room.roomTypeName}
                </h3>
                <p className="text-warm-600 mb-4">
                  {room.roomTypeId === 'casa-playa' && 'Habitación compartida con vista al mar y ambiente social'}
                  {room.roomTypeId === 'casitas-privadas' && 'Casita privada con jardín independiente'}
                  {room.roomTypeId === 'casas-deluxe' && 'Studio privado a 2 pasos del océano con cocina y baño privado'}
                </p>
                
                {/* Room Features */}
                <div className="flex flex-wrap gap-2 mb-3">
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
              </div>

              <div className="text-right ml-4">
                {(('available' in room && room.available === false) || room.availableRooms === 0) ? (
                  <div className="text-2xl font-bold text-warm-400">
                    No disponible
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-warm-600">
                      ${room.pricePerNight}
                    </div>
                    <div className="text-sm text-warm-600">por noche</div>
                    {nights > 0 && (
                      <div className="text-sm font-semibold text-warm-900 mt-1">
                        Total: ${room.pricePerNight * nights}
                      </div>
                    )}
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
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay habitaciones disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            No encontramos habitaciones disponibles para las fechas seleccionadas.
          </p>
          <button
            onClick={() => setCurrentStep('dates')}
            className="btn-secondary"
          >
            Cambiar fechas
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {availableRooms && availableRooms.length > 0 && (
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep('dates')}
            className="btn-secondary"
          >
            Cambiar fechas
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedRoom}
            className="btn-primary flex items-center space-x-2"
          >
            <span>Continuar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
} 