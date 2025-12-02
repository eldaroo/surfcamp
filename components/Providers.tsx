'use client';

import { I18nProvider, Locale } from '@/lib/i18n';
import WhatsAppWidget from './WhatsAppWidget';

interface ProvidersProps {
  children: React.ReactNode;
  locale?: Locale;
}

export default function Providers({ children, locale = 'en' }: ProvidersProps) {
  return (
    <I18nProvider initialLocale={locale}>
      {children}
      <WhatsAppWidget />
    </I18nProvider>
  );
}
