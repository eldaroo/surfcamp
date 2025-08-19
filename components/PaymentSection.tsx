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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'nowpayments' | 'mock'>('mock');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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
      
      // Convertir fechas Date objects a formato ISO string para la API
      const formatDateForAPI = (date: Date | string) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const checkInFormatted = formatDateForAPI(bookingData.checkIn!);
      const checkOutFormatted = formatDateForAPI(bookingData.checkOut!);
      
      console.log('📅 Formatted dates for API:', {
        original: { checkIn: bookingData.checkIn, checkOut: bookingData.checkOut },
        formatted: { checkIn: checkInFormatted, checkOut: checkOutFormatted }
      });

      // Crear reserva en LobbyPMS solo para pagos reales
      console.log('🏨 Creating reservation in LobbyPMS...');
      const reservationResponse = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guests: bookingData.guests,
          contactInfo: bookingData.contactInfo,
          roomTypeId: selectedRoom.roomTypeId,
          activities: selectedActivities.map(a => a.id),
          paymentIntentId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      const reservationData = await reservationResponse.json();

      if (!reservationResponse.ok) {
        throw new Error(reservationData.error || 'Error creating reservation');
      }

      console.log('✅ Reservation created successfully in LobbyPMS:', reservationData);
      
      // Enviar notificaciones de WhatsApp para actividades específicas
      await sendActivityWhatsAppNotifications();
      
      // Success! Move to success page
      setCurrentStep('success');
    } catch (error) {
      console.error('❌ Payment/Reservation error:', error);
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
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                className="text-blue-500"
              />
              <div>
                <div className="font-medium text-white">{t('payment.method.stripe')}</div>
                <div className="text-sm text-blue-300">{t('payment.method.stripeDescription')}</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-white/30 rounded-lg cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="paymentMethod"
                value="nowpayments"
                checked={paymentMethod === 'nowpayments'}
                onChange={(e) => setPaymentMethod(e.target.value as 'nowpayments')}
                className="text-blue-500"
              />
              <div>
                <div className="font-medium text-white">{t('payment.method.crypto')}</div>
                <div className="text-sm text-blue-300">{t('payment.method.cryptoDescription')}</div>
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
                  {paymentMethod === 'mock' ? 'Procesando demo...' : t('payment.processing')}
                </span>
              </>
            ) : (
              <>
                <span>
                  {paymentMethod === 'mock' ? 'Completar Demo' : t('payment.payButton')}
                </span>
                            <span>→</span>
              </>
            )}
          </button>
        </div>

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