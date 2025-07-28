'use client';

import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function PriceSummary() {
  const { t } = useI18n();
  const { bookingData, selectedRoom, selectedActivities, priceBreakdown } = useBookingStore();

  if (!bookingData.checkIn || !bookingData.checkOut) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
        <div className="text-warm-400 text-sm">
          {t('prices.selectDates')}
        </div>
      </div>
    );
  }

  if (!priceBreakdown) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
        <div className="text-warm-400 text-sm">
          {t('prices.selectDates')}
        </div>
      </div>
    );
  }

  const { accommodation, activities, subtotal, tax, total } = priceBreakdown;
  const nights = Math.ceil((new Date(bookingData.checkOut!).getTime() - new Date(bookingData.checkIn!).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
      
      {/* Booking Summary */}
      <div className="bg-warm-50 rounded-lg p-4">
        <h4 className="font-medium text-warm-900 mb-2">{t('dates.summary.title')}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.checkIn')}:</span>
            <span className="font-medium">
              {new Date(bookingData.checkIn!).toLocaleDateString('es-ES')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.checkOut')}:</span>
            <span className="font-medium">
              {new Date(bookingData.checkOut!).toLocaleDateString('es-ES')}
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

      {/* Accommodation */}
      {selectedRoom && (
        <div className="border-b border-warm-200 pb-4 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-warm-900">{selectedRoom.roomTypeName}</h4>
              <p className="text-sm text-warm-600">
                {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
              </p>
            </div>
            <span className="font-semibold text-warm-900">${accommodation}</span>
          </div>
        </div>
      )}

      {/* Activities */}
      {selectedActivities.length > 0 && (
        <div className="border-b border-warm-200 pb-4 mt-4">
          <h4 className="font-medium text-warm-900 mb-2">{t('prices.activities')}</h4>
          <div className="space-y-2">
            {selectedActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center">
                <div>
                  <span className="text-warm-600">{activity.name}</span>
                </div>
                <span className="font-medium text-warm-900">${activity.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-warm-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-warm-900">{t('prices.total')}</span>
          <span className="text-2xl font-bold text-warm-600">${total}</span>
        </div>
      </div>
    </div>
  );
} 