'use client';

import { motion } from 'framer-motion';
import { Calendar, Home, Activity, CreditCard, Check, Users } from 'lucide-react';
import { useBookingStore } from '@/lib/store';

const steps = [
  {
    id: 'dates',
    name: 'Fechas',
    description: 'Selecciona fechas y huéspedes',
    icon: Calendar,
  },
  {
    id: 'accommodation',
    name: 'Alojamiento',
    description: 'Elige tu habitación',
    icon: Home,
  },
  {
    id: 'activities',
    name: 'Actividades',
    description: 'Personaliza tu experiencia',
    icon: Activity,
  },
  {
    id: 'contact',
    name: 'Contacto',
    description: 'Tus datos personales',
    icon: Users,
  },
  {
    id: 'confirmation',
    name: 'Confirmación',
    description: 'Revisa tu reserva',
    icon: Check,
  },
  {
    id: 'payment',
    name: 'Pago',
    description: 'Completa tu reserva',
    icon: CreditCard,
  },
];

export default function BookingSteps() {
  const { currentStep } = useBookingStore();

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const isCompleted = stepIdx < currentStepIndex;
            const isCurrent = stepIdx === currentStepIndex;
            const Icon = step.icon;

            return (
              <li key={step.id} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-ocean-600 border-ocean-600 text-white'
                        : isCurrent
                        ? 'border-ocean-600 text-ocean-600 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Connector Line */}
                  {stepIdx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        stepIdx < currentStepIndex
                          ? 'bg-ocean-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stepIdx * 0.1 }}
                  className="mt-3 text-center"
                >
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-ocean-600' : 'text-gray-600'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {step.description}
                  </p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
} 