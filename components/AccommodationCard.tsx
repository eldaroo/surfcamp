'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

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
  const visibleFeatures = features.slice(0, 3);
  const hiddenCount = features.length - 3;

  const handleFlip = () => {
    if (!isUnavailable) {
      setIsFlipped(!isFlipped);
    }
  };

  const hasImage = accommodationImages[room.roomTypeId];

  return (
    <div className="flip-card w-full min-h-[280px]" style={{ perspective: '1000px' }}>
      <motion.div
        className="flip-card-inner w-full h-full relative min-h-[280px]"
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
          className={`flip-card-face flip-card-front absolute w-full rounded-3xl overflow-hidden group/card min-h-[280px] ${
            isUnavailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
        >
          <div className="w-full h-full relative min-h-[280px]">
            {hasImage ? (
              <>
                <Image
                  src={accommodationImages[room.roomTypeId]}
                  alt={room.roomTypeName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/card:scale-105"
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

        {/* Back Face - Details */}
        <div
          className="flip-card-face flip-card-back absolute w-full rounded-3xl cursor-pointer min-h-[280px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={handleFlip}
        >
          <div className="flex w-full h-full flex-col md:flex-row items-stretch rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur transition hover:border-amber-300/70 hover:shadow-amber-300/20 overflow-hidden">
            <div className="flex flex-1 flex-col px-4 md:px-6 py-4 gap-3">
              <div className="flex items-start justify-between flex-shrink-0">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-100 font-heading">{room.roomTypeName}</h3>
                    {isSelected && (
                      <CheckCircle2 className="h-6 md:h-7 w-6 md:w-7 text-amber-300" aria-hidden="true" />
                    )}
                  </div>

                  {/* Availability + Capacity */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="rounded-full px-3 py-1 text-white text-xs font-medium border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--brand-aqua) 18%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--brand-aqua) 40%, transparent)'
                      }}
                    >
                      {room.availableRooms} {room.availableRooms === 1 ? 'available' : 'available'}
                    </div>

                    <div className="flex items-center text-slate-300 text-xs font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {room.maxGuests} {room.maxGuests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
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
                  <p className="text-sm leading-relaxed text-slate-300">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Pricing & Action */}
            <div
              className="flex flex-col justify-center items-center gap-3 border-t md:border-t-0 md:border-l border-slate-700/60 bg-slate-800/30 px-4 md:px-5 py-4 md:min-w-[260px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Stay Info */}
              <div className="text-center w-full">
                <p className="text-xs md:text-sm text-slate-400 mb-1">
                  {locale === 'es' ? 'Estadía' : 'Stay'}
                </p>
                <p className="text-base md:text-lg font-semibold text-slate-200">
                  {nights} {nights === 1 ? (locale === 'es' ? 'noche' : 'night') : (locale === 'es' ? 'noches' : 'nights')}
                </p>
              </div>

              {/* Total Price - Main Focus */}
              <div className="text-center w-full py-3 px-3 rounded-xl bg-slate-700/50 border border-slate-600/50">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400 block mb-1.5">
                  Total
                </span>
                <div className="text-2xl md:text-3xl font-bold text-amber-300 mb-1">
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
                className={`w-full rounded-2xl px-4 md:px-6 py-3 md:py-3.5 text-sm md:text-base font-semibold transition ${
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
      </motion.div>
    </div>
  );
};

export default AccommodationCard;
