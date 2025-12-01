'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { getAltTags } from '@/lib/altTags';
import { ChevronLeft, ChevronRight, Users, Home, Sparkles } from 'lucide-react';

const accommodations = [
  {
    id: 'casa-playa',
    images: [
      '/assets/accomodations/shared/dorm-zeneidas-surf-g.jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (1).jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (2).jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (3).jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (4).jpg',
      '/assets/accomodations/shared/dorm-zeneidas-surf-g (5).jpg',
    ],
    capacity: '8',
    icon: Users,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'casitas-privadas',
    images: [
      '/assets/accomodations/privadas/private-zeneidas-sur.jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (1).jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (2).jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (3).jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (4).jpg',
      '/assets/accomodations/privadas/private-zeneidas-sur (5).jpg',
    ],
    capacity: '2',
    icon: Home,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'casas-deluxe',
    images: [
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf.jpg',
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (1).jpg',
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (2).jpg',
      '/assets/accomodations/Studio Deluxe/IMG_8534.jpg',
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (3).jpeg',
      '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (4).jpeg',
    ],
    capacity: '2',
    icon: Sparkles,
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
];

export default function AccommodationsShowcase() {
  const { t, locale } = useI18n();
  const alts = getAltTags(locale as 'en' | 'es');
  const [currentImages, setCurrentImages] = useState<{ [key: string]: number }>({
    'casa-playa': 0,
    'casitas-privadas': 0,
    'casas-deluxe': 0,
  });
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Get alt-tag based on accommodation type and image index
  const getAccommodationAlt = (id: string, index: number): string => {
    const altMap: { [key: string]: string[] } = {
      'casa-playa': [
        alts.shared.dorm,
        alts.shared.dorm1,
        alts.shared.dorm2,
        alts.shared.dorm3,
        alts.shared.dorm4,
        alts.shared.dorm5,
      ],
      'casitas-privadas': [
        alts.private.main,
        alts.private.interior1,
        alts.private.interior2,
        alts.private.interior3,
        alts.private.interior4,
        alts.private.interior5,
      ],
      'casas-deluxe': [
        alts.deluxe.interior1,
        alts.deluxe.bathroom,
        alts.deluxe.kitchen,
        alts.deluxe.luxury,
        alts.deluxe.main,
        alts.deluxe.exterior,
      ],
    };
    return altMap[id]?.[index] || `${t(`accommodation.roomTypes.${id}.name`)} - Santa Teresa`;
  };

  const nextImage = (id: string, totalImages: number) => {
    setCurrentImages((prev) => ({
      ...prev,
      [id]: (prev[id] + 1) % totalImages,
    }));
  };

  const prevImage = (id: string, totalImages: number) => {
    setCurrentImages((prev) => ({
      ...prev,
      [id]: (prev[id] - 1 + totalImages) % totalImages,
    }));
  };

  const openModal = (id: string, imageIndex: number) => {
    setModalOpen(id);
    setModalImageIndex(imageIndex);
  };

  const closeModal = () => {
    setModalOpen(null);
  };

  const nextModalImage = () => {
    if (modalOpen) {
      const accommodation = accommodations.find((acc) => acc.id === modalOpen);
      if (accommodation) {
        setModalImageIndex((prev) => (prev + 1) % accommodation.images.length);
      }
    }
  };

  const prevModalImage = () => {
    if (modalOpen) {
      const accommodation = accommodations.find((acc) => acc.id === modalOpen);
      if (accommodation) {
        setModalImageIndex(
          (prev) => (prev - 1 + accommodation.images.length) % accommodation.images.length
        );
      }
    }
  };

  return (
    <section className="py-20 px-4 overflow-hidden bg-[#163237]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {t('landing.accommodationShowcase.title')}
          </h2>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto">
            {t('landing.accommodationShowcase.subtitle')}
          </p>
        </motion.div>

        {/* Accommodations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {accommodations.map((accommodation, index) => {
            const Icon = accommodation.icon;
            const currentImageIndex = currentImages[accommodation.id];
            const roomType = t(`accommodation.roomTypes.${accommodation.id}.name`);
            const description = t(
              `accommodation.roomTypes.${accommodation.id}.description`
            );
            const features = t(
              `accommodation.roomTypes.${accommodation.id}.features`
            ) as unknown as string[];

            return (
              <motion.div
                key={accommodation.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative group bg-gradient-to-br ${accommodation.color} backdrop-blur-sm rounded-2xl overflow-hidden border ${accommodation.borderColor} hover:shadow-2xl transition-all duration-500`}
              >
                {/* Image Carousel */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={accommodation.images[currentImageIndex]}
                      alt={getAccommodationAlt(accommodation.id, currentImageIndex)}
                      className="w-full h-full object-cover cursor-pointer"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      onClick={() => openModal(accommodation.id, currentImageIndex)}
                    />
                  </AnimatePresence>

                  {/* Image Navigation */}
                  {accommodation.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          prevImage(accommodation.id, accommodation.images.length)
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          nextImage(accommodation.id, accommodation.images.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {accommodation.images.map((_, imgIndex) => (
                          <button
                            key={imgIndex}
                            onClick={() =>
                              setCurrentImages((prev) => ({
                                ...prev,
                                [accommodation.id]: imgIndex,
                              }))
                            }
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              imgIndex === currentImageIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to image ${imgIndex + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Capacity Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-900">
                      {accommodation.capacity} {t('accommodation.guestsPlural')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-slate-900/50 backdrop-blur-sm min-h-[240px] flex flex-col">
                  <h3 className="text-2xl font-heading font-bold text-white mb-3">
                    {roomType}
                  </h3>
                  <p className="text-slate-200 mb-4 leading-relaxed flex-grow">
                    {description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(features) &&
                      features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white border border-white/20"
                        >
                          {feature}
                        </span>
                      ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Image Modal */}
        <AnimatePresence>
          {modalOpen && (() => {
            const selectedAccommodation = accommodations.find((acc) => acc.id === modalOpen);
            if (!selectedAccommodation) return null;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
                onClick={closeModal}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="relative w-full max-w-6xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={modalImageIndex}
                        src={selectedAccommodation.images[modalImageIndex]}
                        alt={getAccommodationAlt(selectedAccommodation.id, modalImageIndex)}
                        className="w-full h-full object-contain"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {selectedAccommodation.images.length > 1 && (
                      <>
                        <button
                          onClick={prevModalImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full transition-all duration-300 z-10"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextModalImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full transition-all duration-300 z-10"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white text-sm font-semibold">
                        {modalImageIndex + 1} / {selectedAccommodation.images.length}
                      </span>
                    </div>
                  </div>

                  {/* Image Indicators */}
                  <div className="flex justify-center gap-2 mt-6">
                    {selectedAccommodation.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setModalImageIndex(index)}
                        className={`transition-all duration-300 ${
                          index === modalImageIndex
                            ? 'w-2.5 h-1 bg-white rounded-full'
                            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75 rounded-full'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Title */}
                  <div className="mt-4 text-center">
                    <h3 className="text-2xl font-heading font-bold text-white">
                      {t(`accommodation.roomTypes.${selectedAccommodation.id}.name`)}
                    </h3>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </section>
  );
}
