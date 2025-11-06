'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice } from '@/lib/prices';
import BookingConfirmation from './BookingConfirmation';
import BackButton from './BackButton';

export default function PaymentSection() {
  const { t } = useI18n();
  const {
    bookingData,
    selectedRoom,
    selectedActivities,
    selectedYogaPackages,
    selectedSurfPackages,
    selectedSurfClasses,
    activityQuantities,
    setCurrentStep,
    setPriceBreakdown,
    participants
  } = useBookingStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [wetravelResponse, setWetravelResponse] = useState<any>(null);
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<'waiting' | 'payment_received' | 'processing_reservation'>('waiting');
  const paymentStatusInterval = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const paymentWindowRef = useRef<Window | null>(null);

  const closePaymentWindow = useCallback(() => {
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    paymentWindowRef.current = null;
  }, []);

  const isReadyForPayment =
    bookingData.checkIn &&
    bookingData.checkOut &&
    bookingData.guests &&
    selectedActivities.length > 0 &&
    bookingData.contactInfo &&
    selectedRoom;

  // Function to calculate prices
  const calculatePrices = () => {
    if (!selectedRoom || !bookingData.checkIn || !bookingData.checkOut) {
      return null;
    }

    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate accommodation cost
    const accommodation = selectedRoom.isSharedRoom
      ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)
      : selectedRoom.pricePerNight * nights;

    // Calculate activities cost from all participants
    let activitiesTotal = 0;
    participants.forEach(participant => {
      participant.selectedActivities.forEach((activity: any) => {
        if (activity.category === 'yoga') {
          const yogaPackage = participant.selectedYogaPackages[activity.id];
          if (yogaPackage) {
            activitiesTotal += getActivityTotalPrice('yoga', yogaPackage, 1);
          }
        } else if (activity.category === 'surf') {
          const surfClasses = participant.selectedSurfClasses[activity.id];
          if (surfClasses) {
            activitiesTotal += getActivityTotalPrice('surf', undefined, 1, surfClasses);
          }
        } else {
          const quantity = participant.activityQuantities[activity.id] || 1;
          activitiesTotal += activity.price * quantity;
        }
      });
    });

    const subtotal = accommodation + activitiesTotal;
    const tax = 0; // Add tax calculation if needed
    const total = subtotal + tax;

    return {
      accommodation,
      activities: activitiesTotal,
      subtotal,
      tax,
      total,
      currency: 'USD'
    };
  };

  const serializedParticipants = useMemo(() =>
    participants.map((participant, index) => {
      // Only include activity-specific data for activities this participant has selected
      const participantActivityIds = new Set(
        (participant.selectedActivities || []).map((a: any) => a.id)
      );

      // Filter activity quantities to only include this participant's activities
      const filteredActivityQuantities: Record<string, number> = {};
      if (participant.activityQuantities) {
        Object.entries(participant.activityQuantities).forEach(([activityId, quantity]) => {
          if (participantActivityIds.has(activityId)) {
            filteredActivityQuantities[activityId] = quantity as number;
          }
        });
      }

      // Filter yoga packages to only include this participant's activities
      const filteredYogaPackages: Record<string, string> = {};
      if (participant.selectedYogaPackages) {
        Object.entries(participant.selectedYogaPackages).forEach(([activityId, pkg]) => {
          if (participantActivityIds.has(activityId)) {
            filteredYogaPackages[activityId] = pkg as string;
          }
        });
      }

      // Filter surf classes to only include this participant's activities
      const filteredSurfClasses: Record<string, number> = {};
      if (participant.selectedSurfClasses) {
        Object.entries(participant.selectedSurfClasses).forEach(([activityId, classes]) => {
          if (participantActivityIds.has(activityId)) {
            filteredSurfClasses[activityId] = classes as number;
          }
        });
      }

      // Filter yoga classes to only include this participant's activities
      const filteredYogaClasses: Record<string, number> = {};
      if (participant.yogaClasses) {
        Object.entries(participant.yogaClasses).forEach(([activityId, classes]) => {
          if (participantActivityIds.has(activityId)) {
            filteredYogaClasses[activityId] = classes as number;
          }
        });
      }

      return {
        id: participant.id,
        name: participant.name || `Participant ${index + 1}`,
        selectedActivities: (participant.selectedActivities || []).map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          category: activity.category,
          package:
            participant.selectedYogaPackages?.[activity.id] ??
            (participant.selectedSurfClasses?.[activity.id] !== undefined
              ? `${participant.selectedSurfClasses?.[activity.id]}-classes`
              : activity.package),
          classCount:
            participant.selectedSurfClasses?.[activity.id] ?? activity.classCount,
          quantity:
            participant.activityQuantities?.[activity.id] ??
            (typeof activity.quantity === 'number' ? activity.quantity : undefined),
        })),
        activityQuantities: filteredActivityQuantities,
        selectedYogaPackages: filteredYogaPackages,
        yogaClasses: filteredYogaClasses,
        selectedSurfClasses: filteredSurfClasses,
      };
    }),
  [participants]
  );

  // Function to check payment status
  const checkPaymentStatus = async (orderId?: string, tripId?: string) => {
    try {
      const params = new URLSearchParams();
      if (orderId) params.append('order_id', orderId);
      if (tripId) params.append('trip_id', tripId);

      const response = await fetch(`/api/payment-status?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 Payment status check:', data);
      console.log('🔍 Debug - orderId:', orderId, 'tripId:', tripId);
      console.log('🔍 Debug - show_success:', data.show_success, 'is_booking_created:', data.is_booking_created, 'is_completed:', data.is_completed);

      // Update status message based on payment state
      if (data.payment?.status === 'booking_created' || data.payment?.status === 'completed') {
        if (data.order?.lobbypms_reservation_id) {
          setPaymentStatusMessage('processing_reservation');
        } else {
          setPaymentStatusMessage('payment_received');
        }
      }

      if (data.show_success && (data.is_booking_created || data.is_completed)) {
        console.log('🎉 Payment successful, redirecting to success page');

        // Calculate final prices before redirecting
        const prices = calculatePrices();
        if (prices) {
          setPriceBreakdown(prices);
          console.log('💰 Price breakdown calculated:', prices);
        } else {
          console.warn('⚠️ Could not calculate price breakdown');
        }

        // Clear the interval
        if (paymentStatusInterval.current) {
          clearInterval(paymentStatusInterval.current);
          paymentStatusInterval.current = null;
        }
        setIsWaitingForPayment(false);
        setIsCheckingPaymentStatus(false);
        // Redirect to success page
        setCurrentStep('success');
        closePaymentWindow();
        window.focus();
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return null;
    }
  };

  // Function to start SSE connection for real-time payment status
  const startPaymentStatusSSE = (orderId: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsCheckingPaymentStatus(true);
    console.log('📡 Starting SSE connection for order:', orderId);

    // Create EventSource connection
    const eventSource = new EventSource(`/api/payment-status-stream?order_id=${orderId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 SSE message received:', data);

        if (data.type === 'connected') {
          console.log('🔗 SSE connected for order:', data.orderId);
        } else if (data.type === 'reservation_complete') {
          console.log('🎉 Reservation complete! Data:', data);

          // Calculate final prices
          const prices = calculatePrices();
          if (prices) {
            setPriceBreakdown(prices);
            console.log('💰 Price breakdown calculated:', prices);
          }

          // Close SSE connection
          eventSource.close();
          eventSourceRef.current = null;

          // Update UI
          setIsWaitingForPayment(false);
          setIsCheckingPaymentStatus(false);
          setCurrentStep('success');
          closePaymentWindow();
          window.focus();
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      eventSource.close();
      eventSourceRef.current = null;

      // Fallback to polling after SSE failure
      console.log('⚠️ Falling back to polling...');
      startPaymentStatusPolling(orderId, undefined);
    };

    // Timeout after 10 minutes
    setTimeout(() => {
      if (eventSourceRef.current) {
        console.log('⏰ SSE connection timeout');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsCheckingPaymentStatus(false);
      }
    }, 10 * 60 * 1000);
  };

  // Fallback: Polling function (used if SSE fails)
  const startPaymentStatusPolling = (orderId?: string, tripId?: string) => {
    if (paymentStatusInterval.current) {
      clearInterval(paymentStatusInterval.current);
    }

    setIsCheckingPaymentStatus(true);
    console.log('🔄 Starting payment status polling for:', { orderId, tripId });

    // Check immediately
    checkPaymentStatus(orderId, tripId);

    // Then check every 3 seconds
    paymentStatusInterval.current = setInterval(() => {
      checkPaymentStatus(orderId, tripId);
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (paymentStatusInterval.current) {
        clearInterval(paymentStatusInterval.current);
        paymentStatusInterval.current = null;
        setIsCheckingPaymentStatus(false);
        console.log('⏰ Payment status polling timed out');
      }
    }, 10 * 60 * 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentStatusInterval.current) {
        clearInterval(paymentStatusInterval.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      closePaymentWindow();
    };
  }, [closePaymentWindow]);

  const handlePayment = async () => {
    if (!isReadyForPayment) {
      setError(t('payment.error.missingData'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('💳 Starting payment process...');

      // Abrir ventana inmediatamente para evitar bloqueo de pop-ups
      // y mostrar mensaje de carga
      closePaymentWindow();
      paymentWindowRef.current = window.open('', '_blank');
      const paymentWindow = paymentWindowRef.current;
      if (paymentWindow) {
        const loadingTitle = t('payment.generatingLink');
        const loadingMessage = t('payment.pleaseWait') || 'Please wait a moment...';

        paymentWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${loadingTitle}</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                  color: white;
                }
                .loader {
                  text-align: center;
                }
                .spinner {
                  border: 4px solid rgba(255, 255, 255, 0.1);
                  border-top: 4px solid #fbbf24;
                  border-radius: 50%;
                  width: 50px;
                  height: 50px;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                h2 { margin: 0 0 10px; }
                p { margin: 0; opacity: 0.8; }
              </style>
            </head>
            <body>
              <div class="loader">
                <div class="spinner"></div>
                <h2>${loadingTitle}</h2>
                <p>${loadingMessage}</p>
              </div>
            </body>
          </html>
        `);
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

      // 💾 Crear payload completo incluyendo datos para guardar en DB
      const paymentPayload = {
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
        guests: bookingData.guests,
        roomTypeId: selectedRoom?.roomTypeId,
        isSharedRoom: selectedRoom?.isSharedRoom, // Add isSharedRoom to payload
        contactInfo: bookingData.contactInfo,
        selectedActivities: selectedActivities.map((a: any) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          price: a.price,
          package:
            a.category === 'yoga'
              ? selectedYogaPackages[a.id]
              : a.category === 'surf'
                ? selectedSurfPackages[a.id]
                : undefined,
          classCount: a.category === 'surf' ? selectedSurfClasses[a.id] : undefined
        })),
        participants: serializedParticipants,
        // WeTravel specific data
        wetravelData: {
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
          }
        }
      };

      console.log('💰 Total price being sent:', total);
      console.log('📤 Sending request to payment API with full booking data');
      console.log('👥 [PaymentSection] Serialized participants being sent:', JSON.stringify(serializedParticipants, null, 2));
      console.log('🏠 [PaymentSection] selectedRoom data:', {
        roomTypeId: selectedRoom?.roomTypeId,
        isSharedRoom: selectedRoom?.isSharedRoom,
        maxGuests: selectedRoom?.maxGuests
      });

      const wetravelResponse = await fetch('/api/wetravel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
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
        // Actualizar la URL de la ventana ya abierta
        if (paymentWindow) {
          paymentWindow.location.href = wetravelData.payment_url;
          paymentWindow.focus();
        } else {
          // Fallback si la ventana fue bloqueada
          window.open(wetravelData.payment_url, '_blank');
        }

        // Mostrar estado de esperando procesar pago
        setError(''); // Limpiar errores previos
        setIsWaitingForPayment(true);
        setPaymentStatusMessage('waiting'); // Reset message to initial state

        // Start polling for payment status using both order_id and trip_id
        const orderId = wetravelData.order_id;
        const tripId = wetravelData.trip_id;

        console.log('🔗 Payment link opened in new tab, starting payment status monitoring...', {
          orderId,
          tripId
        });

        // Start SSE connection for real-time updates
        startPaymentStatusSSE(orderId);
      } else {
        // Cerrar la ventana si no hay URL
        closePaymentWindow();
        throw new Error('No payment URL received from WeTravel');
      }
      
    } catch (error) {
      console.error('❌ Payment/WeTravel error:', error);
      setError(error instanceof Error ? error.message : t('payment.error.processing'));
      // Cerrar la ventana de pago si ocurrió un error
      closePaymentWindow();
    } finally {
      setIsProcessing(false);
    }
  };
  const nights = bookingData.checkIn && bookingData.checkOut ? Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
    (1000 * 60 * 60 * 24)
  ) : 0;

  const accommodationTotal = selectedRoom ? (
    selectedRoom.isSharedRoom
      ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)  // Casa de Playa: precio por persona
      : selectedRoom.pricePerNight * nights  // Privadas/Deluxe: precio por habitación (ya ajustado por backend)
  ) : 0;

  // Calculate activities total from all participants
  let activitiesTotal = 0;
  participants.forEach(participant => {
    participant.selectedActivities.forEach((activity: any) => {
      if (activity.category === 'yoga') {
        const yogaPackage = participant.selectedYogaPackages[activity.id];
        if (yogaPackage) {
          activitiesTotal += getActivityTotalPrice('yoga', yogaPackage, 1);
        }
      } else if (activity.category === 'surf') {
        const surfClasses = participant.selectedSurfClasses[activity.id];
        if (surfClasses) {
          activitiesTotal += getActivityTotalPrice('surf', undefined, 1, surfClasses);
        }
      } else {
        const quantity = participant.activityQuantities[activity.id] || 1;
        activitiesTotal += activity.price * quantity;
      }
    });
  });

  const total = accommodationTotal + activitiesTotal;

  // Debug log to check participants data
  console.log('🔍 [PaymentSection] Participants data:', {
    participantsCount: participants.length,
    participants: participants.map(p => ({
      id: p.id,
      name: p.name,
      activitiesCount: p.selectedActivities.length,
      activities: p.selectedActivities.map((a: any) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        surfClasses: p.selectedSurfClasses[a.id],
        yogaPackage: p.selectedYogaPackages[a.id],
        quantity: p.activityQuantities[a.id]
      }))
    })),
    activitiesTotal,
    total
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Back Button */}
      <div className="mb-6">
        <BackButton variant="minimal" />
      </div>

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

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('payment.generatingLink')}</span>
              </>
            ) : (
              <>
                <span>{t('payment.generateLink')}</span>
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
                {paymentStatusMessage === 'waiting' && (
                  <>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2 font-heading">
                      {t('payment.waitingForPayment.title')}
                    </h3>
                    <p className="text-blue-300 text-sm">
                      {t('payment.waitingForPayment.description')}
                    </p>
                  </>
                )}
                {paymentStatusMessage === 'payment_received' && (
                  <>
                    <h3 className="text-lg font-semibold text-green-400 mb-2 font-heading">
                      ✅ ¡Pago Recibido!
                    </h3>
                    <p className="text-blue-300 text-sm">
                      Procesando tu reserva, esto tomará solo unos segundos...
                    </p>
                  </>
                )}
                {paymentStatusMessage === 'processing_reservation' && (
                  <>
                    <h3 className="text-lg font-semibold text-green-400 mb-2 font-heading">
                      ✨ Confirmando Reserva...
                    </h3>
                    <p className="text-blue-300 text-sm">
                      Tu pago fue procesado exitosamente. Estamos confirmando tu reserva en el sistema.
                    </p>
                  </>
                )}
                {isCheckingPaymentStatus && (
                  <p className="text-green-300 text-xs mt-3 animate-pulse">
                    🔄 Verificando estado automáticamente...
                  </p>
                )}
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
            <h3 className="text-lg font-semibold text-white mb-4 font-heading">{t('payment.summary.title')}</h3>
            <div className="space-y-3">
              {selectedRoom && (
                <div className="flex justify-between">
                  <span className="text-white">{selectedRoom.roomTypeName}</span>
                  <span className="font-medium text-blue-400">${accommodationTotal}</span>
                </div>
              )}
              {participants.flatMap((participant, pIndex) =>
                participant.selectedActivities.map((activity: any, aIndex) => {
                  let activityPrice: number;
                  let activityDetails: string = '';
                  const showParticipantName = participants.length > 1;

                  if (activity.category === 'yoga') {
                    const selectedYogaPackage = participant.selectedYogaPackages[activity.id];
                    if (!selectedYogaPackage) return null; // No hay paquete seleccionado
                    activityPrice = getActivityTotalPrice('yoga', selectedYogaPackage, 1);
                    activityDetails = `(${selectedYogaPackage})`;
                  } else if (activity.category === 'surf') {
                    const surfClasses = participant.selectedSurfClasses[activity.id];
                    if (!surfClasses) return null; // No hay clases seleccionadas
                    activityPrice = getActivityTotalPrice('surf', undefined, 1, surfClasses);
                    activityDetails = `(${surfClasses} ${surfClasses === 1 ? 'clase' : 'clases'})`;
                  } else {
                    const quantity = participant.activityQuantities[activity.id] || 1;
                    activityPrice = (activity.price || 0) * quantity;
                  }

                  return (
                    <div key={`${participant.id}-${activity.id}-${pIndex}-${aIndex}`} className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-white">
                          {activity.name}
                          {activityDetails && (
                            <span className="text-sm text-blue-300 ml-2">
                              {activityDetails}
                            </span>
                          )}
                        </div>
                        {showParticipantName && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {participant.name}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-blue-400 whitespace-nowrap">${activityPrice}</span>
                    </div>
                  );
                })
              )}
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
