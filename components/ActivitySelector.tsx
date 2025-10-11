'use client';

import { useState, useEffect, useMemo, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Clock, Flame, ShieldCheck, Sparkles, Minus, Plus, Timer, Award, CheckCircle, TrendingUp, Heart, MapPin, Calendar } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getLocalizedActivities } from '@/lib/activities';
import { getActivityTotalPrice } from '@/lib/prices';
import { formatCurrency } from '@/lib/utils';
import { Activity } from '@/types';

// Constantes con tipos explícitos para evitar errores de TypeScript
const TIME_SLOTS = ['7:00 AM', '3:00 PM'] as const;
type TimeSlot = typeof TIME_SLOTS[number];

const YOGA_PACKAGES = ['1-class', '3-classes', '10-classes'] as const;
type YogaPackage = typeof YOGA_PACKAGES[number];

const SURF_PACKAGES = ['3-classes', '4-classes', '5-classes', '6-classes', '7-classes', '8-classes', '9-classes', '10-classes'] as const;
type SurfPackage = typeof SURF_PACKAGES[number];
type CardTheme = {
  background: string;
  borderColor: string;
  shadow: string;
  accent: string;
  accentContrast: string;
  badgePrimaryBg: string;
  badgePrimaryBorder: string;
  badgeSecondaryBg: string;
  badgeSecondaryBorder: string;
  text: string;
  muted: string;
  duration: string;
};

const CARD_THEMES: Record<string, CardTheme> = {
  surf: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(71, 85, 105, 0.5)',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    accent: '#fbbf24',
    accentContrast: '#1f2937',
    badgePrimaryBg: 'rgba(71, 85, 105, 0.3)',
    badgePrimaryBorder: 'rgba(71, 85, 105, 0.5)',
    badgeSecondaryBg: 'rgba(71, 85, 105, 0.2)',
    badgeSecondaryBorder: 'rgba(71, 85, 105, 0.3)',
    text: '#ffffff',
    muted: '#e2e8f0',
    duration: '#0ea5e9',
  },
  yoga: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(71, 85, 105, 0.5)',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    accent: '#06b6d4',
    accentContrast: '#fff',
    badgePrimaryBg: 'rgba(71, 85, 105, 0.3)',
    badgePrimaryBorder: 'rgba(71, 85, 105, 0.5)',
    badgeSecondaryBg: 'rgba(71, 85, 105, 0.2)',
    badgeSecondaryBorder: 'rgba(71, 85, 105, 0.3)',
    text: '#ffffff',
    muted: '#e2e8f0',
    duration: '#10b981',
  },
  ice_bath: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(71, 85, 105, 0.5)',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    accent: '#0ea5e9',
    accentContrast: '#fff',
    badgePrimaryBg: 'rgba(71, 85, 105, 0.3)',
    badgePrimaryBorder: 'rgba(71, 85, 105, 0.5)',
    badgeSecondaryBg: 'rgba(71, 85, 105, 0.2)',
    badgeSecondaryBorder: 'rgba(71, 85, 105, 0.3)',
    text: '#ffffff',
    muted: '#e2e8f0',
    duration: '#38bdf8',
  },
  default: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(71, 85, 105, 0.5)',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    accent: '#fbbf24',
    accentContrast: '#1f2937',
    badgePrimaryBg: 'rgba(71, 85, 105, 0.3)',
    badgePrimaryBorder: 'rgba(71, 85, 105, 0.5)',
    badgeSecondaryBg: 'rgba(71, 85, 105, 0.2)',
    badgeSecondaryBorder: 'rgba(71, 85, 105, 0.3)',
    text: '#ffffff',
    muted: '#e2e8f0',
    duration: '#0ea5e9',
  },
};

type MarketingContent = {
  title: string;
  subtitle: string;
  rating: string;
  limited: string;
  trust: string;
  socialProof: string;
  accent: string;
  accentSecondary: string;
  accentSoft: string;
  contrastText: string;
  groupInfo: string;
  tagline?: string;
};

