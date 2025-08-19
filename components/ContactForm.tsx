'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

export default function ContactForm() {
  const { t } = useI18n();
  const { bookingData, setBookingData, setCurrentStep } = useBookingStore();
  const [formData, setFormData] = useState({
    firstName: bookingData.contactInfo?.firstName || '',
    lastName: bookingData.contactInfo?.lastName || '',
    email: bookingData.contactInfo?.email || '',
    phone: bookingData.contactInfo?.phone || '',
    dni: bookingData.contactInfo?.dni || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setCurrentStep('payment');
      setTimeout(() => setIsSubmitting(false), 1000); // Simulate loading
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-4"
    >
              <div className="mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">{t('contact.title')}</h2>
          <p className="text-yellow-300">{t('contact.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
              {t('contact.firstName')}
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`input-field ${
                errors.firstName ? 'border-warm-400' : 'border-warm-300'
              }`}

            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-300">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
              {t('contact.lastName')}
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`input-field ${
                errors.lastName ? 'border-warm-400' : 'border-warm-300'
              }`}

            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-300">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              {t('contact.email')}
            </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`input-field ${
              errors.email ? 'border-warm-400' : 'border-warm-300'
            }`}
            
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-300">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">
              {t('contact.phone')}
            </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`input-field ${
              errors.phone ? 'border-warm-400' : 'border-warm-300'
            }`}
            
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-300">{errors.phone}</p>
          )}
        </div>

        {/* DNI */}
        <div>
                      <label htmlFor="dni" className="block text-sm font-medium text-white mb-1">
              {t('contact.dni')}
            </label>
          <input
            type="text"
            id="dni"
            value={formData.dni}
            onChange={(e) => handleInputChange('dni', e.target.value)}
            className={`input-field ${
              errors.dni ? 'border-warm-400' : 'border-warm-300'
            }`}

          />
          {errors.dni && (
            <p className="mt-1 text-sm text-red-300">{errors.dni}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-32"
          >
            {isSubmitting ? t('common.loading') : t('common.continue')}
          </button>
        </div>
      </form>
    </motion.div>
  );
} 