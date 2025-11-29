'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2, X, ZoomIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { getAltTags } from '@/lib/altTags';

type RoomFromAPI = {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
  maxGuests: number;
  totalCapacity?: number;
  canAccommodateRequestedGuests?: boolean;
  isSharedRoom?: boolean;
  roomsNeeded?: number;
  requiresMultipleRooms?: boolean;
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
  description: string | { desktop: string; mobile: string };
  locale: 'es' | 'en';
  onSelect: () => void;
  getFeatureChipStyle: (color: 'aqua' | 'gold' | 'orange') => string;
};

const accommodationImages: Record<string, string> = {
  'casa-playa': '/assets/casa-playa.jpg',
  'casitas-privadas': '/assets/casitas-privadas.jpg',
  'casas-deluxe': '/assets/casas-deluxe.JPG',
};

// Gallery images for each accommodation type
const accommodationGalleries: Record<string, string[]> = {
  'casitas-privadas': [
    '/assets/accomodations/privadas/private-zeneidas-sur.jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (1).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (2).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (3).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (4).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (5).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (6).jpg',
    '/assets/accomodations/privadas/private-zeneidas-sur (7).jpg',
  ],
  'casa-playa': [
    '/assets/accomodations/shared/dorm-zeneidas-surf-g.jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (1).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (2).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (3).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (4).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (5).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (6).jpg',
    '/assets/accomodations/shared/dorm-zeneidas-surf-g (7).jpg',
    '/assets/accomodations/shared/10337622666123bbee.jpg',
  ],
  'casas-deluxe': [
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf.jpg',
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (1).jpg',
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (2).jpg',
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (3).jpeg',
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (4).jpeg',
    '/assets/accomodations/Studio Deluxe/deluxe-zeneidas-surf (5).jpeg',
    '/assets/accomodations/Studio Deluxe/IMG_8534.jpg',
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
  console.log('[ACCOMMODATION CARD] Rendering, lightboxOpen:', useState(false)[0]);
  const { t } = useI18n();
  const alts = getAltTags(locale);

  // Get main image alt-tag based on room type
  const getMainImageAlt = (roomTypeId: string): string => {
    const mainAltMap: { [key: string]: string } = {
      'casa-playa': alts.shared.main,
      'casitas-privadas': alts.private.main,
      'casas-deluxe': alts.deluxe.main,
    };
    return mainAltMap[roomTypeId] || room.roomTypeName;
  };

  // Get gallery alt-tag based on room type and image index
  const getGalleryAlt = (roomTypeId: string, index: number): string => {
    const altMap: { [key: string]: string[] } = {
      'casa-playa': [
        alts.shared.dorm,
        alts.shared.dorm1,
        alts.shared.dorm2,
        alts.shared.dorm3,
        alts.shared.dorm4,
        alts.shared.dorm5,
        alts.shared.dorm6,
        alts.shared.dorm7,
        alts.shared.beachView,
      ],
      'casitas-privadas': [
        alts.private.cabin2,
        alts.private.interior1,
        alts.private.interior2,
        alts.private.interior3,
        alts.private.interior4,
        alts.private.interior5,
        alts.private.interior6,
        alts.private.interior7,
      ],
      'casas-deluxe': [
        alts.deluxe.interior1,
        alts.deluxe.bathroom,
        alts.deluxe.kitchen,
        alts.deluxe.main,
        alts.deluxe.exterior,
        alts.deluxe.main,
        alts.deluxe.luxury,
      ],
    };
    return altMap[roomTypeId]?.[index] || room.roomTypeName;
  };

  const [isFlipped, setIsFlipped] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const lightboxWrapperRef = useRef<HTMLDivElement | null>(null);
  const lightboxOverlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextFlipRef = useRef(false);
  const [lightboxDimensions, setLightboxDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const visibleFeatures = features.slice(0, 3);
  const hiddenCount = features.length - 3;

  console.log('[ACCOMMODATION CARD] State:', {
    isFlipped,
    lightboxOpen,
    lightboxImageIndex,
    lightboxDimensions,
    isClient
  });

  const handleFlip = () => {
    if (ignoreNextFlipRef.current) {
      ignoreNextFlipRef.current = false;
      return;
    }
    if (!isUnavailable) {
      setIsFlipped(!isFlipped);
    }
  };

  const hasImage = accommodationImages[room.roomTypeId];
  const gallery = accommodationGalleries[room.roomTypeId] || [];

  const openLightbox = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[LIGHTBOX] Opening lightbox at index:', index);
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    console.log('[LIGHTBOX] Closing lightbox');
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    console.log('[LIGHTBOX] Next image');
    setLightboxImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevLightboxImage = () => {
    console.log('[LIGHTBOX] Previous image');
    setLightboxImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('[LIGHTBOX EFFECT] Running, lightboxOpen:', lightboxOpen);
    if (!lightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPointerEvents = document.body.style.pointerEvents;

    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none'; // Disable pointer events on body
    console.log('[LIGHTBOX EFFECT] Disabled pointer-events on body');

    const aspectRatio = 16 / 10;

    const computeDimensions = () => {
      console.log('[LIGHTBOX] Computing dimensions');
      const maxWidth = Math.min(window.innerWidth - 64, 1280);
      const maxHeight = window.innerHeight - 120;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      setLightboxDimensions((prev) => {
        if (prev && prev.width === roundedWidth && prev.height === roundedHeight) {
          console.log('[LIGHTBOX] Dimensions unchanged:', prev);
          return prev;
        }
        console.log('[LIGHTBOX] Setting new dimensions:', { width: roundedWidth, height: roundedHeight });
        return { width: roundedWidth, height: roundedHeight };
      });
    };

    // Add global mouse move listener to detect hover issues
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (lightboxOverlayRef.current && !lightboxOverlayRef.current.contains(target)) {
        console.log('[LIGHTBOX HOVER ISSUE] Mouse over element outside lightbox:', {
          tagName: target.tagName,
          className: target.className,
          id: target.id
        });
      }
    };

    computeDimensions();
    window.addEventListener('resize', computeDimensions);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      console.log('[LIGHTBOX EFFECT] Cleanup - Restoring pointer-events on body');
      document.body.style.overflow = previousOverflow;
      document.body.style.pointerEvents = previousPointerEvents;
      window.removeEventListener('resize', computeDimensions);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    console.log('[CLICK OUTSIDE EFFECT] Running, isFlipped:', isFlipped, 'lightboxOpen:', lightboxOpen);
    if (!isFlipped) return;

    let touchStartY = 0;
    let touchStartX = 0;
    const scrollThreshold = 10; // pixels

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0].clientY;
      touchStartX = event.touches[0].clientX;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      console.log('[TOUCH END] Event fired, lightboxOpen:', lightboxOpen);

      // Don't close if lightbox is open
      if (lightboxOpen) {
        console.log('[TOUCH END] Ignoring - lightbox is open');
        return;
      }

      const touchEndY = event.changedTouches[0].clientY;
      const touchEndX = event.changedTouches[0].clientX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      const deltaX = Math.abs(touchEndX - touchStartX);

      // If the user scrolled, don't close the card
      if (deltaY > scrollThreshold || deltaX > scrollThreshold) {
        console.log('[TOUCH END] Ignoring - user was scrolling');
        return;
      }

      const target = event.target as Node | null;
      if (
        !target ||
        (cardRef.current && cardRef.current.contains(target)) ||
        (lightboxOverlayRef.current && lightboxOverlayRef.current.contains(target))
      ) {
        return;
      }

      console.log('[TOUCH END] Closing card');
      if (cardRef.current) {
        ignoreNextFlipRef.current = true;
        setLightboxOpen(false);
        setIsFlipped(false);
        setTimeout(() => {
          ignoreNextFlipRef.current = false;
        }, 0);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      console.log('[CLICK OUTSIDE] Event fired, lightboxOpen:', lightboxOpen);

      // Don't close if lightbox is open
      if (lightboxOpen) {
        console.log('[CLICK OUTSIDE] Ignoring - lightbox is open');
        return;
      }

      const target = event.target as Node | null;
      if (
        !target ||
        (cardRef.current && cardRef.current.contains(target)) ||
        (lightboxOverlayRef.current && lightboxOverlayRef.current.contains(target))
      ) {
        return;
      }

      console.log('[CLICK OUTSIDE] Closing card');
      if (cardRef.current) {
        ignoreNextFlipRef.current = true;
        setLightboxOpen(false);
        setIsFlipped(false);
        setTimeout(() => {
          ignoreNextFlipRef.current = false;
        }, 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      console.log('[CLICK OUTSIDE EFFECT] Cleanup');
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isFlipped, lightboxOpen]);

  useEffect(() => {
    if (!isFlipped) {
      ignoreNextFlipRef.current = false;
    }
  }, [isFlipped]);

  return (
    <>
      <div
        ref={cardRef}
        className="flip-card w-full relative min-h-[400px] md:min-h-[200px]"
        style={{
          perspective: '1000px',
          height: 'auto',
          isolation: 'isolate',
          // Disable pointer events when lightbox is open
          pointerEvents: lightboxOpen ? 'none' : 'auto'
        }}
      >
        <motion.div
          className="flip-card-inner w-full relative min-h-[400px] md:min-h-[200px]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 25
          }}
          style={{
            transformStyle: 'preserve-3d',
            height: 'auto'
          }}
        >
        {/* Front Face - Image */}
        <div
          className={`flip-card-face flip-card-front ${!isFlipped ? 'relative' : 'absolute inset-0'} w-full rounded-3xl overflow-hidden group/card min-h-[400px] md:min-h-[200px] ${
            isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            visibility: isFlipped ? 'hidden' : 'visible'
          }}
          onClick={handleFlip}
        >
          <div className="w-full relative min-h-[400px] md:min-h-[200px] h-full">
            {hasImage ? (
              <>
                <Image
                  src={accommodationImages[room.roomTypeId]}
                  alt={getMainImageAlt(room.roomTypeId)}
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

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-8 py-4">
              <div className="text-center max-w-lg">
                <h2 className="text-[1.35rem] md:text-[2rem] leading-snug font-bold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-heading">
                  {t(`accommodation.roomTypes.${room.roomTypeId}.name`)}
                </h2>
                {isUnavailable ? (
                  <div className="inline-block rounded-full px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-wide bg-black/80 text-white shadow-lg">
                    {locale === 'es' ? 'Agotado' : 'Sold out'}
                  </div>
                ) : (
                  <div
                    className="inline-block rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold backdrop-blur-sm min-w-fit"
                    style={{ backgroundColor: 'rgba(242, 193, 78, 0.9)', color: '#1a1a1a' }}
                  >
                    {room.isSharedRoom ? (
                      <>
                        <span className="text-sm md:text-base font-bold">${roomPrice}</span>
                        <span className="font-medium"> / {locale === 'es' ? 'noche / persona' : 'night / person'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm md:text-base font-bold">${roomPrice}</span>
                        <span className="font-medium"> / {locale === 'es' ? 'noche (total)' : 'night (total)'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isUnavailable && (
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-semibold">
                {locale === "es" ? "Toca para ver detalles" : "Tap to see details"}
              </div>
            )}

            {isUnavailable && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-x-4 bottom-6 bg-black/85 rounded-full px-5 py-2 text-center">
                  <span className="text-white text-sm md:text-base font-bold uppercase tracking-[0.4em]">
                    {locale === "es" ? "Agotado" : "Sold Out"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Face - Details with Mini Carousel at Bottom */}
        <div
          className={`flip-card-face flip-card-back ${isFlipped ? 'relative' : 'absolute inset-0'} w-full rounded-3xl cursor-pointer min-h-[400px] md:min-h-[200px]`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            visibility: !isFlipped ? 'hidden' : 'visible'
          }}
          onClick={handleFlip}
        >
          <div className="flex w-full flex-col md:flex-row items-stretch rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20 overflow-hidden min-h-[400px] md:min-h-[200px]">
            <div className="flex flex-1 flex-col px-3 md:px-3 py-3 md:py-2 gap-1.5 md:gap-1">
              <div className="flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  {/* Mobile Title - Below image, above description */}
                  <h3 className="md:hidden text-xl font-bold text-white font-heading mb-3">{t(`accommodation.roomTypes.${room.roomTypeId}.name`)}</h3>

                  <div className="hidden md:flex items-center gap-2 md:gap-2 mb-2 md:mb-1.5">
                    <h3 className="text-lg md:text-xl font-bold text-slate-100 font-heading">{t(`accommodation.roomTypes.${room.roomTypeId}.name`)}</h3>
                    {isSelected && (
                      <CheckCircle2 className="h-5 md:h-6 w-5 md:w-6 text-amber-300" aria-hidden="true" />
                    )}
                  </div>

                  {/* Multiple Rooms Alert - Prominent Warning */}
                  {room.requiresMultipleRooms && room.roomsNeeded && (
                    <div className="mb-2 md:mb-3 p-2 md:p-3 rounded-lg border-2" style={{
                      backgroundColor: 'color-mix(in srgb, var(--brand-orange) 15%, transparent)',
                      borderColor: 'var(--brand-orange)'
                    }}>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-amber-200 text-xs md:text-sm font-bold mb-0.5">
                            {locale === 'es'
                              ? `Necesitas ${room.roomsNeeded} habitaciones separadas`
                              : `You need ${room.roomsNeeded} separate rooms`}
                          </p>
                          <p className="text-slate-300 text-[10px] md:text-xs leading-snug">
                            {locale === 'es'
                              ? `Para ${guests} huéspedes se reservarán ${room.roomsNeeded} unidades independientes (${room.availableRooms} disponibles)`
                              : `For ${guests} guests, ${room.roomsNeeded} independent units will be booked (${room.availableRooms} available)`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Availability + Capacity */}
                  <div className="flex items-center gap-2 md:gap-2 mb-2 md:mb-1.5 flex-wrap">
                    <div
                      className="rounded-full px-2 md:px-2 py-0.5 md:py-0.5 text-white text-[10px] md:text-[11px] font-medium border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--brand-aqua) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--brand-aqua) 40%, transparent)'
                      }}
                    >
                      {room.availableRooms} {room.availableRooms === 1 ? 'available' : 'available'}
                    </div>

                    <div className="flex items-center text-slate-300 text-[10px] md:text-[11px] font-medium">
                      <svg className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {room.maxGuests} {room.maxGuests === 1 ? 'guest' : 'guests'} {locale === 'es' ? 'por unidad' : 'per unit'}
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 md:gap-1.5 mb-2 md:mb-1.5">
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
                  <p className="text-sm md:text-sm leading-snug md:leading-tight text-slate-300 mb-2 md:mb-1">
                    <span className="md:hidden">{typeof description === 'object' ? description.mobile : description}</span>
                    <span className="hidden md:inline">{typeof description === 'object' ? description.desktop : description}</span>
                  </p>
                </div>
              </div>

              {/* Mini Photo Carousel - Bottom of left section */}
              {gallery.length > 0 && (
                <div className="mt-auto pt-2 md:pt-1.5 border-t border-slate-700/40">
                  <div className="flex items-center gap-1.5 md:gap-1.5 overflow-x-auto scrollbar-hide pb-2 md:pb-1">
                    {gallery.map((img, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        onClick={(e) => openLightbox(idx, e)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative flex-shrink-0 w-12 h-12 md:w-12 md:h-12 rounded-md md:rounded-md overflow-hidden border-2 border-slate-600/60 hover:border-amber-300/80 transition-all group/thumb"
                      >
                        <Image
                          src={img}
                          alt={getGalleryAlt(room.roomTypeId, idx)}
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

            {/* Price and Action Panel */}
            <div
              className="flex flex-col justify-center items-center gap-2 md:gap-2 border-t md:border-t-0 md:border-l border-slate-700/60 bg-slate-800/30 px-3 md:px-3 py-3 md:py-2 md:min-w-[200px] flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile: Compact Price + Button Layout */}
              <div className="w-full md:hidden">
                {/* Price Row - Horizontal on Mobile */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                      {nights} {nights === 1 ? (locale === 'es' ? 'noche' : 'night') : (locale === 'es' ? 'noches' : 'nights')}
                    </span>
                    <div className="text-xl font-bold text-amber-300">
                      ${totalPrice}
                    </div>
                    {room.requiresMultipleRooms && room.roomsNeeded && (
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        {room.roomsNeeded} × ${room.pricePerNight}/noche
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Per night</p>
                    <p className="text-xs text-slate-400 font-medium">${roomPrice}</p>
                    {room.requiresMultipleRooms && room.roomsNeeded && (
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        ({room.roomsNeeded} {locale === 'es' ? 'unidades' : 'units'})
                      </p>
                    )}
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
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
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

              {/* Desktop: Horizontal Layout - 3 columns */}
              <div className="hidden md:flex md:flex-col md:items-center md:gap-3 w-full">
                {/* Unified Price Container - 3 Column Horizontal Layout */}
                <div className="w-full py-3 px-3 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <div className="flex items-center justify-center gap-3 py-1">
                    {/* Nights */}
                    <div className="flex flex-col items-center flex-1 border-r border-slate-600/50">
                      <p className="text-[10px] text-slate-400 mb-1">
                        {nights === 1 ? (locale === 'es' ? 'noche' : 'night') : (locale === 'es' ? 'noches' : 'nights')}
                      </p>
                      <p className="text-xl font-bold text-slate-200">
                        {nights}
                      </p>
                    </div>

                    {/* Guests */}
                    <div className="flex flex-col items-center flex-1 border-r border-slate-600/50">
                      <p className="text-[10px] text-slate-400 mb-1">
                        {guests === 1 ? (locale === 'es' ? 'huésped' : 'guest') : (locale === 'es' ? 'huéspedes' : 'guests')}
                      </p>
                      <p className="text-xl font-bold text-slate-200">
                        {guests}
                      </p>
                    </div>

                    {/* Total Price */}
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                        Total
                      </span>
                      <div className="text-xl font-bold text-amber-300">
                        ${totalPrice}
                      </div>
                    </div>
                  </div>

                  {/* Price per night info */}
                  <div className="text-center mt-2 pt-2 border-t border-slate-600/30">
                    <p className="text-[10px] text-slate-400">
                      {locale === 'es' ? 'a' : 'at'} ${roomPrice}/{locale === 'es' ? 'noche' : 'night'}
                    </p>
                    {room.requiresMultipleRooms && room.roomsNeeded && (
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        ({room.roomsNeeded} {locale === 'es' ? 'habitaciones' : 'rooms'} × ${room.pricePerNight})
                      </p>
                    )}
                  </div>
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

      {/* Lightbox Modal - rendered via portal */}
      {isClient && lightboxOpen && gallery.length > 0 && createPortal(
        <div
          ref={lightboxOverlayRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 md:p-8"
          onClick={(e) => {
            console.log('[LIGHTBOX OVERLAY] Clicked');
            closeLightbox();
          }}
          style={{ pointerEvents: 'auto', isolation: 'isolate' }}
        >
          {/* Compact Container - Auto-adjusts to image */}
          <div
            ref={lightboxWrapperRef}
            className="relative w-full"
            style={{ maxWidth: "1280px", width: lightboxDimensions ? `${lightboxDimensions.width}px` : "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
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
              <div className="relative w-full" style={{ aspectRatio: "16/10", height: lightboxDimensions ? `${lightboxDimensions.height}px` : undefined }}>
                <Image
                  src={gallery[lightboxImageIndex]}
                  alt={getGalleryAlt(room.roomTypeId, lightboxImageIndex)}
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
                      alt={getGalleryAlt(room.roomTypeId, idx)}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};

export default AccommodationCard;
