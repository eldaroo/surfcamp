'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice } from '@/lib/prices';
import { 
  sendIceBathReservationNotification, 
  sendSurfClassReservationNotification 
} from '@/lib/whatsapp';
import BookingConfirmation from './BookingConfirmation';

export default function PaymentSection() {
  const { t } = useI18n();
  const { 
    bookingData, 
    selectedRoom,
    selectedActivities, 
    selectedYogaPackages,
    selectedSurfPackages,
    setCurrentStep 
  } = useBookingStore();
  const [paymentMethod, setPaymentMethod] = useState<'wetravel' | 'mock'>('mock');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [wetravelResponse, setWetravelResponse] = useState<any>(null);

  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedActivities.length > 0 &&
    bookingData.contactInfo &&
    selectedRoom;

  const handlePayment = async () => {
    if (!isReadyForPayment) {
      setError(t('payment.error.missingData'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('💳 Starting payment process...');
      
      // Si es pago demo, ir directo a éxito sin reservar en LobbyPMS
      if (paymentMethod === 'mock') {
        console.log('🎭 Demo payment selected - skipping LobbyPMS reservation');
        // Simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Demo payment completed successfully');
        setCurrentStep('success');
        return;
      }
      
      // Generar link de pago con WeTravel
      console.log('🔗 Generating WeTravel payment link...');
      
      // Convertir fechas Date objects a formato ISO string para la API
      const formatDateForAPI = (date: Date | string) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const checkInFormatted = formatDateForAPI(bookingData.checkIn!);
      const checkOutFormatted = formatDateForAPI(bookingData.checkOut!);
      
      // Calcular días antes de la salida para el plan de pago
      const today = new Date();
      const checkInDate = new Date(checkInFormatted);
      const daysBeforeDeparture = Math.max(1, Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) - 1);
      
      console.log('📅 Payment plan calculation:', {
        today: today.toISOString().split('T')[0],
        checkIn: checkInFormatted,
        daysBeforeDeparture,
        dueDate: new Date(checkInDate.getTime() - (daysBeforeDeparture * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      });

      // Crear payload para WeTravel (precios en dólares, no en centavos)
      const wetravelPayload = {
        data: {
          trip: {
            title: "Surf & Yoga Retreat – Santa Teresa",
            start_date: checkInFormatted,
            end_date: checkOutFormatted,
            currency: "USD",
            participant_fees: "all"
          },
          pricing: {
            price: Math.round(total), // Precio en dólares
            payment_plan: {
              allow_auto_payment: false,
              allow_partial_payment: false,
              deposit: 0,
              installments: [
                { 
                  price: Math.round(total), // Precio en dólares
                  days_before_departure: daysBeforeDeparture
                }
              ]
            }
          },
          metadata: {
            trip_id: `st-${checkInFormatted.replace(/-/g, '')}`,
            customer_id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            booking_data: {
              checkIn: checkInFormatted,
              checkOut: checkOutFormatted,
              guests: bookingData.guests,
              roomType: selectedRoom?.roomTypeName,
              activities: selectedActivities.map(a => ({
                id: a.id,
                name: a.name,
                package: a.category === 'yoga' ? selectedYogaPackages[a.id] : selectedSurfPackages[a.id]
              })),
              total: total
            }
          }
        }
      };

      console.log('💰 Total price being sent to WeTravel:', total);
      console.log('📤 Sending request to WeTravel API:', wetravelPayload);

      const wetravelResponse = await fetch('/api/wetravel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wetravelPayload),
      });

      const wetravelData = await wetravelResponse.json();

      if (!wetravelResponse.ok) {
        throw new Error(wetravelData.error || 'Error generating payment link');
      }

      console.log('✅ WeTravel payment link generated successfully:', wetravelData);
      
      // Guardar la respuesta de WeTravel en el estado
      setWetravelResponse(wetravelData);
      
      // Redirigir al usuario al link de pago
      if (wetravelData.payment_url) {
        // Abrir el link de pago en una nueva pestaña
        window.open(wetravelData.payment_url, '_blank');
        
        // Mostrar estado de esperando procesar pago
        setError(''); // Limpiar errores previos
        setIsWaitingForPayment(true);
        
        console.log('🔗 Payment link opened in new tab, waiting for payment completion...');
      } else {
        throw new Error('No payment URL received from WeTravel');
      }
      
    } catch (error) {
      console.error('❌ Payment/WeTravel error:', error);
      setError(error instanceof Error ? error.message : t('payment.error.processing'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para enviar notificaciones de WhatsApp según las actividades reservadas
  const sendActivityWhatsAppNotifications = async () => {
    try {
      console.log('📱 Enviando notificaciones de WhatsApp...');
      
      // Preparar datos básicos para las notificaciones
      const notificationData = {
        checkIn: typeof bookingData.checkIn === 'string' ? bookingData.checkIn : bookingData.checkIn!.toISOString().split('T')[0],
        checkOut: typeof bookingData.checkOut === 'string' ? bookingData.checkOut : bookingData.checkOut!.toISOString().split('T')[0],
        guestName: `${bookingData.contactInfo?.firstName} ${bookingData.contactInfo?.lastName}`,
        phone: bookingData.contactInfo?.phone || '',
        dni: bookingData.contactInfo?.dni || '',
        total: total,
        guests: bookingData.guests || 1
      };

      // Enviar notificación de baño de hielo si está reservado
      const iceBathActivity = selectedActivities.find(activity => 
        activity.id === 'ice-bath-session'
      );
      
      if (iceBathActivity) {
        console.log('🧊 Enviando notificación de baño de hielo...');
        await sendIceBathReservationNotification(notificationData);
        console.log('✅ Notificación de baño de hielo enviada');
      }

      // Enviar notificación de clases de surf si están reservadas
      const surfActivity = selectedActivities.find(activity => 
        activity.id === 'surf-package'
      );
      
      if (surfActivity) {
        const surfPackage = selectedSurfPackages[surfActivity.id];
        if (surfPackage) {
          console.log('🏄‍♂️ Enviando notificación de clases de surf...');
          await sendSurfClassReservationNotification({
            ...notificationData,
            surfPackage: surfPackage
          });
          console.log('✅ Notificación de clases de surf enviada');
        }
      }

      console.log('📱 Todas las notificaciones de WhatsApp enviadas');
    } catch (error) {
      console.error('❌ Error enviando notificaciones de WhatsApp:', error);
      // No fallar el pago por errores de WhatsApp
    }
  };

  // Si no hay datos completos, mostrar error
  if (!isReadyForPayment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-2xl font-bold mb-4 font-heading">{t('payment.error.title')}</h2>
        <div className="mb-4 text-warm-600 font-semibold">{t('payment.error.missingData')}</div>
        <button
          onClick={() => setCurrentStep('contact')}
          className="btn-primary"
        >
          {t('common.back')}
        </button>
      </motion.div>
      );
    }

  const nights = bookingData.checkIn && bookingData.checkOut ? Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
    (1000 * 60 * 60 * 24)
  ) : 0;

  const accommodationTotal = selectedRoom ? (
    selectedRoom.pricePerNight * nights
  ) : 0;

  const activitiesTotal = selectedActivities.reduce((sum, activity) => {
    // Calcular precio según el paquete seleccionado
    if (activity.category === 'yoga') {
      const yogaPackage = selectedYogaPackages[activity.id];
      if (!yogaPackage) return sum; // No hay paquete seleccionado
      return sum + getActivityTotalPrice('yoga', yogaPackage);
    } else if (activity.category === 'surf') {
      const surfPackage = selectedSurfPackages[activity.id];
      if (!surfPackage) return sum; // No hay paquete seleccionado
      return sum + getActivityTotalPrice('surf', surfPackage);
    } else {
      return sum + (activity.price || 0);
    }
  }, 0);
  
  const total = accommodationTotal + activitiesTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
          <span className="text-white">💳</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">{t('payment.title')}</h2>
          <p className="text-yellow-300">{t('payment.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="space-y-6">
          {/* Error Message */}
          {/* The original code had a variable `missingData` which was not defined.
              Assuming it was meant to be `!isReadyForPayment` or similar.
              For now, I'll remove it as it's not in the new_code. */}
          {/* <div className="mb-4 text-warm-600 font-semibold">{t('payment.error.missingData')}</div> */}

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('payment.method.title')}</h3>
            
            <label className="flex items-center space-x-3 p-3 border border-white/30 rounded-lg cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="paymentMethod"
                value="wetravel"
                checked={paymentMethod === 'wetravel'}
                onChange={(e) => setPaymentMethod(e.target.value as 'wetravel')}
                className="text-blue-500"
              />
              <div>
                <div className="font-medium text-white">{t('payment.method.wetravel')}</div>
                <div className="text-sm text-blue-300">{t('payment.method.wetravelDescription')}</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border border-white/30 rounded-lg cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="paymentMethod"
                value="mock"
                checked={paymentMethod === 'mock'}
                onChange={(e) => setPaymentMethod(e.target.value as 'mock')}
                className="text-blue-500"
              />
              <div>
                <div className="font-medium text-white">{t('payment.method.demo')}</div>
                <div className="text-sm text-blue-300">{t('payment.method.demoDescription')}</div>
              </div>
            </label>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {paymentMethod === 'mock' ? 'Procesando demo...' : 'Generando link de pago...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {paymentMethod === 'mock' ? 'Completar Demo' : 'Generar Link de Pago'}
                </span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Waiting for Payment Status */}
        {isWaitingForPayment && (
          <div className="bg-white/10 border border-yellow-300/50 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300"></div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  {t('payment.waitingForPayment.title')}
                </h3>
                <p className="text-blue-300 text-sm">
                  {t('payment.waitingForPayment.description')}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.open(wetravelResponse?.payment_url, '_blank')}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {t('payment.waitingForPayment.openLinkButton')}
                </button>
                <button
                  onClick={() => setIsWaitingForPayment(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {t('payment.waitingForPayment.hideMessageButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">{t('payment.summary.title')}</h3>
            <div className="space-y-3">
              {selectedRoom && (
                <div className="flex justify-between">
                  <span className="text-white">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium text-blue-400">${accommodationTotal}</span>
                </div>
              )}
              {selectedActivities.map((activity) => {
                let activityPrice: number;
                if (activity.category === 'yoga') {
                  const selectedYogaPackage = selectedYogaPackages[activity.id];
                  if (!selectedYogaPackage) return null; // No hay paquete seleccionado
                  activityPrice = getActivityTotalPrice('yoga', selectedYogaPackage);
                } else if (activity.category === 'surf') {
                  const selectedSurfPackage = selectedSurfPackages[activity.id];
                  if (!selectedSurfPackage) return null; // No hay plan de progreso seleccionado
                  activityPrice = getActivityTotalPrice('surf', selectedSurfPackage);
                } else {
                  activityPrice = activity.price || 0;
                }
                
                return (
                  <div key={activity.id} className="flex justify-between">
                    <span className="text-white">
                      {activity.name}
                      {activity.category === 'surf' && selectedSurfPackages[activity.id] && (
                        <span className="text-sm text-blue-300 ml-2">
                          (Plan de Progreso: {selectedSurfPackages[activity.id]})
                        </span>
                      )}
                                              {activity.category === 'yoga' && selectedYogaPackages[activity.id] && (
                          <span className="text-sm text-blue-300 ml-2">
                            (Paquete: {selectedYogaPackages[activity.id]})
                          </span>
                        )}
                    </span>
                    <span className="font-medium text-blue-400">${activityPrice}</span>
                  </div>
                );
              })}
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{t('payment.summary.total')}</span>
                  <span className="text-2xl font-bold text-yellow-300">${total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span className="font-semibold text-white">{t('payment.secure.title')}</span>
            </div>
            <p className="text-blue-300 text-sm mt-1">{t('payment.secure.description')}</p>
          </div>

          {/* Demo Payment Notice */}
          {paymentMethod === 'mock' && (
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">ℹ️</span>
                <span className="font-semibold text-white">Modo Demo</span>
              </div>
              <p className="text-blue-300 text-sm mt-1">
                Este es un pago de demostración. No se realizará ninguna reserva real en el sistema ni se procesará ningún cargo.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="font-semibold text-white">{t('common.error')}</span>
              </div>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 