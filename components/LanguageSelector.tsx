'use client';

import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export default function LanguageSelector() {
  const { locale } = useI18n();
  const router = useRouter();

  const changeLanguage = (newLocale: 'es' | 'en') => {
    router.push(`/${newLocale}`);
  };

  return (
    <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          locale === 'es' 
            ? 'bg-ocean-600 text-white' 
            : 'text-gray-600 hover:text-ocean-600 hover:bg-gray-100'
        }`}
      >
        ES
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          locale === 'en' 
            ? 'bg-ocean-600 text-white' 
            : 'text-gray-600 hover:text-ocean-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
    </div>
  );
} 