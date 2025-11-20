'use client';

import SurfProgramSelector from '@/components/activities/SurfProgramSelector';
import { I18nProvider } from '@/lib/i18n';
import { useParams } from 'next/navigation';

export default function SurfProgramsPage() {
  const params = useParams();
  const locale = (params?.locale as 'es' | 'en') || 'en';

  const handleSelectProgram = (programId: string, price: number) => {
    console.log('Program selected:', programId, price);
  };

  return (
    <I18nProvider initialLocale={locale}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-dark)' }}>
        <main className="container mx-auto px-4 pt-20 md:pt-8 pb-8">
          <div className="mx-auto max-w-7xl">
            <SurfProgramSelector onSelectProgram={handleSelectProgram} />
          </div>
        </main>
      </div>
    </I18nProvider>
  );
}
