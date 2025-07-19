'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Calendar, Users, Activity, Home } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { formatCurrency, calculateNights } from '@/lib/utils';

export default function PriceSummary() {
  const { 
    bookingData, 
    selectedActivities, 
    priceBreakdown,
    setPriceBreakdown,
    currentStep,
    isLoading,
    selectedRoom
  } = useBookingStore();

  // Calculate quote when data changes
  useEffect(() => {
    const calculateQuote = async () => {
      if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.guests) {
        return;
      }

      // Construir el array de actividades con cantidades
      const activitiesWithQuantities = selectedActivities.map(a => ({
        activityId: a.id,
        quantity: bookingData.activityQuantities?.[a.id] || 1
      }));

      try {
        const response = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: bookingData.guests,
            activities: activitiesWithQuantities,
            roomTypeId: selectedRoom?.roomTypeId,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setPriceBreakdown(data.priceBreakdown);
        }
      } catch (error) {
        console.error('Error calculating quote:', error);
      }
    };

    calculateQuote();
  }, [bookingData, selectedActivities, selectedRoom, setPriceBreakdown]);

  if (!bookingData.checkIn || !bookingData.checkOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Calculator className="w-5 h-5 text-ocean-600" />
          <h3 className="text-lg font-semibold text-gray-900">Resumen de Precio</h3>
        </div>
        <p className="text-gray-500 text-center py-8">
          Selecciona fechas para ver el precio
        </p>
      </motion.div>
    );
  }

  const nights = calculateNights(
    new Date(bookingData.checkIn), 
    new Date(bookingData.checkOut)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Calculator className="w-5 h-5 text-ocean-600" />
        <h3 className="text-lg font-semibold text-gray-900">Resumen de Precio</h3>
      </div>

      {/* Booking Summary */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(bookingData.checkIn).toLocaleDateString('es-ES')} - {' '}
            {new Date(bookingData.checkOut).toLocaleDateString('es-ES')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            {bookingData.guests} {bookingData.guests === 1 ? 'huésped' : 'huéspedes'}
          </span>
        </div>

        {selectedRoom && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <span>{selectedRoom.roomTypeName}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>
            {selectedActivities.length} {selectedActivities.length === 1 ? 'actividad' : 'actividades'}
          </span>
        </div>
      </div>

      {/* Price Breakdown */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : priceBreakdown ? (
        <div className="space-y-4">
          {/* Accommodation - only show if there's a price */}
          {priceBreakdown.accommodation > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                Alojamiento ({nights} {nights === 1 ? 'noche' : 'noches'})
              </span>
              <span className="font-semibold">
                {formatCurrency(priceBreakdown.accommodation)}
              </span>
            </div>
          )}

          {/* Activities */}
          {priceBreakdown.activities.length > 0 && (
            <div>
              <p className="text-gray-600 mb-2">Actividades:</p>
              <div className="space-y-2 ml-4">
                {priceBreakdown.activities.map((activity, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {activity.name} × {activity.quantity}
                    </span>
                    <span>{formatCurrency(activity.price * activity.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between pt-4 border-t-2 border-ocean-200">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-ocean-600">
              {formatCurrency(priceBreakdown.total)}
            </span>
          </div>

          {/* Price per person */}
          {bookingData.guests && bookingData.guests > 1 && (
            <div className="text-center text-sm text-gray-500 pt-2">
              {formatCurrency(priceBreakdown.total / bookingData.guests)} por persona
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          Calculando precio...
        </p>
      )}

      {/* Call to Action */}
      {currentStep === 'dates' && priceBreakdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="bg-ocean-50 rounded-lg p-4 text-center">
            <p className="text-ocean-800 font-semibold mb-2">
              ¡Precio base disponible!
            </p>
            <p className="text-ocean-600 text-sm">
              Continúa para añadir actividades y completar tu reserva
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 