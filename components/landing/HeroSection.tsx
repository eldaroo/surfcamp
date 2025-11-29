'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Volume2, VolumeX } from 'lucide-react';

export default function HeroSection() {
  const { t } = useI18n();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollToBooking = () => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-start justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/Reel 1.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Sound Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute top-24 right-4 md:top-8 md:right-8 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-300 group"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Content - Mobile: title at top, CTA at bottom */}
      <div className="relative z-10 container mx-auto px-4 text-center flex flex-col min-h-[90vh] md:min-h-0 md:h-auto justify-between md:justify-start pt-8 pb-16 md:pt-32 md:pb-16">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Main H1 - Optimized for SEO */}
          {/* Mobile: Short title */}
          <h1 className="md:hidden text-4xl font-heading font-bold text-white mb-12 drop-shadow-2xl leading-tight">
            {t('landing.hero.title')}
          </h1>

          {/* Desktop: Full SEO title */}
          <h1 className="hidden md:block text-5xl lg:text-6xl font-heading font-bold text-white mb-12 drop-shadow-2xl leading-tight">
            Santa Teresa Surf Experience en Zeneidas Surf Garden, Costa Rica
          </h1>

          {/* Desktop: Tagline and Button here */}
          <div className="hidden md:block">
            <p className="text-lg md:text-xl text-[#ece97f] mb-12 font-semibold drop-shadow-lg">
              {t('landing.hero.tagline')}
            </p>

            <div className="flex justify-center">
              <button
                onClick={scrollToBooking}
                className="px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                {t('landing.hero.bookNow')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Mobile CTA anchored to the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="md:hidden max-w-5xl mx-auto space-y-6 mt-auto"
        >
          <p className="text-lg text-[#ece97f] font-semibold drop-shadow-lg">
            {t('landing.hero.tagline')}
          </p>

          <div className="flex justify-center">
            <button
              onClick={scrollToBooking}
              className="px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {t('landing.hero.bookNow')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
