'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import BackButton from './BackButton';
import PhoneSelector from './PhoneSelector';

const buildLeadGuestName = (firstName: string, lastName: string) =>
  `${firstName.trim()} ${lastName.trim()}`.trim();

export default function ContactForm() {
  const { t } = useI18n();
  const {
    bookingData,
    setBookingData,
    setCurrentStep,
    setPersonalizationName,
    personalizationName,
  } = useBookingStore();
  const [formData, setFormData] = useState({
    firstName: bookingData.contactInfo?.firstName || '',
    lastName: bookingData.contactInfo?.lastName || '',
    email: bookingData.contactInfo?.email || '',
    phone: bookingData.contactInfo?.phone || '',
    dni: bookingData.contactInfo?.dni || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const leadGuestName = buildLeadGuestName(
      bookingData.contactInfo?.firstName || '',
      bookingData.contactInfo?.lastName || ''
    );

    if (!leadGuestName) {
      if (personalizationName) {
        setPersonalizationName('');
      }
      console.log('[ContactForm] No lead guest name found. Clearing personalization name.');
      return;
    }

    if (
      !personalizationName ||
      personalizationName === leadGuestName ||
      personalizationName === leadGuestName.charAt(0)
    ) {
      console.log('[ContactForm] Syncing personalization name from booking data.', {
        firstName: bookingData.contactInfo?.firstName,
        lastName: bookingData.contactInfo?.lastName,
        leadGuestName,
        existingPersonalizationName: personalizationName,
      });
      setPersonalizationName(leadGuestName);
    }
  }, [
    bookingData.contactInfo?.firstName,
    bookingData.contactInfo?.lastName,
    personalizationName,
    setPersonalizationName,
  ]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('contact.validation.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('contact.validation.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.validation.emailInvalid');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('contact.validation.phoneRequired');
    }

    if (!formData.dni.trim()) {
      newErrors.dni = t('contact.validation.dniRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setBookingData({
        ...bookingData,
        contactInfo: formData
      });

      const leadGuestName = buildLeadGuestName(formData.firstName, formData.lastName);
      console.log('[ContactForm] Submit lead guest name computed.', {
        leadGuestName,
        formData,
      });
      setPersonalizationName(leadGuestName);

      setCurrentStep('payment');
      setTimeout(() => setIsSubmitting(false), 1000); // Simulate loading
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'firstName' || field === 'lastName') {
        const leadGuestName = buildLeadGuestName(
          field === 'firstName' ? value : updated.firstName,
          field === 'lastName' ? value : updated.lastName
        );
        console.log('[ContactForm] Lead guest name updated via input change.', {
          field,
          value,
          updated,
          leadGuestName,
        });
        setPersonalizationName(leadGuestName);
      }

      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <div className="mb-8">
          <BackButton variant="minimal" />
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 font-heading">{t('contact.title')}</h1>
          <p className="text-xl text-yellow-400 font-heading">{t('contact.subtitle')}</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-2 font-heading">Personal Information</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-300 mb-3">
                  {t('contact.firstName')}
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder={t('contact.placeholder.firstName')}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.firstName ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                  }`}
                />
                {errors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {errors.firstName}
                  </motion.p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-300 mb-3">
                  {t('contact.lastName')}
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder={t('contact.placeholder.lastName')}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.lastName ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                  }`}
                />
                {errors.lastName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {errors.lastName}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-3">
                {t('contact.email')}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('contact.placeholder.email')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  errors.email ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                }`}
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Phone */}
            <div>
              <PhoneSelector
                label={t('contact.phone')}
                value={formData.phone}
                onChange={(phone) => handleInputChange('phone', phone)}
                placeholder={t('contact.placeholder.phone')}
                error={errors.phone}
              />
            </div>

            {/* DNI */}
            <div>
              <label htmlFor="dni" className="block text-sm font-semibold text-gray-300 mb-3">
                {t('contact.dni')}
              </label>
              <input
                type="text"
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                placeholder={t('contact.placeholder.dni')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                  errors.dni ? 'border-red-500 focus:ring-red-400' : 'border-gray-600 hover:border-gray-500'
                }`}
              />
              {errors.dni && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.dni}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 shadow-lg hover:shadow-yellow-500/25'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>{t('common.continue')}</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 
