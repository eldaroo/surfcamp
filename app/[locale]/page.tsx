'use client';

import { useMemo, useEffect, type ReactNode, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useBookingStore } from "@/lib/store";
import StepLoader from "@/components/StepLoader";

const StepLoaderFallback = () => <StepLoader />;

const DateSelector = dynamic(() => import("@/components/DateSelector"), {
  loading: StepLoaderFallback,
});
const AccommodationSelector = dynamic(
  () => import("@/components/AccommodationSelector"),
  { loading: StepLoaderFallback }
);
const ActivitySelector = dynamic(() => import("@/components/ActivitySelector"), {
  loading: StepLoaderFallback,
});
const ContactForm = dynamic(() => import("@/components/ContactForm"), {
  loading: StepLoaderFallback,
});
const PaymentSection = dynamic(() => import("@/components/PaymentSection"), {
  loading: StepLoaderFallback,
});
const SuccessPage = dynamic(() => import("@/components/SuccessPage"), {
  loading: StepLoaderFallback,
});

const stepComponents: Record<string, ComponentType> = {
  dates: DateSelector,
  accommodation: AccommodationSelector,
  activities: ActivitySelector,
  contact: ContactForm,
  payment: PaymentSection,
  success: SuccessPage,
};

export default function HomePage() {
  const { t, locale } = useI18n();
  const {
    currentStep,
    bookingData,
    selectedRoom,
    selectedActivities,
    setCurrentStep,
  } = useBookingStore();

  const isReadyForPayment = Boolean(
    bookingData.checkIn &&
      bookingData.checkOut &&
      bookingData.guests &&
      selectedRoom &&
      bookingData.contactInfo
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES"),
    [locale]
  );

  const dateRange = useMemo(() => {
    if (!bookingData.checkIn || !bookingData.checkOut) return "-";
    const checkIn = dateFormatter.format(new Date(bookingData.checkIn));
    const checkOut = dateFormatter.format(new Date(bookingData.checkOut));
    return `${checkIn} - ${checkOut}`;
  }, [bookingData.checkIn, bookingData.checkOut, dateFormatter]);

  const activitySummary = useMemo(() => {
    if (!selectedActivities.length) {
      return t("activities.noActivities");
    }
    return selectedActivities.map((activity) => activity.name).join(", ");
  }, [selectedActivities, t]);

  const confirmationSummary = useMemo(
    () => [
      {
        label: t("dates.checkIn"),
        value: dateRange,
      },
      {
        label: t("dates.guests"),
        value: bookingData.guests ?? "-",
      },
      {
        label: t("accommodation.title"),
        value: selectedRoom?.roomTypeName ?? "-",
      },
      {
        label: t("activities.title"),
        value: activitySummary,
      },
    ],
    [activitySummary, bookingData.guests, dateRange, selectedRoom?.roomTypeName, t]
  );

  useEffect(() => {
    const preloadChain: Record<string, ComponentType[]> = {
      dates: [AccommodationSelector],
      accommodation: [ActivitySelector],
      activities: [ContactForm],
      contact: [PaymentSection],
      payment: [SuccessPage],
    };

    preloadChain[currentStep]?.forEach((Component) => {
      const preload = (Component as unknown as { preload?: () => void }).preload;
      if (typeof preload === "function") {
        preload();
      }
    });
  }, [currentStep]);

  let content: ReactNode;

  if (currentStep === "confirmation") {
    content = (
      <div className="card p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold font-heading">
          {t("booking.steps.confirmation.title")}
        </h2>
        <div className="mb-6 space-y-2 text-sm text-slate-200">
          {confirmationSummary.map(({ label, value }) => (
            <div key={label}>
              <span className="font-semibold">{label}:</span> {value}
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() => isReadyForPayment && setCurrentStep("payment")}
          disabled={!isReadyForPayment}
        >
          {t("common.continue")}
        </button>
        {!isReadyForPayment && (
          <div className="mt-4 text-warm-600">
            {t("booking.validation.completeAllData")}
          </div>
        )}
      </div>
    );
  } else {
    const StepComponent = stepComponents[currentStep] ?? DateSelector;
    content = <StepComponent />;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full"
          >
            <motion.div
              className="organic-hover"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {content}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}