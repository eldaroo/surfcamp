'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Volume2, VolumeX } from 'lucide-react';

export default function HeroSection() {
  const { t } = useI18n();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroTitle = t('landing.hero.title');
  const [primaryHeroTitle, brandHeroTitleRaw] = (heroTitle ?? '').split('\n');
  const brandHeroTitle = brandHeroTitleRaw?.trim();
  const mainHeroTitle = primaryHeroTitle?.trim() || heroTitle;
  const [showMobileContent, setShowMobileContent] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setShowMobileContent(newMuted);
      } else {
        setShowMobileContent(true);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 768;

    if (!isMobile || isMuted) {
      setShowMobileContent(true);
      return;
    }

    let hideTimeout = window.setTimeout(() => setShowMobileContent(false), 2000);

    const handleScroll = () => {
      setShowMobileContent(true);
      clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => setShowMobileContent(false), 2000);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(hideTimeout);
    };
  }, [isMuted]);

  const mobileVisibilityClasses = showMobileContent
    ? 'opacity-100 translate-y-0 pointer-events-auto'
    : 'opacity-0 translate-y-3 pointer-events-none';

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

      {/* Sound Toggle Button - Desktop */}
      <button
        onClick={toggleMute}
        className="hidden md:flex absolute top-8 left-8 z-20 w-12 h-12 rounded-full bg-black/40 border border-white/40 shadow-2xl backdrop-blur-md hover:bg-black/60 items-center justify-center transition-all duration-300 group"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Sound Toggle Button - Mobile */}
      <button
        onClick={toggleMute}
        className={`md:hidden absolute top-6 left-4 z-20 w-14 h-14 rounded-full bg-[rgba(22,50,55,0.85)] border border-white/60 shadow-2xl backdrop-blur-md hover:bg-[rgba(22,50,55,0.95)] flex items-center justify-center transition-all duration-300 ${mobileVisibilityClasses}`}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Content - Mobile: title at top, CTA at bottom */}
      <div className="relative z-10 container mx-auto px-4 text-center flex flex-col min-h-[90vh] md:min-h-0 md:h-auto justify-end pt-8 pb-16 md:pt-32 md:pb-16">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto mt-auto"
        >
          {/* Main H1 - Optimized for SEO */}
          {/* Mobile: Short title */}
            <div className={`md:hidden transition-all duration-500 ${mobileVisibilityClasses}`}>
              <h1
                className="text-4xl font-heading font-bold text-white leading-tight"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
              >
                {mainHeroTitle}
              </h1>
              {brandHeroTitle && (
                <p className="text-lg font-semibold text-[#ece97f] tracking-[0.15em] uppercase mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {brandHeroTitle}
                </p>
              )}
           </div>

      {/* Desktop: Full SEO title */}
      <h1
        className="hidden md:block text-5xl lg:text-6xl font-heading font-bold text-white mb-12 leading-[1.6] lg:leading-[3.2rem]"
        style={{ textShadow: '0 6px 35px rgba(0,0,0,0.65)' }}
      >
        {mainHeroTitle}
        {brandHeroTitle && (
          <span className="block text-base font-bold text-[#ece97f] tracking-[0.3em] mt-2">
            {brandHeroTitle}
          </span>
        )}
      </h1>

        </motion.div>
      </div>
    </section>
  );
}
