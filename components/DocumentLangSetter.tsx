'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export default function DocumentLangSetter() {
  const { locale } = useI18n();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const lang = locale === 'en' ? 'en-US' : 'es-ES';
      document.documentElement.lang = lang;
      
      // Also set the body lang attribute for better coverage
      document.body.lang = lang;
      
      // Try to force the locale for all inputs
      const inputs = document.querySelectorAll('input[type="date"]');
      inputs.forEach((input) => {
        (input as HTMLInputElement).lang = lang;
        input.setAttribute('data-locale', lang);
      });

      // Force locale for react-datepicker elements
      const datePickers = document.querySelectorAll('.react-datepicker');
      datePickers.forEach((picker) => {
        picker.setAttribute('lang', lang);
      });

      // Force locale for react-datepicker popper
      const poppers = document.querySelectorAll('.react-datepicker-popper');
      poppers.forEach((popper) => {
        popper.setAttribute('lang', lang);
      });
    }
  }, [locale]);

  return null;
}