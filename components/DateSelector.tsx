'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import PriceSummary from '@/components/PriceSummary';
import CustomDatePicker from '@/components/CustomDatePicker';
import BackButton from './BackButton';

export default function DateSelector() {
  const { t, locale } = useI18n();
  const { bookingData, setBookingData, setCurrentStep } = useBookingStore();
  const [guests, setGuests] = useState(bookingData.guests || 1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Usar fechas del store global para mantener sincronización
  const checkInDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null;
  const checkOutDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null;

  // Sincronizar guests con el store global
  useEffect(() => {
    if (bookingData.guests && bookingData.guests !== guests) {
      setGuests(bookingData.guests);
    }
  }, [bookingData.guests, guests]);

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (!checkInDate || !checkOutDate) {
      setError(t('dates.error.selectDates'));
      setIsLoading(false);
      return;
    }

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
      // Actualizar solo los huéspedes en el store (las fechas ya se actualizaron en onChange)
      setBookingData({
        ...bookingData,
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
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" lang={locale === 'en' ? 'en-US' : 'es-ES'}>
      {/* Columna izquierda - Selector de fechas */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="card"
      >
              <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton variant="minimal" />
          </div>

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
                setGuests(newGuests);
                setBookingData({ ...bookingData, guests: newGuests });
              }}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
            >
              <span className="text-white">-</span>
            </button>
            <span className="text-2xl font-bold text-blue-400 w-12 text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => {
                const newGuests = guests + 1;
                setGuests(newGuests);
                setBookingData({ ...bookingData, guests: newGuests });
              }}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !checkInDate || !checkOutDate}
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