'use client';

import { useMemo } from 'react';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice, calculateSurfPrice, calculateYogaPrice } from '@/lib/prices';

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

// Get activity price with package info for a specific participant
const getActivityDetailsForParticipant = (activity: any, participant: any) => {
  let price = 0;
  let packageInfo = '';
  let unitLabel = '';

  if (activity.category === 'yoga') {
    const yogaPackage = participant.selectedYogaPackages[activity.id];
    const yogaClassCount = participant.yogaClasses[activity.id] ?? 1;
    const useDiscount = participant.yogaUsePackDiscount[activity.id] ?? false;

    if (yogaPackage) {
      price = getActivityTotalPrice('yoga', yogaPackage);
      packageInfo = yogaPackage;
      // Extract number from package (e.g., "4-classes" -> "4 classes")
      const classCount = yogaPackage.match(/(\d+)/)?.[1] || '1';
      unitLabel = `${classCount} × ${formatCurrency(price / parseInt(classCount))} / class`;
    } else {
      // Calculate price based on yoga classes and discount
      price = calculateYogaPrice(yogaClassCount, useDiscount);
      packageInfo = `${yogaClassCount} ${yogaClassCount === 1 ? 'class' : 'classes'}`;
      unitLabel = `${yogaClassCount} × ${formatCurrency(price / yogaClassCount)} / class`;
    }
  } else if (activity.category === 'surf') {
    const surfClasses = participant.selectedSurfClasses[activity.id];
    // If surfClasses is not defined for this participant, default to 4
    const classes = surfClasses !== undefined ? surfClasses : 4;
    price = calculateSurfPrice(classes);
    packageInfo = `${classes} classes`;
    unitLabel = `${classes} × ${formatCurrency(calculateSurfPrice(classes) / classes)} / class`;
  } else {
    price = activity.price || 0;
    unitLabel = `1 × ${formatCurrency(price)} / activity`;
  }

  return { price, packageInfo, unitLabel };
};

export default function PriceSummary({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { t, locale } = useI18n();
  const {
    bookingData,
    selectedRoom,
    selectedActivities,
    priceBreakdown,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedSurfClasses,
    participants,
    setCurrentStep
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

  // Build list of all activity selections grouped by participant
  const allActivitySelections = useMemo(() => {
    const selections: Array<{
      activity: any;
      participant: any;
      price: number;
      packageInfo: string;
      unitLabel: string;
    }> = [];

    console.log('[PriceSummary] Building activity selections', {
      participantCount: participants.length,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        activitiesCount: p.selectedActivities.length,
        activities: p.selectedActivities.map(a => a.name),
        yogaClasses: p.yogaClasses,
        yogaUsePackDiscount: p.yogaUsePackDiscount,
        selectedYogaPackages: p.selectedYogaPackages,
      }))
    });

    participants.forEach(participant => {
      participant.selectedActivities.forEach(activity => {
        const details = getActivityDetailsForParticipant(activity, participant);
        console.log('[PriceSummary] Activity details', {
          participantName: participant.name,
          activityName: activity.name,
          category: activity.category,
          price: details.price,
          packageInfo: details.packageInfo,
        });
        selections.push({
          activity,
          participant,
          ...details
        });
      });
    });

    console.log('[PriceSummary] Total selections:', selections.length);
    return selections;
  }, [participants]);

  // Calculate totals
  const accommodationTotal = selectedRoom && nights > 0
    ? (selectedRoom.isSharedRoom
        ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
        : selectedRoom.pricePerNight * nights)
    : 0;

  const activitiesTotal = allActivitySelections.reduce((sum, selection) => {
    return sum + selection.price;
  }, 0);

  const subtotal = accommodationTotal + activitiesTotal;
  const fees = priceBreakdown?.tax || 0;
  const discounts = 0; // Placeholder for future discounts
  const total = subtotal + fees - discounts;

  // Form validation
  const isFormValid = !!(bookingData.checkIn && bookingData.checkOut && selectedRoom);

  if (isCollapsed) {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{
          backgroundColor: 'var(--brand-surface)',
          borderColor: 'var(--brand-border)'
        }}
      >
        <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-text)' }}>
          {getText('prices.total', 'Total')}
        </span>
        <span className="text-[20px] font-bold" style={{ color: 'var(--brand-gold)' }}>
          {formatCurrency(total, locale)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-3 md:p-4 border lg:sticky lg:top-6"
      style={{
        backgroundColor: 'var(--brand-surface)',
        borderColor: 'var(--brand-border)'
      }}
      role="complementary"
      aria-label="Booking Summary"
    >
      {/* PASS 2: mb-4 → mb-3, text-[18px] → text-[16px] */}
      <h3
        className="text-[16px] font-semibold mb-3 font-heading"
        style={{ color: 'var(--brand-text)' }}
      >
        {getText('prices.summary', 'Price Summary')}
      </h3>

      {/* PASS 2: space-y-3 mb-4 → space-y-2.5 mb-3 */}
      <ul className="space-y-2.5 mb-3">
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

        {/* Activities - showing each participant's selections */}
        {allActivitySelections.map((selection, index) => {
          const { activity, participant, price, packageInfo } = selection;
          const showParticipantName = participants.length > 1;

          return (
            <li key={`${participant.id}-${activity.id}-${index}`}>
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
                  {showParticipantName && (
                    <div
                      className="text-[12px] mt-1"
                      style={{ color: 'var(--brand-text-dim)' }}
                    >
                      {participant.name}
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

      {/* PASS 2: mb-4 → mb-3 */}
      {allActivitySelections.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setCurrentStep('activities')}
            className="text-[12px] font-medium px-3 py-1 rounded-full border bg-transparent hover:bg-[color-mix(in_srgb,var(--brand-gold)_10%,transparent)] transition-colors"
            style={{
              color: 'var(--brand-gold)',
              borderColor: 'var(--brand-gold)'
            }}
          >
            {getText('activities.edit', 'Edit Activities')}
          </button>
        </div>
      )}

      {/* PASS 2: mb-2.5 → mb-2, mb-4 → mb-3 */}
      {((accommodationTotal > 0) && (activitiesTotal > 0)) && (
        <>
          <div
            className="h-px mb-2"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-border) 50%, transparent)' }}
          />
          <div className="flex justify-between items-center mb-3">
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

      {/* PASS 2: mb-4 → mb-3 */}
      {fees > 0 && (
        <div className="flex justify-between items-center mb-3">
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

      {/* PASS 2: mb-4 → mb-3 */}
      {discounts > 0 && (
        <div className="flex justify-between items-center mb-3">
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

      {/* PASS 2: pt-4 → pt-3 */}
      {(accommodationTotal > 0 || activitiesTotal > 0) && (
        <div
          className="border-t pt-3"
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