'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2, X, ZoomIn } from 'lucide-react';

type RoomFromAPI = {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
  maxGuests: number;
  totalCapacity?: number;
  canAccommodateRequestedGuests?: boolean;
  isSharedRoom?: boolean;
};

type AccommodationCardProps = {
  room: RoomFromAPI;
  isSelected: boolean;
  isUnavailable: boolean;
  nights: number;
  guests: number;
  roomPrice: number;
  totalPrice: number;
  features: { label: string; color: 'aqua' | 'gold' | 'orange' }[];
  description: string;
  locale: 'es' | 'en';
  onSelect: () => void;
  getFeatureChipStyle: (color: 'aqua' | 'gold' | 'orange') => string;
};

const accommodationImages: Record<string, string> = {
  'casa-playa': '/assets/casa-playa.jpg',
  'casitas-privadas': '/assets/casitas-privadas.jpg',
  'casas-deluxe': '/assets/casas-deluxe.jpg',
};

// Gallery images for each accommodation type
const accommodationGalleries: Record<string, string[]> = {
  'casitas-privadas': [
    '/assets/accomodations/privadas/10337621829372707f.jpg',
    '/assets/accomodations/privadas/103376218295a6354e.jpg',
    '/assets/accomodations/privadas/103376218296bc3914.jpg',
    '/assets/accomodations/privadas/1033762182b0e5084f - copia.jpg',
    '/assets/accomodations/privadas/1033762182b5dc5787.jpg',
  ],
  'casa-playa': [
    '/assets/accomodations/shared/10337622666123bbee - copia.jpg',
    '/assets/accomodations/shared/1033762377b0ab2774 - copia.jpg',
    '/assets/accomodations/shared/10337647bc8c76985d - copia.jpg',
    '/assets/accomodations/shared/IMG_7536 - copia.JPG',
    '/assets/accomodations/shared/IMG_7560 - copia.JPG',
  ],
  'casas-deluxe': [
    '/assets/accomodations/Studio Deluxe/10337647bb1de2f9c0 - copia.jpg',
    '/assets/accomodations/Studio Deluxe/10337647bb1f31ea46 - copia.jpg',
    '/assets/accomodations/Studio Deluxe/IMG_8534 - copia.JPG',
    '/assets/accomodations/Studio Deluxe/IMG_8578 - copia.JPG',
    '/assets/accomodations/Studio Deluxe/IMG_8595 - copia.JPG',
  ],
};

