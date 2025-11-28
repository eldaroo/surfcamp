'use client';

import { I18nProvider } from '@/lib/i18n';
import WhatsAppWidget from './WhatsAppWidget';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider initialLocale="es">
      {children}
      <WhatsAppWidget />
    </I18nProvider>
  );
}
