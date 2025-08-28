'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import PriceSummary from '@/components/PriceSummary';

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
      
      // Avanzar directamente al paso de alojamiento
      // La verificación de disponibilidad se hará en el AccommodationSelector
      setCurrentStep('accommodation');
    } catch (error) {
      setError(t('dates.error.general'));
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Columna izquierda - Selector de fechas */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="card"
      >
              <div className="mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">{t('dates.title')}</h2>
            <p className="text-yellow-300">{t('dates.subtitle')}</p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('dates.checkIn')} *
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white/10 text-white"
              ref={checkInRef}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('dates.checkOut')} *
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white/10 text-white"
              ref={checkOutRef}
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
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
            >
              <span className="text-white">-</span>
            </button>
            <span className="text-2xl font-bold text-blue-400 w-12 text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests(guests + 1)}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
            >
              <span className="text-white">+</span>
            </button>
            <span className="text-yellow-300">
              {guests === 1 ? t('dates.guest') : t('dates.guests')}
            </span>
          </div>
        </div>

        {/* Summary */}
        {(checkIn || checkOut) && (
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-yellow-300 mb-2">{t('dates.summary.title')}</h3>
            <div className="space-y-1 text-sm">
              {checkIn && (
                <div>
                  <span className="text-white">{t('dates.summary.checkIn')}:</span>
                  <span className="ml-2 font-medium text-blue-300">
                    {new Date(checkIn).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {checkOut && (
                <div>
                  <span className="text-white">{t('dates.summary.checkOut')}:</span>
                  <span className="ml-2 font-medium text-blue-300">
                    {new Date(checkOut).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-white">{t('dates.summary.guests')}:</span>
                <span className="ml-2 font-medium text-blue-300">{guests}</span>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !checkIn || !checkOut}
          className="w-32 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
        >
          {isLoading ? t('common.loading') : t('common.continue')}
        </button>
        </form>
      </motion.div>

      {/* Columna derecha - Price Summary */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card"
      >
        <PriceSummary />
      </motion.div>
    </div>
  );
} 