'use client';

import { I18nProvider } from '@/lib/i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider initialLocale="es">
      {children}
    </I18nProvider>
  );
}
