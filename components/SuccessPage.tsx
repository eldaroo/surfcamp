'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function SuccessPage() {
  const { t, locale } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, priceBreakdown } = useBookingStore();

  if (!priceBreakdown) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-warm-400 text-lg">{t('success.loading')}</div>
        </div>
      </div>
    );
  }

  const { total } = priceBreakdown;
  const nights = Math.ceil((new Date(bookingData.checkOut!).getTime() - new Date(bookingData.checkIn!).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen py-8"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-600 text-4xl">✅</span>
          </div>
          <h1 className="text-4xl font-bold text-warm-900 mb-2 font-heading">{t('success.title')}</h1>
          <p className="text-xl text-warm-600">{t('success.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Booking Reference */}
            <div>
              <h2 className="text-2xl font-bold text-warm-900 mb-6 font-heading">{t('success.bookingReference')}</h2>
              <div className="bg-warm-50 rounded-lg p-4">
                <h3 className="font-semibold text-warm-900 mb-3">{t('payment.client')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('contact.firstName')}:</span>
                    <span className="font-medium">{bookingData.contactInfo?.firstName || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('contact.lastName')}:</span>
                    <span className="font-medium">{bookingData.contactInfo?.lastName || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('contact.email')}:</span>
                    <span className="font-medium">{bookingData.contactInfo?.email || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('contact.phone')}:</span>
                    <span className="font-medium">{bookingData.contactInfo?.phone || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div>
              <div className="bg-warm-50 rounded-lg p-4">
                <h3 className="font-semibold text-warm-900 mb-3">{t('dates.summary.title')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('dates.summary.checkIn')}:</span>
                    <span className="font-medium">
                      {new Date(bookingData.checkIn!).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('dates.summary.checkOut')}:</span>
                    <span className="font-medium">
                      {new Date(bookingData.checkOut!).toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('dates.summary.guests')}:</span>
                    <span className="font-medium">{bookingData.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-600">{t('dates.summary.nights')}:</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation */}
            {selectedRoom && (
              <div>
                <div className="bg-warm-50 rounded-lg p-4">
                  <h3 className="font-semibold text-warm-900 mb-3">{t('prices.accommodation')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-600">{t('accommodation.roomTypes.' + selectedRoom.roomTypeId + '.name')}:</span>
                      <span className="font-medium">{selectedRoom.roomTypeName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedActivities.length > 0 && (
              <div>
                <div className="bg-warm-50 rounded-lg p-4">
                  <h3 className="font-semibold text-warm-900 mb-3">{t('prices.activities')}</h3>
                  <div className="space-y-2 text-sm">
                    {selectedActivities.map((activity) => (
                      <div key={activity.id} className="flex justify-between">
                        <span className="text-warm-600">{activity.name}:</span>
                        <span className="font-medium">${activity.price}</span>
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
              <div className="flex items-start space-x-3 p-4 bg-accent-50 border border-accent-200 rounded-lg">
                <span className="text-accent-600">📧</span>
                <div>
                  <p className="font-semibold text-warm-900">{t('success.confirmationSent')}</p>
                  <p className="text-warm-600 text-sm">
                    {t('success.confirmationText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-accent-50 border border-accent-200 rounded-lg">
                <span className="text-accent-600">📱</span>
                <div>
                  <p className="font-semibold text-warm-900">{t('success.whatsappSent')}</p>
                  <p className="text-warm-600 text-sm">
                    {t('success.whatsappText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-warm-900 mb-4">{t('success.needHelp')}</h3>
              <p className="text-warm-600 text-sm mb-4">{t('success.helpText')}</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <span className="text-warm-600">{t('success.phone')}:</span>
                    <span className="ml-2 font-medium">+506 8888 8888</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-warm-600">{t('success.email')}:</span>
                    <span className="ml-2 font-medium">info@surfcamp.com</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="text-warm-600">{t('success.location')}:</span>
                    <span className="ml-2 font-medium">Santa Teresa, Costa Rica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="mt-8">
          <div className="bg-warm-50 rounded-lg p-6">
            <h3 className="font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
            <div className="space-y-3">
              {selectedRoom && (
                <div className="flex justify-between">
                  <span className="text-warm-600">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium">${priceBreakdown.accommodation}</span>
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
                  <span className="font-semibold text-warm-900">{t('prices.total')}</span>
                  <span className="text-xl font-bold text-warm-600">${total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8">
          <p className="text-warm-600">{t('success.thankYou')}</p>
        </div>
      </div>
    </motion.div>
  );
} 