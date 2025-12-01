'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { getAltTags } from '@/lib/altTags';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  age: number;
  country: string;
  occupation: string;
  avatar: string;
  quote: string;
  review: string;
}

export default function StoriesSlider() {
  const { t, raw, locale } = useI18n();
  const reviews = (raw<Review[]>('landing.reviews.data') || []) as Review[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const alts = getAltTags(locale as 'en' | 'es');

  // Get review alt-tag based on avatar path
  const getReviewAlt = (avatar: string): string => {
    const avatarMap: { [key: string]: string } = {
      'lujan': alts.reviews.lujan,
      'catherine': alts.reviews.catherine,
      'taylor': alts.reviews.taylor,
      'marcelo': alts.reviews.marcelo,
      'eilin': alts.reviews.eilin,
    };

    // Extract name from avatar path (e.g., '/assets/reviews/review-catherine.jpg' -> 'catherine')
    const match = avatar.match(/review[s]?-(\w+)\./i);
    const key = match?.[1]?.toLowerCase();

    return key && avatarMap[key] ? avatarMap[key] : `${currentReview.name} - Santa Teresa testimonial`;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentReview = reviews[currentIndex];

  return (
    <section className="relative bg-[#163237] overflow-hidden py-12 md:py-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/assets/reviews/oceano-atlantico.jpeg)',
            backgroundColor: '#163237',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {t('landing.reviews.title')}
          </h2>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto">
            {t('landing.reviews.subtitle')}
          </p>
        </motion.div>

        {/* Reviews Carousel */}
        <div className="relative max-w-4xl mx-auto min-h-[400px] md:min-h-[450px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
                {/* Avatar */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#ece97f] shadow-xl bg-gradient-to-br from-[#163237] to-[#2a4f57] flex items-center justify-center">
                      <img
                        src={currentReview.avatar}
                        alt={getReviewAlt(currentReview.avatar)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show initials instead
                          e.currentTarget.style.display = 'none';
                          const initialsDiv = e.currentTarget.nextElementSibling;
                          if (initialsDiv) {
                            (initialsDiv as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center text-3xl md:text-4xl font-bold text-[#ece97f]">
                        {currentReview.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote Highlight */}
                <div className="text-center mb-6">
                  <p className="text-xl md:text-2xl font-semibold text-[#ece97f] leading-relaxed">
                    {currentReview.quote}
                  </p>
                </div>

                {/* Full Review */}
                <div className="text-center mb-8">
                  <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
                    {currentReview.review}
                  </p>
                </div>

                {/* Reviewer Details */}
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {currentReview.name}
                  </h3>
                  <p className="text-slate-300 text-sm md:text-base">
                    {currentReview.age} {t('landing.reviews.years')} • {currentReview.country} • {currentReview.occupation}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-white/20"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-white/20"
            aria-label="Next review"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-3 mt-8 md:mt-10">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-2.5 h-1 bg-[#ece97f] rounded-full'
                  : 'w-1.5 h-1.5 bg-white/30 rounded-full hover:bg-white/50'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
