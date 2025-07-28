'use client';

import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

const steps = [
  {
    id: 'dates',
    icon: '📅',
    name: 'dates',
    description: 'dates'
  },
  {
    id: 'accommodation',
    icon: '🏠',
    name: 'accommodation',
    description: 'accommodation'
  },
  {
    id: 'activities',
    icon: '🏄',
    name: 'activities',
    description: 'activities'
  },
  {
    id: 'contact',
    icon: '👤',
    name: 'contact',
    description: 'contact'
  },
  {
    id: 'confirmation',
    icon: '✅',
    name: 'confirmation',
    description: 'confirmation'
  },
  {
    id: 'payment',
    icon: '💳',
    name: 'payment',
    description: 'payment'
  }
];

export default function BookingSteps() {
  const { currentStep } = useBookingStore();
  const { t } = useI18n();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

            return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                  <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-warm-500 text-white'
                      : isCompleted
                      ? 'bg-accent-500 text-white'
                      : 'bg-warm-200 text-warm-500'
                    }`}
                  >
                  {step.icon}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isActive ? 'text-warm-600' : isCompleted ? 'text-accent-600' : 'text-warm-500'
                    }`}
                  >
                    {t(`booking.steps.${step.name}.title`)}
                  </div>
                  <div className="text-xs text-warm-400 mt-1 max-w-24">
                    {t(`booking.steps.${step.name}.description`)}
                  </div>
                </div>
                  </div>

              {index < steps.length - 1 && (
                    <div
                  className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                    isCompleted ? 'bg-accent-500' : 'bg-warm-200'
                      }`}
                    />
                  )}
                </div>
            );
          })}
      </div>
    </div>
  );
} 