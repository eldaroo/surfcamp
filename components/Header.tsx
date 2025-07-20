'use client';

import { motion } from 'framer-motion';
import { Waves, Sun, Mountain } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const { t } = useI18n();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-surf-gradient rounded-full flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-sand-400 rounded-full flex items-center justify-center">
                <Sun className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">{t('header.title')}</h1>
              <p className="text-sm text-gray-600">{t('header.poweredBy')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              {t('header.nav.home')}
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              {t('header.nav.activities')}
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              {t('header.nav.accommodation')}
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              {t('header.nav.contact')}
            </a>
          </nav>

          {/* Contact Info and Language Selector */}
          <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Mountain className="w-4 h-4" />
              <span>{t('header.location')}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <span>{t('header.phone')}</span>
            <div className="h-4 w-px bg-gray-300"></div>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </motion.header>
  );
} 