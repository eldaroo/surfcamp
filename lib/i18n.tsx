'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Tipos
export type Locale = 'es' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  raw: <T = unknown>(key: string) => T | undefined;
}

// Traducciones
const translations = {
  es: {
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      continue: "Continuar",
      back: "Atrás",
      goBack: "Volver",
      next: "Siguiente",
      save: "Guardar",
      edit: "Editar",
      delete: "Eliminar",
      confirm: "Confirmar",
      close: "Cerrar"
    },
    hero: {
      title: "Reserva tu Experiencia de Surf",
      subtitle: "Vive la aventura perfecta con clases de surf, yoga y baños de hielo en un entorno paradisíaco. Personaliza tu estadía y reserva al instante."
    },
    booking: {
      steps: {
        dates: {
          title: "Fechas y Huéspedes",
          description: "Selecciona tus fechas de estadía"
        },
        accommodation: {
          title: "Alojamiento",
          description: "Elige tu tipo de habitación"
        },
        activities: {
          title: "Actividades",
          description: "Elige tus actividades favoritas"
        },
        contact: {
          title: "Contacto",
          description: "Completa tus datos"
        },
        confirmation: {
          title: "Confirmación",
          description: "Revisa tu reserva"
        },
        payment: {
          title: "Pago",
          description: "Completa tu reserva"
        },
        success: {
          title: "Confirmado",
          description: "¡Reserva exitosa!"
        }
      },
      validation: {
        completeAllData: "Completa todos los datos de la reserva antes de continuar."
      }
    },
    dates: {
      title: "Selecciona tus Fechas",
      subtitle: "Elige las fechas de tu estadía y número de huéspedes",
      checkIn: "Entrada",
      checkOut: "Salida",
      guests: "Huéspedes",
      nights: "noches",
      night: "noche",
      guest: "persona",
      guests_plural: "personas",
      searchAvailability: "Ver disponibilidad",
      searchingAvailability: "Buscando disponibilidad...",
      searchHint: "Actualiza las fechas y presiona Ver disponibilidad para mostrar los resultados.",
      placeholder: {
        selectDate: "Selecciona fecha"
      },
      validation: {
        selectDates: "Por favor selecciona las fechas de entrada y salida",
        pastDate: "No puedes seleccionar fechas pasadas",
        invalidRange: "La fecha de salida debe ser posterior a la fecha de entrada",
        guestsRange: "El número de huéspedes debe estar entre 1 y 12"
      },
      error: {
        noAvailability: "No hay disponibilidad para las fechas seleccionadas. Por favor elige otras fechas.",
        general: "Error verificando disponibilidad"
      },
      summary: {
        title: "Resumen de tu estadía",
        checkIn: "Entrada",
        checkOut: "Salida",
        nights: "Noches",
        guests: "Huéspedes"
      }
    },
    accommodation: {
      title: "Selecciona tu Alojamiento",
      subtitle: "Elige el tipo de habitación para tu estadía",
      searchSummary: "Resumen de tu búsqueda",
      checkIn: "Entrada",
      checkOut: "Salida",
      guests: "Huéspedes",
      nights: "Noches",
      noRoomsAvailable: "No hay habitaciones disponibles para las fechas seleccionadas",
      tryDifferentDates: "Intenta con otras fechas",
      roomTypes: {
        "casa-playa": {
          name: "Casa de Playa (Cuarto Compartido)",
          description: "Casa compartida frente al mar con vista al océano y ambiente social. Incluye cocina compartida, comedor amplio y patio con hamacas. Hasta 8 huéspedes (habitaciones con ventilador y AC).",
          features: ["Compartida", "Económica", "Social"]
        },
        "casitas-privadas": {
          name: "Casitas Privadas",
          description: "Casitas independientes con privacidad total, ideales para parejas o viajeros que buscan tranquilidad.",
          features: ["Privada", "Tranquila", "Independiente"]
        },
        "casas-deluxe": {
          name: "Casas Deluxe",
          description: "Casas premium con todas las comodidades, perfectas para quienes buscan lujo y confort.",
          features: ["Premium", "Espaciosa", "Comodidades Deluxe"]
        }
      },
      pricePerNight: "por noche",
      total: "Total",
      notAvailable: "No disponible",
      selectAccommodation: "Por favor selecciona una opción de alojamiento",
      searchingRooms: "Buscando habitaciones disponibles...",
      changeGuests: "Ajustar huéspedes",
      changeDates: "Cambiar fechas",
      capacity: "Capacidad",
      perNight: "por noche",
      suggestions: "Sugerencias",
      reducePlease: "Reduce el número de huéspedes",
      selectDifferentDates: "Selecciona fechas diferentes",
      contactSurfcamp: "Contacta al surfcamp para opciones especiales",
      noAvailableMessage: "no encontramos habitaciones con capacidad suficiente.",
      noAvailableFor: "Para",
      guestsFrom: "huéspedes del",
      to: "al",
      room: "habitación",
      rooms: "habitaciones",
      guest: "huésped", 
      guestsPlural: "huéspedes",
      sharedRoomBeds: "3 habitaciones con",
      totalBeds: "camas totales",
      kingSizeBed: "2 personas en cama king size",
      roomDescriptions: {
        "casa-playa": {
          desktop: "Casa compartida frente al mar con vista al océano y ambiente social. Incluye cocina, comedor amplio y patio con hamacas.",
          mobile: "Casa compartida frente al mar con vista al océano y ambiente social."
        },
        "casitas-privadas": {
          desktop: "Cabaña privada rodeada de jardín tropical, con total privacidad y confort. Incluye cocina, Wi-Fi y A/C — ideal para parejas.",
          mobile: "Cabaña privada con vista al jardín, Wi-Fi y A/C."
        },
        "casas-deluxe": {
          desktop: "Estudio privado a pocos pasos del mar. Equipado con cocina, baño con agua caliente, Wi-Fi y A/C — perfecto para parejas que buscan confort y privacidad.",
          mobile: "Estudio frente al mar para 2 personas, con cocina, Wi-Fi, A/C y cama king-size."
        }
      },
      features: {
        sharedRoom: "Cuarto Compartido",
        oceanView: "Vista al Mar",
        socialEnvironment: "Ambiente Social",
        totalPrivacy: "Privacidad Total",
        privateGarden: "Jardín Privado",
        intimateEnvironment: "Ambiente Íntimo",
        independentHouse: "Casa Independiente",
        beachStudio: "Beach Studio",
        privateKitchen: "Cocina Privada",
        hotWaterBathroom: "Baño con Agua Caliente",
        wifiAC: "Wi-Fi & AC"
      }
    },
    activities: {
      title: "Selecciona tus Actividades",
      subtitle: "Personaliza tu experiencia con actividades adicionales",
      noActivities: "No has seleccionado actividades",
      selectedActivities: "Actividades seleccionadas",
      addActivities: "Agregar actividades",
      categories: {
        surf: "Surf",
        yoga: "Yoga",
        ice_bath: "Baño de Hielo",
        transport: "Transporte"
      },
      selectProgressPlan: "Selecciona tu Plan de Progreso Personalizado:",
      selectDates: "Seleccionar Fechas",
      selectAtLeastOne: "Selecciona al menos una actividad para continuar",
      selectSurfRequired: "Debes seleccionar un programa de surf para continuar. Las demás actividades son opcionales.",
      mustSelectSurf: "Selecciona un Programa de Surf Primero",
      errorProcessing: "Error procesando actividades. Por favor intenta de nuevo.",
      peopleQuantity: "Cantidad de personas:",
      sessionsQuantity: "Cantidad de sesiones:",
      perSession: "por sesión",
      clear: "Cambiar Plan",
      dontIncludeYoga: "No incluir clases de yoga",
      includeIceBath: "Incluir Terapia de Baño de Hielo",
      removeIceBath: "Quitar Terapia de Baño de Hielo",
      classes: "Clases",
      class: "Clase",
      perProgram: "por programa",
      perTrip: "por viaje",
      perPerson: "por persona",
      trips: "viajes",
      sessions: "sesiones",
      forSessions: "para",
      people: "personas",
      pickupTime: "Horario de recogida:",
      urgency: "Plazas limitadas por grupo - reserva hoy para asegurar tu ola",
      socialProof: "4.9/5 de 120 surfistas felices",
      trusted: "Confiado por viajeros de +15 países",
      reserveSpot: "Reserva tu Plaza",
      bestValue: "Mejor Valor",
      savings: "Ahorra",
      yogaSocialProof: "4.8/5 de 85 yoguis felices",
      yogaSavings: "3 Clases - Ahorra 20%",
      yoga10Savings: "10 Clases - Ahorra 30%",
      iceBathSocialProof: "Usado por surfistas profesionales y atletas mundialmente - 4.9/5 satisfacción.",
      iceBathAuthority: "Seguro y supervisado por entrenadores certificados."
    },
    contact: {
      title: "Información de Contacto",
      subtitle: "Completa tus datos para completar la reserva",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Email",
      phone: "Teléfono",
      dni: "DNI",
      placeholder: {
        firstName: "Tu nombre",
        lastName: "Tu apellido",
        email: "tu@email.com",
        phone: "+34 123 456 789",
        dni: "12345678A"
      },
      validation: {
        firstNameRequired: "El nombre es requerido",
        lastNameRequired: "El apellido es requerido",
        emailRequired: "El email es requerido",
        emailInvalid: "Email inválido",
        phoneRequired: "El teléfono es requerido",
        dniRequired: "El DNI es requerido"
      },
      required: "Campo requerido",
      invalidEmail: "Email inválido",
      invalidPhone: "Teléfono inválido"
    },
    payment: {
      title: "Pago Seguro",
      subtitle: "Completa tu reserva con pago seguro",
      summary: {
        title: "Resumen del Pago",
        total: "Total"
      },
      client: "Cliente",
      dni: "DNI",
      email: "Email",
      phone: "Teléfono",
      dates: "Fechas",
      guests: "Huéspedes",
      accommodation: "Alojamiento",
      activities: "Actividades",
      total: "Total",
      method: {
        title: "Método de pago",
        wetravel: "WeTravel",
        wetravelDescription: "Pago seguro con tarjeta de crédito/débito",
        demo: "Pago Demo",
        demoDescription: "Para propósitos de demostración (sin cargo real)"
      },
      secure: {
        title: "Pago 100% Seguro",
        description: "Tu información está protegida con encriptación SSL"
      },
      processing: "Procesando pago...",
      payButton: "Confirmar y Pagar",
      waitingForPayment: {
        title: "Esperando Procesar Pago",
        description: "El link de pago se abrió en una nueva pestaña. Complete el pago en WeTravel y regrese aquí cuando termine.",
        openLinkButton: "Abrir Link de Pago",
        hideMessageButton: "Ocultar Mensaje"
      },
      error: {
        title: "Error en la Confirmación",
        missingData: "Faltan datos para el pago. Por favor revisa la información de la reserva.",
        processing: "Error procesando el pago"
      },
      processingDemo: "Procesando demo...",
      generatingLink: "Generando link de pago...",
      pleaseWait: "Por favor espera un momento",
      completeDemo: "Completar Demo",
      generateLink: "Generar Link de Pago",
      demoMode: "Modo Demo",
      demoNotice: "Este es un pago de demostración. No se realizará ninguna reserva real en el sistema ni se procesará ningún cargo.",
      bookingConfirmation: "Confirmación de Reserva",
      missingPaymentData: "Faltan datos para el pago. Verifica que el monto, la descripción y el ID de pedido estén definidos.",
      paymentSuccessful: "¡Pago exitoso! 🎉",
      paymentFailed: "El pago no fue exitoso. 😢",
      redirectingToPayment: "Redirigiendo al pago...",
      payWithCard: "Pagar con tarjeta",
      errorCreatingPayment: "Error al crear el pago",
      minimumAmount: "El monto mínimo para pagar con USDC (Solana) es"
    },
    success: {
      title: "¡Reserva Confirmada!",
      subtitle: "Tu reserva ha sido procesada exitosamente",
      bookingReference: "Referencia de reserva",
      confirmationSent: "Se envió una confirmación a tu email",
      confirmationText: "Revisa tu bandeja de entrada y spam para encontrar los detalles completos de tu reserva.",
      whatsappSent: "También recibirás un mensaje por WhatsApp",
      whatsappText: "Te contactaremos por WhatsApp con información adicional y coordinación de llegada.",
      needHelp: "¿Necesitas Ayuda?",
      helpText: "Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos",
      phone: "Teléfono",
      email: "Email",
      location: "Ubicación",
      newReservation: "Hacer Nueva Reserva",
      thankYou: "¡Gracias por elegir SurfCamp Santa Teresa!",
      loading: "Cargando confirmación..."
    },
    prices: {
      perNight: "por noche",
      total: "Total",
      activities: "Actividades",
      accommodation: "Alojamiento",
      summary: "Resumen de precios",
      selectDates: "Selecciona fechas para ver el precio",
      selectedActivitiesTitle: "Actividades Seleccionadas",
      activitiesTotal: "Total Actividades:",
      selectDatesForPrice: "Selecciona fechas para ver el precio completo con alojamiento",
      estimatedTotal: "Total Estimado",
      activitySelectedNoPackage: "Actividad seleccionada sin paquete (precio: $0)",
      activitySelectedNoPlan: "Actividad seleccionada sin plan de progreso (precio: $0)"
    }
  },
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      continue: "Continue",
      back: "Back",
      goBack: "Go Back",
      next: "Next",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      close: "Close"
    },
    hero: {
      title: "Book Your Surf Experience",
      subtitle: "Live the perfect adventure with surf lessons, yoga and ice baths in a paradisiacal environment. Customize your stay and book instantly."
    },
    booking: {
      steps: {
        dates: {
          title: "Dates & Guests",
          description: "Select your stay dates"
        },
        accommodation: {
          title: "Accommodation",
          description: "Choose your room type"
        },
        activities: {
          title: "Activities",
          description: "Choose your favorite activities"
        },
        contact: {
          title: "Contact",
          description: "Complete your information"
        },
        confirmation: {
          title: "Confirmation",
          description: "Review your booking"
        },
        payment: {
          title: "Payment",
          description: "Complete your booking"
        },
        success: {
          title: "Confirmed",
          description: "Successful booking!"
        }
      },
      validation: {
        completeAllData: "Complete all booking information before continuing."
      }
    },
    dates: {
      title: "Select Your Dates",
      subtitle: "Choose your stay dates and number of guests",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Guests",
      nights: "nights",
      night: "night",
      guest: "guest",
      guests_plural: "guests",
      searchAvailability: "Check availability",
      searchingAvailability: "Searching availability...",
      searchHint: "Update your dates and press Check availability to see results.",
      placeholder: {
        selectDate: "Select date"
      },
      validation: {
        selectDates: "Please select check-in and check-out dates",
        pastDate: "You cannot select past dates",
        invalidRange: "Check-out date must be after check-in date",
        guestsRange: "Number of guests must be between 1 and 12"
      },
      error: {
        noAvailability: "No availability for selected dates. Please choose different dates.",
        general: "Error checking availability"
      },
      summary: {
        title: "Stay Summary",
        checkIn: "Check-in",
        checkOut: "Check-out",
        nights: "Nights",
        guests: "Guests"
      }
    },
    accommodation: {
      title: "Select Your Accommodation",
      subtitle: "Choose the room type for your stay",
      searchSummary: "Search Summary",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Guests",
      nights: "Nights",
      noRoomsAvailable: "No rooms available for selected dates",
      tryDifferentDates: "Try different dates",
      roomTypes: {
        "casa-playa": {
          name: "Beach House (Shared Room)",
          description: "Shared beachfront house with ocean view and social vibe. Includes shared kitchen, large dining area, and hammock yard. Up to 8 guests (rooms with fan & AC).",
          features: ["Shared", "Affordable", "Social"]
        },
        "casitas-privadas": {
          name: "Private Cottages",
          description: "Independent cottages with total privacy, ideal for couples or travelers seeking tranquility.",
          features: ["Private", "Quiet", "Independent"]
        },
        "casas-deluxe": {
          name: "Deluxe Studio",
          description: "Premium studio with all amenities, perfect for those seeking luxury and comfort.",
          features: ["Premium", "Spacious", "Deluxe Amenities"]
        }
      },
      pricePerNight: "per night",
      total: "Total",
      notAvailable: "Not available",
      selectAccommodation: "Please select an accommodation option",
      searchingRooms: "Searching for available rooms...",
      changeGuests: "Adjust guests",
      changeDates: "Change dates",
      capacity: "Capacity",
      perNight: "per night",
      suggestions: "Suggestions",
      reducePlease: "Reduce the number of guests",
      selectDifferentDates: "Select different dates",
      contactSurfcamp: "Contact the surfcamp for special options",
      noAvailableMessage: "we couldn't find rooms with sufficient capacity.",
      noAvailableFor: "For",
      guestsFrom: "guests from",
      to: "to",
      room: "room",
      rooms: "rooms",
      guest: "guest",
      guestsPlural: "guests",
      sharedRoomBeds: "3 rooms with",
      totalBeds: "total beds",
      kingSizeBed: "2 people in a king size bed",
      roomDescriptions: {
        "casa-playa": {
          desktop: "Shared beachfront house with ocean view and social vibe. Includes shared kitchen, large dining area, and hammock yard.",
          mobile: "Shared beachfront house with ocean view and social vibe."
        },
        "casitas-privadas": {
          desktop: "Private cottage surrounded by tropical garden, offering total privacy and comfort. Includes private kitchen, Wi-Fi, and A/C — ideal for couples.",
          mobile: "Private cottage with garden view, Wi-Fi, and A/C."
        },
        "casas-deluxe": {
          desktop: "Private studio just steps from the beach. Includes a private kitchen, hot-water bathroom, Wi-Fi, and A/C — perfect for couples seeking comfort and privacy.",
          mobile: "Beachfront studio for 2 guests with kitchen, Wi-Fi, A/C, and king-size bed."
        }
      },
      features: {
        sharedRoom: "Shared Room",
        oceanView: "Ocean View",
        socialEnvironment: "Social Environment",
        totalPrivacy: "Total Privacy",
        privateGarden: "Private Garden",
        intimateEnvironment: "Intimate Environment",
        independentHouse: "Independent House",
        beachStudio: "Beach Studio",
        privateKitchen: "Private Kitchen",
        hotWaterBathroom: "Hot Water Bathroom",
        wifiAC: "Wi-Fi & AC"
      }
    },
    activities: {
      title: "Select Your Activities",
      subtitle: "Customize your experience with additional activities",
      noActivities: "No activities selected",
      selectedActivities: "Selected activities",
      addActivities: "Add activities",
      categories: {
        surf: "Surf",
        yoga: "Yoga",
        ice_bath: "Ice Bath",
        transport: "Transport"
      },
      selectProgressPlan: "Select your Personalized Progress Plan:",
      selectDates: "Select Dates",
      mustSelectSurf: "Select a Surf Program First",
      selectAtLeastOne: "Select at least one activity to continue",
      selectSurfRequired: "You must select a surf program to continue. Other activities are optional.",
      errorProcessing: "Error processing activities. Please try again.",
      peopleQuantity: "Number of people:",
      sessionsQuantity: "Number of sessions:",
      perSession: "per session",
      clear: "Change Plan",
      dontIncludeYoga: "Don't include yoga lessons",
      includeIceBath: "Include Ice Bath Therapy",
      removeIceBath: "Remove Ice Bath Therapy",
      classes: "Classes",
      class: "Class",
      perProgram: "per program",
      perTrip: "per trip",
      perPerson: "per person",
      trips: "trips",
      sessions: "sessions",
      forSessions: "for",
      people: "people",
      pickupTime: "Pickup time:",
      urgency: "Limited spots per group - book today to secure your wave",
      socialProof: "4.9/5 from 120 happy surfers",
      trusted: "Trusted by travelers from 15+ countries",
      reserveSpot: "Reserve Your Spot Now",
      bestValue: "Best Value",
      savings: "Save",
      yogaSocialProof: "4.8/5 from 85 happy yogis",
      yogaSavings: "3 Classes - Save 20%",
      yoga10Savings: "10 Classes - Save 30%",
      iceBathSocialProof: "Used by pro surfers & athletes worldwide - 4.9/5 satisfaction.",
      iceBathAuthority: "Safe & supervised by certified coaches."
    },
    contact: {
      title: "Contact Information",
      subtitle: "Complete your information to finish the booking",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      dni: "ID Number",
      placeholder: {
        firstName: "Your first name",
        lastName: "Your last name",
        email: "your@email.com",
        phone: "your phone number",
        dni: "Your ID number" // Changed from "12345678" to "Your ID number" for generality
      },
      validation: {
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        emailRequired: "Email is required",
        emailInvalid: "Invalid email",
        phoneRequired: "Phone is required",
        dniRequired: "ID number is required"
      },
      required: "Required field",
      invalidEmail: "Invalid email",
      invalidPhone: "Invalid phone number"
    },
    payment: {
      title: "Secure Payment",
      subtitle: "Complete your booking with secure payment",
      summary: {
        title: "Payment Summary",
        total: "Total"
      },
      client: "Client",
      dni: "ID Number",
      email: "Email",
      phone: "Phone",
      dates: "Dates",
      guests: "Guests",
      accommodation: "Accommodation",
      activities: "Activities",
      total: "Total",
      method: {
        title: "Payment method",
        wetravel: "WeTravel",
        wetravelDescription: "Secure payment with credit/debit card",
        demo: "Demo Payment",
        demoDescription: "For demonstration purposes (no real charge)"
      },
      secure: {
        title: "100% Secure Payment",
        description: "Your information is protected with SSL encryption"
      },
      processing: "Processing payment...",
      payButton: "Confirm and Pay",
      waitingForPayment: {
        title: "Waiting for Payment Processing",
        description: "The payment link opened in a new tab. Complete the payment on WeTravel and return here when finished.",
        openLinkButton: "Open Payment Link",
        hideMessageButton: "Hide Message"
      },
      error: {
        title: "Confirmation Error",
        missingData: "Missing data for payment. Please review your booking information.",
        processing: "Error processing payment"
      },
      processingDemo: "Processing demo...",
      generatingLink: "Generating payment link...",
      pleaseWait: "Please wait a moment",
      completeDemo: "Complete Demo",
      generateLink: "Generate Payment Link",
      demoMode: "Demo Mode",
      demoNotice: "This is a demonstration payment. No real reservation will be made in the system and no charges will be processed.",
      bookingConfirmation: "Booking Confirmation",
      missingPaymentData: "Missing payment data. Verify that the amount, description and order ID are defined.",
      paymentSuccessful: "Payment successful! 🎉",
      paymentFailed: "Payment was not successful. 😢",
      redirectingToPayment: "Redirecting to payment...",
      payWithCard: "Pay with card",
      errorCreatingPayment: "Error creating payment",
      minimumAmount: "The minimum amount to pay with USDC (Solana) is"
    },
    success: {
      title: "Booking Confirmed!",
      subtitle: "Your booking has been processed successfully",
      bookingReference: "Booking reference",
      confirmationSent: "A confirmation has been sent to your email",
      confirmationText: "Check your inbox and spam folder to find the complete details of your booking.",
      whatsappSent: "You will also receive a WhatsApp message",
      whatsappText: "We will contact you via WhatsApp with additional information and arrival coordination.",
      needHelp: "Need Help?",
      helpText: "If you have any questions about your booking, don't hesitate to contact us",
      phone: "Phone",
      email: "Email",
      location: "Location",
      newReservation: "Make New Reservation",
      thankYou: "Thank you for choosing SurfCamp Santa Teresa!",
      loading: "Loading confirmation..."
    },
    prices: {
      perNight: "per night",
      total: "Total",
      activities: "Activities",
      accommodation: "Accommodation",
      summary: "Price summary",
      selectDates: "Select dates to see price",
      selectedActivitiesTitle: "Selected Activities",
      activitiesTotal: "Activities Total:",
      selectDatesForPrice: "Select dates to see complete price with accommodation",
      estimatedTotal: "Estimated Total",
      activitySelectedNoPackage: "Activity selected without package (price: $0)",
      activitySelectedNoPlan: "Activity selected without progress plan (price: $0)"
    }
  }
};

// Context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Hook personalizado
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Función para obtener traducción anidada
function getNestedTranslation(obj: any, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      // @ts-expect-error dynamic lookup
      return current[key];
    }
    return undefined;
  }, obj);
}

// Provider
export function I18nProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = (key: string): string => {
    const translation = getNestedTranslation(translations[locale], key);
    return typeof translation === 'string' ? translation : key;
  };

  const raw = <T = unknown>(key: string): T | undefined => {
    return getNestedTranslation(translations[locale], key) as T | undefined;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, raw }}>
      {children}
    </I18nContext.Provider>
  );
}
