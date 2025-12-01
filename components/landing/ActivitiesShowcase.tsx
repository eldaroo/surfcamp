'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const activities = [
  {
    id: 1,
    key: 'surfProgram',
    video: '/assets/Reel 1.mp4',
    icon: '🏄‍♂️',
  },
  {
    id: 2,
    key: 'breathwork',
    video: '/assets/videos/Videos%20de%20Actividades/Respiraciones.mp4',
    icon: '🌬️',
  },
  {
    id: 3,
    key: 'soundHealing',
    video: '/assets/videos/Videos%20de%20Actividades/Kirtan%202.mp4',
    icon: '🎵',
  },
  {
    id: 4,
    key: 'creativeArts',
    video: '/assets/videos/Videos%20de%20Actividades/Ceramica.mp4',
    icon: '🎨',
  },
];

export default function ActivitiesShowcase() {
  const { t } = useI18n();
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileActivities = useMemo(() => {
    const reordered = [...activities];
    const surfIndex = reordered.findIndex((activity) => activity.key === 'surfProgram');

    if (surfIndex >= 0) {
      const [surfActivity] = reordered.splice(surfIndex, 1);
      reordered.push(surfActivity);
    }

    return reordered;
  }, []);

  const openVideo = (id: number) => {
    setActiveVideo(id);
  };

  const closeVideo = () => {
    setActiveVideo(null);
  };

  const nextSlide = () => {
    const totalSlides = mobileActivities.length || 1;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    const totalSlides = mobileActivities.length || 1;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Hero Title - Only Desktop */}
        <div className="hidden lg:block text-center mb-5 xl:mb-6 2xl:mb-8 pt-1 xl:pt-2 2xl:pt-4">
          <h1 className="text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-heading font-bold text-gray-900 mb-5 xl:mb-6 2xl:mb-8 leading-[3.8] xl:leading-[3.2rem] 2xl:leading-[4.2rem] whitespace-pre-line">
            {t('landing.hero.title')}
          </h1>
          <p className="text-base lg:text-base xl:text-lg 2xl:text-xl text-[#997146] mb-6 xl:mb-8 2xl:mb-12 font-semibold max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
        </div>

        {/* Section Header - Only Mobile */}
        <div className="text-center mb-12 lg:hidden">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('landing.activitiesShowcase.title')}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {t('landing.activitiesShowcase.subtitle')}
          </p>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden max-w-sm mx-auto">
          <div className="relative">
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                  onClick={() => mobileActivities[currentSlide] && openVideo(mobileActivities[currentSlide].id)}
                >
                  {/* Video */}
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    {mobileActivities[currentSlide] && (
                      <source src={mobileActivities[currentSlide].video} type="video/mp4" />
                    )}
                  </video>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold">
                        {mobileActivities[currentSlide] &&
                          t(`landing.activitiesShowcase.${mobileActivities[currentSlide].key}.title`)}
                      </h3>
                    </div>
                    <p className="text-base text-gray-200 leading-snug line-clamp-2">
                      {mobileActivities[currentSlide] &&
                        t(`landing.activitiesShowcase.${mobileActivities[currentSlide].key}.description`)}
                    </p>
                  </div>

                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
                aria-label="Previous activity"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
                aria-label="Next activity"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {mobileActivities.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-1.5 h-0.5 bg-[#163237] rounded-full'
                      : 'w-1 h-1 bg-gray-300 rounded-full hover:bg-gray-400'
                  }`}
                  aria-label={`Go to activity ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6 max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onClick={() => openVideo(activity.id)}
            >
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg">
                {/* Video */}
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={activity.video} type="video/mp4" />
                </video>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold">
                      {t(`landing.activitiesShowcase.${activity.key}.title`)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-200 leading-snug line-clamp-2">
                    {t(`landing.activitiesShowcase.${activity.key}.description`)}
                  </p>
                </div>

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Click to Play Label */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-xs font-semibold">
                    {t('landing.activitiesShowcase.clickToPlay')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video Modal */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
              onClick={closeVideo}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl aspect-video"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={closeVideo}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
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

                {/* Video Player with Sound */}
                <video
                  key={activeVideo}
                  autoPlay
                  controls
                  loop
                  className="w-full h-full rounded-lg"
                >
                  <source
                    src={activities.find((a) => a.id === activeVideo)?.video}
                    type="video/mp4"
                  />
                </video>

                {/* Video Title */}
                <div className="absolute -bottom-12 left-0 text-white">
                  <h3 className="text-2xl font-bold">
                    {t(`landing.activitiesShowcase.${activities.find((a) => a.id === activeVideo)?.key}.title`)}
                  </h3>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
