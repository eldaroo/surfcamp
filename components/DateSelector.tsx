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
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('dates.title')}</h2>
          <p className="text-gray-600">{t('dates.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dates.checkIn')}
            </label>
            <input
              ref={checkInRef}
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              min={new Date().toISOString().split('T')[0]}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dates.checkOut')}
            </label>
            <input
              ref={checkOutRef}
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              min={checkIn || new Date().toISOString().split('T')[0]}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Number of Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dates.guests')}
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-gray-600">-</span>
              </button>
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(12, guests + 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-gray-600">+</span>
              </button>
            </div>
            <span className="text-gray-600">
              {guests === 1 ? `1 ${t('dates.guest')}` : `${guests} ${t('dates.guests_plural')}`}
            </span>
          </div>
        </div>

        {/* Summary */}
        {(checkIn || checkOut || guests > 1) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{t('dates.summary.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {checkIn && (
                <div>
                  <span className="text-gray-600">{t('dates.summary.checkIn')}:</span>
                  <span className="ml-2 font-medium">{new Date(checkIn).toLocaleDateString()}</span>
                </div>
              )}
              {checkOut && (
                <div>
                  <span className="text-gray-600">{t('dates.summary.checkOut')}:</span>
                  <span className="ml-2 font-medium">{new Date(checkOut).toLocaleDateString()}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">{t('dates.summary.guests')}:</span>
                <span className="ml-2 font-medium">{guests}</span>
              </div>
            </div>
            {nights > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {error.split('. ').map((err, index) => (
                      <li key={index}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !checkIn || !checkOut}
            className="btn-primary flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span>{t('common.continue')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
} 