const AccommodationCard = ({
  room,
  isSelected,
  isUnavailable,
  nights,
  guests,
  roomPrice,
  totalPrice,
  features,
  description,
  locale,
  onSelect,
  getFeatureChipStyle,
}: AccommodationCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const visibleFeatures = features.slice(0, 3);
  const hiddenCount = features.length - 3;

  const handleFlip = () => {
    if (!isUnavailable) {
      setIsFlipped(!isFlipped);
    }
  };

  const hasImage = accommodationImages[room.roomTypeId];
  const gallery = accommodationGalleries[room.roomTypeId] || [];

  const openLightbox = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  return (
    <>
      <div className="flip-card w-full h-[420px] md:h-[300px]" style={{ perspective: '1000px' }}>
        <motion.div
          className="flip-card-inner w-full h-full relative"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 25
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
        {/* Front Face - Image */}
        <div
          className={`flip-card-face flip-card-front absolute w-full h-full rounded-3xl overflow-hidden group/card ${
            isUnavailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
        >
          <div className="w-full h-full relative">
            {hasImage ? (
              <>
                <Image
                  src={accommodationImages[room.roomTypeId]}
                  alt={room.roomTypeName}
                  fill
                  className="object-cover transition-transform duration-300 scale-[1.3] group-hover/card:scale-[1.4]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 transition-opacity duration-300 group-hover/card:opacity-80"></div>
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover/card:bg-white/10"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover/card:bg-white/10"></div>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-8 py-6">
              <div className="text-center max-w-lg">
                <h2 className="text-[1.35rem] md:text-[2rem] leading-snug font-bold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-heading">
                  {room.roomTypeName}
                </h2>
                <div
                  className="inline-block rounded-full px-3 py-1.5 text-sm md:text-base font-semibold backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(242, 193, 78, 0.9)', color: '#1a1a1a' }}
                >
                  ${roomPrice}
                  <span className="font-medium"> / night</span>
                </div>
              </div>
            </div>

            {!isUnavailable && (
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-semibold">
                {locale === "es" ? "Toca para ver detalles" : "Tap to see details"}
              </div>
            )}

            {isUnavailable && (
              <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs md:text-sm font-semibold">
                {locale === "es" ? "No disponible" : "Unavailable"}
              </div>
            )}
          </div>
        </div>

        {/* Back Face - Details with Mini Carousel at Bottom */}
        <div
          className="flip-card-face flip-card-back absolute w-full h-full rounded-3xl cursor-pointer"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={handleFlip}
        >
          <div className="flex w-full h-full flex-col md:flex-row items-stretch rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20 overflow-hidden">
            <div className="flex flex-1 flex-col px-3 md:px-6 py-3 md:py-4 gap-2 md:gap-3 overflow-y-auto">
              <div className="flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                    <h3 className="text-lg md:text-2xl font-bold text-slate-100 font-heading">{room.roomTypeName}</h3>
                    {isSelected && (
                      <CheckCircle2 className="h-5 md:h-7 w-5 md:w-7 text-amber-300" aria-hidden="true" />
                    )}
                  </div>

                  {/* Availability + Capacity */}
                  <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                    <div
                      className="rounded-full px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-medium border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--brand-aqua) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--brand-aqua) 40%, transparent)'
                      }}
                    >
                      {room.availableRooms} {room.availableRooms === 1 ? 'available' : 'available'}
                    </div>

                    <div className="flex items-center text-slate-300 text-[10px] md:text-xs font-medium">
                      <svg className="w-3 md:w-4 h-3 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {room.maxGuests} {room.maxGuests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    {visibleFeatures.map((feature, index) => (
                      <span
                        key={index}
                        className={getFeatureChipStyle(feature.color)}
                      >
                        {feature.label}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: 'color-mix(in srgb, white 5%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--brand-border) 60%, transparent)',
                          color: 'color-mix(in srgb, white 80%, transparent)'
                        }}
                      >
                        +{hiddenCount}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs md:text-sm leading-relaxed text-slate-300">
                    {description}
                  </p>
                </div>
              </div>

              {/* Mini Photo Carousel - Bottom of left section */}
              {gallery.length > 0 && (
                <div className="mt-auto pt-2 md:pt-3 border-t border-slate-700/40">
                  <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {gallery.map((img, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        onClick={(e) => openLightbox(idx, e)}
                        whileHover={{ scale: 1.1, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-md md:rounded-lg overflow-hidden border-2 border-slate-600/60 hover:border-amber-300/80 transition-all group/thumb"
                      >
                        <Image
                          src={img}
                          alt={`${room.roomTypeName} thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Pricing & Action - Optimized for Mobile */}
            <div
              className="flex flex-col justify-center items-center gap-2 md:gap-3 border-t md:border-t-0 md:border-l border-slate-700/60 bg-slate-800/30 px-3 md:px-5 py-3 md:py-4 md:min-w-[260px] flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile: Compact Price + Button Layout */}
              <div className="w-full md:hidden">
                {/* Price Row - Horizontal on Mobile */}
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                      {nights} {nights === 1 ? (locale === 'es' ? 'noche' : 'night') : (locale === 'es' ? 'noches' : 'nights')}
                    </span>
                    <div className="text-xl font-bold text-amber-300">
                      ${totalPrice}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Per night</p>
                    <p className="text-xs text-slate-400 font-medium">${roomPrice}</p>
                  </div>
                </div>

                {/* Action Button - Full Width Mobile */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  disabled={isUnavailable}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    isSelected
                      ? "bg-slate-800/90 text-amber-200 border border-amber-300/30"
                      : "bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 text-slate-900 shadow-md shadow-amber-300/30"
                  } ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUnavailable
                    ? (locale === 'es' ? 'No disponible' : 'Unavailable')
                    : isSelected
                      ? '✓ ' + (locale === 'es' ? 'Seleccionado' : 'Selected')
                      : (locale === 'es' ? 'Seleccionar' : 'Select')
                  }
                </button>
              </div>

              {/* Desktop: Original Vertical Layout */}
              <div className="hidden md:flex md:flex-col md:items-center md:gap-3 w-full">
                {/* Stay Info */}
                <div className="text-center w-full">
                  <p className="text-sm text-slate-400 mb-1">
                    {locale === 'es' ? 'Estadía' : 'Stay'}
                  </p>
                  <p className="text-lg font-semibold text-slate-200">
                    {nights} {nights === 1 ? (locale === 'es' ? 'noche' : 'night') : (locale === 'es' ? 'noches' : 'nights')}
                  </p>
                </div>

                {/* Total Price */}
                <div className="text-center w-full py-3 px-3 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1.5">
                    Total
                  </span>
                  <div className="text-3xl font-bold text-amber-300 mb-1">
                    ${totalPrice}
                  </div>
                  <p className="text-xs text-slate-400">
                    {locale === 'es' ? 'a' : 'at'} ${roomPrice}/{locale === 'es' ? 'noche' : 'night'}
                    {room.isSharedRoom && guests > 1 && (
                      <span className="text-slate-500"> · {guests} {guests === 1 ? (locale === 'es' ? 'huésped' : 'guest') : (locale === 'es' ? 'huéspedes' : 'guests')}</span>
                    )}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  disabled={isUnavailable}
                  className={`w-full rounded-2xl px-6 py-3.5 text-base font-semibold transition ${
                    isSelected
                      ? "bg-slate-800/90 text-amber-200 hover:bg-slate-800 border border-amber-300/30"
                      : "bg-gradient-to-r from-amber-300 via-amber-300 to-amber-400 text-slate-900 shadow-lg shadow-amber-300/40 hover:from-amber-200 hover:to-amber-300"
                  } ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUnavailable
                    ? (locale === 'es' ? 'No disponible' : 'Unavailable')
                    : isSelected
                      ? (locale === 'es' ? '✓ Seleccionado' : '✓ Selected')
                      : (locale === 'es' ? 'Seleccionar habitación' : 'Select Room')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Lightbox Modal - Refined Compact View */}
      <AnimatePresence>
        {lightboxOpen && gallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-8"
            onClick={closeLightbox}
          >
            {/* Compact Container - Auto-adjusts to image */}
            <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
              {/* Close Button - Outside top-right */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 md:-top-14 md:-right-2 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm z-20 shadow-lg"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              {/* Image Counter - Outside top-left */}
              <div className="absolute -top-12 left-0 md:-top-14 md:-left-2 px-4 py-2 rounded-full bg-black/70 text-white text-xs md:text-sm font-medium backdrop-blur-md z-20 shadow-lg">
                {lightboxImageIndex + 1} / {gallery.length}
              </div>

              {/* Main Image Container with rounded corners and shadow */}
              <motion.div
                key={lightboxImageIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-slate-900/50"
              >
                <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={gallery[lightboxImageIndex]}
                    alt={`${room.roomTypeName} - Image ${lightboxImageIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
                    priority
                  />
                </div>
              </motion.div>

              {/* Navigation Arrows - Positioned relative to image container */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevLightboxImage();
                    }}
                    className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md shadow-lg"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextLightboxImage();
                    }}
                    className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md shadow-lg"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Thumbnail Strip - Below image */}
              <div className="mt-4 md:mt-6 flex justify-center">
                <div className="flex gap-2 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-md max-w-full overflow-x-auto scrollbar-hide shadow-lg">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImageIndex(idx);
                      }}
                      className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === lightboxImageIndex
                          ? 'border-amber-300 scale-105 shadow-lg shadow-amber-300/30'
                          : 'border-white/30 hover:border-white/60 hover:scale-105'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccommodationCard;
