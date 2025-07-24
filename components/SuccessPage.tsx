'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function SuccessPage() {
  const { t } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, reset } = useBookingStore();

  const handleNewReservation = () => {
    reset();
    window.location.href = '/es';
  };

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
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('success.title')}</h1>
        <p className="text-xl text-gray-600">{t('success.subtitle')}</p>
              </div>
              
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Details */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('success.bookingReference')}</h2>
          
          <div className="space-y-4">
            {/* Client Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('payment.client')}</h3>
              <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.firstName')}:</span>
                  <span className="font-medium">{bookingData.contactInfo?.firstName}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.lastName')}:</span>
                  <span className="font-medium">{bookingData.contactInfo?.lastName}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.email')}:</span>
                  <span className="font-medium">{bookingData.contactInfo?.email}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.phone')}:</span>
                  <span className="font-medium">{bookingData.contactInfo?.phone}</span>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('dates.summary.title')}</h3>
              <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('dates.summary.checkIn')}:</span>
                  <span className="font-medium">
                    {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('dates.summary.checkOut')}:</span>
                  <span className="font-medium">
                    {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">{t('dates.summary.guests')}:</span>
                  <span className="font-medium">
                    {bookingData.guests} {bookingData.guests === 1 ? t('dates.guest') : t('dates.guests_plural')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('dates.summary.nights')}:</span>
                  <span className="font-medium">
                    {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                  </span>
                </div>
              </div>
            </div>

            {/* Accommodation */}
            {selectedRoom && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('prices.accommodation')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('accommodation.roomTypes.' + selectedRoom.roomTypeId + '.name')}:</span>
                    <span className="font-medium">${selectedRoom.pricePerNight} {t('prices.perNight')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Activities */}
        {selectedActivities.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('prices.activities')}</h3>
                <div className="space-y-2 text-sm">
                  {selectedActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{activity.name}:</span>
                      <span className="font-medium">${activity.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
            </div>
            
        {/* Confirmation & Contact */}
        <div className="space-y-6">
          {/* Email Confirmation */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-gray-900">{t('success.confirmationSent')}</p>
            </div>
            <p className="text-gray-600 text-sm">
              {t('success.confirmationSent')} {bookingData.contactInfo?.email}
            </p>
          </div>

          {/* WhatsApp Confirmation */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <p className="font-semibold text-gray-900">{t('success.whatsappSent')}</p>
            </div>
              <p className="text-gray-600 text-sm">
              {t('success.whatsappSent')}
              </p>
          </div>
          
          {/* Help Section */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">{t('success.needHelp')}</h3>
            <p className="text-gray-600 text-sm mb-4">{t('success.helpText')}</p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-600">{t('success.phone')}:</span>
                <span className="font-medium">{t('header.phone')}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">{t('success.email')}:</span>
                <span className="font-medium">info@surfcamp.com</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">{t('success.location')}:</span>
                <span className="font-medium">{t('header.location')}</span>
            </div>
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">{t('prices.summary')}</h3>
            
            <div className="space-y-3">
              {selectedRoom && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium">${accommodationTotal}</span>
                </div>
              )}
              
              {selectedActivities.map((activity, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{activity.name}</span>
                  <span className="font-medium">${activity.price}</span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{t('prices.total')}</span>
                  <span className="text-xl font-bold text-blue-600">${total}</span>
                </div>
            </div>
            </div>
          </div>
        </div>
          </div>
          
      {/* Action Buttons */}
      <div className="text-center mt-8">
        <button
          onClick={handleNewReservation}
          className="btn-primary"
        >
          {t('success.newReservation')}
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-gray-600">{t('success.thankYou')}</p>
      </div>
      </motion.div>
  );
} 