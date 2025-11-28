'use client';

import { I18nProvider } from '@/lib/i18n';
<<<<<<< HEAD
=======
import WhatsAppWidget from './WhatsAppWidget';
>>>>>>> feature/nueva-feature-clean

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider initialLocale="es">
      {children}
<<<<<<< HEAD
=======
      <WhatsAppWidget />
>>>>>>> feature/nueva-feature-clean
    </I18nProvider>
  );
}
