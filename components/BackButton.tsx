'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
}

export default function BackButton({ className = '', variant = 'default' }: BackButtonProps) {
  const { t } = useI18n();
  const { goBack, canGoBack } = useBookingStore();

  if (!canGoBack()) {
    return null;
  }

  const baseClasses = "flex items-center space-x-2 transition-all duration-200";

  const variantClasses = {
    default: "bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-gray-500",
    minimal: "text-gray-400 hover:text-yellow-400",
    floating: "fixed top-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700/90 text-white px-3 py-2 rounded-full border border-gray-600 hover:border-yellow-400"
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={goBack}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span className="font-medium">{t('common.goBack')}</span>
    </motion.button>
  );
}