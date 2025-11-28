import { Activity } from '@/types';
import { ACTIVITY_PRICES } from './prices';

// Base activity structure without localized content
export const ACTIVITY_BASE_DATA = [
  {
    id: 'surf-package',
    price: ACTIVITY_PRICES.surf.basePrice,
    duration: 480,
    maxParticipants: 2,
    category: 'surf' as const,
  },
  {
    id: 'yoga-package',
    price: ACTIVITY_PRICES.yoga.basePrice,
    duration: 60,
    maxParticipants: 15,
    category: 'yoga' as const,
  },
  {
    id: 'ice-bath-session',
    price: ACTIVITY_PRICES.ice_bath.basePrice,
    duration: 45,
    maxParticipants: 1,
    category: 'ice_bath' as const,
  },
  {
    id: 'transport-airport',
    price: ACTIVITY_PRICES.transport.basePrice,
    duration: 360,
    maxParticipants: 8,
    category: 'transport' as const,
  },
  {
    id: 'hosting-service',
    price: ACTIVITY_PRICES.hosting.basePrice,
    duration: 0,
    maxParticipants: 1,
    category: 'hosting' as const,
  },
];

// Localized activity content
export const ACTIVITY_TRANSLATIONS = {
  es: {
    'surf-package': {
      name: 'Programa de Surf - Domina las Olas',
      description: 'Aprende a surfear como un profesional en Santa Teresa. Lecciones personalizadas, videoanálisis exclusivo y material completo. Tabla y lycra incluidos. Instructores certificados. Grupos reducidos.',
    },
    'yoga-package': {
      name: 'Yoga Matutino - Alinea tu Cuerpo y Mente',
      description: 'Comienza el día centrado y energizado con sesiones frente al océano dirigidas por instructores certificados. Clases matutinas frente al océano. Mats y accesorios incluidos. Flujo suave, adecuado para todos los niveles. Grupos pequeños para atención personal.',
    },
    'ice-bath-session': {
      name: 'Terapia de Baño de Hielo - Recarga tu Cuerpo',
      description: 'Siéntete vivo, recupérate más rápido y mejora tu estado de ánimo con una inmersión en frío guiada. Respiración guiada y preparación de movimiento. Recuperación inmediata para músculos adoloridos. Regeneración perfecta post-surf. Experiencia privada 1:1.',
    },
    'transport-airport': {
      name: 'Transporte Aeropuerto San José',
      description: 'Transporte terrestre desde/hacia el Aeropuerto Internacional Juan Santamaría (SJO) en San José.',
    },
    'hosting-service': {
      name: 'Servicio de Hosting',
      description: 'Organización personalizada de actividades y acompañamiento durante tu estadía. Incluye planificación de horarios, coordinación con instructores y asistencia personalizada.',
    },
  },
  en: {
    'surf-package': {
      name: 'Surf Program - Ride the Wave',
      description: 'Learn to Surf Like a Pro in Santa Teresa. Personalized lessons, video analysis, and exclusive materials. Board and wetsuit included. Certified instructors. Small groups.',
    },
    'yoga-package': {
      name: 'Morning Yoga - Align Your Body & Mind',
      description: 'Start your day grounded and energized with ocean-view sessions led by certified instructors. Oceanfront morning classes. Mats & props included. Gentle flow, suitable for all levels. Small group size for personal attention.',
    },
    'ice-bath-session': {
      name: 'Ice Bath Therapy - Recharge Your Body',
      description: 'Feel alive, recover faster, and boost your mood with a guided cold immersion. Guided breathwork & movement prep. Immediate recovery for sore muscles. Perfect post-surf regeneration. Private, 1:1 experience.',
    },
    'transport-airport': {
      name: 'San José Airport Transport',
      description: 'Ground transportation to/from Juan Santamaría International Airport (SJO) in San José.',
    },
    'hosting-service': {
      name: 'Hosting Service',
      description: 'Personalized activity organization and accompaniment during your stay. Includes schedule planning, instructor coordination and personalized assistance.',
    },
  },
};

// Function to get localized activities
export function getLocalizedActivities(locale: 'es' | 'en'): Activity[] {
  return ACTIVITY_BASE_DATA.map(baseActivity => ({
    ...baseActivity,
    name: ACTIVITY_TRANSLATIONS[locale][baseActivity.id as keyof typeof ACTIVITY_TRANSLATIONS[typeof locale]]?.name || baseActivity.id,
    description: ACTIVITY_TRANSLATIONS[locale][baseActivity.id as keyof typeof ACTIVITY_TRANSLATIONS[typeof locale]]?.description || '',
  }));
}

// Keep the old export for backward compatibility, defaulting to Spanish
export const AVAILABLE_ACTIVITIES: Activity[] = getLocalizedActivities('es');

export const getActivityById = (id: string): Activity | undefined => {
  return AVAILABLE_ACTIVITIES.find(activity => activity.id === id);
};

export const getActivitiesByCategory = (category: Activity['category']): Activity[] => {
  return AVAILABLE_ACTIVITIES.filter(activity => activity.category === category);
};

export const calculateActivitiesTotal = (selectedActivities: Activity[], guests: number): number => {
  return selectedActivities.reduce((total, activity) => {
    return total + (activity.price * guests);
  }, 0);
}; 