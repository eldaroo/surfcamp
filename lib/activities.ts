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
      name: 'Programa de Surf',
      description: 'Clases de surf especializadas para cada nivel + videoanálisis personalizado + material de video y fotográfico. Incluye tabla y lycra.',
    },
    'yoga-package': {
      name: 'Sesiones de Yoga',
      description: 'Sesiones de yoga al amanecer para comenzar el día con energía y equilibrio. Elige el paquete que mejor se adapte a tu estadía.',
    },
    'ice-bath-session': {
      name: 'Baños de Hielo',
      description: 'Sesión 1:1 de terapia de frío para regeneración completa. Incluye movimiento y técnicas de respiración para máxima recuperación.',
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
      name: 'Surf Program',
      description: 'Specialized surf classes for every level + personalized video analysis + video and photo material. Includes board and wetsuit.',
    },
    'yoga-package': {
      name: 'Yoga Sessions',
      description: 'Sunrise yoga sessions to start the day with energy and balance. Choose the package that best fits your stay.',
    },
    'ice-bath-session': {
      name: 'Ice Baths',
      description: '1:1 cold therapy session for complete regeneration. Includes movement and breathing techniques for maximum recovery.',
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