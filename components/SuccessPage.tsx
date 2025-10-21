'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice, calculateSurfPrice } from '@/lib/prices';

export default function SuccessPage() {
  const { t, locale } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, priceBreakdown, selectedYogaPackages, selectedSurfPackages, participants } = useBookingStore();

  // Calculate basic totals if priceBreakdown is not available
  let displayTotal = 0;
  if (priceBreakdown) {
    displayTotal = priceBreakdown.total;
  } else {
    // Fallback calculation with proper pricing
    let activitiesTotal = 0;
    selectedActivities.forEach((activity: any) => {
      if (activity.category === 'yoga') {
        const yogaPackage = selectedYogaPackages[activity.id];
        if (yogaPackage) {
          activitiesTotal += getActivityTotalPrice('yoga', yogaPackage);
        }
      } else if (activity.category === 'surf') {
        const surfPackage = selectedSurfPackages[activity.id];
        if (surfPackage) {
          activitiesTotal += getActivityTotalPrice('surf', surfPackage);
        }
      } else {
        activitiesTotal += activity.price;
      }
    });

    // Add accommodation if available
    let accommodationTotal = 0;
    if (selectedRoom && bookingData.checkIn && bookingData.checkOut) {
      const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24));
      accommodationTotal = selectedRoom.pricePerNight * nights;
    }

    displayTotal = activitiesTotal + accommodationTotal;
  }

  // If we don't have booking data at all, show loading
  if (!bookingData.contactInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-300 text-lg">{t('success.loading')}</div>
        </div>
      </div>
    );
  }

  const nights = Math.ceil((new Date(bookingData.checkOut!).getTime() - new Date(bookingData.checkIn!).getTime()) / (1000 * 60 * 60 * 24));

  // Function to get the correct activity price based on selected packages
  const getActivityPrice = (activity: any) => {
    if (activity.category === 'yoga') {
      const yogaPackage = selectedYogaPackages[activity.id];
      if (yogaPackage) {
        return getActivityTotalPrice('yoga', yogaPackage);
      }
    } else if (activity.category === 'surf') {
      const surfPackage = selectedSurfPackages[activity.id];
      if (surfPackage) {
        return getActivityTotalPrice('surf', surfPackage);
      }
    }
    return activity.price;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen py-8 bg-gray-900"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
            <span className="text-white text-5xl">✅</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 font-heading">{t('success.title')}</h1>
          <p className="text-xl text-gray-300 font-heading">{t('success.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Booking Reference */}
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-6 font-heading">{t('success.bookingReference')}</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                <h3 className="font-semibold text-white font-heading mb-4">{t('payment.client')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('contact.firstName')}:</span>
                    <span className="font-medium text-white">{bookingData.contactInfo?.firstName || ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('contact.lastName')}:</span>
                    <span className="font-medium text-white">{bookingData.contactInfo?.lastName || ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('contact.email')}:</span>
                    <span className="font-medium text-white">{bookingData.contactInfo?.email || ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('contact.phone')}:</span>
                    <span className="font-medium text-white">{bookingData.contactInfo?.phone || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                <h3 className="font-semibold text-white font-heading mb-4">{t('dates.summary.title')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('dates.summary.checkIn')}:</span>
                    <span className="font-medium text-white">
                      {new Date(bookingData.checkIn!).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('dates.summary.checkOut')}:</span>
                    <span className="font-medium text-white">
                      {new Date(bookingData.checkOut!).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('dates.summary.guests')}:</span>
                    <span className="font-medium text-white">{bookingData.guests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{t('dates.summary.nights')}:</span>
                    <span className="font-medium text-white">{nights}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation */}
            {selectedRoom && (
              <div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-white font-heading mb-4">{t('prices.accommodation')}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('accommodation.roomTypes.' + selectedRoom.roomTypeId + '.name')}:</span>
                      <span className="font-medium text-white">{selectedRoom.roomTypeName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedActivities.length > 0 && (
              <div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold text-white font-heading mb-4">{t('prices.activities')}</h3>
                  <div className="space-y-3 text-sm">
                    {selectedActivities.map((activity: any) => (
                      <div key={activity.id} className="flex justify-between items-center">
                        <span className="text-gray-400">{activity.name}:</span>
                        <span className="font-medium text-yellow-400">${getActivityPrice(activity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-5 bg-green-900/30 border border-green-700 rounded-lg shadow-lg">
                <span className="text-green-400 text-2xl">📧</span>
                <div>
                  <p className="font-semibold text-white font-heading mb-2">{t('success.confirmationSent')}</p>
                  <p className="text-gray-300 text-sm">
                    {t('success.confirmationText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-5 bg-green-900/30 border border-green-700 rounded-lg shadow-lg">
                <span className="text-green-400 text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-white font-heading mb-2">{t('success.whatsappSent')}</p>
                  <p className="text-gray-300 text-sm">
                    {t('success.whatsappText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold text-yellow-400 font-heading mb-4">{t('success.needHelp')}</h3>
              <p className="text-gray-300 text-sm mb-6">{t('success.helpText')}</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <span className="text-gray-400">{t('success.phone')}:</span>
                    <span className="ml-2 font-medium text-white">+541153695627</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-gray-400">{t('success.email')}:</span>
                    <span className="ml-2 font-medium text-white">info@zeneidasgarden.com</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="text-gray-400">{t('success.location')}:</span>
                    <span className="ml-2 font-medium text-white">Santa Teresa, Costa Rica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="mt-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h3 className="font-semibold text-yellow-400 font-heading mb-6">{t('prices.summary')}</h3>
            <div className="space-y-4">
              {selectedRoom && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium text-white">${priceBreakdown?.accommodation || 0}</span>
                </div>
              )}

              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-lg font-heading">{t('prices.total')}</span>
                  <span className="text-2xl font-bold text-yellow-400">${displayTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-12">
          <p className="text-gray-300 text-lg">{t('success.thankYou')}</p>
        </div>
      </div>
    </motion.div>
  );
} 