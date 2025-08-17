'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useBookingStore } from '@/lib/store';
import BookingSteps from '@/components/BookingSteps';
import DateSelector from '@/components/DateSelector';
import AccommodationSelector from '@/components/AccommodationSelector';
import ActivitySelector from '@/components/ActivitySelector';
import BookingConfirmation from '@/components/BookingConfirmation';
import PaymentSection from '@/components/PaymentSection';
import SuccessPage from '@/components/SuccessPage';
import PriceSummary from '@/components/PriceSummary';
import ContactForm from '@/components/ContactForm';

export default function HomePage() {
  console.log('🏠 HomePage - Iniciando renderizado');
  
  const { t } = useI18n();
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
      case 'accommodation':
        return <AccommodationSelector />;
      case 'activities':
        return <ActivitySelector />;
      case 'contact':
        return <ContactForm />;
      case 'confirmation':
        return (
          <div className="card text-center p-8">
            <h2 className="text-2xl font-bold mb-4">{t('booking.steps.confirmation.title')}</h2>
            {/* Resumen visual */}
            <div className="mb-6">
              <div><b>{t('dates.checkIn')}:</b> {bookingData.checkIn && bookingData.checkOut ? `${new Date(bookingData.checkIn).toLocaleDateString('es-ES')} - ${new Date(bookingData.checkOut).toLocaleDateString('es-ES')}` : '-'}</div>
              <div><b>{t('dates.guests')}:</b> {bookingData.guests}</div>
              <div><b>{t('accommodation.title')}:</b> {selectedRoom?.roomTypeName || '-'}</div>
              <div><b>{t('activities.title')}:</b> {selectedActivities.length > 0 ? selectedActivities.map(a => a.name).join(', ') : t('activities.noActivities')}</div>
            </div>
            <button
              className="btn-primary"
              onClick={() => isReadyForPayment && setCurrentStep('payment')}
              disabled={!isReadyForPayment}
            >
              {t('common.continue')}
            </button>
            {!isReadyForPayment && (
              <div className="mt-4 text-warm-600">
                Completa todos los datos de la reserva antes de continuar.
              </div>
            )}
          </div>
        );
      case 'payment':
        return <PaymentSection />;
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
            <BookingSteps />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                className="organic-hover"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <motion.div
                className="organic-hover"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <PriceSummary />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 