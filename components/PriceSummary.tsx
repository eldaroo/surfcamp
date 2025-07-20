'use client';

import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function PriceSummary() {
  const { t } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, priceBreakdown } = useBookingStore();

  if (!bookingData.checkIn || !bookingData.checkOut) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('prices.summary')}</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            {t('prices.selectDates')}
          </div>
        </div>
      </div>
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
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('prices.summary')}</h3>
      
      <div className="space-y-4">
        {/* Stay Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{t('dates.summary.title')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dates.summary.checkIn')}:</span>
              <span className="font-medium">
                {new Date(bookingData.checkIn).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dates.summary.checkOut')}:</span>
              <span className="font-medium">
                {new Date(bookingData.checkOut).toLocaleDateString()}
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
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{selectedRoom.roomTypeName}</h4>
                <p className="text-sm text-gray-600">
                  {nights} {nights === 1 ? t('dates.night') : t('dates.nights')} × ${selectedRoom.pricePerNight} {t('prices.perNight')}
                </p>
              </div>
              <span className="font-semibold text-gray-900">${accommodationTotal}</span>
            </div>
          </div>
        )}

        {/* Activities */}
        {selectedActivities.length > 0 && (
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">{t('prices.activities')}</h4>
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
        <div className="pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">{t('prices.total')}</span>
            <span className="text-2xl font-bold text-blue-600">${total}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 