'use client';

import { useI18n, type Locale } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);

    // Actualizar la URL si usa rutas dinámicas [locale]
    const segments = pathname.split('/');
    if (segments[1] === 'es' || segments[1] === 'en') {
      segments[1] = newLocale;
      router.push(segments.join('/'));
    } else {
      router.push(`/${newLocale}`);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-1 shadow-lg">
      <button
        onClick={() => handleLanguageChange('es')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          locale === 'es'
            ? 'bg-white text-slate-900 shadow-md'
            : 'text-white hover:bg-white/20'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          locale === 'en'
            ? 'bg-white text-slate-900 shadow-md'
            : 'text-white hover:bg-white/20'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
