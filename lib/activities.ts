import { Activity } from '@/types';

export const AVAILABLE_ACTIVITIES: Activity[] = [
  {
    id: 'surf-package-4',
    name: 'Paquete Surf Básico',
    description: '4 clases de surf con instructor certificado. Incluye tabla y lycra.',
    price: 320,
    duration: 480,
    maxParticipants: 2,
    category: 'surf',
  },
  {
    id: 'surf-package-5',
    name: 'Paquete Surf Intermedio',
    description: '5 clases de surf + videoanálisis personalizado + material de video y fotográfico. Incluye tabla y lycra.',
    price: 500,
    duration: 600,
    maxParticipants: 2,
    category: 'surf',
  },
  {
    id: 'surf-package-6',
    name: 'Paquete Surf Avanzado',
    description: '6 clases de surf + videoanálisis personalizado + material de video y fotográfico. Incluye tabla y lycra.',
    price: 600,
    duration: 720,
    maxParticipants: 2,
    category: 'surf',
  },
  {
    id: 'yoga-morning',
    name: 'Yoga Matutino',
    description: 'Sesión de yoga al amanecer para comenzar el día con energía y equilibrio.',
    price: 10,
    duration: 60,
    maxParticipants: 15,
    category: 'yoga',
  },
  {
    id: 'ice-bath-session',
    name: 'Baño de Hielo Individual',
    description: 'Sesión individual de terapia de frío para recuperación y bienestar mental.',
    price: 25,
    duration: 30,
    maxParticipants: 1,
    category: 'ice_bath',
  },
  {
    id: 'transport-airport-7am',
    name: 'Transporte Aeropuerto - 7:00 AM',
    description: 'Transporte terrestre desde/hacia el aeropuerto. Salida a las 7:00 AM.',
    price: 50,
    duration: 360,
    maxParticipants: 8,
    category: 'transport',
  },
  {
    id: 'transport-airport-3pm',
    name: 'Transporte Aeropuerto - 3:00 PM',
    description: 'Transporte terrestre desde/hacia el aeropuerto. Salida a las 3:00 PM.',
    price: 50,
    duration: 360,
    maxParticipants: 8,
    category: 'transport',
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