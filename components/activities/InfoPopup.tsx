'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Review {
  author: string;
  location: string;
  text: string;
}

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  rating?: string;
  reviewsText?: string;
  trustMessage?: string;
  locale: 'es' | 'en';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  anchorElement?: HTMLElement | null;
  activityName?: string;
}

const REVIEWS: Review[] = [
  {
    author: 'Catherine Cormier',
    location: 'Canada',
    text: 'The surf lessons were exactly what I needed. They changed how I think and helped me find calm in the ocean.'
  },
  {
    author: 'Taryne Evans',
    location: 'South Africa',
    text: 'Through the surf sessions I learned to push my limits, breathe, and find peace in the waves.'
  },
  {
    author: 'Marcelo',
    location: 'Argentina',
    text: 'The surf classes were incredible. What once felt impossible became real with just a few steps and great instructors.'
  },
  {
    author: 'Luján Sánchez',
    location: 'Argentina',
    text: 'Each surf session brought a feeling of connection with the sea and with myself.'
  },
  {
    author: 'Eilin Annika Orgland',
    location: 'Switzerland',
    text: 'In the waves I learned to let go, trust the ocean, and open my heart again.'
  }
];

const InfoPopup = ({
  isOpen,
  onClose,
  rating,
  reviewsText,
  trustMessage,
  locale,
  onMouseEnter,
  onMouseLeave,
  anchorElement,
  activityName
}: InfoPopupProps) => {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Create portal container if it doesn't exist
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'info-popup-portal';
      document.body.appendChild(portalRef.current);
    }

    // Prevent body scroll when popup is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Calculate position based on anchor element
  useEffect(() => {
    if (isOpen && anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const popupWidth = 384; // max-w-sm = 384px
      const popupHeight = 400; // approximate height

      // Position popup so stars are in the middle vertically
      let top = rect.top + (rect.height / 2) - (popupHeight / 2);
      let left = rect.left + (rect.width / 2) - (popupWidth / 2);

      // Ensure popup stays within viewport
      if (top < 10) {
        top = 10;
      }
      if (top + popupHeight > window.innerHeight - 10) {
        top = window.innerHeight - popupHeight - 10;
      }
      if (left < 10) {
        left = 10;
      }
      if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
      }

      setPosition({ top, left });
    }
  }, [isOpen, anchorElement]);

  // Reset carousel when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentReviewIndex(0);
      setDirection(0);
    }
  }, [isOpen]);

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentReviewIndex((prev) => {
        const next = prev + 1;
        return next >= REVIEWS.length ? 0 : next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, currentReviewIndex]);

  const handlePrevReview = () => {
    setDirection(-1);
    setCurrentReviewIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? REVIEWS.length - 1 : next;
    });
  };

  const handleNextReview = () => {
    setDirection(1);
    setCurrentReviewIndex((prev) => {
      const next = prev + 1;
      return next >= REVIEWS.length ? 0 : next;
    });
  };

  const t = {
    es: {
      close: 'Cerrar',
      rating: 'Calificación',
      reviews: 'Reseñas'
    },
    en: {
      close: 'Close',
      rating: 'Rating',
      reviews: 'Reviews'
    }
  };

  const copy = t[locale];

  const popupContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popup - Positioned relative to anchor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{
              duration: 0.25,
              type: "spring",
              stiffness: 300,
              damping: 28
            }}
            className="fixed z-[9999] w-full max-w-sm pointer-events-auto"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/98 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
                  <h3 className="text-lg font-semibold text-white font-heading">
                    {activityName || copy.rating}
                  </h3>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white active:scale-95"
                    aria-label={copy.close}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 py-6 space-y-5">
                  {/* Star Rating */}
                  {rating && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-6 w-6 fill-amber-300 text-amber-300"
                          />
                        ))}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {rating}
                        </span>
                        <span className="text-sm text-slate-400">/ 5.0</span>
                      </div>
                      {reviewsText && (
                        <p className="text-sm text-slate-400">
                          {reviewsText}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reviews Carousel */}
                  <div className="relative">
                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-5" />

                    <div className="relative overflow-hidden min-h-[140px] flex items-center">
                      <AnimatePresence initial={false} mode="wait" custom={direction}>
                        <motion.div
                          key={currentReviewIndex}
                          custom={direction}
                          initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                          transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                          }}
                          className="w-full px-2"
                        >
                          <div className="text-center space-y-3">
                            <p className="text-sm md:text-base italic leading-relaxed text-slate-200">
                              "{REVIEWS[currentReviewIndex].text}"
                            </p>
                            <div className="flex flex-col items-center gap-1">
                              <p className="text-xs font-semibold text-amber-300">
                                {REVIEWS[currentReviewIndex].author}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                {REVIEWS[currentReviewIndex].location}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation Arrows */}
                      <button
                        onClick={handlePrevReview}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-amber-300 hover:border-amber-300/50 transition-all active:scale-95"
                        aria-label="Previous review"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleNextReview}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-amber-300 hover:border-amber-300/50 transition-all active:scale-95"
                        aria-label="Next review"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      {REVIEWS.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setDirection(index > currentReviewIndex ? 1 : -1);
                            setCurrentReviewIndex(index);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentReviewIndex
                              ? 'w-6 bg-amber-300'
                              : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                          }`}
                          aria-label={`Go to review ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Trust Message */}
                  {trustMessage && (
                    <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 px-4 py-3">
                      <p className="text-center text-sm leading-relaxed text-slate-200">
                        {trustMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render using portal to ensure proper z-index stacking
  return portalRef.current ? createPortal(popupContent, portalRef.current) : null;
};

export default InfoPopup;
