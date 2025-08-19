'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBookingStore } from '@/lib/store';
import { motion } from 'framer-motion';
import ActivitySelector from '@/components/ActivitySelector';
import DateSelector from '@/components/DateSelector';
import AccommodationSelector from '@/components/AccommodationSelector';
import ContactForm from '@/components/ContactForm';
import PaymentSection from '@/components/PaymentSection';
import SuccessPage from '@/components/SuccessPage';

import MotionWrapper from '@/components/MotionWrapper';

export default function HomePage() {
  
  const { t } = useI18n();
  
  const { currentStep, bookingData, selectedRoom, selectedActivities, setCurrentStep, priceBreakdown } = useBookingStore();
  
  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedRoom &&
    selectedActivities.length > 0 &&
    bookingData.contactInfo;



  const renderCurrentStep = () => {
    
    switch (currentStep) {
      case 'activities':
        return <ActivitySelector />;
      case 'dates':
        return <DateSelector />;
      case 'accommodation':
        return <AccommodationSelector />;
      case 'contact':
        return <ContactForm />;
      case 'payment':
        return <PaymentSection />;
      case 'success':
        return <SuccessPage />;
      default:
        return <ActivitySelector />;
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">


          {/* Main Content */}
          <MotionWrapper
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full"
          >
            <MotionWrapper
              className="organic-hover"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </MotionWrapper>
          </MotionWrapper>
        </div>
      </main>
    </div>
  );
} 