const MARKETING_CONTENT: Record<string, MarketingContent> = {
  surf: {
    title: 'Programa de Surf',
    subtitle: '',
    rating: '4.9 (120 reviews)',
    limited: '',
    trust: 'Premium',
    socialProof: '',
    accent: '#fbbf24',
    accentSecondary: '#f59e0b',
    accentSoft: 'rgba(251, 191, 36, 0.18)',
    contrastText: '#1f2937',
    groupInfo: 'Hasta 5 personas',
    tagline: '',
  },
  yoga: {
    title: 'Yoga Matutino',
    subtitle: 'Sunrise yoga sessions to start the day with energy and balance.',
    rating: '',
    limited: '',
    trust: '',
    socialProof: '',
    accent: '#06b6d4',
    accentSecondary: '#0891b2',
    accentSoft: 'rgba(6, 182, 212, 0.16)',
    contrastText: '#fff',
    groupInfo: 'Grupos pequeños',
    tagline: '',
  },
  ice_bath: {
    title: 'Ice Bath Therapy',
    subtitle: '1:1 cold therapy session for complete regeneration. Includes movement and breathing techniques for maximum recovery.',
    rating: '',
    limited: '',
    trust: '',
    socialProof: '',
    accent: '#0ea5e9',
    accentSecondary: '#0284c7',
    accentSoft: 'rgba(14, 165, 233, 0.18)',
    contrastText: '#fff',
    groupInfo: 'Sesión privada',
    tagline: '',
  },
  transport: {
    title: 'Transporte Aeropuerto',
    subtitle: 'Traslado directo desde/hacia San José',
    rating: '',
    limited: '',
    trust: '',
    socialProof: '',
    accent: '#fbbf24',
    accentSecondary: '#f59e0b',
    accentSoft: 'rgba(251, 191, 36, 0.18)',
    contrastText: '#1f2937',
    groupInfo: 'Hasta 8 personas',
    tagline: '',
  },
  hosting: {
    title: 'Servicio de Hosting',
    subtitle: 'Organización personalizada de tu estadía',
    rating: '',
    limited: '',
    trust: '',
    socialProof: '',
    accent: '#fbbf24',
    accentSecondary: '#f59e0b',
    accentSoft: 'rgba(251, 191, 36, 0.18)',
    contrastText: '#1f2937',
    groupInfo: 'Personalizado',
    tagline: '',
  },
  default: {
    title: '',
    subtitle: '',
    rating: '4.8 (100 reviews)',
    limited: 'Save 30%',
    trust: 'Premium',
    socialProof: '',
    accent: '#38bdf8',
    accentSecondary: '#60a5fa',
    accentSoft: 'rgba(96, 165, 250, 0.16)',
    contrastText: '#082f49',
    groupInfo: 'Atención personal',
    tagline: '',
  },
};

// UI text translations for activity cards
const UI_TRANSLATIONS = {
  es: {
    // Surf card specifics
    certifiedInstructors: 'Profesores certificados',
    includesEquipment: 'Incluye lycra y tabla',
    videoAnalysis: 'Video analysis',
    transportIncluded: 'Traslados a otros spots incluidos',
    classesOfHours: 'clases de 2h',
    smallGroups: 'Grupos reducidos',

    // General UI
    hoursOfTravel: 'horas de viaje',
    minutes: 'minutos',
    allLevels: 'Todos los niveles',
    postSurfRecovery: 'Post-surf recovery',
    doorToDoor: 'Puerta a puerta',
    completeService: 'Servicio completo',
    people: 'Personas',
    sessions: 'Sesiones',
    schedule: 'Horario',
    plan: 'Plan',
    classUnit: 'clase',
    classesUnit: 'clases',
    numberOfClasses: 'Número de clases',
    totalPrice: 'Precio total',
    completeProgram: 'programa completo',
    completeClasses: 'clases completas',
    perSession: 'por sesión',
    persons: 'personas',
    sessionsUnit: 'sesiones',
    trips: 'viajes',
    perTrip: 'por viaje',
    perPerson: 'por persona',
    selected: '✓ Seleccionado',
    bookNow: 'Reservar Ahora',
    clear: 'Limpiar',

    // Trust indicators
    limitedSpots: 'Limited spots per group – book today to secure your wave',
    trustedTravelers: 'Trusted by travelers from 15+ countries'
  },
  en: {
    // Surf card specifics
    certifiedInstructors: 'Certified instructors',
    includesEquipment: 'Board and wetsuit included',
    videoAnalysis: 'Video analysis',
    transportIncluded: 'Transport to other spots included',
    classesOfHours: '2-hour classes',
    smallGroups: 'Small groups',

    // General UI
    hoursOfTravel: 'hours of travel',
    minutes: 'minutes',
    allLevels: 'All levels',
    postSurfRecovery: 'Post-surf recovery',
    doorToDoor: 'Door to door',
    completeService: 'Complete service',
    people: 'People',
    sessions: 'Sessions',
    schedule: 'Schedule',
    plan: 'Plan',
    classUnit: 'class',
    classesUnit: 'classes',
    numberOfClasses: 'Number of classes',
    totalPrice: 'Total price',
    completeProgram: 'complete program',
    completeClasses: 'complete classes',
    perSession: 'per session',
    persons: 'people',
    sessionsUnit: 'sessions',
    trips: 'trips',
    perTrip: 'per trip',
    perPerson: 'per person',
    selected: '✓ Selected',
    bookNow: 'Book Now',
    clear: 'Clear',

    // Trust indicators
    limitedSpots: 'Limited spots per group – book today to secure your wave',
    trustedTravelers: 'Trusted by travelers from 15+ countries'
  }
};

