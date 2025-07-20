'use client';

import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-1 text-sm rounded ${
          locale === 'es' 
            ? 'bg-ocean-600 text-white' 
            : 'text-gray-600 hover:text-ocean-600'
        }`}
      >
        ES
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-sm rounded ${
          locale === 'en' 
            ? 'bg-ocean-600 text-white' 
            : 'text-gray-600 hover:text-ocean-600'
        }`}
      >
        EN
      </button>
    </div>
  );
} 