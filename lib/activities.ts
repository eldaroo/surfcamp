import { Activity } from '@/types';
import { ACTIVITY_PRICES } from './prices';

export const AVAILABLE_ACTIVITIES: Activity[] = [
  {
    id: 'surf-package',
    name: 'Programa de Surf',
    description: 'Clases de surf especializadas para cada nivel + videoanálisis personalizado + material de video y fotográfico. Incluye tabla y lycra.',
    price: ACTIVITY_PRICES.surf.basePrice,
    duration: 480,
    maxParticipants: 2,
    category: 'surf',
  },
  {
    id: 'yoga-package',
    name: 'Clases de Yoga',
    description: 'Sesiones de yoga al amanecer para comenzar el día con energía y equilibrio. Elige el paquete que mejor se adapte a tu estadía.',
    price: ACTIVITY_PRICES.yoga.basePrice,
    duration: 60,
    maxParticipants: 15,
    category: 'yoga',
  },
  {
    id: 'ice-bath-session',
    name: 'Baño de Hielo Individual',
    description: 'Sesión 1:1 de terapia de frío para regeneración completa. Incluye movimiento y técnicas de respiración para máxima recuperación.',
    price: ACTIVITY_PRICES.ice_bath.basePrice,
    duration: 45,
    maxParticipants: 1,
    category: 'ice_bath',
  },
  {
    id: 'transport-airport',
    name: 'Transporte Aeropuerto San José',
    description: 'Transporte terrestre desde/hacia el Aeropuerto Internacional Juan Santamaría (SJO) en San José.',
    price: ACTIVITY_PRICES.transport.basePrice,
    duration: 360,
    maxParticipants: 8,
    category: 'transport',
  },
  {
    id: 'hosting-service',
    name: 'Servicio de Hosting',
    description: 'Organización personalizada de actividades y acompañamiento durante tu estadía. Incluye planificación de horarios, coordinación con instructores y asistencia personalizada.',
    price: ACTIVITY_PRICES.hosting.basePrice,
    duration: 0,
    maxParticipants: 1,
    category: 'hosting',
  },
];

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