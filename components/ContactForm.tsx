'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice } from '@/lib/prices';
import BackButton from './BackButton';
import PhoneSelector from './PhoneSelector';

const isValidPhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digitsOnly = trimmed.replace(/\D+/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) return false;
  const allowedCharsPattern = /^[+\d\s()-]+$/;
  return allowedCharsPattern.test(trimmed);
};

const normalizePhoneForStore = (value: string) =>
  value.replace(/\s+/g, ' ').trim();

const buildLeadGuestName = (firstName: string, lastName: string) =>
  `${firstName.trim()} ${lastName.trim()}`.trim();

export default function ContactForm() {
  const { t } = useI18n();
  const {
    bookingData,
    setBookingData,
    setCurrentStep,
    setPersonalizationName,
    personalizationName,
    selectedRoom,
    selectedActivities,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedSurfClasses,
    setPriceBreakdown
  } = useBookingStore();
  const [formData, setFormData] = useState({
    firstName: bookingData.contactInfo?.firstName || '',
    lastName: bookingData.contactInfo?.lastName || '',
    email: bookingData.contactInfo?.email || '',
    phone: bookingData.contactInfo?.phone || '',
    dni: bookingData.contactInfo?.dni || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [wetravelResponse, setWetravelResponse] = useState<any>(null);
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState(false);
  const paymentStatusInterval = useRef<NodeJS.Timeout | null>(null);
  const paymentWindowRef = useRef<Window | null>(null);

  const closePaymentWindow = useCallback(() => {
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    paymentWindowRef.current = null;
  }, []);

  useEffect(() => {
    const leadGuestName = buildLeadGuestName(
      bookingData.contactInfo?.firstName || '',
      bookingData.contactInfo?.lastName || ''
    );

    // Only update if both firstName and lastName exist and personalization name is different
    if (leadGuestName && leadGuestName !== personalizationName) {
      console.log('[ContactForm] Syncing personalization name from booking data.', {
        firstName: bookingData.contactInfo?.firstName,
        lastName: bookingData.contactInfo?.lastName,
        leadGuestName,
        existingPersonalizationName: personalizationName,
      });
      setPersonalizationName(leadGuestName);
    } else if (!leadGuestName && personalizationName) {
      // Clear personalization name if contact info is cleared
      console.log('[ContactForm] No lead guest name found. Clearing personalization name.');
      setPersonalizationName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingData.contactInfo?.firstName,
    bookingData.contactInfo?.lastName,
  ]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (paymentStatusInterval.current) {
        clearInterval(paymentStatusInterval.current);
      }
      closePaymentWindow();
    };
  }, [closePaymentWindow]);

  // Calculate prices
  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const accommodationTotal = selectedRoom ? (
    selectedRoom.isSharedRoom
      ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
      : selectedRoom.pricePerNight * nights
  ) : 0;

  const activitiesTotal = selectedActivities.reduce((sum: number, activity: any) => {
    if (activity.category === 'yoga') {
      const yogaPackage = selectedYogaPackages[activity.id];
      if (!yogaPackage) return sum;
      return sum + getActivityTotalPrice('yoga', yogaPackage, bookingData.guests || 1);
    } else if (activity.category === 'surf') {
      const surfClasses = selectedSurfClasses[activity.id];
      if (!surfClasses) return sum;
      return sum + getActivityTotalPrice('surf', undefined, bookingData.guests || 1, surfClasses);
    } else {
      return sum + ((activity.price || 0) * (bookingData.guests || 1));
    }
  }, 0);

  const total = accommodationTotal + activitiesTotal;

  // Payment status checking
  const checkPaymentStatus = async (orderId?: string, tripId?: string) => {
    try {
      const params = new URLSearchParams();
      if (orderId) params.append('order_id', orderId);
      if (tripId) params.append('trip_id', tripId);

      const response = await fetch(`/api/payment-status?${params.toString()}`);
      const data = await response.json();

      if (data.show_success && (data.is_booking_created || data.is_completed)) {
        const prices = {
          accommodation: accommodationTotal,
          activities: activitiesTotal,
          subtotal: total,
          tax: 0,
          total,
          currency: 'USD'
        };
        setPriceBreakdown(prices);

        if (paymentStatusInterval.current) {
          clearInterval(paymentStatusInterval.current);
          paymentStatusInterval.current = null;
        }
        setIsWaitingForPayment(false);
        setIsCheckingPaymentStatus(false);
        setCurrentStep('success');
        closePaymentWindow();
        window.focus();
      }

      return data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  };

  const startPaymentStatusPolling = (orderId?: string, tripId?: string) => {
    if (paymentStatusInterval.current) {
      clearInterval(paymentStatusInterval.current);
    }

    setIsCheckingPaymentStatus(true);
    checkPaymentStatus(orderId, tripId);

    paymentStatusInterval.current = setInterval(() => {
      checkPaymentStatus(orderId, tripId);
    }, 3000);

    setTimeout(() => {
      if (paymentStatusInterval.current) {
        clearInterval(paymentStatusInterval.current);
        paymentStatusInterval.current = null;
        setIsCheckingPaymentStatus(false);
      }
    }, 10 * 60 * 1000);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('contact.validation.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('contact.validation.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.validation.emailInvalid');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('contact.validation.phoneRequired');
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = t('contact.invalidPhone');
    }

    if (!formData.dni.trim()) {
      newErrors.dni = t('contact.validation.dniRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      const normalizedFormData = {
        ...formData,
        phone: normalizePhoneForStore(formData.phone),
      };
      setFormData(normalizedFormData);
      setBookingData({
        ...bookingData,
        contactInfo: normalizedFormData
      });

      const leadGuestName = buildLeadGuestName(formData.firstName, formData.lastName);
      setPersonalizationName(leadGuestName);

      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const handlePayment = async () => {
    // First validate and save contact info
    if (!validateForm()) {
      return;
    }

    // Save contact info
    setBookingData({
      ...bookingData,
      contactInfo: formData
    });

    const leadGuestName = buildLeadGuestName(formData.firstName, formData.lastName);
    setPersonalizationName(leadGuestName);

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      closePaymentWindow();
      paymentWindowRef.current = window.open('', '_blank');
      const paymentWindow = paymentWindowRef.current;

      if (paymentWindow) {
        const loadingTitle = t('payment.generatingLink');
        const loadingMessage = t('payment.pleaseWait') || 'Please wait a moment...';

        paymentWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${loadingTitle}</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                  color: white;
                }
                .loader {
                  text-align: center;
                }
                .spinner {
                  border: 4px solid rgba(255, 255, 255, 0.1);
                  border-top: 4px solid #fbbf24;
                  border-radius: 50%;
                  width: 50px;
                  height: 50px;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                h2 { margin: 0 0 10px; }
                p { margin: 0; opacity: 0.8; }
              </style>
            </head>
            <body>
              <div class="loader">
                <div class="spinner"></div>
                <h2>${loadingTitle}</h2>
                <p>${loadingMessage}</p>
              </div>
            </body>
          </html>
        `);
      }

      const formatDateForAPI = (date: Date | string) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
      };

      const checkInFormatted = formatDateForAPI(bookingData.checkIn!);
      const checkOutFormatted = formatDateForAPI(bookingData.checkOut!);

      const today = new Date();
      const checkInDate = new Date(checkInFormatted);
      const daysBeforeDeparture = Math.max(1, Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) - 1);

      const paymentPayload = {
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
        guests: bookingData.guests,
        roomTypeId: selectedRoom?.roomTypeId,
        contactInfo: formData,
        selectedActivities: selectedActivities.map((a: any) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          price: a.price,
          package:
            a.category === 'yoga'
              ? selectedYogaPackages[a.id]
              : a.category === 'surf'
                ? selectedSurfPackages[a.id]
                : undefined,
          classCount: a.category === 'surf' ? selectedSurfClasses[a.id] : undefined
        })),
        wetravelData: {
          trip: {
            title: "Surf & Yoga Retreat – Santa Teresa",
            start_date: checkInFormatted,
            end_date: checkOutFormatted,
            currency: "USD",
            participant_fees: "all"
          },
          pricing: {
            price: Math.round(total),
            payment_plan: {
              allow_auto_payment: false,
              allow_partial_payment: false,
              deposit: 0,
              installments: [
                {
                  price: Math.round(total),
                  days_before_departure: daysBeforeDeparture
                }
              ]
            }
          }
        }
      };

      const wetravelResponse = await fetch('/api/wetravel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      const wetravelData = await wetravelResponse.json();

      if (!wetravelResponse.ok) {
        throw new Error(wetravelData.error || 'Error generating payment link');
      }

      setWetravelResponse(wetravelData);

      if (wetravelData.payment_url) {
        if (paymentWindowRef.current) {
          paymentWindowRef.current.location.href = wetravelData.payment_url;
          paymentWindowRef.current.focus();
        } else {
          window.open(wetravelData.payment_url, '_blank');
        }

        setPaymentError('');
        setIsWaitingForPayment(true);

        const orderId = wetravelData.order_id;
        const tripId = wetravelData.trip_id;

        startPaymentStatusPolling(orderId, tripId);
      } else {
        closePaymentWindow();
        throw new Error('No payment URL received from WeTravel');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : t('payment.error.processing'));
      closePaymentWindow();
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'firstName' || field === 'lastName') {
        const leadGuestName = buildLeadGuestName(
          field === 'firstName' ? value : updated.firstName,
          field === 'lastName' ? value : updated.lastName
        );
        console.log('[ContactForm] Lead guest name updated via input change.', {
          field,
          value,
          updated,
          leadGuestName,
        });
        setPersonalizationName(leadGuestName);
      }

      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Back Button */}
        <div className="mb-8">
          <BackButton variant="minimal" />
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 font-heading">{t('contact.title')}</h1>
          <p className="text-xl text-yellow-400 font-heading">{t('contact.subtitle')}</p>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left Column - Personal Information */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl h-full">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-2 font-heading">Personal Information</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-300 mb-3">
                  {t('contact.firstName')}
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder={t('contact.placeholder.firstName')}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.firstName ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                  }`}
                />
                {errors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {errors.firstName}
                  </motion.p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-300 mb-3">
                  {t('contact.lastName')}
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder={t('contact.placeholder.lastName')}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.lastName ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                  }`}
                />
                {errors.lastName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {errors.lastName}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-3">
                {t('contact.email')}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('contact.placeholder.email')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  errors.email ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                }`}
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Phone */}
            <div>
              <PhoneSelector
                label={t('contact.phone')}
                value={formData.phone}
                onChange={(phone) => handleInputChange('phone', phone)}
                placeholder={t('contact.placeholder.phone')}
                error={errors.phone}
              />
            </div>

            {/* DNI */}
            <div>
              <label htmlFor="dni" className="block text-sm font-semibold text-gray-300 mb-3">
                {t('contact.dni')}
              </label>
              <input
                type="text"
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                placeholder={t('contact.placeholder.dni')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  errors.dni ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                }`}
              />
              {errors.dni && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.dni}
                </motion.p>
              )}
            </div>

          </form>
          </div>

          {/* Right Column - Payment Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl h-full">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-2 font-heading">{t('payment.title')}</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
          </div>

          <div className="space-y-6">
            {/* Payment Summary */}
            <div>
              <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 font-heading">{t('payment.summary.title')}</h3>
                <div className="space-y-3">
                  {selectedRoom && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">{selectedRoom.roomTypeName}</span>
                      <span className="font-medium text-yellow-400">${accommodationTotal}</span>
                    </div>
                  )}
                  {selectedActivities.map((activity: any) => {
                    let activityPrice: number;
                    let activityDetails: string = '';

                    if (activity.category === 'yoga') {
                      const selectedYogaPackage = selectedYogaPackages[activity.id];
                      if (!selectedYogaPackage) return null;
                      activityPrice = getActivityTotalPrice('yoga', selectedYogaPackage, bookingData.guests || 1);
                      activityDetails = `(${selectedYogaPackage})`;
                    } else if (activity.category === 'surf') {
                      const surfClasses = selectedSurfClasses[activity.id];
                      if (!surfClasses) return null;
                      activityPrice = getActivityTotalPrice('surf', undefined, bookingData.guests || 1, surfClasses);
                      activityDetails = `(${surfClasses} ${surfClasses === 1 ? 'clase' : 'clases'})`;
                    } else {
                      activityPrice = (activity.price || 0) * (bookingData.guests || 1);
                    }

                    return (
                      <div key={activity.id} className="flex justify-between">
                        <span className="text-gray-300">
                          {activity.name}
                          {activityDetails && (
                            <span className="text-sm text-gray-400 ml-2">
                              {activityDetails}
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-yellow-400">${activityPrice}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{t('payment.summary.total')}</span>
                      <span className="text-2xl font-bold text-yellow-300">${total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-400">✅</span>
                  <span className="font-semibold text-white">{t('payment.secure.title')}</span>
                </div>
                <p className="text-gray-300 text-sm">{t('payment.secure.description')}</p>
              </div>
            </div>

            {/* Payment Button */}
            <motion.button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                whileHover={{ scale: isProcessingPayment ? 1 : 1.02 }}
                whileTap={{ scale: isProcessingPayment ? 1 : 0.98 }}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isProcessingPayment
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 shadow-lg hover:shadow-yellow-500/25'
                }`}
              >
                {isProcessingPayment ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('payment.generatingLink')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>💳 {t('payment.generateLink')}</span>
                  </div>
                )}
              </motion.button>

              {/* Waiting for Payment */}
              {isWaitingForPayment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-yellow-500/10 border border-yellow-300/50 rounded-lg p-6 text-center"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300 mb-2 font-heading">
                        {t('payment.waitingForPayment.title')}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {t('payment.waitingForPayment.description')}
                      </p>
                      {isCheckingPaymentStatus && (
                        <p className="text-green-300 text-xs mt-2">
                          ✅ Verificando estado del pago automáticamente...
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => window.open(wetravelResponse?.payment_url, '_blank')}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-colors duration-200"
                      >
                        {t('payment.waitingForPayment.openLinkButton')}
                      </button>
                      <button
                        onClick={() => setIsWaitingForPayment(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors duration-200"
                      >
                        {t('payment.waitingForPayment.hideMessageButton')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Error */}
              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-400/50 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="font-semibold text-white">{t('common.error')}</span>
                  </div>
                  <p className="text-red-300 text-sm">{paymentError}</p>
                </motion.div>
              )}
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
