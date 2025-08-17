'use client';

import { useEffect, useRef } from 'react';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export const steps = [
  {
    id: 'activities',
    icon: '🏄',
    name: 'activities',
    description: 'activities'
  },
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
    id: 'contact',
    icon: '👤',
    name: 'contact',
    description: 'contact'
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Centrar el paso activo en móvil
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Delay para asegurar que el DOM esté completamente renderizado
    const timeoutId = setTimeout(() => {
      const activeStep = container.querySelector(`[data-step="${currentStep}"]`) as HTMLElement;
      if (activeStep && window.innerWidth <= 768) {
        const containerWidth = container.offsetWidth;
        const stepLeft = activeStep.offsetLeft;
        const stepWidth = activeStep.offsetWidth;
        const scrollLeft = stepLeft - (containerWidth / 2) + (stepWidth / 2);
        
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }, 100); // Pequeño delay para asegurar renderizado

    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  // También centrar cuando cambie el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const activeStep = container.querySelector(`[data-step="${currentStep}"]`) as HTMLElement;
      if (activeStep && window.innerWidth <= 768) {
        const containerWidth = container.offsetWidth;
        const stepLeft = activeStep.offsetLeft;
        const stepWidth = activeStep.offsetWidth;
        const scrollLeft = stepLeft - (containerWidth / 2) + (stepWidth / 2);
        
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  return (
    <div className="mb-8">
      <div ref={containerRef} className="flex items-center overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-full">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

            return (
              <div 
                key={step.id} 
                className="flex items-center flex-shrink-0"
                data-step={step.id}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                      isActive
                        ? 'selected-gold text-white'
                        : isCompleted
                        ? 'bg-accent-200 text-white shadow-lg'
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
                      isCompleted ? 'bg-accent-200' : 'bg-warm-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 