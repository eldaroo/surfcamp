'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useBookingStore } from '@/lib/store';
import { validateDateRange, validateGuestCount, calculateNights } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

export default function DateSelector() {
  const { 
    bookingData, 
    setBookingData, 
    setCurrentStep,
    setLoading,
    setError,
    error
  } = useBookingStore();

  const [checkIn, setCheckIn] = useState<Date | null>(
    bookingData.checkIn ? new Date(bookingData.checkIn) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    bookingData.checkOut ? new Date(bookingData.checkOut) : null
  );
  const [guests, setGuests] = useState(bookingData.guests || 1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!checkIn || !checkOut) {
      errors.push('Por favor selecciona las fechas de entrada y salida');
      return errors;
    }

    const dateError = validateDateRange(checkIn, checkOut);
    if (dateError) {
      errors.push(dateError);
    }

    const guestError = validateGuestCount(guests);
    if (guestError) {
      errors.push(guestError);
    }

    return errors;
  };

  const handleContinue = async () => {
    if (localLoading) return; // Evita doble submit
    const errors = validateForm();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setLocalLoading(true);
    setError(null);

    try {
      // Check availability first
      const requestUrl = `${window.location.origin}/api/availability`;
      const requestBody = {
        checkIn: checkIn!.toISOString(),
        checkOut: checkOut!.toISOString(),
        guests,
      };
      
      const availabilityResponse = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const availabilityData = await availabilityResponse.json();

      if (!availabilityResponse.ok) {
        // Create detailed error message
        let errorMessage = 'Error verificando disponibilidad';
        
        if (availabilityData.error) {
          errorMessage += `: ${availabilityData.error}`;
        }
        
        if (availabilityData.apiError) {
          errorMessage += ` (API: ${availabilityData.apiError})`;
        }
        
        // Add technical details with Request URL
        if (availabilityData.debug) {
          errorMessage += ` | Debug: ${availabilityData.debug.message || 'Info técnica disponible'}`;
        }
        
        // Add request details
        errorMessage += ` | Request URL: ${requestUrl}`;
        errorMessage += ` | Request Body: ${JSON.stringify(requestBody)}`;
        errorMessage += ` | Response Status: ${availabilityResponse.status}`;
        
        // Log detailed error for debugging
        console.error('❌ AVAILABILITY ERROR DETAILS:', {
          requestUrl,
          requestBody,
          status: availabilityResponse.status,
          statusText: availabilityResponse.statusText,
          response: availabilityData,
        });
        
        throw new Error(errorMessage);
      }

      if (!availabilityData.available) {
        setError('No hay disponibilidad para las fechas seleccionadas. Por favor elige otras fechas.');
        return;
      }

      // Save booking data
      setBookingData({
        checkIn: checkIn!,
        checkOut: checkOut!,
        guests,
      });

      // Move to next step
      setCurrentStep('accommodation');
    } catch (error: any) {
      console.error('❌ ERROR COMPLETO:', error);
      
      // Create user-friendly error message with technical details
      let userMessage = 'Error verificando disponibilidad';
      
      if (error.message) {
        userMessage = error.message;
      }
      
      // Add technical details for debugging
      if (error.name && error.name !== 'Error') {
        userMessage += ` (${error.name})`;
      }
      
      setError(userMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-ocean-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fechas y Huéspedes</h2>
          <p className="text-gray-600">Selecciona cuándo quieres vivir la experiencia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Check-in Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de Entrada
          </label>
          <DatePicker
            selected={checkIn}
            onChange={(date) => setCheckIn(date)}
            selectsStart
            startDate={checkIn}
            endDate={checkOut}
            minDate={new Date()}
            placeholderText="Selecciona fecha"
            className="input-field"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de Salida
          </label>
          <DatePicker
            selected={checkOut}
            onChange={(date) => setCheckOut(date)}
            selectsEnd
            startDate={checkIn}
            endDate={checkOut}
            minDate={checkIn || new Date()}
            placeholderText="Selecciona fecha"
            className="input-field"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>

      {/* Guests Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Número de Huéspedes
        </label>
        <div className="flex items-center space-x-4">
          <Users className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={guests <= 1}
            >
              -
            </button>
            <span className="text-xl font-semibold w-12 text-center">{guests}</span>
            <button
              onClick={() => setGuests(Math.min(12, guests + 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={guests >= 12}
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {guests === 1 ? '1 huésped' : `${guests} huéspedes`}
          </span>
        </div>
      </div>

      {/* Stay Summary */}
      {checkIn && checkOut && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-ocean-50 rounded-lg p-4 mb-6"
        >
          <h3 className="font-semibold text-ocean-800 mb-2">Resumen de tu estadía</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Entrada:</span>
              <p className="font-semibold">{checkIn.toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <span className="text-gray-600">Salida:</span>
              <p className="font-semibold">{checkOut.toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <span className="text-gray-600">Noches:</span>
              <p className="font-semibold">{nights} {nights === 1 ? 'noche' : 'noches'}</p>
            </div>
            <div>
              <span className="text-gray-600">Huéspedes:</span>
              <p className="font-semibold">{guests} {guests === 1 ? 'persona' : 'personas'}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Messages */}
      {(validationErrors.length > 0 || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          {validationErrors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm mb-2">{error}</p>
          ))}
          {error && (
            <div>
              <p className="text-red-600 text-sm mb-2 font-medium">🚨 {error}</p>
              
              {/* Technical Details Toggle */}
              {error.includes('|') && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-red-500 text-xs underline hover:text-red-700"
                  >
                    {showErrorDetails ? 'Ocultar detalles técnicos' : 'Mostrar detalles técnicos'}
                  </button>
                  
                  {showErrorDetails && (
                    <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800">
                      <p className="font-bold mb-1">🔧 INFORMACIÓN TÉCNICA:</p>
                      <div className="whitespace-pre-wrap break-all">
                        {error.split('|').map((part, i) => (
                          <div key={i} className="mb-1">
                            {part.trim()}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-red-600">
                        💡 Comparte esta información con el equipo técnico para resolver el problema
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* General troubleshooting tips */}
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-800 text-xs font-medium mb-1">🛠️ POSIBLES SOLUCIONES:</p>
                <ul className="text-orange-700 text-xs space-y-1">
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Intenta con fechas diferentes</li>
                  <li>• Recarga la página e intenta nuevamente</li>
                  <li>• Si el problema persiste, contacta al soporte técnico</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!checkIn || !checkOut || localLoading}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continuar</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
} 