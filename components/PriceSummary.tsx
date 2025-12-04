'use client';

import { useMemo } from 'react';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
  getActivityTotalPrice,
  calculateSurfPrice,
  calculateYogaPrice,
  calculatePrivateCoachingUpgrade,
} from '@/lib/prices';

// Surf program names
const SURF_PROGRAMS = {
  fundamental: {
    name: { es: 'Core Surf Program (2 sesiones de videoanalisis)', en: 'Core Surf Program (2 video analysis sessions)' },
  },
  progressionPlus: {
    name: { es: 'Intensive Surf Program (4 sesiones de videoanalisis)', en: 'Intensive Surf Program (4 video analysis sessions)' },
  },
  highPerformance: {
    name: { es: 'Elite Surf Program (5 sesiones de videoanalisis)', en: 'Elite Surf Program (5 video analysis sessions)' },
  },
} as const;

// Map surf classes to program ID
const surfClassesToProgram = (classes: number): 'fundamental' | 'progressionPlus' | 'highPerformance' => {
  if (classes <= 4) return 'fundamental';
  if (classes <= 6) return 'progressionPlus';
  return 'highPerformance';
};

// Helper function for currency formatting
const formatCurrency = (amount: number, locale: string = 'en-US'): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function PriceSummary({
  isCollapsed = false,
  showContainer = true,
  hideTitle = false,
  tone = 'default',
}: {
  isCollapsed?: boolean;
  showContainer?: boolean;
  hideTitle?: boolean;
  tone?: 'default' | 'neutral';
}) {
  const { t, locale } = useI18n();
  const {
    bookingData,
    selectedRoom,
    priceBreakdown,
    participants,
    isPrivateUpgrade,
    setCurrentStep,
  } = useBookingStore();

  // Get activity price with package info for a specific participant
  const getActivityDetailsForParticipant = (activity: any, participant: any) => {
    let price = 0;
    let packageInfo = '';

    if (activity.category === 'yoga') {
      const yogaPackage = participant.selectedYogaPackages[activity.id];
      const yogaClassCount = participant.yogaClasses[activity.id] ?? 1;
      const useDiscount = participant.yogaUsePackDiscount[activity.id] ?? false;

      if (yogaPackage) {
        price = getActivityTotalPrice('yoga', yogaPackage);
        packageInfo = yogaPackage;
      } else {
        price = calculateYogaPrice(yogaClassCount, useDiscount);
        packageInfo = `${yogaClassCount} ${yogaClassCount === 1 ? 'class' : 'classes'}`;
      }
    } else if (activity.category === 'surf') {
      const surfClasses = participant.selectedSurfClasses[activity.id];
      const classes = surfClasses !== undefined ? surfClasses : 4;
      price = calculateSurfPrice(classes);
      packageInfo = '';
    } else {
      price = activity.price || 0;
      packageInfo = '';
    }

    return { price, packageInfo };
  };

  // Default translations with fallbacks
  const getText = (key: string, fallback: string): string => {
    try {
      const translation = t(key);
      return translation === key ? fallback : translation;
    } catch {
      return fallback;
    }
  };

  // Calculate nights
  const nights =
    bookingData.checkIn && bookingData.checkOut
      ? Math.ceil(
          (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  // Format dates for display
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Build list of all activity selections grouped by participant
  const allActivitySelections = useMemo(() => {
    const selections: Array<{
      activity: any;
      participant: any;
      price: number;
      packageInfo: string;
    }> = [];

    participants.forEach((participant) => {
      participant.selectedActivities.forEach((activity: any) => {
        const details = getActivityDetailsForParticipant(activity, participant);
        selections.push({
          activity,
          participant,
          ...details,
        });
      });
    });

    return selections;
  }, [participants]);

  // Calculate totals
  const accommodationTotal =
    selectedRoom && nights > 0
      ? selectedRoom.isSharedRoom
        ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
        : selectedRoom.pricePerNight * nights
      : 0;

  const activitiesTotal = allActivitySelections.reduce((sum, selection) => sum + selection.price, 0);

  // Calculate 1:1 coaching upgrade total if selected
  const privateCoachingUpgradeTotal = useMemo(() => {
    if (!isPrivateUpgrade) return 0;

    let total = 0;
    participants.forEach((participant) => {
      participant.selectedActivities.forEach((activity: any) => {
        if (activity.category === 'surf') {
          const surfClasses = participant.selectedSurfClasses[activity.id];
          const classes = surfClasses !== undefined ? surfClasses : 4;
          total += calculatePrivateCoachingUpgrade(classes);
        }
      });
    });
    return total;
  }, [participants, isPrivateUpgrade]);

  const subtotal = accommodationTotal + activitiesTotal + privateCoachingUpgradeTotal;
  const fees = priceBreakdown?.tax || 0;
  const discounts = 0; // Placeholder for future discounts
  const total = subtotal + fees - discounts;

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border bg-white/80 backdrop-blur-md border-white/40">
        <span className="text-base font-semibold text-black">{getText('prices.total', 'Total')}</span>
        <span className="text-xl font-bold text-amber-600">{formatCurrency(total, locale)}</span>
      </div>
    );
  }

  // Get locale-aware accommodation name
  const getAccommodationName = () => {
    if (!selectedRoom) return '';

    const accommodationNames = {
      'casa-playa': locale === 'es' ? 'Casa de Playa (Cuarto Compartido)' : 'Beach House (Shared Room)',
      'casitas-privadas': locale === 'es' ? 'Casitas Privadas' : 'Private House',
      'casas-deluxe': locale === 'es' ? 'Casas Deluxe' : 'Deluxe Studio',
    };

    return accommodationNames[selectedRoom.roomTypeId as keyof typeof accommodationNames] || selectedRoom.roomTypeName;
  };

  const textMuted = tone === 'neutral' ? 'text-gray-800' : 'text-[#6d5f57]';
  const amountText = tone === 'neutral' ? 'text-gray-900' : textMuted;
  const editBtnTone =
    tone === 'neutral'
      ? 'border-gray-300 text-gray-800 hover:bg-gray-100'
      : 'border-amber-400 text-amber-700 hover:bg-amber-50';

  const content = (
    <>
      {!hideTitle && showContainer && (
        <h3 className="text-base md:text-lg font-semibold mb-3 font-heading text-black">
          {getText('prices.summary', 'Price Summary')}
        </h3>
      )}

      <ul className="space-y-2.5 mb-3">
        {/* Accommodation */}
        {selectedRoom && nights > 0 && (
          <li>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="text-sm md:text-base font-medium text-black">
                  {getAccommodationName()}
                  {bookingData.checkIn && bookingData.checkOut && bookingData.guests && (
                    <span className={`text-xs md:text-sm ml-1 font-normal ${textMuted}`}>
                      ({formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}, {bookingData.guests}{' '}
                      {bookingData.guests === 1 ? (locale === 'es' ? 'persona' : 'guest') : locale === 'es' ? 'personas' : 'guests'})
                    </span>
                  )}
                </div>
                <div className={`text-xs mt-1 ${textMuted}`}>
                  {selectedRoom.isSharedRoom
                    ? `${bookingData.guests} × ${formatCurrency(selectedRoom.pricePerNight, locale)} / night`
                    : `${nights} × ${formatCurrency(selectedRoom.pricePerNight, locale)} / night`}
                </div>
              </div>
              <div className={`text-sm md:text-base font-medium text-right ${amountText}`}>
                {formatCurrency(accommodationTotal, locale)}
              </div>
            </div>
          </li>
        )}

        {/* Activities - showing each participant's selections */}
        {allActivitySelections.map((selection, index) => {
          const { activity, participant, price, packageInfo } = selection;
          const showParticipantName = participants.length > 1;

          // For surf activities, show program name instead of generic activity name
          let displayName = activity.name;
          if (activity.category === 'surf') {
            const surfClasses = participant.selectedSurfClasses[activity.id];
            const classes = surfClasses !== undefined ? surfClasses : 4;
            const programId = surfClassesToProgram(classes);
            const program = SURF_PROGRAMS[programId];
            displayName = program.name[locale === 'en' ? 'en' : 'es'].replace(/\s*\([^)]*\)/, '');
          }

          return (
            <li key={`${participant.id}-${activity.id}-${index}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="text-sm md:text-base font-medium text-black">
                    {displayName}
                    {packageInfo && activity.category !== 'surf' && (
                      <span className="text-xs ml-2 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        {packageInfo.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                  {showParticipantName && <div className={`text-xs mt-1 ${textMuted}`}>{participant.name}</div>}
                </div>
                <div className={`text-sm md:text-base font-medium text-right ${amountText}`}>
                  {formatCurrency(price, locale)}
                </div>
              </div>
            </li>
          );
        })}

        {/* 1:1 Private Coaching Upgrade - shown as separate line if selected */}
        {isPrivateUpgrade && privateCoachingUpgradeTotal > 0 && (
          <li>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="text-sm md:text-base font-medium text-black">
                  {locale === 'es' ? 'Coaching 1:1 Privado' : '1:1 Private Coaching'}
                  <span className="text-xs ml-2 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    {locale === 'es' ? 'Mejora' : 'Upgrade'}
                  </span>
                </div>
                {participants.length > 1 && (
                  <div className={`text-xs mt-1 ${textMuted}`}>
                    {locale === 'es' ? 'Para todos los participantes' : 'For all participants'}
                  </div>
                )}
              </div>
              <div className={`text-sm md:text-base font-medium text-right ${amountText}`}>
                {formatCurrency(privateCoachingUpgradeTotal, locale)}
              </div>
            </div>
          </li>
        )}
      </ul>

      {allActivitySelections.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setCurrentStep('activities')}
            className={`text-[12px] font-medium px-3 py-1 rounded-full border bg-transparent transition-colors ${editBtnTone}`}
          >
            {getText('activities.edit', 'Edit Activities')}
          </button>
        </div>
      )}

      {(accommodationTotal > 0 || activitiesTotal > 0) && (
        <>
          {accommodationTotal > 0 && activitiesTotal > 0 && (
            <>
              <div className="h-px mb-2 bg-gray-200" />
              <div className="flex justify-between items-center mb-3">
                <span className="text-[14px] font-medium text-black">{getText('prices.subtotal', 'Subtotal')}</span>
                <span className={`text-[14px] font-medium text-right ${amountText}`}>
                  {formatCurrency(subtotal, locale)}
                </span>
              </div>
            </>
          )}

          {fees > 0 && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-[14px] font-medium text-black">{getText('prices.tax', 'Taxes & Fees')}</span>
              <span className={`text-[14px] font-medium text-right ${amountText}`}>
                {formatCurrency(fees, locale)}
              </span>
            </div>
          )}

          {discounts > 0 && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-[14px] font-medium text-black">{getText('prices.discount', 'Discount')}</span>
              <span className={`text-[14px] font-medium text-right ${amountText}`}>
                -{formatCurrency(discounts, locale)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center" aria-live="polite">
              <span className="text-[18px] font-semibold text-black">{getText('prices.total', 'Total')}</span>
              <span className="text-[24px] font-bold text-right text-amber-600">
                {formatCurrency(total, locale)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Empty States */}
      {!bookingData.checkIn && !bookingData.checkOut && activitiesTotal === 0 && (
        <div className="text-center py-8">
          <div className="text-[32px] mb-3">:)</div>
          <p className="text-[15px] text-black">{getText('prices.selectDatesToStart', 'Select dates to see pricing')}</p>
        </div>
      )}

      {bookingData.checkIn && bookingData.checkOut && !selectedRoom && activitiesTotal === 0 && (
        <div className="text-center py-8">
          <div className="text-[32px] mb-3">:)</div>
          <p className="text-[15px] text-black">
            {getText('prices.selectAccommodationToSeeTotal', 'Select accommodation to see total')}
          </p>
        </div>
      )}
    </>
  );

  if (showContainer) {
    return (
      <div
        className="rounded-2xl p-3 md:p-4 border bg-white/80 backdrop-blur-md border-white/40"
        role="complementary"
        aria-label="Booking Summary"
      >
        {content}
      </div>
    );
  }

  return (
    <div role="complementary" aria-label="Booking Summary">
      {content}
    </div>
  );
}
