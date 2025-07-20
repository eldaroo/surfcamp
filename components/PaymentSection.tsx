'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import BookingConfirmation from './BookingConfirmation';

export default function PaymentSection() {
  const { t } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, setCurrentStep } = useBookingStore();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'mock'>('mock');
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
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mover al paso de éxito
      setCurrentStep('success');
    } catch (error) {
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
        <div className="mb-4 text-red-600 font-semibold">{t('payment.error.missingData')}</div>
        <button
          onClick={() => setCurrentStep('contact')}
          className="btn-primary"
        >
          {t('common.back')}
        </button>
      </motion.div>
    );
  }

  const nights = Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
    (1000 * 60 * 60 * 24)
  );

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
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('payment.title')}</h2>
          <p className="text-gray-600">{t('payment.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('payment.summary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.client')}:</span>
                <span className="font-medium">
                  {bookingData.contactInfo?.firstName} {bookingData.contactInfo?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.dni')}:</span>
                <span className="font-medium">{bookingData.contactInfo?.dni}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.email')}:</span>
                <span className="font-medium">{bookingData.contactInfo?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.phone')}:</span>
                <span className="font-medium">{bookingData.contactInfo?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.dates')}:</span>
                <span className="font-medium">
                  {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.guests')}:</span>
                <span className="font-medium">{bookingData.guests}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('payment.method.title')}</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">{t('payment.method.card')}</div>
                  <div className="text-sm text-gray-600">{t('payment.method.cardDescription')}</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="crypto"
                  checked={paymentMethod === 'crypto'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'crypto')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">{t('payment.method.crypto')}</div>
                  <div className="text-sm text-gray-600">{t('payment.method.cryptoDescription')}</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mock"
                  checked={paymentMethod === 'mock'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'mock')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium">{t('payment.method.demo')}</div>
                  <div className="text-sm text-gray-600">{t('payment.method.demoDescription')}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-800">{t('payment.secure.title')}</span>
            </div>
            <p className="text-green-700 text-sm mt-1">{t('payment.secure.description')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-red-800">{t('common.error')}</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

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

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('prices.summary')}</h3>
          
          <div className="space-y-4">
            {/* Accommodation */}
            {selectedRoom && (
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{selectedRoom.roomTypeName}</div>
                  <div className="text-sm text-gray-600">
                    {nights} {nights === 1 ? t('dates.night') : t('dates.nights')} × ${selectedRoom.pricePerNight}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">${accommodationTotal}</span>
              </div>
            )}

            {/* Activities */}
            {selectedActivities.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="font-medium text-gray-900 mb-2">{t('prices.activities')}</div>
                <div className="space-y-2">
                  {selectedActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{activity.name}</span>
                      <span className="font-medium">${activity.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">{t('prices.total')}</span>
                <span className="text-2xl font-bold text-blue-600">${total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 