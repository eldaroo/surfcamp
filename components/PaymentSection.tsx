'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getActivityTotalPrice } from '@/lib/prices';
import BookingConfirmation from './BookingConfirmation';
import {
  detectSurfPrograms,
  getCoachingPrograms,
  calculateWeTravelPayment,
  getAccommodationTotal
} from '@/lib/wetravel-pricing';

// Surf program names
const SURF_PROGRAMS = {
  fundamental: {
    name: { es: 'Core Surf Program', en: 'Core Surf Program' },
  },
  progressionPlus: {
    name: { es: 'Intensive Surf Program', en: 'Intensive Surf Program' },
  },
  highPerformance: {
    name: { es: 'Elite Surf Program', en: 'Elite Surf Program' },
  },
} as const;

// Map surf classes to program ID
const surfClassesToProgram = (classes: number): 'fundamental' | 'progressionPlus' | 'highPerformance' => {
  if (classes <= 4) return 'fundamental';
  if (classes <= 6) return 'progressionPlus';
  return 'highPerformance';
};

export default function PaymentSection() {
  const { t, locale } = useI18n();
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
    participants,
    goBack
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
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  const closePaymentWindow = useCallback(() => {
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    paymentWindowRef.current = null;
  }, []);

  // Check if this is adding activities to an existing reservation
  const hasExistingReservation = Boolean(bookingData.existingReservationId);

  // Handle back button click
  const handleBackClick = () => {
    if (hasExistingReservation) {
      // Show confirmation modal for existing reservations
      setShowBackConfirmation(true);
    } else {
      // Normal back navigation for new reservations
      goBack();
    }
  };

  const confirmGoBack = () => {
    setShowBackConfirmation(false);
    setCurrentStep('find-reservation');
  };

  const cancelGoBack = () => {
    setShowBackConfirmation(false);
  };

  const isReadyForPayment = hasExistingReservation
    ? // For existing reservations: only need activities and contact info
      selectedActivities.length > 0 && bookingData.contactInfo
    : // For new reservations: need dates, room, activities, and contact
      bookingData.checkIn &&
      bookingData.checkOut &&
      bookingData.guests &&
      selectedActivities.length > 0 &&
      bookingData.contactInfo &&
      selectedRoom;

  // Function to calculate prices
  const calculatePrices = () => {
    // For existing reservations, skip accommodation and date checks
    if (hasExistingReservation) {
      // Only calculate activities cost
      let activitiesTotal = 0;
      participants.forEach(participant => {
        participant.selectedActivities.forEach((activity: any) => {
          if (activity.category === 'yoga') {
            const yogaPackage = participant.selectedYogaPackages[activity.id];
            const yogaClassCount = participant.yogaClasses?.[activity.id] ?? 1;
            const useDiscount = participant.yogaUsePackDiscount?.[activity.id] ?? false;

            if (yogaPackage) {
              activitiesTotal += getActivityTotalPrice('yoga', yogaPackage, 1);
            } else {
              const pricePerClass = useDiscount ? 8 : 10;
              activitiesTotal += yogaClassCount * pricePerClass;
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

      return {
        accommodation: 0,
        activities: activitiesTotal,
        subtotal: activitiesTotal,
        tax: 0,
        total: activitiesTotal,
        currency: 'USD'
      };
    }

    // For new reservations, require room and dates
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
          const yogaClassCount = participant.yogaClasses?.[activity.id] ?? 1;
          const useDiscount = participant.yogaUsePackDiscount?.[activity.id] ?? false;

          if (yogaPackage) {
            activitiesTotal += getActivityTotalPrice('yoga', yogaPackage, 1);
          } else {
            // Calculate from individual classes
            const pricePerClass = useDiscount ? 8 : 10;
            activitiesTotal += yogaClassCount * pricePerClass;
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

  // Calculate correct deposit amount using the same logic as backend
  const calculateDepositAmount = () => {
    const prices = calculatePrices();
    if (!prices) return { deposit: 0, remaining: 0 };

    const { total, accommodationTotal, activitiesTotal } = prices;

    // Detect surf programs and coaching
    const surfPrograms = detectSurfPrograms(participants, selectedActivities);
    const coachingPrograms = getCoachingPrograms(participants, selectedActivities);

    if (surfPrograms.length > 0) {
      // Use the same formula as backend
      const effectiveAccommodationTotal = hasExistingReservation ? 0 : accommodationTotal;

      const paymentBreakdown = calculateWeTravelPayment({
        surfPrograms,
        coachingPrograms,
        accommodationTotal: effectiveAccommodationTotal
      });

      return {
        deposit: paymentBreakdown.total,
        remaining: total - paymentBreakdown.total
      };
    } else {
      // Fallback to 10% for non-surf bookings
      const deposit = Math.round(total * 0.10);
      return {
        deposit,
        remaining: total - deposit
      };
    }
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
  const checkPaymentStatus = async (orderId?: string, tripId?: string, tripUuid?: string) => {
    try {
      const params = new URLSearchParams();
      if (orderId) params.append('order_id', orderId);
      if (tripId && tripId !== '') params.append('trip_id', tripId);
      if (tripUuid && tripUuid !== '') params.append('trip_uuid', tripUuid);

      const response = await fetch(`/api/payment-status?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 Payment status check:', data);
      console.log('🔍 Debug - orderId:', orderId, 'tripId:', tripId, 'tripUuid:', tripUuid);
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
  const startPaymentStatusPolling = (orderId?: string, tripId?: string, tripUuid?: string) => {
    if (paymentStatusInterval.current) {
      clearInterval(paymentStatusInterval.current);
    }

    setIsCheckingPaymentStatus(true);
    console.log('🔄 Starting payment status polling for:', { orderId, tripId, tripUuid });

    // Check immediately
    checkPaymentStatus(orderId, tripId, tripUuid);

    // Then check every 3 seconds
    paymentStatusInterval.current = setInterval(() => {
      checkPaymentStatus(orderId, tripId, tripUuid);
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
      console.log('🔍 hasExistingReservation:', hasExistingReservation);
      console.log('🔍 existingReservationId:', bookingData.existingReservationId);

      let paymentPayload: any;

      // Build customer name (common for both flows)
      const customerName = `${bookingData.contactInfo?.firstName || ''} ${bookingData.contactInfo?.lastName || ''}`.trim() || 'Guest';

      if (hasExistingReservation) {
        // 📋 EXISTING RESERVATION: Only send activities data
        console.log('💼 Building payload for existing reservation');

        // Format dates for API
        const formatDateForAPI = (date: Date | string) => {
          if (typeof date === 'string') return date;
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        };

        const checkInFormatted = formatDateForAPI(bookingData.checkIn!);
        const checkOutFormatted = formatDateForAPI(bookingData.checkOut!);

        const activitiesLabel = locale === 'es' ? 'Actividades adicionales' : 'Additional activities';
        const dynamicTitle = `${customerName} - ${activitiesLabel}`;

        // For WeTravel: use tomorrow as start_date to avoid "dates in past" error
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const wetravelStartDate = tomorrow.toISOString().split('T')[0];

        // Use day after tomorrow as end_date, or actual checkout if it's in the future
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const checkOutDate = new Date(checkOutFormatted);
        const wetravelEndDate = checkOutDate > dayAfterTomorrow
          ? checkOutFormatted
          : dayAfterTomorrow.toISOString().split('T')[0];

        paymentPayload = {
          existingReservationId: bookingData.existingReservationId,
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guests: bookingData.guests,
          contactInfo: bookingData.contactInfo,
          locale,
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
          priceBreakdown: {
            accommodation: 0,
            activities: activitiesTotal,
            total: activitiesTotal
          },
          // WeTravel specific data
          wetravelData: {
            trip: {
              title: dynamicTitle,
              start_date: wetravelStartDate, // Tomorrow to avoid "dates in past" error
              end_date: wetravelEndDate, // Day after tomorrow or real checkout date
              currency: "USD",
              participant_fees: "none"
            },
            pricing: {
              price: Math.round(activitiesTotal),
              payment_plan: {
                allow_auto_payment: false,
                allow_partial_payment: false,
                deposit: 0,
                installments: []
              }
            }
          }
        };

        console.log('✅ Existing reservation payload built:', {
          existingReservationId: bookingData.existingReservationId,
          activitiesTotal,
          participantsCount: serializedParticipants.length
        });
      } else {
        // 🏠 NEW RESERVATION: Send complete booking data
        console.log('🏠 Building payload for new reservation');

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

        // Get accommodation name based on locale
        const accommodationNames = {
          'casa-playa': locale === 'es' ? 'Casa de Playa' : 'Beach House',
          'casitas-privadas': locale === 'es' ? 'Casitas Privadas' : 'Private House',
          'casas-deluxe': locale === 'es' ? 'Casas Deluxe' : 'Deluxe Studio'
        };
        const accommodationType = accommodationNames[selectedRoom?.roomTypeId as keyof typeof accommodationNames] || selectedRoom?.roomTypeId || 'Room';

        const nightsCount = Math.ceil((new Date(checkOutFormatted).getTime() - new Date(checkInFormatted).getTime()) / (1000 * 60 * 60 * 24));
        const nightsText = nightsCount === 1 ? (locale === 'es' ? '1 noche' : '1 night') : `${nightsCount} ${locale === 'es' ? 'noches' : 'nights'}`;
        const guestsText = bookingData.guests === 1 ? (locale === 'es' ? '1 huésped' : '1 guest') : `${bookingData.guests} ${locale === 'es' ? 'huéspedes' : 'guests'}`;
        const depositLabel = locale === 'es' ? 'Depósito' : 'Deposit';
        const dynamicTitle = `${customerName} - ${accommodationType} (${nightsText}, ${guestsText}) - ${depositLabel}`;

        console.log('📝 Generated dynamic title:', dynamicTitle);

        paymentPayload = {
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guests: bookingData.guests,
          roomTypeId: selectedRoom?.roomTypeId,
          isSharedRoom: selectedRoom?.isSharedRoom,
          contactInfo: bookingData.contactInfo,
          selectedRoom: selectedRoom ? { ...selectedRoom } : null,
          priceBreakdown,
          nights: nightsCount,
          locale,
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
              title: dynamicTitle,
              start_date: checkInFormatted,
              end_date: checkOutFormatted,
              currency: "USD",
              participant_fees: "none"
            },
            pricing: {
              price: Math.round(total), // TOTAL price - backend will calculate deposit
              payment_plan: {
                allow_auto_payment: false,
                allow_partial_payment: false,
                deposit: 0,
                installments: []
              }
            }
          }
        };

        console.log('✅ New reservation payload built');
      }

      console.log('💰 Total price:', total);
      console.log('💰 10% Deposit will be charged by backend:', Math.round(total * 0.10));
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

        // Start polling for payment status using order_id, trip_id, and trip_uuid
        const orderId = wetravelData.order_id;
        const tripId = wetravelData.trip_id;
        // Extract trip_uuid from various possible locations
        const tripUuid = wetravelData.trip_uuid ||
                        wetravelData.metadata?.trip?.uuid ||
                        wetravelData.debug?.trip_id ||
                        null;

        console.log('🔗 Payment link opened in new tab, starting payment status monitoring...', {
          orderId,
          tripId,
          tripUuid
        });

        // Start SSE connection for real-time updates
        startPaymentStatusSSE(orderId);

        // ALSO start polling as fallback with all available IDs
        startPaymentStatusPolling(orderId, tripId, tripUuid);
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
  // For existing reservations, skip accommodation calculations
  const nights = hasExistingReservation ? 0 : (
    bookingData.checkIn && bookingData.checkOut ? Math.ceil(
      (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    ) : 0
  );

  const accommodationTotal = hasExistingReservation ? 0 : (
    selectedRoom ? (
      selectedRoom.isSharedRoom
        ? selectedRoom.pricePerNight * nights * (bookingData.guests || 1)  // Casa de Playa: precio por persona
        : selectedRoom.pricePerNight * nights  // Privadas/Deluxe: precio por habitación (ya ajustado por backend)
    ) : 0
  );

  // Calculate activities total from all participants
  let activitiesTotal = 0;
  participants.forEach(participant => {
    participant.selectedActivities.forEach((activity: any) => {
      if (activity.category === 'yoga') {
        const yogaPackage = participant.selectedYogaPackages[activity.id];
        const yogaClassCount = participant.yogaClasses?.[activity.id] ?? 1;
        const useDiscount = participant.yogaUsePackDiscount?.[activity.id] ?? false;

        if (yogaPackage) {
          activitiesTotal += getActivityTotalPrice('yoga', yogaPackage, 1);
        } else {
          // Calculate from individual classes
          const pricePerClass = useDiscount ? 8 : 10;
          activitiesTotal += yogaClassCount * pricePerClass;
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

  const priceBreakdown = useMemo(
    () => ({
      accommodation: accommodationTotal,
      activities: activitiesTotal,
      subtotal: total,
      tax: 0,
      total,
      currency: 'USD'
    }),
    [accommodationTotal, activitiesTotal, total]
  );

  // Debug log to check participants data
  console.log('🔍 [PaymentSection] RENDERING - Participants data:', {
    participantsCount: participants.length,
    participants: participants.map(p => ({
      id: p.id,
      name: p.name,
      activitiesCount: p.selectedActivities.length,
      activities: p.selectedActivities.map((a: any) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        surfClasses: p.selectedSurfClasses?.[a.id],
        yogaPackage: p.selectedYogaPackages?.[a.id],
        yogaClasses: p.yogaClasses?.[a.id],
        yogaUsePackDiscount: p.yogaUsePackDiscount?.[a.id],
        quantity: p.activityQuantities?.[a.id]
      }))
    })),
    activitiesTotal,
    total
  });

  console.log('==================== PAYMENT SECTION START ====================');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Back Button */}
      <div className="mb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">{t('common.goBack')}</span>
        </motion.button>
      </div>

      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center mr-4 shadow-lg">
          <span className="text-slate-900 text-xl">💳</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">{t('payment.title')}</h2>
          <p className="text-amber-300">{t('payment.subtitle')}</p>
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

          {/* Deposit Notice */}
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-xl">ℹ️</span>
              <div>
                {hasExistingReservation ? (
                  <>
                    <h4 className="font-semibold text-blue-300 mb-1">
                      {locale === 'es' ? 'Añadiendo actividades a tu reserva' : 'Adding activities to your reservation'}
                    </h4>
                    <p className="text-blue-200 text-sm">
                      {locale === 'es'
                        ? 'El depósito será calculado automáticamente basado en las actividades seleccionadas. El saldo restante será debido antes de tu llegada.'
                        : 'The deposit will be automatically calculated based on your selected activities. The remaining balance will be due before your arrival.'}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-blue-300 mb-1">10% Deposit Required</h4>
                    <p className="text-blue-200 text-sm">
                      You only need to pay a 10% deposit now (${Math.round(total * 0.10)}) to secure your booking.
                      The remaining balance (${Math.round(total * 0.90)}) will be due before your arrival.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 rounded-xl font-bold text-base shadow-lg hover:from-amber-200 hover:to-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
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
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300/20 to-amber-500/20 border-b border-amber-400/30 px-4 md:px-5 py-3">
              <h3 className="text-lg font-bold text-black font-heading">{t('payment.summary.title')}</h3>
            </div>
            <div className="p-4 md:p-5 space-y-3">
              {/* Only show accommodation for new reservations */}
              {!hasExistingReservation && selectedRoom && (
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <div className="text-sm md:text-base font-medium text-black">{selectedRoom.roomTypeName}</div>
                  </div>
                  <div className="text-sm md:text-base font-medium text-right text-earth-600">${accommodationTotal}</div>
                </div>
              )}
              {/* Show existing reservation notice */}
              {hasExistingReservation && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                  <span className="text-amber-600 text-sm">ℹ️</span>
                  <span className="text-gray-700 text-sm font-medium">
                    {locale === 'es' ? 'Añadiendo actividades a reserva existente' : 'Adding activities to existing reservation'}
                  </span>
                </div>
              )}
              {participants.flatMap((participant, pIndex) => {
                console.log(`🔍 [PaymentSection] Participant ${pIndex + 1}:`, {
                  name: participant.name,
                  selectedActivitiesCount: participant.selectedActivities.length,
                  selectedActivities: participant.selectedActivities.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    category: a.category
                  })),
                  selectedYogaPackages: participant.selectedYogaPackages,
                  yogaClasses: participant.yogaClasses,
                  yogaUsePackDiscount: participant.yogaUsePackDiscount
                });

                return participant.selectedActivities.map((activity: any, aIndex) => {
                  let activityPrice: number;
                  let activityDetails: string = '';
                  const showParticipantName = participants.length > 1;

                  if (activity.category === 'yoga') {
                    const selectedYogaPackage = participant.selectedYogaPackages[activity.id];
                    const yogaClassCount = participant.yogaClasses?.[activity.id] ?? 1;
                    const useDiscount = participant.yogaUsePackDiscount?.[activity.id] ?? false;

                    console.log(`🧘 [PaymentSection] Yoga activity for ${participant.name}:`, {
                      activityId: activity.id,
                      activityName: activity.name,
                      selectedYogaPackage,
                      yogaClassCount,
                      useDiscount
                    });

                    if (selectedYogaPackage) {
                      // Has predefined package
                      activityPrice = getActivityTotalPrice('yoga', selectedYogaPackage, 1);
                      activityDetails = `(${selectedYogaPackage.replace('-', ' ')})`;
                      console.log(`✅ [PaymentSection] Yoga with package:`, { activityPrice, activityDetails });
                    } else {
                      // Calculate from individual classes
                      // Import calculateYogaPrice if needed, or calculate inline
                      const pricePerClass = useDiscount ? 8 : 10; // $10/class or $8/class with discount
                      activityPrice = yogaClassCount * pricePerClass;
                      activityDetails = `(${yogaClassCount} ${yogaClassCount === 1 ? 'class' : 'classes'})`;
                      console.log(`✅ [PaymentSection] Yoga with individual classes:`, { activityPrice, activityDetails, yogaClassCount, pricePerClass });
                    }
                  } else if (activity.category === 'surf') {
                    const surfClasses = participant.selectedSurfClasses[activity.id];
                    if (!surfClasses) return null; // No hay clases seleccionadas
                    activityPrice = getActivityTotalPrice('surf', undefined, 1, surfClasses);
                    // No mostramos detalles adicionales, el nombre del programa es suficiente
                    activityDetails = '';
                  } else {
                    const quantity = participant.activityQuantities[activity.id] || 1;
                    activityPrice = (activity.price || 0) * quantity;
                  }

                  // For surf activities, show program name instead of generic activity name
                  let displayName = activity.name;
                  if (activity.category === 'surf') {
                    const surfClasses = participant.selectedSurfClasses[activity.id];
                    if (surfClasses) {
                      const programId = surfClassesToProgram(surfClasses);
                      const program = SURF_PROGRAMS[programId];
                      displayName = program.name[locale === 'en' ? 'en' : 'es'];
                    }
                  }

                  return (
                    <div key={`${participant.id}-${activity.id}-${pIndex}-${aIndex}`} className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="text-sm md:text-base font-medium text-black">
                          {displayName}
                          {activityDetails && (
                            <span className="text-xs md:text-sm text-gray-600 ml-2">
                              {activityDetails}
                            </span>
                          )}
                        </div>
                        {showParticipantName && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {participant.name}
                          </div>
                        )}
                      </div>
                      <div className="text-sm md:text-base font-medium text-right whitespace-nowrap text-earth-600">${activityPrice}</div>
                    </div>
                  );
                });
              })
              }
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[18px] font-semibold text-black">{t('payment.summary.total')}</span>
                  <span className="text-[24px] font-bold text-right text-earth-600">${total}</span>
                </div>
                {(() => {
                  const { deposit, remaining } = calculateDepositAmount();
                  return (
                    <>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-700">
                          {locale === 'es' ? 'Depósito requerido' : 'Deposit Required'}
                        </span>
                        <span className="text-lg font-bold text-earth-600">
                          ${deposit}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {locale === 'es'
                          ? `Balance restante: $${remaining} a pagar antes de la llegada`
                          : `Remaining balance: $${remaining} due before arrival`}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-4 shadow-lg space-y-4">
            {/* Deposit Information */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600">💰</span>
                <span className="font-semibold text-black">
                  {locale === 'es' ? 'Información del Depósito' : 'Deposit Information'}
                </span>
              </div>
              <p className="text-gray-700 text-sm">
                {(() => {
                  const { deposit, remaining } = calculateDepositAmount();
                  return locale === 'es'
                    ? `Solo necesitas pagar un depósito de $${deposit} ahora. El balance restante de $${remaining} será pagado antes de tu llegada.`
                    : `You only need to pay a deposit of $${deposit} now. The remaining balance of $${remaining} will be paid before your arrival.`;
                })()}
              </p>
            </div>

            {/* Security Notice */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="font-semibold text-black">{t('payment.secure.title')}</span>
              </div>
              <p className="text-gray-700 text-sm mt-1">{t('payment.secure.description')}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="font-semibold text-red-900">{t('common.error')}</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Back Confirmation Modal */}
      {showBackConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {locale === 'es' ? '¿Estás seguro?' : 'Are you sure?'}
              </h3>
            </div>
            <p className="text-gray-700 mb-6">
              {locale === 'es'
                ? 'Si vuelves atrás, perderás el progreso en esta página de pago. ¿Deseas continuar?'
                : 'If you go back, you will lose the progress on this payment page. Do you want to continue?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelGoBack}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                {locale === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={confirmGoBack}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-slate-900 rounded-xl font-semibold transition-all shadow-lg"
              >
                {locale === 'es' ? 'Sí, volver' : 'Yes, go back'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
} 
