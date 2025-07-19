'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Users, Activity, Mail, Phone, Home, Bed } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { formatCurrency, formatDate, calculateNights, generateBookingReference } from '@/lib/utils';

export default function SuccessPage() {
  const { 
    bookingData,
    selectedActivities,
    selectedRoom,
    priceBreakdown,
    reset
  } = useBookingStore();

  const handleNewReservation = () => {
    reset();
  };

  if (!bookingData.contactInfo || !priceBreakdown) {
    return (
      <div className="card">
        <p className="text-center text-gray-500">
          No se encontró información de la reserva.
        </p>
      </div>
    );
  }

  const nights = calculateNights(
    new Date(bookingData.checkIn!), 
    new Date(bookingData.checkOut!)
  );
  
  const bookingReference = generateBookingReference();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          ¡Reserva Confirmada!
        </h1>
        <p className="text-xl text-gray-600">
          Tu aventura en el surf camp está confirmada
        </p>
      </motion.div>

      {/* Booking Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mb-8"
      >
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Referencia de Reserva
          </h2>
          <p className="text-3xl font-mono font-bold text-green-600">
            {bookingReference}
          </p>
          <p className="text-green-700 mt-2">
            Guarda este número para futuras consultas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Guest Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-ocean-600" />
              <span>Información del Huésped</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
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
              
              <div className="flex justify-between">
                <span className="text-gray-600">Huéspedes:</span>
                <span className="font-semibold">{bookingData.guests}</span>
              </div>
            </div>
          </div>

          {/* Stay Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-ocean-600" />
              <span>Detalles de la Estadía</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Entrada:</span>
                <span className="font-semibold">
                  {formatDate(new Date(bookingData.checkIn!))}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Salida:</span>
                <span className="font-semibold">
                  {formatDate(new Date(bookingData.checkOut!))}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Noches:</span>
                <span className="font-semibold">{nights}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation Information */}
        {selectedRoom && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Bed className="w-5 h-5 text-ocean-600" />
              <span>Alojamiento Reservado</span>
            </h3>
            
            <div className="bg-ocean-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-ocean-800">{selectedRoom.roomTypeName}</h4>
                  <p className="text-sm text-ocean-600">
                    {formatCurrency(selectedRoom.pricePerNight)} por noche
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ocean-800">
                    {formatCurrency(selectedRoom.pricePerNight * nights)}
                  </p>
                  <p className="text-sm text-ocean-600">{nights} noches</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities */}
        {selectedActivities.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-ocean-600" />
              <span>Actividades Reservadas</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedActivities.map((activity) => (
                <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {activity.duration} min • Máx. {activity.maxParticipants} personas
                    </span>
                    <span className="font-semibold text-ocean-600">
                      {formatCurrency(activity.price * bookingData.guests!)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="mt-8 bg-ocean-50 rounded-lg p-6">
          <h3 className="font-semibold text-ocean-800 mb-4">Resumen de Pago</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Alojamiento ({nights} noches)</span>
              <span>{formatCurrency(priceBreakdown.accommodation)}</span>
            </div>
            
            {priceBreakdown.activities.length > 0 && (
              <>
                <div className="text-sm text-gray-600">Actividades:</div>
                {priceBreakdown.activities.map((activity, index) => (
                  <div key={index} className="flex justify-between text-sm ml-4">
                    <span>{activity.name} × {activity.quantity}</span>
                    <span>{formatCurrency(activity.price * activity.quantity)}</span>
                  </div>
                ))}
              </>
            )}
            
            <div className="flex justify-between text-xl font-bold text-ocean-800 pt-4 border-t-2 border-ocean-300">
              <span>Total Pagado</span>
              <span>{formatCurrency(priceBreakdown.total)}</span>
            </div>
            
            <p className="text-sm text-ocean-600 mt-2">
              Sin IVA • Sin cargos adicionales
            </p>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card mb-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Próximos Pasos</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Confirmación por Email</p>
              <p className="text-gray-600 text-sm">
                Recibirás un email de confirmación con todos los detalles en {bookingData.contactInfo.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Contacto Directo</p>
              <p className="text-gray-600 text-sm">
                Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Home className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Preparativos</p>
              <p className="text-gray-600 text-sm">
                Te enviaremos una lista de qué traer y cómo llegar al surf camp
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card mb-8 text-center"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">¿Necesitas Ayuda?</h3>
        <p className="text-gray-600 mb-4">
          Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Phone className="w-6 h-6 text-ocean-600 mx-auto mb-2" />
            <p className="font-semibold">Teléfono</p>
            <p className="text-sm text-gray-600">+541153695627</p>
          </div>
          
          <div className="text-center">
            <Mail className="w-6 h-6 text-ocean-600 mx-auto mb-2" />
            <p className="font-semibold">Email</p>
                            <p className="text-sm text-gray-600">info@surfcamp-santateresa.com</p>
          </div>
          
          <div className="text-center">
            <Home className="w-6 h-6 text-ocean-600 mx-auto mb-2" />
            <p className="font-semibold">Ubicación</p>
            <p className="text-sm text-gray-600">Santa Teresa, Costa Rica</p>
          </div>
        </div>
      </motion.div>

      {/* New Reservation Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-center"
      >
        <button
          onClick={handleNewReservation}
          className="btn-primary"
        >
          Hacer Nueva Reserva
        </button>
      </motion.div>
    </div>
  );
} 