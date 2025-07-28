'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function DateSelector() {
  const { t } = useI18n();
  const { bookingData, setBookingData, setCurrentStep } = useBookingStore();
  const [guests, setGuests] = useState(bookingData.guests || 1);
  const [checkIn, setCheckIn] = useState(bookingData.checkIn ? new Date(bookingData.checkIn).toISOString().split('T')[0] : '');
  const [checkOut, setCheckOut] = useState(bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (!checkIn || !checkOut) {
      setError(t('dates.error.selectDates'));
      setIsLoading(false);
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      setError(t('dates.error.pastDate'));
      setIsLoading(false);
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError(t('dates.error.invalidRange'));
      setIsLoading(false);
      return;
    }

    try {
      // Actualizar el store
      setBookingData({
        ...bookingData,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests
      });
      
      // Verificar disponibilidad
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guests
        }),
      });

      const data = await response.json();

      if (data.success && data.available) {
      setCurrentStep('accommodation');
      } else {
        setError(t('dates.error.noAvailability'));
      }
    } catch (error) {
      setError(t('dates.error.general'));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-warm-100 rounded-lg flex items-center justify-center mr-4">
          <CalendarIcon className="w-6 h-6 text-warm-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-900">{t('dates.title')}</h2>
          <p className="text-warm-600">{t('dates.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              {t('dates.checkIn')} *
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-warm-300 rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent cursor-pointer"
              ref={checkInRef}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              {t('dates.checkOut')} *
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-warm-300 rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent cursor-pointer"
              ref={checkOutRef}
            />
          </div>
        </div>

        {/* Guests Counter */}
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-2">
            {t('dates.guests')}
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-10 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-50"
            >
              <span className="text-warm-600">-</span>
            </button>
            <span className="text-2xl font-bold text-warm-900 w-12 text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests(guests + 1)}
              className="w-10 h-10 rounded-full border border-warm-300 flex items-center justify-center hover:bg-warm-50"
            >
              <span className="text-warm-600">+</span>
            </button>
            <span className="text-warm-600">
              {guests === 1 ? t('dates.guest') : t('dates.guests')}
            </span>
          </div>
        </div>

        {/* Summary */}
        {(checkIn || checkOut) && (
          <div className="bg-warm-50 rounded-lg p-4">
            <h3 className="font-semibold text-warm-900 mb-2">{t('dates.summary.title')}</h3>
            <div className="space-y-1 text-sm">
              {checkIn && (
                <div>
                  <span className="text-warm-600">{t('dates.summary.checkIn')}:</span>
                  <span className="ml-2 font-medium">
                    {new Date(checkIn).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {checkOut && (
                <div>
                  <span className="text-warm-600">{t('dates.summary.checkOut')}:</span>
                  <span className="ml-2 font-medium">
                    {new Date(checkOut).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-warm-600">{t('dates.summary.guests')}:</span>
                <span className="ml-2 font-medium">{guests}</span>
              </div>
              {nights > 0 && (
                <div className="mt-2 text-sm text-warm-600">
                  {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-warm-50 border border-warm-200 rounded-lg p-4">
            <p className="text-warm-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !checkIn || !checkOut}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('common.loading') : t('common.continue')}
        </button>
      </form>
    </motion.div>
  );
} 