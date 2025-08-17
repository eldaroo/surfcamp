'use client';

import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice } from '@/lib/prices';


export default function PriceSummary() {
  const { t } = useI18n();
  const { 
    bookingData, 
    selectedRoom, 
    selectedActivities, 
    priceBreakdown,
    selectedYogaPackages,
    selectedSurfPackages
  } = useBookingStore();

  // Función para calcular el precio de una actividad según el paquete seleccionado
  const getActivityPrice = (activity: any) => {
    if (activity.category === 'yoga') {
      const yogaPackage = selectedYogaPackages[activity.id];
      if (!yogaPackage) return 0; // No hay paquete seleccionado
      return getActivityTotalPrice('yoga', yogaPackage);
    } else if (activity.category === 'surf') {
      const surfPackage = selectedSurfPackages[activity.id];
      if (!surfPackage) return 0; // No hay paquete seleccionado
      return getActivityTotalPrice('surf', surfPackage);
    } else {
      return activity.price;
    }
  };

  // Mostrar resumen de actividades incluso sin fechas seleccionadas
  if (!bookingData.checkIn || !bookingData.checkOut) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
        
        {/* Activities Summary */}
        {selectedActivities.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-warm-50 rounded-lg p-4">
              <h4 className="font-medium text-warm-900 mb-3">Actividades Seleccionadas</h4>
              <div className="space-y-3">
                {selectedActivities.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-warm-700 font-medium">{activity.name}</span>
                      <div className="text-xs text-warm-500 mt-1">
                        {activity.category === 'yoga' 
                          ? (() => {
                              const yogaPackage = selectedYogaPackages[activity.id];
                              if (!yogaPackage) return '⚠️ Actividad seleccionada sin paquete (precio: $0)';
                              return `Paquete: ${yogaPackage === '1-class' ? '1 clase' : yogaPackage === '3-classes' ? '3 clases' : '10 clases'}`;
                            })()
                          : activity.category === 'surf'
                          ? (() => {
                              const surfPackage = selectedSurfPackages[activity.id];
                              if (!surfPackage) return '⚠️ Actividad seleccionada sin paquete (precio: $0)';
                              return `Paquete: ${surfPackage === '4-classes' ? '4 clases' : surfPackage === '5-classes' ? '5 clases' : '6 clases'}`;
                            })()
                          : ''
                        }
                      </div>
                    </div>
                    <span className="font-semibold text-warm-900">${getActivityPrice(activity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total de Actividades */}
            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-warm-900">Total Actividades:</span>
                <span className="text-xl font-bold text-warm-600">
                  ${selectedActivities.reduce((sum, activity) => sum + getActivityPrice(activity), 0)}
                </span>
              </div>
            </div>

            <div className="text-sm text-warm-500 text-center">
              Selecciona fechas para ver el precio completo con alojamiento
            </div>
          </div>
        ) : (
          <div className="text-warm-400 text-sm text-center">
            {t('prices.selectDates')}
          </div>
        )}
      </div>
    );
  }

  const nights = Math.ceil((new Date(bookingData.checkOut!).getTime() - new Date(bookingData.checkIn!).getTime()) / (1000 * 60 * 60 * 24));

  // Si no hay priceBreakdown pero hay fechas, mostrar resumen básico
  if (!priceBreakdown) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
        
        {/* Booking Summary */}
        <div className="bg-warm-50 rounded-lg p-4">
          <h4 className="font-medium text-warm-900 mb-2">{t('dates.summary.title')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-600">{t('dates.summary.checkIn')}:</span>
              <span className="font-medium">
                {new Date(bookingData.checkIn!).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">{t('dates.summary.checkOut')}:</span>
              <span className="font-medium">
                {new Date(bookingData.checkOut!).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">{t('dates.summary.guests')}:</span>
              <span className="font-medium">{bookingData.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">{t('dates.summary.nights')}:</span>
              <span className="font-medium">{nights}</span>
            </div>
          </div>
        </div>

        {/* Accommodation Preview */}
        {selectedRoom && (
          <div className="border-b border-warm-200 pb-4 mt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-warm-900">{selectedRoom.roomTypeName}</h4>
                <p className="text-sm text-warm-600">
                  {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
                </p>
              </div>
              <span className="font-semibold text-warm-900">${selectedRoom.pricePerNight * nights}</span>
            </div>
          </div>
        )}

        {/* Activities Preview */}
        {selectedActivities.length > 0 && (
          <div className="border-b border-warm-200 pb-4 mt-4">
            <h4 className="font-medium text-warm-900 mb-2">{t('prices.activities')}</h4>
            <div className="space-y-2">
              {selectedActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center">
                  <div>
                    <span className="text-warm-600">{activity.name}</span>
                  </div>
                  <span className="font-medium text-warm-900">${getActivityPrice(activity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Total */}
        {selectedRoom ? (
          <div className="mt-4 pt-4 border-t border-warm-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-warm-900">Total Estimado</span>
              <span className="text-2xl font-bold text-warm-600">
                ${selectedRoom.pricePerNight * nights + selectedActivities.reduce((sum, activity) => sum + getActivityPrice(activity), 0)}
              </span>
            </div>
          </div>
        ) : selectedActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-warm-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-warm-900">Total Actividades</span>
              <span className="text-2xl font-bold text-warm-600">
                ${selectedActivities.reduce((sum, activity) => sum + getActivityPrice(activity), 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si hay priceBreakdown, mostrar el resumen completo
  const { accommodation, activities, subtotal, tax, total } = priceBreakdown;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-warm-900 mb-4">{t('prices.summary')}</h3>
      
      {/* Booking Summary */}
      <div className="bg-warm-50 rounded-lg p-4">
        <h4 className="font-medium text-warm-900 mb-2">{t('dates.summary.title')}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.checkIn')}:</span>
            <span className="font-medium">
              {new Date(bookingData.checkIn!).toLocaleDateString('es-ES')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.checkOut')}:</span>
            <span className="font-medium">
              {new Date(bookingData.checkOut!).toLocaleDateString('es-ES')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.guests')}:</span>
            <span className="font-medium">{bookingData.guests}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">{t('dates.summary.nights')}:</span>
            <span className="font-medium">{nights}</span>
          </div>
        </div>
      </div>

      {/* Accommodation */}
      {selectedRoom && (
        <div className="border-b border-warm-200 pb-4 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-warm-900">{selectedRoom.roomTypeName}</h4>
              <p className="text-sm text-warm-600">
                {nights} {nights === 1 ? t('dates.night') : t('dates.nights')}
              </p>
            </div>
            <span className="font-semibold text-warm-900">${accommodation}</span>
          </div>
        </div>
      )}

      {/* Activities */}
      {selectedActivities.length > 0 && (
        <div className="border-b border-warm-200 pb-4 mt-4">
          <h4 className="font-medium text-warm-900 mb-2">{t('prices.activities')}</h4>
          <div className="space-y-2">
            {selectedActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center">
                <div>
                  <span className="text-warm-600">{activity.name}</span>
                </div>
                <span className="font-medium text-warm-900">${activity.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-warm-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-warm-900">{t('prices.total')}</span>
          <span className="text-2xl font-bold text-warm-600">${total}</span>
        </div>
      </div>
    </div>
  );
} 