'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ChevronLeft, Lock, CheckCircle } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { formatCurrency, generateBookingReference } from '@/lib/utils';
import BookingConfirmation from './BookingConfirmation';
import ContactForm from './ContactForm';

export default function PaymentSection() {
  const { 
    bookingData,
    selectedActivities,
    selectedRoom,
    priceBreakdown,
    setCurrentStep,
    setLoading,
    setError,
    error,
    currentStep // <-- Asegurarse de obtener el paso actual
  } = useBookingStore();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mock'>('mock');
  const [showCardPayment, setShowCardPayment] = useState(false);
  // Generar orderId solo una vez por sesión de pago
  const [orderId] = useState(() => generateBookingReference());
  const orderDescription = bookingData.contactInfo && bookingData.checkIn && bookingData.checkOut
    ? `Reserva para ${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName} del ${new Date(bookingData.checkIn).toLocaleDateString('es-ES')} al ${new Date(bookingData.checkOut).toLocaleDateString('es-ES')}`
    : '';

  const handlePayment = async () => {
    if (!priceBreakdown || !bookingData.contactInfo) {
      setError('Información de reserva incompleta');
      return;
    }

    setIsProcessingPayment(true);
    setError(null);

    try {
      const bookingReference = generateBookingReference();

      // For demo mode, skip actual payment processing
      let paymentData = null;
      
      if (paymentMethod === 'mock') {
        // Simulate demo payment processing
        console.log('🎯 Processing demo payment...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        paymentData = {
          success: true,
          paymentIntentId: `demo_pi_${Date.now()}`,
          clientSecret: `demo_secret_${Date.now()}`,
          message: 'Demo payment processed successfully'
        };
        
        console.log('✅ Demo payment completed:', paymentData);
      } else {
        // Real Stripe payment (when implemented)
        const paymentResponse = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceBreakdown.total,
            currency: 'eur',
            bookingReference,
          }),
        });

        paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Error creating payment intent');
        }

        // Simulate payment processing (replace with real Stripe Elements integration)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('🏨 Creating reservation with data:', {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        contactInfo: bookingData.contactInfo,
        roomTypeId: selectedRoom?.roomTypeId || 'casa-playa',
        activities: selectedActivities.map(a => a.id),
        paymentIntentId: paymentData.paymentIntentId,
      });

      // Create reservation
      const reservationResponse = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          contactInfo: bookingData.contactInfo,
          roomTypeId: selectedRoom?.roomTypeId || 'casa-playa',
          activities: selectedActivities.map(a => a.id),
          paymentIntentId: paymentData.paymentIntentId,
        }),
      });

      const reservationData = await reservationResponse.json();

      if (!reservationResponse.ok) {
        throw new Error(reservationData.error || 'Error creating reservation');
      }

      console.log('✅ Reservation created successfully:', reservationData);

      // Success! Move to success page
      setCurrentStep('success');
    } catch (error) {
      console.error('Payment/Reservation error:', error);
      setError(error instanceof Error ? error.message : 'Error procesando el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Renderizar el formulario de contacto si el paso actual es 'contact'
  if (currentStep === 'contact') {
    return <ContactForm />;
  }

  if (!bookingData.contactInfo || !priceBreakdown) {
    return (
      <div className="card">
        <p className="text-center text-gray-500">
          Información de reserva incompleta. Por favor vuelve al paso anterior.
        </p>
      </div>
    );
  }

  // Si el usuario elige pagar con tarjeta, mostrar BookingConfirmation
  if (showCardPayment) {
    // Validar datos antes de mostrar BookingConfirmation
    if (!orderId || !orderDescription || !priceBreakdown || !bookingData.contactInfo) {
      return (
        <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Error en la Confirmación</h2>
          <div className="mb-4 text-red-600 font-semibold">Faltan datos para el pago. Por favor revisa la información de la reserva.</div>
          <button className="btn-primary" onClick={() => setShowCardPayment(false)}>Volver</button>
        </div>
      );
    }
    return (
      <BookingConfirmation
        amount={priceBreakdown.total}
        order_id={orderId}
        order_description={orderDescription}
        summary={
          <div className="mb-4">
            <div><b>Fechas:</b> {new Date(bookingData.checkIn!).toLocaleDateString('es-ES')} - {new Date(bookingData.checkOut!).toLocaleDateString('es-ES')}</div>
            <div><b>Huéspedes:</b> {bookingData.guests}</div>
            {selectedRoom && <div><b>Alojamiento:</b> {selectedRoom.roomTypeName}</div>}
            {selectedActivities.length > 0 && (
              <div><b>Actividades:</b> {selectedActivities.map(a => a.name).join(', ')}</div>
            )}
          </div>
        }
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pago Seguro</h2>
          <p className="text-gray-600">Completa tu reserva de forma segura</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Pago 100% Seguro</p>
            <p className="text-green-600 text-sm">
              Tu información está protegida con encriptación SSL
            </p>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Resumen final</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-semibold">
              {bookingData.contactInfo.firstName} {bookingData.contactInfo.lastName}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">DNI:</span>
            <span className="font-semibold">{bookingData.contactInfo.dni}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-semibold">{bookingData.contactInfo.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Teléfono:</span>
            <span className="font-semibold">{bookingData.contactInfo.phone}</span>
          </div>
          
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-gray-600">Fechas:</span>
            <span className="font-semibold">
              {new Date(bookingData.checkIn!).toLocaleDateString('es-ES')} - {' '}
              {new Date(bookingData.checkOut!).toLocaleDateString('es-ES')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Huéspedes:</span>
            <span className="font-semibold">{bookingData.guests}</span>
          </div>

          {selectedRoom && (
            <div className="flex justify-between">
              <span className="text-gray-600">Alojamiento:</span>
              <span className="font-semibold">{selectedRoom.roomTypeName}</span>
            </div>
          )}
          
          {selectedActivities.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-gray-600 mb-2">Actividades:</p>
              {selectedActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between ml-4">
                  <span className="text-gray-500">{activity.name}</span>
                  <span className="font-semibold">
                    {formatCurrency(activity.price * bookingData.guests!)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Método de pago</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="mock"
              checked={paymentMethod === 'mock'}
              onChange={(e) => setPaymentMethod(e.target.value as 'mock')}
              className="text-ocean-600"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Pago Demo</p>
              <p className="text-sm text-gray-600">
                Para propósitos de demostración (no se procesará ningún cargo real)
              </p>
            </div>
            <div className="text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="text-ocean-600"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Tarjeta de Crédito/Débito</p>
              <p className="text-sm text-gray-600">
                Paga con tarjeta de forma segura usando NOWPayments
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </label>
        </div>
      </div>

      {/* Total */}
      <div className="bg-ocean-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-ocean-800">Total a pagar:</span>
          <span className="text-2xl font-bold text-ocean-600">
            {formatCurrency(priceBreakdown.total)}
          </span>
        </div>
        <p className="text-sm text-ocean-600 mt-2">
          Sin IVA • Sin cargos adicionales
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('confirmation')}
          disabled={isProcessingPayment}
          className="btn-secondary flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        {paymentMethod === 'card' ? (
          <button
            onClick={() => setShowCardPayment(true)}
            disabled={isProcessingPayment}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>Pagar con tarjeta</span>
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessingPayment ? 'Procesando...' : `Confirmar y Pagar ${formatCurrency(priceBreakdown.total)}`}
            </span>
          </button>
        )}
      </div>

      {/* Processing Animation */}
      {isProcessingPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {paymentMethod === 'mock' ? 'Procesando pago demo...' : 'Procesando tu pago...'}
            </h3>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu reserva
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 