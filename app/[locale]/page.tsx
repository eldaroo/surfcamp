'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useBookingStore } from '@/lib/store';
import DateSelector from '@/components/DateSelector';
import ActivitySelector from '@/components/ActivitySelector';
import BookingConfirmation from '@/components/BookingConfirmation';
import SuccessPage from '@/components/SuccessPage';

import ContactForm from '@/components/ContactForm';

export default function HomePage() {
  console.log('🏠 HomePage - Iniciando renderizado');
  
  const { t, locale } = useI18n();
  console.log('🏠 HomePage - Hook useI18n obtenido, t function:', typeof t);
  
  const { currentStep, bookingData, selectedRoom, selectedActivities, setCurrentStep, priceBreakdown } = useBookingStore();
  console.log('🏠 HomePage - Estado del store obtenido, currentStep:', currentStep);
  
  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedRoom &&
    bookingData.contactInfo;

  console.log('🏠 HomePage - isReadyForPayment:', isReadyForPayment);

  // Log de depuración para saber qué datos están presentes
  console.log('Datos para pago:', {
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    guests: bookingData.guests,
    selectedRoom,
    contactInfo: bookingData.contactInfo
  });

  const renderCurrentStep = () => {
    console.log('🏠 HomePage - Renderizando step:', currentStep);

    switch (currentStep) {
      case 'dates':
        return <DateSelector />;
      case 'activities':
        return <ActivitySelector />;
      case 'contact':
        return <ContactForm />;
      case 'success':
        return <SuccessPage />;
      default:
        return <DateSelector />;
    }
  };

  console.log('🏠 HomePage - Renderizando página principal');

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Booking Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            {/* Removed BookingSteps component */}
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full"
          >
            <motion.div
              className="organic-hover"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 