'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, ChevronRight, ChevronLeft, Clock, Users } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { Activity } from '@/types';
import { AVAILABLE_ACTIVITIES, getActivitiesByCategory } from '@/lib/activities';
import { formatCurrency } from '@/lib/utils';

export default function ActivitySelector() {
  const { 
    bookingData,
    selectedActivities,
    setSelectedActivities,
    activityQuantities,
    setActivityQuantity,
    setCurrentStep,
    setLoading,
    setPriceBreakdown,
    setError
  } = useBookingStore();

  const hasQuantitySelector = (category: string) => {
    return ['yoga', 'ice_bath', 'transport'].includes(category);
  };

  const getActivityQuantity = (activityId: string) => {
    return activityQuantities[activityId] || 0;
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

  const toggleActivity = (activity: Activity) => {
    if (activity.category === 'surf') {
      // Para surf, solo se puede seleccionar UN paquete
      setSelectedActivities([activity]);
    } else if (hasQuantitySelector(activity.category)) {
      // Para actividades con selector de cantidad, NO cambiar la cantidad al tocar la card
      // Solo agregar/remover de seleccionados si no está seleccionada
      const isSelected = selectedActivities.some((a: Activity) => a.id === activity.id);
      if (!isSelected) {
        // Si no está seleccionada, agregarla con cantidad 1 si no tiene cantidad
        const currentQuantity = getActivityQuantity(activity.id);
        if (currentQuantity === 0) {
          updateActivityQuantity(activity.id, 1);
        } else {
          setSelectedActivities([...selectedActivities, activity]);
        }
      }
      // Si ya está seleccionada, no hacer nada al tocar la card
    } else {
      // Para otras actividades, se pueden seleccionar múltiples
      const isSelected = selectedActivities.some((a: Activity) => a.id === activity.id);
      if (isSelected) {
        const updatedActivities = selectedActivities.filter((a: Activity) => a.id !== activity.id);
        setSelectedActivities(updatedActivities);
      } else {
        setSelectedActivities([...selectedActivities, activity]);
      }
    }
  };

  const handleActivityToggle = (activity: Activity) => {
    toggleActivity(activity);
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare activity data with quantities
      const activitiesWithQuantities = selectedActivities.map(activity => ({
        activityId: activity.id,
        quantity: activityQuantities[activity.id] || 1
      }));

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

  const renderActivityCard = (activity: Activity) => {
    const isSelected = selectedActivities.some((a: Activity) => a.id === activity.id);
    const quantity = activityQuantities[activity.id] || (isSelected ? 1 : 0);
    
    let totalPrice: number;
    if (activity.category === 'yoga') {
      totalPrice = activity.price * quantity * (bookingData.guests || 1);
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
            <p className="font-bold text-ocean-600">{formatCurrency(activity.price)}</p>
            <p className="text-xs text-gray-500">
              {activity.category === 'yoga' ? 'por clase' : 
               activity.category === 'ice_bath' ? 'por sesión' : 
               activity.category === 'transport' ? 'por viaje' : 
               'por persona'}
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">{activity.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{activity.duration} min</span>
          </div>
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

        {((bookingData.guests && bookingData.guests > 1) || (hasQuantitySelector(activity.category) && quantity > 0)) && (
          <div className="bg-warm-50 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-warm-600">
                {hasQuantitySelector(activity.category) && quantity > 1 
                  ? `${quantity} ${
                      activity.category === 'yoga' ? 'clases' :
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

  const surfActivities = getActivitiesByCategory('surf');
  const yogaActivities = getActivitiesByCategory('yoga');
  const iceBathActivities = getActivitiesByCategory('ice_bath');
  const transportActivities = getActivitiesByCategory('transport');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center">
          <ActivityIcon className="w-5 h-5 text-ocean-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actividades</h2>
          <p className="text-gray-600">Elige las actividades que más te gusten</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          💡 <strong>Tip:</strong> Los paquetes de surf se calculan por persona. Para yoga, baños de hielo y transporte puedes elegir la cantidad que necesites.
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

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('dates')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>

        <button
          onClick={handleContinue}
          className="btn-primary flex items-center space-x-2"
        >
          <span>{selectedActivities.length > 0 ? 'Continuar' : 'Saltar actividades'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
} 