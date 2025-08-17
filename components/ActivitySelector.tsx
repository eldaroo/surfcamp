'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ChevronRight, ActivityIcon } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { AVAILABLE_ACTIVITIES } from '@/lib/activities';
import { getActivityTotalPrice } from '@/lib/prices';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

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



  // Remover estado local, usar solo el store global
  // const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<string, '7:00 AM' | '3:00 PM'>>({});
  // const [selectedYogaPackages, setSelectedYogaPackages] = useState<Record<string, '1-class' | '3-classes' | '10-classes'>>({});
  // const [selectedSurfPackages, setSelectedSurfPackages] = useState<Record<string, '4-classes' | '5-classes' | '6-classes'>>({});

  const hasQuantitySelector = (category: string) => {
    return ['ice_bath', 'transport'].includes(category);
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

  const toggleActivity = (activity: any) => {
    if (activity.category === 'surf' || activity.category === 'yoga') {
      // Para surf y yoga, solo se puede seleccionar UN paquete de cada categoría
      const otherActivitiesInCategory = selectedActivities.filter(
        (a: any) => a.category === activity.category && a.id !== activity.id
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
      const isSelected = selectedActivities.some((a: any) => a.id === activity.id);
      if (!isSelected) {
        // Si no está seleccionada, agregarla con cantidad 1 si no tiene cantidad
        const currentQuantity = getActivityQuantity(activity.id);
        if (currentQuantity === 0) {
          updateActivityQuantity(activity.id, 1);
        } else {
          setSelectedActivities([...selectedActivities, activity]);
        }
      } else {
        // Si está seleccionada, removerla
        const updatedActivities = selectedActivities.filter((a: any) => a.id !== activity.id);
        setSelectedActivities(updatedActivities);
      }
    } else {
      // Para otras actividades (hosting, etc.), toggle simple
      const isSelected = selectedActivities.some((a: any) => a.id === activity.id);
      if (isSelected) {
        const updatedActivities = selectedActivities.filter((a: any) => a.id !== activity.id);
        setSelectedActivities(updatedActivities);
      } else {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const handleActivityToggle = (activity: any) => {
    toggleActivity(activity);
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

      const quoteResponse = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          activities: activitiesWithQuantities,
        }),
      });

      const quoteData = await quoteResponse.json();

      if (!quoteResponse.ok) {
        throw new Error(quoteData.error || 'Error calculating quote');
      }

      setPriceBreakdown(quoteData.priceBreakdown);
      setCurrentStep('contact');
    } catch (error) {
      console.error('Error processing activities:', error);
      setError('Error procesando actividades. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderActivityCard = (activity: any) => {
    const isSelected = selectedActivities.some((a: any) => a.id === activity.id);
    const quantity = activityQuantities[activity.id] || (isSelected ? 1 : 0);
    
    let totalPrice: number;
    if (activity.category === 'yoga') {
      // Para yoga, el precio depende del paquete seleccionado
      const yogaPackage = getSelectedYogaPackage(activity.id);
      if (!yogaPackage) {
        totalPrice = 0; // No hay paquete seleccionado, pero la actividad está seleccionada
      } else {
        totalPrice = getActivityTotalPrice('yoga', yogaPackage, bookingData.guests || 1);
      }
    } else if (activity.category === 'surf') {
      // Para surf, el precio depende del paquete seleccionado
      const surfPackage = getSelectedSurfPackage(activity.id);
      if (!surfPackage) {
        totalPrice = 0; // No hay paquete seleccionado, pero la actividad está seleccionada
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
        className={`card cursor-pointer transition-all duration-300 card-hover-gold min-h-[280px] ${
          isSelected ? 'selected-gold' : 'hover:border-warm-300'
        }`}
        onClick={() => handleActivityToggle(activity)}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex-1 mr-4">{activity.name}</h3>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-ocean-600">
              {activity.category === 'yoga' 
                ? (() => {
                    const yogaPackage = getSelectedYogaPackage(activity.id);
                    if (!yogaPackage) return 'Selecciona paquete';
                    return formatCurrency(getActivityTotalPrice('yoga', yogaPackage));
                  })()
                : activity.category === 'surf'
                ? (() => {
                    const surfPackage = getSelectedSurfPackage(activity.id);
                    if (!surfPackage) return 'Selecciona paquete';
                    return formatCurrency(getActivityTotalPrice('surf', surfPackage));
                  })()
                : formatCurrency(activity.price)
              }
            </p>
            <p className="text-xs text-gray-500">
              {activity.category === 'yoga' 
                ? (getSelectedYogaPackage(activity.id) ? 'por clase' : '')
                : activity.category === 'surf'
                ? (getSelectedSurfPackage(activity.id) ? 'por clase' : '')
                : activity.category === 'ice_bath' ? 'por sesión' : 
               activity.category === 'transport' ? 'por viaje' : 
               'por persona'}
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">{activity.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          {activity.duration > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {activity.category === 'transport' ? '6 horas' : `${activity.duration} min`}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Máx. {activity.maxParticipants}</span>
          </div>
        </div>

        {/* Selector de cantidad */}
        {hasQuantitySelector(activity.category) && (
          <div className={`rounded-lg p-4 mb-4 ${
            activity.category === 'yoga' ? 'bg-warm-50' : 
            activity.category === 'ice_bath' ? 'bg-accent-50' : 
            'bg-warm-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warm-700">
                {activity.category === 'yoga' ? 'Cantidad de clases:' :
                 activity.category === 'ice_bath' ? 'Cantidad de sesiones:' :
                 'Cantidad de viajes:'}
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateActivityQuantity(activity.id, Math.max(0, quantity - 1));
                  }}
                  className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-300 transition-colors"
                  disabled={quantity <= 0}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-warm-900">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateActivityQuantity(activity.id, quantity + 1);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${
                    activity.category === 'yoga' ? 'bg-warm-500 hover:bg-warm-600' :
                    activity.category === 'ice_bath' ? 'bg-accent-500 hover:bg-accent-600' :
                    'bg-warm-600 hover:bg-warm-700'
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selector de horario para transporte */}
        {hasTimeSelector(activity.category) && quantity > 0 && (
          <div className="bg-warm-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warm-700">
                Horario de salida:
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTimeSlot(activity.id, '7:00 AM');
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    getSelectedTimeSlot(activity.id) === '7:00 AM'
                      ? 'bg-warm-600 text-white'
                      : 'bg-warm-200 text-warm-700 hover:bg-warm-300'
                  }`}
                >
                  7:00 AM
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTimeSlot(activity.id, '3:00 PM');
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    getSelectedTimeSlot(activity.id) === '3:00 PM'
                      ? 'bg-warm-600 text-white'
                      : 'bg-warm-200 text-warm-700 hover:bg-warm-300'
                  }`}
                >
                  3:00 PM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selector de paquete para yoga */}
        {hasYogaPackageSelector(activity.category) && (
          <div className="bg-warm-50 rounded-lg p-4 mb-4">
            <div className="space-y-3">
              <span className="text-sm font-medium text-warm-700 block">
                Selecciona tu paquete:
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateYogaPackage(activity.id, '1-class');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedYogaPackage(activity.id) === '1-class'
                      ? 'border-warm-600 bg-warm-100 text-warm-800 shadow-md'
                      : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300 hover:bg-warm-50'
                  }`}
                >
                  <div className="font-semibold text-lg">1</div>
                  <div className="text-xs">Clase</div>
                  <div className="font-bold text-sm mt-1">$12</div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateYogaPackage(activity.id, '3-classes');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedYogaPackage(activity.id) === '3-classes'
                      ? 'border-warm-600 bg-warm-100 text-warm-800 shadow-md'
                      : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300 hover:bg-warm-50'
                  }`}
                >
                  <div className="font-semibold text-lg">3</div>
                  <div className="text-xs">Clases</div>
                  <div className="font-bold text-sm mt-1">$30</div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateYogaPackage(activity.id, '10-classes');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedYogaPackage(activity.id) === '10-classes'
                      ? 'border-warm-600 bg-warm-100 text-warm-800 shadow-md'
                      : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300 hover:bg-warm-50'
                  }`}
                >
                  <div className="font-semibold text-lg">10</div>
                  <div className="text-xs">Clases</div>
                  <div className="font-bold text-sm mt-1">$80</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selector de paquete para surf */}
        {hasSurfPackageSelector(activity.category) && (
          <div className="bg-ocean-50 rounded-lg p-4 mb-4">
            <div className="space-y-3">
              <span className="text-sm font-medium text-warm-700 block">
                Selecciona tu paquete:
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSurfPackage(activity.id, '4-classes');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedSurfPackage(activity.id) === '4-classes'
                      ? 'border-ocean-600 bg-ocean-100 text-ocean-800 shadow-md'
                      : 'border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300 hover:bg-ocean-50'
                  }`}
                >
                  <div className="font-semibold text-lg">4</div>
                  <div className="text-xs">Clases</div>
                  <div className="font-bold text-sm mt-1">$450</div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSurfPackage(activity.id, '5-classes');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedSurfPackage(activity.id) === '5-classes'
                      ? 'border-ocean-600 bg-ocean-100 text-ocean-800 shadow-md'
                      : 'border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300 hover:bg-ocean-50'
                  }`}
                >
                  <div className="font-semibold text-lg">5</div>
                  <div className="text-xs">Clases</div>
                  <div className="font-bold text-sm mt-1">$530</div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSurfPackage(activity.id, '6-classes');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    getSelectedSurfPackage(activity.id) === '6-classes'
                      ? 'border-ocean-600 bg-ocean-100 text-ocean-800 shadow-md'
                      : 'border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300 hover:bg-ocean-50'
                  }`}
                >
                  <div className="font-semibold text-lg">6</div>
                  <div className="text-xs">Clases</div>
                  <div className="font-bold text-sm mt-1">$600</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {((bookingData.guests && bookingData.guests > 1) || (hasQuantitySelector(activity.category) && quantity > 0)) && (
          <div className="bg-warm-50 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-warm-600">
                {activity.category === 'yoga' 
                  ? `Paquete de ${getSelectedYogaPackage(activity.id) === '1-class' ? '1 clase' : getSelectedYogaPackage(activity.id) === '3-classes' ? '3 clases' : '10 clases'} para ${bookingData.guests || 1} persona${bookingData.guests !== 1 ? 's' : ''}:`
                  : activity.category === 'surf'
                  ? `Paquete de ${getSelectedSurfPackage(activity.id) === '4-classes' ? '4 clases' : getSelectedSurfPackage(activity.id) === '5-classes' ? '5 clases' : '6 clases'} para ${bookingData.guests || 1} persona${bookingData.guests !== 1 ? 's' : ''}:`
                  : hasQuantitySelector(activity.category) && quantity > 1 
                  ? `${quantity} ${
                      activity.category === 'ice_bath' ? 'sesiones' :
                      'viajes'
                    } x ${bookingData.guests || 1} persona${bookingData.guests !== 1 ? 's' : ''}:`
                  : `Total para ${bookingData.guests || 1} persona${bookingData.guests !== 1 ? 's' : ''}:`
                }
              </span>
              <span className="font-semibold text-warm-900">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        )}

        {isSelected && !hasQuantitySelector(activity.category) && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-warm-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {hasQuantitySelector(activity.category) && quantity > 0 && (
          <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${
            activity.category === 'yoga' ? 'bg-warm-500' :
            activity.category === 'ice_bath' ? 'bg-accent-500' :
            'bg-warm-600'
          }`}>
            <span className="text-xs text-white font-bold">{quantity}</span>
          </div>
        )}
      </motion.div>
    );
  };

  const surfActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'surf');
  const yogaActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'yoga');
  const iceBathActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'ice_bath');
  const transportActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'transport');
  const hostingActivities = AVAILABLE_ACTIVITIES.filter(activity => activity.category === 'hosting');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ActivityIcon className="w-8 h-8 text-ocean-600" />
            {t('activities.title')}
          </h2>
          <p className="text-gray-600 mt-2">{t('activities.subtitle')}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          💡 <strong>Tip:</strong> Los paquetes de surf se calculan por persona. Para yoga, baños de hielo y transporte puedes elegir la cantidad que necesites. <strong>Los paquetes de yoga y surf son opcionales</strong> - puedes seleccionar las actividades sin paquetes si solo quieres reservar el lugar.
        </p>
      </div>

      {/* Surf Classes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-warm-600 mb-4">🏄‍♂️ Clases de Surf</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {surfActivities.map((activity) => renderActivityCard(activity))}
        </div>
      </div>

      {/* Yoga Sessions Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-accent-600 mb-4">🧘‍♀️ Sesiones de Yoga</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {yogaActivities.map((activity) => renderActivityCard(activity))}
        </div>
      </div>

      {/* Ice Bath Sessions Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-accent-600 mb-4">🧊 Baños de Hielo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {iceBathActivities.map((activity) => renderActivityCard(activity))}
        </div>
      </div>

      {/* Transport Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-warm-600 mb-4">🚐 Transporte Aeropuerto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transportActivities.map((activity) => renderActivityCard(activity))}
        </div>
      </div>

      {/* Hosting Services Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-accent-600 mb-4">🌟 Servicios de Hosting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hostingActivities.map((activity) => renderActivityCard(activity))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={selectedActivities.length === 0}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Seleccionar Fechas</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Mensaje de ayuda */}
      {selectedActivities.length === 0 && (
        <div className="mt-4 text-center text-sm text-warm-600 bg-warm-50 rounded-lg p-3 border border-warm-200">
          💡 Selecciona al menos una actividad para continuar
        </div>
      )}
    </motion.div>
  );
} 