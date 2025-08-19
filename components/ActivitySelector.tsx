'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { AVAILABLE_ACTIVITIES } from '@/lib/activities';
import { getActivityTotalPrice } from '@/lib/prices';
import { formatCurrency } from '@/lib/utils';

// Función para renderizar las tarjetas de actividad (debe estar fuera del componente principal)
const createRenderActivityCard = (
  selectedActivities: any[],
  activityQuantities: Record<string, number>,
  bookingData: any,
  getSelectedYogaPackage: (id: string) => string | null,
  getSelectedSurfPackage: (id: string) => string | null,
  getActivityTotalPrice: (category: string, packageType: string, guests: number) => number,
  formatCurrency: (amount: number) => string,
  hasQuantitySelector: (category: string) => boolean,
  hasTimeSelector: (category: string) => boolean,
  hasYogaPackageSelector: (category: string) => boolean,
  hasSurfPackageSelector: (category: string) => boolean,
  getActivityQuantity: (id: string) => number,
  getSelectedTimeSlot: (id: string) => string,
  updateTimeSlot: (id: string, timeSlot: '7:00 AM' | '3:00 PM') => void,
  updateYogaPackage: (id: string, packageType: '1-class' | '3-classes' | '10-classes') => void,
  updateSurfPackage: (id: string, packageType: '4-classes' | '5-classes' | '6-classes') => void,
  updateActivityQuantity: (id: string, quantity: number) => void,
  handleActivityToggle: (activity: any) => void,
  clearActivity: (activityId: string) => void
) => {
  return (activity: any) => {
    const isSelected = selectedActivities.some((a: any) => a.id === activity.id);
    const quantity = activityQuantities[activity.id] || (isSelected ? 1 : 0);
    
    let totalPrice: number;
    if (activity.category === 'yoga') {
      const yogaPackage = getSelectedYogaPackage(activity.id);
      if (!yogaPackage) {
        totalPrice = 0;
      } else {
        totalPrice = getActivityTotalPrice('yoga', yogaPackage, bookingData.guests || 1);
      }
    } else if (activity.category === 'surf') {
      const surfPackage = getSelectedSurfPackage(activity.id);
      if (!surfPackage) {
        totalPrice = 0;
      } else {
        totalPrice = getActivityTotalPrice('surf', surfPackage, bookingData.guests || 1);
      }
    } else if (activity.category === 'ice_bath') {
      totalPrice = activity.price * quantity * (bookingData.guests || 1);
    } else if (activity.category === 'transport') {
      totalPrice = activity.price * quantity * (bookingData.guests || 1);
    } else {
      totalPrice = activity.price * (bookingData.guests || 1);
    }

    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card cursor-pointer transition-all duration-300 h-[500px] bg-white/5 border-gray-600 flex flex-col ${
          isSelected ? 'ring-2 ring-ocean-500 bg-white/10 border-ocean-500' : 'hover:bg-white/10 hover:border-gray-500'
        }`}
        onClick={() => handleActivityToggle(activity)}
      >
        {/* Header con título y precio en la misma línea */}
        <div className="flex items-start justify-between mb-4">
          <h3 className={`text-xl font-bold ${
            activity.category === 'transport' ? 'text-warm-400' : 'text-accent-200'
          }`}>
            {activity.category === 'surf' && 'Clases de Surf'}
            {activity.category === 'yoga' && 'Sesiones de Yoga'}
            {activity.category === 'ice_bath' && 'Baños de Hielo'}
            {activity.category === 'transport' && 'Transporte Aeropuerto'}
            {activity.category === 'hosting' && 'Servicios de Hosting'}
          </h3>
          
          {/* Precio */}
          {((activity.category === 'yoga' && getSelectedYogaPackage(activity.id)) || 
            (activity.category === 'surf' && getSelectedSurfPackage(activity.id)) || 
            activity.category !== 'yoga' && activity.category !== 'surf') && (
            <div className="text-right flex flex-col items-end">
              <p className="font-bold text-blue-300 text-lg">
                {activity.category === 'yoga' 
                  ? formatCurrency(getActivityTotalPrice('yoga', getSelectedYogaPackage(activity.id)!, quantity))
                  : activity.category === 'surf'
                  ? formatCurrency(getActivityTotalPrice('surf', getSelectedSurfPackage(activity.id)!, quantity))
                  : formatCurrency(activity.price * quantity)
                }
              </p>
              <p className="text-xs text-white">
                {activity.category === 'yoga' 
                  ? 'por programa'
                  : activity.category === 'surf'
                  ? 'por programa'
                  : activity.category === 'ice_bath' ? 
                    (quantity > 1 ? `por ${quantity} sesiones` : 'por sesión') : 
                 activity.category === 'transport' ? 
                   (quantity > 1 ? `por ${quantity} viajes` : 'por viaje') : 
                 'por persona'}
              </p>
            </div>
          )}
        </div>

        {/* Descripción */}
        <p className="text-white text-base mb-4">{activity.description}</p>

        {/* Duración */}
        {activity.duration > 0 && (
          <div className="mb-4">
            <span className="text-sm text-white">
              {activity.category === 'transport' ? '6 horas' : 
               activity.category === 'surf' ? 
                 (() => {
                   const surfPackage = getSelectedSurfPackage(activity.id);
                   if (surfPackage === '4-classes') return '480 min';
                   if (surfPackage === '5-classes') return '600 min';
                   if (surfPackage === '6-classes') return '720 min';
                   return '480 min'; // default
                 })()
               : `${activity.duration} min`}
            </span>
          </div>
        )}

        {/* Selector de cantidad */}
        {hasQuantitySelector(activity.category) && (
          <div className="mb-4">
            {/* Selector de cantidad de personas */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {activity.category === 'surf' ? 'Cantidad de personas:' : 'Cantidad de personas:'}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActivityQuantity(activity.id, Math.max(0, quantity - 1));
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-medium text-white">{quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const maxQuantity = activity.category === 'surf' ? 2 : 3;
                      updateActivityQuantity(activity.id, Math.min(maxQuantity, quantity + 1));
                    }}
                    disabled={activity.category === 'surf' ? quantity >= 2 : quantity >= 3}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Selector de cantidad de sesiones para ice bath */}
            {activity.category === 'ice_bath' && (
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Cantidad de sesiones:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentSessions = activityQuantities[`${activity.id}_sessions`] || 1;
                        updateActivityQuantity(`${activity.id}_sessions`, Math.max(1, currentSessions - 1));
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-medium text-white">
                      {activityQuantities[`${activity.id}_sessions`] || 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentSessions = activityQuantities[`${activity.id}_sessions`] || 1;
                        updateActivityQuantity(`${activity.id}_sessions`, Math.min(10, currentSessions + 1));
                      }}
                      disabled={(activityQuantities[`${activity.id}_sessions`] || 1) >= 10}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selector de horario para transporte */}
        {hasTimeSelector(activity.category) && (
          <div className="mb-4">
            <div className="mb-3">
              <span className="text-sm font-medium text-white">Horario de recogida:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['7:00 AM', '3:00 PM'].map((timeSlot) => (
                <button
                  key={timeSlot}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTimeSlot(activity.id, timeSlot);
                  }}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    getSelectedTimeSlot(activity.id) === timeSlot
                      ? 'border-warm-500 bg-white/10 text-white'
                      : 'border-white/20 bg-transparent hover:border-white/40 hover:bg-white/5 text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{timeSlot}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de paquete de yoga */}
        {hasYogaPackageSelector(activity.category) && (
          <div className="mb-4">
            <div className="mb-3">
              <span className="text-sm font-medium text-white">Selecciona tu Plan de Progreso Personalizado:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { value: '1-class', label: '1', price: 12, description: 'Clase' },
                { value: '3-classes', label: '3', price: 30, description: 'Clases' },
                { value: '10-classes', label: '10', price: 80, description: 'Clases' }
              ].map((packageOption) => {
                const isSelected = getSelectedYogaPackage(activity.id) === packageOption.value;
                const packagePrice = packageOption.price * (bookingData.guests || 1);
                
                return (
                  <button
                    key={packageOption.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateYogaPackage(activity.id, packageOption.value);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-warm-500 bg-white/10 text-white'
                        : 'border-white/20 bg-transparent hover:border-white/40 hover:bg-white/5 text-white'
                    }`}
                  >
                    <div className="text-lg font-bold text-white">{packageOption.label}</div>
                    <div className="text-sm text-white mt-1">{packageOption.description}</div>
                    <div className="text-lg font-bold text-white mt-2">${packagePrice}</div>
                  </button>
                );
              })}
            </div>
            
            {/* Botón Clear para yoga */}
            <div className="text-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearActivity(activity.id);
                }}
                className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Selector de paquete de surf */}
        {hasSurfPackageSelector(activity.category) && (
          <div className="mb-4">
            <div className="mb-3">
              <span className="text-sm font-medium text-white">Selecciona tu Plan de Progreso Personalizado:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: '4-classes', label: '4', price: 400, description: 'Clases' },
                { value: '5-classes', label: '5', price: 500, description: 'Clases' },
                { value: '6-classes', label: '6', price: 600, description: 'Clases' }
              ].map((packageOption) => {
                const isSelected = getSelectedSurfPackage(activity.id) === packageOption.value;
                const packagePrice = packageOption.price * (bookingData.guests || 1);
                
                return (
                  <button
                    key={packageOption.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSurfPackage(activity.id, packageOption.value);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-ocean-500 bg-white/10 text-white'
                        : 'border-white/20 bg-transparent hover:border-white/40 hover:bg-white/5 text-white'
                    }`}
                  >
                    <div className="text-lg font-bold text-white">{packageOption.label}</div>
                    <div className="text-sm text-white mt-1">{packageOption.description}</div>
                    <div className="text-lg font-bold text-white mt-2">${packagePrice}</div>
                  </button>
                );
              })}
            </div>
            
            {/* Botón Clear para surf */}
            <div className="text-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearActivity(activity.id);
                }}
                className="text-sm text-blue-300 hover:text-blue-200 underline transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}




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
  const { t } = useI18n();
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
    selectedTimeSlots,
    selectedYogaPackages,
    selectedSurfPackages,
    setPriceBreakdown,
    setError
  } = useBookingStore();

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

  const getSelectedTimeSlot = (activityId: string) => {
    return selectedTimeSlots[activityId] || '7:00 AM';
  };

  const getSelectedYogaPackage = (activityId: string) => {
    return selectedYogaPackages[activityId];
  };

  const getSelectedSurfPackage = (activityId: string) => {
    return selectedSurfPackages[activityId];
  };

  const updateTimeSlot = (activityId: string, timeSlot: '7:00 AM' | '3:00 PM') => {
    setSelectedTimeSlot(activityId, timeSlot);
    
    // Asegurar que la actividad esté seleccionada cuando se elige un horario
    const isSelected = selectedActivities.some((a: any) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: any) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateYogaPackage = (activityId: string, yogaPackage: '1-class' | '3-classes' | '10-classes') => {
    setSelectedYogaPackage(activityId, yogaPackage);
    
    // Asegurar que la actividad esté seleccionada cuando se elige un paquete
    const isSelected = selectedActivities.some((a: any) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: any) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateSurfPackage = (activityId: string, surfPackage: '4-classes' | '5-classes' | '6-classes') => {
    setSelectedSurfPackage(activityId, surfPackage);
    
    // Asegurar que la actividad esté seleccionada cuando se elige un paquete
    const isSelected = selectedActivities.some((a: any) => a.id === activityId);
    if (!isSelected) {
      const activity = AVAILABLE_ACTIVITIES.find((a: any) => a.id === activityId);
      if (activity) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const updateActivityQuantity = (activityId: string, quantity: number) => {
    setActivityQuantity(activityId, quantity);
    
    // Si la cantidad es 0, remover de seleccionados
    if (quantity === 0) {
      const updatedActivities = selectedActivities.filter((a: any) => a.id !== activityId);
      setSelectedActivities(updatedActivities);
    } else {
      // Si la cantidad es > 0, agregar a seleccionados si no está
      const isSelected = selectedActivities.some((a: any) => a.id === activityId);
      if (!isSelected) {
        const activity = AVAILABLE_ACTIVITIES.find((a: any) => a.id === activityId);
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

  const toggleActivity = (activityId: string) => {
    const activity = AVAILABLE_ACTIVITIES.find((a: any) => a.id === activityId);
    if (!activity) return;

    if (activity.category === 'surf' || activity.category === 'yoga') {
      // Para surf y yoga, solo se puede seleccionar UN paquete de cada categoría
      const otherActivitiesInCategory = selectedActivities.filter(
        (a: any) => a.category === activity.category && a.id !== activityId
      );
      const activitiesFromOtherCategories = selectedActivities.filter(
        (a: any) => a.category !== activity.category
      );
      
      // Permitir seleccionar la actividad sin paquete
      // El usuario puede seleccionar el paquete después si lo desea
      
      setSelectedActivities([...activitiesFromOtherCategories, activity]);
    } else if (hasQuantitySelector(activity.category)) {
      // Para actividades con selector de cantidad, NO cambiar la cantidad al tocar la card
      // Solo agregar/remover de seleccionados si no está seleccionada
      const isSelected = selectedActivities.some((a: any) => a.id === activityId);
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
        const updatedActivities = selectedActivities.filter((a: any) => a.id !== activityId);
        setSelectedActivities(updatedActivities);
      }
    } else {
      // Para otras actividades (hosting, etc.), toggle simple
      const isSelected = selectedActivities.some((a: any) => a.id === activityId);
      if (isSelected) {
        const updatedActivities = selectedActivities.filter((a: any) => a.id !== activityId);
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
      const activitiesWithQuantities = selectedActivities.map(activity => {
        let quantity = 1;
        let packageInfo = null;
        
        if (activity.category === 'yoga') {
          const yogaPackage = getSelectedYogaPackage(activity.id);
          if (yogaPackage) {
            packageInfo = yogaPackage;
          }
        } else if (activity.category === 'surf') {
          const surfPackage = getSelectedSurfPackage(activity.id);
          if (surfPackage) {
            packageInfo = surfPackage;
          }
        } else {
          quantity = activityQuantities[activity.id] || 1;
        }
        
        return {
          activityId: activity.id,
          quantity,
          package: packageInfo
        };
      });

      // Enviar al endpoint de quote
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          roomId: bookingData.roomId,
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
      setError('Error procesando actividades. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Crear la función renderActivityCard usando la función factory
  const renderActivityCard = createRenderActivityCard(
    selectedActivities,
    activityQuantities,
    bookingData,
    getSelectedYogaPackage,
    getSelectedSurfPackage,
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
      const updatedActivities = selectedActivities.filter(a => a.id !== activityId);
      setSelectedActivities(updatedActivities);
    }
  );

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
              <span className="font-heading">Actividades</span>
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
          <span>Seleccionar Fechas</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Mensaje de ayuda */}
      {selectedActivities.length === 0 && (
        <div className="mt-4 text-center text-base text-accent-200 bg-white/10 rounded-lg p-3 border border-white/20">
          💡 Selecciona al menos una actividad para continuar
        </div>
      )}
    </motion.div>
  );
} 