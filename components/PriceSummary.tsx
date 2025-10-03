'use client';

import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice, calculateSurfPrice } from '@/lib/prices';

// Helper function for currency formatting
const formatCurrency = (amount: number, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function for pluralization
const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

export default function PriceSummary() {
  const { t, locale } = useI18n();
  const {
    bookingData,
    selectedRoom,
    selectedActivities,
    priceBreakdown,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedSurfClasses
  } = useBookingStore();

  // Default translations with fallbacks
  const getText = (key: string, fallback: string): string => {
    try {
      const translation = t(key);
      // If translation returns the key itself (meaning no translation found), use fallback
      return translation === key ? fallback : translation;
    } catch {
      return fallback;
    }
  };

  // Calculate nights
  const nights = bookingData.checkIn && bookingData.checkOut
    ? Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Get activity price with package info
  const getActivityDetails = (activity: any) => {
    let price = 0;
    let packageInfo = '';
    let unitLabel = '';

    if (activity.category === 'yoga') {
      const yogaPackage = selectedYogaPackages[activity.id];
      if (yogaPackage) {
        price = getActivityTotalPrice('yoga', yogaPackage);
        packageInfo = yogaPackage;
        // Extract number from package (e.g., "4-classes" -> "4 classes")
        const classCount = yogaPackage.match(/(\d+)/)?.[1] || '1';
        unitLabel = `${classCount} × ${formatCurrency(price / parseInt(classCount))} / class`;
      }
    } else if (activity.category === 'surf') {
      const surfClasses = selectedSurfClasses[activity.id] || 4;
      price = calculateSurfPrice(surfClasses) * (bookingData.guests || 1);
      packageInfo = `${surfClasses}-classes`;
      unitLabel = `${surfClasses} × ${formatCurrency(calculateSurfPrice(surfClasses) / surfClasses)} / class`;
    } else {
      price = activity.price || 0;
      unitLabel = `1 × ${formatCurrency(price)} / activity`;
    }

    return { price, packageInfo, unitLabel };
  };

  // Calculate totals
  const accommodationTotal = selectedRoom && nights > 0
    ? (selectedRoom.isSharedRoom
        ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
        : selectedRoom.pricePerNight * nights)
    : 0;

  const activitiesTotal = selectedActivities.reduce((sum: number, activity: any) => {
    const { price } = getActivityDetails(activity);
    return sum + price;
  }, 0);

  const subtotal = accommodationTotal + activitiesTotal;
  const fees = priceBreakdown?.tax || 0;
  const discounts = 0; // Placeholder for future discounts
  const total = subtotal + fees - discounts;

  // Form validation
  const isFormValid = !!(bookingData.checkIn && bookingData.checkOut && selectedRoom);

  return (
    <div
      className="rounded-2xl p-6 border lg:sticky lg:top-6"
      style={{
        backgroundColor: 'var(--brand-surface)',
        borderColor: 'var(--brand-border)'
      }}
      role="complementary"
      aria-label="Booking Summary"
    >
      {/* Header */}
      <h3
        className="text-[20px] font-semibold mb-6 font-heading"
        style={{ color: 'var(--brand-text)' }}
      >
        {getText('prices.summary', 'Price Summary')}
      </h3>

      {/* Stay Summary - Compact Grid */}
      {bookingData.checkIn && bookingData.checkOut && (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
            <dt
              className="text-[13px] font-medium"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              {getText('dates.checkIn', 'Check-in')}
            </dt>
            <dd
              className="text-[13px] font-medium text-right"
              style={{ color: 'var(--brand-text)' }}
            >
              {new Date(bookingData.checkIn).toLocaleDateString(
                locale === 'en' ? 'en-US' : 'es-ES',
                {
                  month: 'short',
                  day: 'numeric',
                  year: new Date(bookingData.checkIn).getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
                }
              )}
            </dd>

            <dt
              className="text-[13px] font-medium"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              {getText('dates.checkOut', 'Check-out')}
            </dt>
            <dd
              className="text-[13px] font-medium text-right"
              style={{ color: 'var(--brand-text)' }}
            >
              {new Date(bookingData.checkOut).toLocaleDateString(
                locale === 'en' ? 'en-US' : 'es-ES',
                {
                  month: 'short',
                  day: 'numeric',
                  year: new Date(bookingData.checkOut).getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
                }
              )}
            </dd>

            <dt
              className="text-[13px] font-medium"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              {getText('dates.guests', 'Guests')}
            </dt>
            <dd
              className="text-[13px] font-medium text-right"
              style={{ color: 'var(--brand-text)' }}
            >
              {bookingData.guests} {pluralize(bookingData.guests || 1, 'guest', 'guests')}
            </dd>

            <dt
              className="text-[13px] font-medium"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              {getText('dates.nights', 'Nights')}
            </dt>
            <dd
              className="text-[13px] font-medium text-right"
              style={{ color: 'var(--brand-text)' }}
            >
              {nights} {pluralize(nights, 'night', 'nights')}
            </dd>
          </dl>

          {/* Separator */}
          <div
            className="h-px mb-6"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
          />
        </>
      )}

      {/* Line Items */}
      <ul className="space-y-4 mb-6">
        {/* Accommodation */}
        {selectedRoom && nights > 0 && (
          <li>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div
                  className="text-[15px] font-medium"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {selectedRoom.roomTypeName}
                </div>
                <div
                  className="text-[12px] mt-1"
                  style={{ color: 'var(--brand-text-dim)' }}
                >
                  {selectedRoom.isSharedRoom
                    ? `${bookingData.guests} × ${formatCurrency(selectedRoom.pricePerNight, locale)} / night`
                    : `${nights} × ${formatCurrency(selectedRoom.pricePerNight, locale)} / night`
                  }
                </div>
              </div>
              <div
                className="text-[15px] font-medium text-right"
                style={{ color: 'var(--brand-text)' }}
              >
                {formatCurrency(accommodationTotal, locale)}
              </div>
            </div>
          </li>
        )}

        {/* Activities */}
        {selectedActivities.map((activity: any) => {
          const { price, packageInfo, unitLabel } = getActivityDetails(activity);

          return (
            <li key={activity.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div
                    className="text-[15px] font-medium"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {activity.name}
                    {packageInfo && (
                      <span
                        className="text-[12px] ml-2 px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--brand-aqua) 20%, transparent)',
                          color: 'var(--brand-aqua)'
                        }}
                      >
                        {packageInfo.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                  {unitLabel && (
                    <div
                      className="text-[12px] mt-1"
                      style={{ color: 'var(--brand-text-dim)' }}
                    >
                      {unitLabel}
                    </div>
                  )}
                </div>
                <div
                  className="text-[15px] font-medium text-right"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {formatCurrency(price, locale)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Subtotal (only show if we have multiple items) */}
      {((accommodationTotal > 0) && (activitiesTotal > 0)) && (
        <>
          <div
            className="h-px mb-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
          />
          <div className="flex justify-between items-center mb-6">
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              {getText('prices.subtotal', 'Subtotal')}
            </span>
            <span
              className="text-[14px] font-medium text-right"
              style={{ color: 'var(--brand-text)' }}
            >
              {formatCurrency(subtotal, locale)}
            </span>
          </div>
        </>
      )}

      {/* Fees */}
      {fees > 0 && (
        <div className="flex justify-between items-center mb-6">
          <span
            className="text-[14px] font-medium"
            style={{ color: 'var(--brand-text-dim)' }}
          >
            {getText('prices.tax', 'Taxes & Fees')}
          </span>
          <span
            className="text-[14px] font-medium text-right"
            style={{ color: 'var(--brand-text)' }}
          >
            {formatCurrency(fees, locale)}
          </span>
        </div>
      )}

      {/* Discounts */}
      {discounts > 0 && (
        <div className="flex justify-between items-center mb-6">
          <span
            className="text-[14px] font-medium"
            style={{ color: 'var(--brand-text-dim)' }}
          >
            {getText('prices.discount', 'Discount')}
          </span>
          <span
            className="text-[14px] font-medium text-right"
            style={{ color: 'var(--brand-aqua)' }}
          >
            −{formatCurrency(discounts, locale)}
          </span>
        </div>
      )}

      {/* Total */}
      {(accommodationTotal > 0 || activitiesTotal > 0) && (
        <div
          className="border-t pt-6"
          style={{ borderColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
        >
          <div className="flex justify-between items-center" aria-live="polite">
            <span
              className="text-[18px] font-semibold"
              style={{ color: 'var(--brand-text)' }}
            >
              {getText('prices.total', 'Total')}
            </span>
            <span
              className="text-[24px] font-bold text-right"
              style={{ color: 'var(--brand-gold)' }}
            >
              {formatCurrency(total, locale)}
            </span>
          </div>
        </div>
      )}

      {/* CTA Button */}
      {(accommodationTotal > 0 || activitiesTotal > 0) && (
        <div className="flex justify-center mt-6">
          <button
            disabled={!isFormValid}
            onClick={() => {
              const { currentStep, setCurrentStep } = useBookingStore.getState();

              if (isFormValid) {
                // If form is complete, proceed to next logical step
                if (currentStep === 'dates' && selectedRoom) {
                  setCurrentStep('contact');
                } else if (currentStep === 'accommodation') {
                  setCurrentStep('contact');
                }
              } else {
                // Navigate to next required step
                if (!bookingData.checkIn || !bookingData.checkOut) {
                  setCurrentStep('dates');
                } else if (!selectedRoom) {
                  setCurrentStep('accommodation');
                }
              }
            }}
            className={`
              max-w-sm w-full px-6 py-3 rounded-full text-[16px] font-semibold
              transition-all duration-200
              ${isFormValid
                ? 'hover:shadow-lg hover:-translate-y-0.5'
                : 'cursor-not-allowed opacity-60'
              }
            `}
            style={{
              backgroundColor: isFormValid ? 'var(--brand-gold)' : 'var(--brand-border)',
              color: isFormValid ? 'black' : 'var(--brand-text-dim)'
            }}
          >
            {isFormValid
              ? getText('prices.proceedToBook', 'Proceed to Book')
              : getText('prices.completeSelection', 'Complete Selection')
            }
          </button>
        </div>
      )}

      {/* Empty States */}
      {!bookingData.checkIn && !bookingData.checkOut && activitiesTotal === 0 && (
        <div className="text-center py-8">
          <div className="text-[32px] mb-3">📅</div>
          <p
            className="text-[15px]"
            style={{ color: 'var(--brand-text-dim)' }}
          >
            {getText('prices.selectDatesToStart', 'Select dates to see pricing')}
          </p>
        </div>
      )}

      {bookingData.checkIn && bookingData.checkOut && !selectedRoom && activitiesTotal === 0 && (
        <div className="text-center py-8">
          <div className="text-[32px] mb-3">🏠</div>
          <p
            className="text-[15px]"
            style={{ color: 'var(--brand-text-dim)' }}
          >
            {getText('prices.selectAccommodationToSeeTotal', 'Select accommodation to see total')}
          </p>
        </div>
      )}
    </div>
  );
}