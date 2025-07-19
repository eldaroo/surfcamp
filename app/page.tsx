'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import Header from '@/components/Header';
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
  const { currentStep, bookingData, selectedRoom, selectedActivities, setCurrentStep, priceBreakdown } = useBookingStore();
  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedRoom &&
    bookingData.contactInfo;

  // Log de depuración para saber qué datos están presentes
  console.log('Datos para pago:', {
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    guests: bookingData.guests,
    selectedRoom,
    contactInfo: bookingData.contactInfo
  });

  const renderCurrentStep = () => {
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
            <h2 className="text-2xl font-bold mb-4">Revisa tu reserva</h2>
            {/* Resumen visual */}
            <div className="mb-6">
              <div><b>Fechas:</b> {bookingData.checkIn && bookingData.checkOut ? `${new Date(bookingData.checkIn).toLocaleDateString('es-ES')} - ${new Date(bookingData.checkOut).toLocaleDateString('es-ES')}` : '-'}</div>
              <div><b>Huéspedes:</b> {bookingData.guests}</div>
              <div><b>Alojamiento:</b> {selectedRoom?.roomTypeName || '-'}</div>
              <div><b>Actividades:</b> {selectedActivities.length > 0 ? selectedActivities.map(a => a.name).join(', ') : 'Ninguna'}</div>
            </div>
            <button
              className="btn-primary"
              onClick={() => isReadyForPayment && setCurrentStep('payment')}
              disabled={!isReadyForPayment}
            >
              Continuar al pago
            </button>
            {!isReadyForPayment && (
              <div className="mt-4 text-red-600">
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
              Reserva tu Experiencia de Surf
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vive la aventura perfecta con clases de surf, yoga y baños de hielo 
              en un entorno paradisíaco. Personaliza tu estadía y reserva al instante.
            </p>
          </motion.div>

          {/* Booking Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <BookingSteps />
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-2"
            >
              {renderCurrentStep()}
            </motion.div>

            {/* Price Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-8">
                <PriceSummary />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
} 