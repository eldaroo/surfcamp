'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import BookingConfirmation from './BookingConfirmation';

export default function PaymentSection() {
  const { t } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, setCurrentStep } = useBookingStore();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'nowpayments' | 'mock'>('mock');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedRoom &&
    bookingData.contactInfo;

  const handlePayment = async () => {
    if (!isReadyForPayment) {
      setError(t('payment.error.missingData'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('💳 Starting payment process...');
      
      // Convertir fechas Date objects a formato ISO string para la API
      const formatDateForAPI = (date: Date | string) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const checkInFormatted = formatDateForAPI(bookingData.checkIn!);
      const checkOutFormatted = formatDateForAPI(bookingData.checkOut!);
      
      console.log('📅 Formatted dates for API:', {
        original: { checkIn: bookingData.checkIn, checkOut: bookingData.checkOut },
        formatted: { checkIn: checkInFormatted, checkOut: checkOutFormatted }
      });

      // Crear reserva en LobbyPMS
      console.log('🏨 Creating reservation...');
      const reservationResponse = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guests: bookingData.guests,
          contactInfo: bookingData.contactInfo,
          roomTypeId: selectedRoom.roomTypeId,
          activities: selectedActivities.map(a => a.id),
          paymentIntentId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      const reservationData = await reservationResponse.json();

      if (!reservationResponse.ok) {
        throw new Error(reservationData.error || 'Error creating reservation');
      }

      console.log('✅ Reservation created successfully:', reservationData);
      
      // Success! Move to success page
      setCurrentStep('success');
    } catch (error) {
      console.error('❌ Payment/Reservation error:', error);
      setError(error instanceof Error ? error.message : t('payment.error.processing'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Si no hay datos completos, mostrar error
  if (!isReadyForPayment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-2xl font-bold mb-4">{t('payment.error.title')}</h2>
        <div className="mb-4 text-warm-600 font-semibold">{t('payment.error.missingData')}</div>
        <button
          onClick={() => setCurrentStep('contact')}
          className="btn-primary"
        >
          {t('common.back')}
        </button>
      </motion.div>
      );
    }

  const nights = bookingData.checkIn && bookingData.checkOut ? Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
    (1000 * 60 * 60 * 24)
  ) : 0;

  const accommodationTotal = selectedRoom ? selectedRoom.pricePerNight * nights : 0;
  const activitiesTotal = selectedActivities.reduce((sum, activity) => sum + activity.price, 0);
  const total = accommodationTotal + activitiesTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-warm-100 rounded-lg flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-900">{t('payment.title')}</h2>
          <p className="text-warm-600">{t('payment.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="space-y-6">
          {/* Error Message */}
          {/* The original code had a variable `missingData` which was not defined.
              Assuming it was meant to be `!isReadyForPayment` or similar.
              For now, I'll remove it as it's not in the new_code. */}
          {/* <div className="mb-4 text-warm-600 font-semibold">{t('payment.error.missingData')}</div> */}

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-warm-900">{t('payment.method.title')}</h3>
            
            <label className="flex items-center space-x-3 p-3 border border-warm-300 rounded-lg cursor-pointer hover:bg-warm-50">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                className="text-warm-600"
              />
              <div>
                <div className="font-medium">{t('payment.method.stripe')}</div>
                <div className="text-sm text-warm-600">{t('payment.method.stripeDescription')}</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-warm-300 rounded-lg cursor-pointer hover:bg-warm-50">
              <input
                type="radio"
                name="paymentMethod"
                value="nowpayments"
                checked={paymentMethod === 'nowpayments'}
                onChange={(e) => setPaymentMethod(e.target.value as 'nowpayments')}
                className="text-warm-600"
              />
              <div>
                <div className="font-medium">{t('payment.method.crypto')}</div>
                <div className="text-sm text-warm-600">{t('payment.method.cryptoDescription')}</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border border-warm-300 rounded-lg cursor-pointer hover:bg-warm-50">
              <input
                type="radio"
                name="paymentMethod"
                value="mock"
                checked={paymentMethod === 'mock'}
                onChange={(e) => setPaymentMethod(e.target.value as 'mock')}
                className="text-warm-600"
              />
              <div>
                <div className="font-medium">{t('payment.method.demo')}</div>
                <div className="text-sm text-warm-600">{t('payment.method.demoDescription')}</div>
              </div>
            </label>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('payment.processing')}</span>
              </>
            ) : (
              <>
                <span>{t('payment.payButton')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <div className="bg-warm-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('payment.summary.title')}</h3>
            <div className="space-y-3">
              {selectedRoom && (
                <div className="flex justify-between">
                  <span className="text-warm-600">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium">${accommodationTotal}</span>
                </div>
              )}
              {selectedActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between">
                  <span className="text-warm-600">{activity.name}</span>
                  <span className="font-medium">${activity.price}</span>
                </div>
              ))}
              <div className="border-t border-warm-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-warm-900">{t('payment.summary.total')}</span>
                  <span className="text-2xl font-bold text-warm-600">${total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-accent-800">{t('payment.secure.title')}</span>
            </div>
            <p className="text-accent-700 text-sm mt-1">{t('payment.secure.description')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-warm-50 border border-warm-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-warm-800">{t('common.error')}</span>
              </div>
              <p className="text-warm-700 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 