// Función para renderizar las tarjetas de actividad (debe estar fuera del componente principal)
const createRenderActivityCard = (
  selectedActivities: any[],
  activityQuantities: Record<string, number>,
  bookingData: any,
  getSelectedYogaPackage: (id: string) => '1-class' | '3-classes' | '10-classes' | undefined,
  getSelectedSurfPackage: (id: string) => '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes' | undefined,
  getSelectedSurfClasses: (id: string) => number,
  updateSurfClasses: (id: string, classes: number) => void,
  calculateSurfPrice: (classes: number) => number,
  getActivityTotalPrice: (category: string, packageType: string, guests: number) => number,
  formatCurrency: (amount: number) => string,
  hasQuantitySelector: (category: string) => boolean,
  hasTimeSelector: (category: string) => boolean,
  hasYogaPackageSelector: (category: string) => boolean,
  hasSurfPackageSelector: (category: string) => boolean,
  getActivityQuantity: (id: string) => number,
  getSelectedTimeSlot: (id: string) => '7:00 AM' | '3:00 PM',
  updateTimeSlot: (id: string, timeSlot: '7:00 AM' | '3:00 PM') => void,
  updateYogaPackage: (id: string, packageType: '1-class' | '3-classes' | '10-classes') => void,
  updateSurfPackage: (id: string, packageType: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes') => void,
  updateActivityQuantity: (id: string, quantity: number) => void,
  handleActivityToggle: (activity: any) => void,
  clearActivity: (activityId: string) => void,
  t: (key: string) => string,
  locale: 'es' | 'en'
) => {
  return (activity: any) => {
    const isSelected = selectedActivities.some((a: Activity) => a.id === activity.id);
    const quantity = activityQuantities[activity.id] || (isSelected ? 1 : 0);

    // Get UI translations for current locale
    const ui = UI_TRANSLATIONS[locale] || UI_TRANSLATIONS.es;

    let totalPrice: number;
    if (activity.category === 'yoga') {
      const yogaPackage = getSelectedYogaPackage(activity.id);
      if (!yogaPackage) {
        totalPrice = 0;
      } else {
        totalPrice = getActivityTotalPrice('yoga', yogaPackage, bookingData.guests || 1);
      }
    } else if (activity.category === 'surf') {
      const surfClasses = getSelectedSurfClasses(activity.id);
      totalPrice = calculateSurfPrice(surfClasses) * (bookingData.guests || 1);
    } else if (activity.category === 'ice_bath') {
      const sessions = activityQuantities[`${activity.id}_sessions`] || 1;
      totalPrice = activity.price * quantity * sessions;
    } else if (activity.category === 'transport') {
      totalPrice = activity.price * quantity * (bookingData.guests || 1);
    } else {
      totalPrice = activity.price * (bookingData.guests || 1);
    }

    // Get marketing content for the activity
    const marketing = MARKETING_CONTENT[activity.category] || MARKETING_CONTENT.default;
    const theme = CARD_THEMES[activity.category] || CARD_THEMES.default;

    // Get activity icon
    const getActivityIcon = () => {
      switch (activity.category) {
        case 'surf':
          return <Flame className="w-6 h-6" />;
        case 'yoga':
          return <Heart className="w-6 h-6" />;
        case 'ice_bath':
          return <ShieldCheck className="w-6 h-6" />;
        case 'transport':
          return <MapPin className="w-6 h-6" />;
        case 'hosting':
          return <Award className="w-6 h-6" />;
        default:
          return <Sparkles className="w-6 h-6" />;
      }
    };

    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 h-full group ${
          isSelected ? 'ring-4 ring-orange-400/50 shadow-2xl shadow-orange-400/20' : 'hover:shadow-2xl hover:shadow-black/30'
        }`}
        style={{
          background: theme.background,
          border: `1px solid ${theme.borderColor}`,
          boxShadow: theme.shadow,
        }}
        onClick={() => handleActivityToggle(activity)}
      >
        {/* Glow effect when selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-cyan-400/10 pointer-events-none" />
        )}

        {/* Top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="relative p-5 h-full flex flex-col">
          {/* Header with icon and badges */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accent, color: theme.accentContrast }}>
                {getActivityIcon()}
              </div>
              {marketing.trust && (
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{
                  backgroundColor: theme.badgePrimaryBg,
                  border: `1px solid ${theme.badgePrimaryBorder}`,
                  color: theme.accent
                }}>
                  {marketing.trust}
                </span>
              )}
            </div>

            {/* Price in top right corner for Surf */}
            {activity.category === 'surf' ? (
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: theme.accent }}>
                  ${calculateSurfPrice(getSelectedSurfClasses(activity.id)) * (bookingData.guests || 1)}
                </div>
                <div className="text-xs" style={{ color: theme.muted }}>
                  {ui.totalPrice}
                </div>
              </div>
            ) : activity.category === 'yoga' ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full"
              >
                {(() => {
                  const selectedPackage = getSelectedYogaPackage(activity.id);
                  if (selectedPackage === '3-classes') return '17% OFF';
                  if (selectedPackage === '10-classes') return '33% OFF';
                  return '';
                })()}
              </motion.div>
            ) : null}
          </div>

          {/* 1. Title */}
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
            {marketing.title || activity.name}
          </h3>

          {/* 2. Brief description - Surf gets bullet points */}
          {activity.category === 'surf' ? (
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-sm" style={{ color: theme.muted }}>{ui.certifiedInstructors}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-sm" style={{ color: theme.muted }}>{ui.includesEquipment}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-sm" style={{ color: theme.muted }}>{ui.videoAnalysis}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-sm" style={{ color: theme.muted }}>{ui.transportIncluded}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: theme.muted }}>
              {marketing.subtitle}
            </p>
          )}

          {/* 3. Benefits with icons - Consolidated for Surf */}
          {activity.category === 'surf' ? (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" style={{ color: theme.accent }} />
                <span className="text-sm" style={{ color: theme.text }}>
                  {getSelectedSurfClasses(activity.id)} {ui.classesOfHours}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: theme.accent }} />
                <span className="text-sm" style={{ color: theme.text }}>
                  {ui.smallGroups}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {activity.duration > 0 && (
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5" style={{ color: theme.accent }} />
                  <span className="text-sm font-medium" style={{ color: theme.text }}>
                    {activity.category === 'transport' ? `6 ${ui.hoursOfTravel}` : `${activity.duration} ${ui.minutes}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: theme.accent }} />
                <span className="text-sm font-medium" style={{ color: theme.text }}>
                  {marketing.groupInfo}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" style={{ color: theme.accent }} />
                <span className="text-sm font-medium" style={{ color: theme.text }}>
                  {activity.category === 'yoga' ? ui.allLevels :
                   activity.category === 'ice_bath' ? ui.postSurfRecovery :
                   activity.category === 'transport' ? ui.doorToDoor :
                   ui.completeService}
                </span>
              </div>
            </div>
          )}

          {/* 4. Rating and reviews - Only for Surf */}
          {activity.category === 'surf' && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                {marketing.rating}
              </span>
            </div>
          )}

          {/* 5. Selection controls */}

          <div className={`space-y-4 ${activity.category === 'surf' ? 'mb-8' : 'mb-6'}`}>
            {hasQuantitySelector(activity.category) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold" style={{ color: theme.text }}>
                    {ui.people}
                  </span>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActivityQuantity(activity.id, Math.max(0, quantity - 1));
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentContrast
                      }}
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <span className="w-12 text-center font-bold text-2xl" style={{ color: theme.text }}>
                      {quantity}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const maxQuantity = activity.category === 'surf' ? 2 :
                                         activity.category === 'hosting' ? 5 : 3;
                        updateActivityQuantity(activity.id, Math.min(maxQuantity, quantity + 1));
                      }}
                      disabled={activity.category === 'surf' ? quantity >= 2 :
                                activity.category === 'hosting' ? quantity >= 5 : quantity >= 3}
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentContrast
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {activity.category === 'ice_bath' && (
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold" style={{ color: theme.text }}>
                      {ui.sessions}
                    </span>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentSessions = activityQuantities[`${activity.id}_sessions`] || 1;
                          updateActivityQuantity(`${activity.id}_sessions`, Math.max(1, currentSessions - 1));
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
                        style={{
                          backgroundColor: theme.accent,
                          color: theme.accentContrast
                        }}
                      >
                        <Minus className="w-5 h-5" />
                      </motion.button>
                      <span className="w-12 text-center font-bold text-2xl" style={{ color: theme.text }}>
                        {activityQuantities[`${activity.id}_sessions`] || 1}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentSessions = activityQuantities[`${activity.id}_sessions`] || 1;
                          updateActivityQuantity(`${activity.id}_sessions`, Math.min(10, currentSessions + 1));
                        }}
                        disabled={(activityQuantities[`${activity.id}_sessions`] || 1) >= 10}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: theme.accent,
                          color: theme.accentContrast
                        }}
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasTimeSelector(activity.category) && (
              <div className="space-y-4">
                <span className="text-base font-semibold" style={{ color: theme.text }}>{ui.schedule}</span>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map((timeSlot) => (
                    <motion.button
                      key={timeSlot}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTimeSlot(activity.id, timeSlot);
                      }}
                      className={`p-4 rounded-lg text-sm font-semibold transition-all duration-200`}
                      style={{
                        backgroundColor: getSelectedTimeSlot(activity.id) === timeSlot ? theme.accent : theme.badgeSecondaryBg,
                        color: getSelectedTimeSlot(activity.id) === timeSlot ? theme.accentContrast : theme.text,
                        border: `2px solid ${getSelectedTimeSlot(activity.id) === timeSlot ? theme.accent : 'transparent'}`
                      }}
                    >
                      <Clock className="w-4 h-4 inline mr-2" />
                      {timeSlot}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Package selectors */}
          {hasYogaPackageSelector(activity.category) && (
            <div className="space-y-3">
              <span className="text-sm font-semibold" style={{ color: theme.text }}>{ui.plan}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '1-class' as YogaPackage, label: '1', description: ui.classUnit },
                  { value: '3-classes' as YogaPackage, label: '3', description: ui.classesUnit },
                  { value: '10-classes' as YogaPackage, label: '10', description: ui.classesUnit }
                ].map((packageOption) => {
                  const isPackageSelected = getSelectedYogaPackage(activity.id) === packageOption.value;

                  return (
                    <motion.button
                      key={packageOption.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateYogaPackage(activity.id, packageOption.value);
                      }}
                      className={`p-3 rounded-lg text-center transition-all duration-200`}
                      style={{
                        backgroundColor: isPackageSelected ? theme.accent : theme.badgeSecondaryBg,
                        color: isPackageSelected ? theme.accentContrast : theme.text,
                        border: `1px solid ${isPackageSelected ? theme.accent : 'transparent'}`
                      }}
                    >
                      <div className="text-lg font-bold">{packageOption.label}</div>
                      <div className="text-xs opacity-80">{packageOption.description}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSurfPackageSelector(activity.category) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{ui.numberOfClasses}</span>
                <span className="text-lg font-bold" style={{ color: theme.accent }}>
                  {getSelectedSurfClasses(activity.id)} {ui.classesUnit}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={getSelectedSurfClasses(activity.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const classes = parseInt(e.target.value);
                    updateSurfClasses(activity.id, classes);
                  }}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${theme.accent} 0%, ${theme.accent} ${((getSelectedSurfClasses(activity.id)) - 3) / (10 - 3) * 100}%, ${theme.badgeSecondaryBg} ${((getSelectedSurfClasses(activity.id)) - 3) / (10 - 3) * 100}%, ${theme.badgeSecondaryBg} 100%)`
                  }}
                />
                <style jsx>{`
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${theme.accent};
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.2);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${theme.accent};
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.2);
                  }
                `}</style>
              </div>
              <div className="flex justify-between text-xs" style={{ color: theme.muted }}>
                <span>3 {ui.classesUnit}</span>
                <span>10 {ui.classesUnit}</span>
              </div>
            </div>
          )}

          {/* 6. Price and main CTA */}
          <div className="mt-auto space-y-6">
            {((activity.category === 'yoga' && getSelectedYogaPackage(activity.id)) ||
              (activity.category === 'surf' && getSelectedSurfPackage(activity.id)) ||
              activity.category !== 'yoga' && activity.category !== 'surf') && (
              <>
                <div className="text-center py-3">
                  <div className="text-sm font-medium mb-1" style={{ color: theme.muted }}>
                    {ui.totalPrice}
                  </div>
                  <div className="text-3xl font-bold" style={{ color: theme.accent }}>
                    {activity.category === 'yoga'
                      ? formatCurrency(getActivityTotalPrice('yoga', getSelectedYogaPackage(activity.id)!, quantity))
                      : activity.category === 'surf'
                      ? formatCurrency(calculateSurfPrice(getSelectedSurfClasses(activity.id)) * (bookingData.guests || 1))
                      : activity.category === 'ice_bath'
                      ? formatCurrency(activity.price * quantity * (activityQuantities[`${activity.id}_sessions`] || 1))
                      : formatCurrency(activity.price * quantity)}
                  </div>
                  <div className="text-xs opacity-70" style={{ color: theme.muted }}>
                    {activity.category === 'yoga'
                      ? ui.completeProgram
                      : activity.category === 'surf'
                      ? `${getSelectedSurfClasses(activity.id)} ${ui.completeClasses}`
                      : activity.category === 'ice_bath' ?
                        (() => {
                          const sessions = activityQuantities[`${activity.id}_sessions`] || 1;
                          if (quantity > 1 && sessions > 1) {
                            return `${quantity} ${ui.persons} × ${sessions} ${ui.sessionsUnit}`;
                          } else if (quantity > 1) {
                            return `${quantity} ${ui.persons}`;
                          } else if (sessions > 1) {
                            return `${sessions} ${ui.sessionsUnit}`;
                          } else {
                            return ui.perSession;
                          }
                        })() :
                     activity.category === 'transport' ?
                       (quantity > 1 ? `${quantity} ${ui.trips}` : ui.perTrip) :
                     ui.perPerson}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivityToggle(activity);
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? '#f59e0b' : theme.accent,
                    color: isSelected ? '#1f2937' : theme.accentContrast,
                    boxShadow: `0 3px 12px ${isSelected ? '#f59e0b40' : theme.accent + '40'}`,
                    border: isSelected ? '1px solid #f59e0b' : `1px solid ${theme.accent}`
                  }}
                >
                  {isSelected ? ui.selected : ui.bookNow}
                </motion.button>
              </>
            )}

            {/* Clear button */}
            {(hasYogaPackageSelector(activity.category) || activity.category === 'hosting' || activity.category === 'ice_bath') && isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearActivity(activity.id);
                }}
                className="w-full py-2 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: theme.muted }}
              >
                {ui.clear}
              </button>
            )}

            {/* Surf disclaimers as separate badges before button */}
            {activity.category === 'surf' && (
              <div className="mb-3 space-y-2">
                <div className="p-2 rounded-lg flex items-center gap-2" style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <span className="text-yellow-400">⚠️</span>
                  <p className="text-xs font-medium" style={{ color: theme.accent }}>
                    {ui.limitedSpots}
                  </p>
                </div>
                <div className="p-2 rounded-lg flex items-center gap-2" style={{
                  backgroundColor: 'rgba(71, 85, 105, 0.2)',
                  border: '1px solid rgba(71, 85, 105, 0.3)'
                }}>
                  <span className="text-blue-400">🌍</span>
                  <p className="text-xs font-medium" style={{ color: theme.text }}>
                    {ui.trustedTravelers}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </motion.div>
    );
  };
};

// Componente de carrusel para las actividades
const ActivityCarousel = ({ 
  activities, 
  title, 
  titleColor = "text-accent-200", 
  renderActivityCard 
}: {
  activities: any[];
  title: string;
  titleColor?: string;
  renderActivityCard: (activity: any) => React.ReactNode;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  if (activities.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
              disabled={totalPages <= 1}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-white/70">
              {currentPage + 1} de {totalPages}
            </span>
            <button
              onClick={nextPage}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
              disabled={totalPages <= 1}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {currentActivities.map((activity) => (
          <div key={activity.id} className="w-full">
            {renderActivityCard(activity)}
          </div>
        ))}
      </div>
      
      {/* Indicadores de página */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentPage ? 'bg-accent-200 w-6' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ActivitySelector() {
  const { t, locale } = useI18n();
  
  // Get localized activities based on current locale - using useMemo to refresh when locale changes
  const AVAILABLE_ACTIVITIES = useMemo(() => {
    console.log('🌍 ActivitySelector - Current locale:', locale);
    console.log('🌍 ActivitySelector - Window location:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
    const activities = getLocalizedActivities(locale || 'en');
    console.log('📝 ActivitySelector - First activity name:', activities[0]?.name);
    console.log('📝 ActivitySelector - All activity names:', activities.map(a => a.name));
    return activities;
  }, [locale]);
  
  const {
    bookingData,
    selectedActivities,
    activityQuantities,
    setSelectedActivities,
    setActivityQuantity,
    setCurrentStep,
    setLoading,
    setSelectedTimeSlot,
    setSelectedYogaPackage,
    setSelectedSurfPackage,
    setSelectedSurfClasses,
    selectedTimeSlots,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedSurfClasses,
    setPriceBreakdown,
    setError
  } = useBookingStore();

  // Surf classes are now managed in the store, no local state needed

  // Filtrar actividades por categoría
  const surfActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'surf');
  const yogaActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'yoga');
  const iceBathActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'ice_bath');
  const transportActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'transport');
  const hostingActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'hosting');

  // Estado del carrusel
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const allActivities = [
    ...surfActivities,
    ...yogaActivities,
    ...iceBathActivities,
    ...transportActivities,
    ...hostingActivities
  ];
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const currentActivities = allActivities.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const hasQuantitySelector = (category: string) => {
    return ['ice_bath', 'transport', 'surf'].includes(category);
  };

  const hasTimeSelector = (category: string) => {
    return category === 'transport';
  };

  const hasYogaPackageSelector = (category: string) => {
    return category === 'yoga';
  };

  const hasSurfPackageSelector = (category: string) => {
    return category === 'surf';
  };

  const getActivityQuantity = (activityId: string) => {
    return activityQuantities[activityId] || 0;
  };

  const getSelectedTimeSlot = (activityId: string): '7:00 AM' | '3:00 PM' => {
    return selectedTimeSlots[activityId] || '7:00 AM';
  };

  const getSelectedYogaPackage = (activityId: string): '1-class' | '3-classes' | '10-classes' | undefined => {
    return selectedYogaPackages[activityId];
  };

  const getSelectedSurfPackage = (activityId: string): '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes' | undefined => {
    return selectedSurfPackages[activityId];
  };

  const getSelectedSurfClasses = (activityId: string): number => {
    return selectedSurfClasses[activityId] || 4;
  };

  const updateSurfClasses = (activityId: string, classes: number) => {
    const normalizedClasses = Math.min(10, Math.max(3, Math.round(classes)));
    setSelectedSurfClasses(activityId, normalizedClasses);
    setSelectedSurfPackage(activityId, `${normalizedClasses}-classes` as SurfPackage);

    // Ensure activity is selected when classes are chosen
    const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  // Progressive pricing calculation for surf
  const calculateSurfPrice = (classes: number): number => {
    // Price points: 3 classes = $300, 5 classes = $460, 10 classes = $890
    if (classes <= 3) return 300;
    if (classes <= 5) {
      // Interpolate between 3 and 5 classes
      const ratio = (classes - 3) / (5 - 3);
      return Math.round(300 + (460 - 300) * ratio);
    }
    if (classes <= 10) {
      // Interpolate between 5 and 10 classes
      const ratio = (classes - 5) / (10 - 5);
      return Math.round(460 + (890 - 460) * ratio);
    }
    return 890;
  };

  const updateTimeSlot = (activityId: string, timeSlot: '7:00 AM' | '3:00 PM') => {
    setSelectedTimeSlot(activityId, timeSlot);
    
    // Asegurar que la actividad esté seleccionada cuando se elige un horario
    const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateYogaPackage = (activityId: string, yogaPackage: '1-class' | '3-classes' | '10-classes') => {
    setSelectedYogaPackage(activityId, yogaPackage);
    
    // Asegurar que la actividad esté seleccionada cuando se elige un paquete
    const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateSurfPackage = (activityId: string, surfPackage: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes') => {
    setSelectedSurfPackage(activityId, surfPackage);

    const parsedClasses = parseInt(surfPackage, 10);
    if (Number.isFinite(parsedClasses)) {
      const normalizedClasses = Math.min(10, Math.max(3, parsedClasses));
      setSelectedSurfClasses(activityId, normalizedClasses);
    }
    
    // Asegurar que la actividad estAc seleccionada cuando se elige un paquete
    const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateActivityQuantity = (activityId: string, quantity: number) => {
    setActivityQuantity(activityId, quantity);
    
    // Si la cantidad es 0, remover de seleccionados
    if (quantity === 0) {
      const updatedActivities = selectedActivities.filter((a: Activity) => a.id !== activityId);
      setSelectedActivities(updatedActivities);
    } else {
      // Si la cantidad es > 0, agregar a seleccionados si no está
      const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
      if (!isSelected) {
        const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
        if (activity) {
          setSelectedActivities([...selectedActivities, activity]);
        }
      }
    }
  };

  // Inicializar cantidad por defecto para actividades con selector de cantidad
  useEffect(() => {
    const initializeQuantities = () => {
      const activitiesToInitialize = ['ice_bath', 'surf'];
      activitiesToInitialize.forEach(category => {
        const activity = AVAILABLE_ACTIVITIES.find(a => a.category === category);
        if (activity && !activityQuantities[activity.id]) {
          setActivityQuantity(activity.id, 1);
        }
      });
    };

    initializeQuantities();
  }, []);

  // Auto-select surf program as it's always included
  useEffect(() => {
    const surfActivity = AVAILABLE_ACTIVITIES.find(a => a.category === 'surf');
    if (surfActivity && !selectedActivities.some((a: Activity) => a.id === surfActivity.id)) {
      // Add surf to selected activities
      setSelectedActivities([...selectedActivities, surfActivity]);

      // Set default surf classes/package if not already set
      if (!selectedSurfClasses[surfActivity.id]) {
        setSelectedSurfClasses(surfActivity.id, 4);
      }
      if (!selectedSurfPackages[surfActivity.id]) {
        setSelectedSurfPackage(surfActivity.id, '4-classes');
      }
    }
  }, [AVAILABLE_ACTIVITIES, selectedActivities, selectedSurfClasses, selectedSurfPackages]);

  const toggleActivity = (activityId: string) => {
    const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
    if (!activity) return;

    if (activity.category === 'surf' || activity.category === 'yoga') {
      // Para surf y yoga, solo se puede seleccionar UN paquete de cada categoría
      const otherActivitiesInCategory = selectedActivities.filter(
        (a: Activity) => a.category === activity.category && a.id !== activityId
      );
      const activitiesFromOtherCategories = selectedActivities.filter(
        (a: Activity) => a.category !== activity.category
      );
      
      // Permitir seleccionar la actividad sin paquete
      // El usuario puede seleccionar el paquete después si lo desea
      
      setSelectedActivities([...activitiesFromOtherCategories, activity]);
    } else if (hasQuantitySelector(activity.category)) {
      // Para actividades con selector de cantidad, NO cambiar la cantidad al tocar la card
      // Solo agregar/remover de seleccionados si no está seleccionada
      const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
      if (!isSelected) {
        // Si no está seleccionada, agregarla con cantidad 1 si no tiene cantidad
        const currentQuantity = getActivityQuantity(activityId);
        if (currentQuantity === 0) {
          updateActivityQuantity(activityId, 1);
        } else {
          setSelectedActivities([...selectedActivities, activity]);
        }
      } else {
        // Si está seleccionada, removerla
        const updatedActivities = selectedActivities.filter((a: Activity) => a.id !== activityId);
        setSelectedActivities(updatedActivities);
      }
    } else {
      // Para otras actividades (hosting, etc.), toggle simple
      const isSelected = selectedActivities.some((a: Activity) => a.id === activityId);
      if (isSelected) {
        const updatedActivities = selectedActivities.filter((a: Activity) => a.id !== activityId);
        setSelectedActivities(updatedActivities);
      } else {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const handleActivityToggle = (activity: any) => {
    toggleActivity(activity.id);
  };

  const handleContinue = async () => {
    // Si no hay fechas seleccionadas, simplemente navegar al siguiente paso
    if (!bookingData.checkIn || !bookingData.checkOut) {
      setCurrentStep('dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare activity data with quantities and packages
      const activitiesWithQuantities = selectedActivities.map((activity: Activity) => {
        let quantity = 1;
        let packageInfo: string | null = null;
        let classCount: number | null = null;
        
        if (activity.category === 'yoga') {
          const yogaPackage = getSelectedYogaPackage(activity.id);
          if (yogaPackage) {
            packageInfo = yogaPackage;
          }
        } else if (activity.category === 'surf') {
          const surfPackage = getSelectedSurfPackage(activity.id);
          const surfClasses = getSelectedSurfClasses(activity.id);
          if (surfPackage) {
            packageInfo = surfPackage;
          }
          if (surfClasses) {
            classCount = surfClasses;
          }
        } else {
          quantity = activityQuantities[activity.id] || 1;
        }
        
        return {
          activityId: activity.id,
          quantity,
          package: packageInfo,
          classCount
        };
      });

      // Convertir fechas Date objects a formato ISO string para la API
      const formatDateForAPI = (date: Date | string) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      // Enviar al endpoint de quote
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn: formatDateForAPI(bookingData.checkIn!),
          checkOut: formatDateForAPI(bookingData.checkOut!),
          guests: bookingData.guests || 1,
          roomTypeId: bookingData.roomTypeId!,
          activities: activitiesWithQuantities
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar la cotización');
      }

      const quoteData = await response.json();
      setPriceBreakdown(quoteData.priceBreakdown);
      setCurrentStep('contact');
    } catch (error) {
      console.error('Error processing activities:', error);
      setError(t('activities.errorProcessing'));
    } finally {
      setLoading(false);
    }
  };

  // Crear la función renderActivityCard usando la función factory con useMemo para actualizar cuando cambien las dependencias
  const renderActivityCard = useMemo(() => createRenderActivityCard(
    selectedActivities,
    activityQuantities,
    bookingData,
    getSelectedYogaPackage,
    getSelectedSurfPackage,
    getSelectedSurfClasses,
    updateSurfClasses,
    calculateSurfPrice,
    getActivityTotalPrice,
    formatCurrency,
    hasQuantitySelector,
    hasTimeSelector,
    hasYogaPackageSelector,
    hasSurfPackageSelector,
    getActivityQuantity,
    getSelectedTimeSlot,
    updateTimeSlot,
    updateYogaPackage,
    updateSurfPackage,
    updateActivityQuantity,
    handleActivityToggle,
    (activityId: string) => {
      // Remover de actividades seleccionadas
      const updatedActivities = selectedActivities.filter((a: Activity) => a.id !== activityId);
      setSelectedActivities(updatedActivities);
      // Clear surf classes from store if it's a surf activity
      const activity = AVAILABLE_ACTIVITIES.find((a: Activity) => a.id === activityId);
      if (activity && activity.category === 'surf') {
        setSelectedSurfClasses(activityId, 4); // Reset to default
        setSelectedSurfPackage(activityId, '4-classes');
      }
    },
    t,
    locale
  ), [
    selectedActivities,
    activityQuantities,
    bookingData, // Include full bookingData object
    selectedSurfClasses,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedTimeSlots,
    t,
    locale,
    // Also include the functions that could change
    getSelectedYogaPackage,
    getSelectedSurfPackage,
    getSelectedSurfClasses,
    getActivityQuantity,
    getSelectedTimeSlot
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          {/* Título y subtítulo */}
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="font-heading">{t('activities.title')}</span>
            </h2>
            <p className="text-accent-200 text-lg mt-2">{t('activities.subtitle')}</p>
          </div>
        </div>
      </div>



      {/* Carrusel de actividades */}
      <div className="px-4">
        <div className="relative">
          {/* Flecha izquierda */}
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Flecha derecha */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Grid de actividades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {currentActivities.map((activity, index) => (
              <div key={activity.id} className="w-full">
                {renderActivityCard(activity)}
              </div>
            ))}
          </div>

          {/* Indicadores de página */}
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentPage ? 'bg-accent-200 w-8' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={selectedActivities.length === 0}
          className="flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-ocean-600 hover:bg-ocean-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          <span>{t('activities.selectDates')}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Mensaje de ayuda */}
      {selectedActivities.length === 0 && (
        <div className="mt-4 text-center text-base text-accent-200 bg-white/10 rounded-lg p-3 border border-white/20">
          💡 {t('activities.selectAtLeastOne')}
        </div>
      )}
    </motion.div>
  );
} 









