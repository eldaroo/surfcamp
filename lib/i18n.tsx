'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Tipos
export type Locale = 'es' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
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
          description: "Habitación compartida con 8 camas, perfecta para surfistas que buscan una experiencia social y económica.",
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
      notAvailable: "No disponible"
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
      }
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
      summary: "Resumen final",
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
        card: "Tarjeta de Crédito/Débito",
        cardDescription: "Paga con tarjeta de forma segura",
        crypto: "Criptomonedas",
        cryptoDescription: "Paga con Bitcoin, Ethereum y otras criptos",
        demo: "Pago Demo",
        demoDescription: "Para propósitos de demostración (sin cargo real)"
      },
      secure: {
        title: "Pago 100% Seguro",
        description: "Tu información está protegida con encriptación SSL"
      },
      processing: "Procesando pago...",
      payButton: "Confirmar y Pagar",
      error: {
        title: "Error en la Confirmación",
        missingData: "Faltan datos para el pago. Por favor revisa la información de la reserva.",
        processing: "Error procesando el pago"
      }
    },
    success: {
      title: "¡Reserva Confirmada!",
      subtitle: "Tu reserva ha sido procesada exitosamente",
      bookingReference: "Referencia de reserva",
      confirmationSent: "Se envió una confirmación a tu email",
      whatsappSent: "También recibirás un mensaje por WhatsApp",
      needHelp: "¿Necesitas Ayuda?",
      helpText: "Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos",
      phone: "Teléfono",
      email: "Email",
      location: "Ubicación",
      newReservation: "Hacer Nueva Reserva",
      thankYou: "¡Gracias por elegir SurfCamp Santa Teresa!"
    },
    prices: {
      perNight: "por noche",
      total: "Total",
      activities: "Actividades",
      accommodation: "Alojamiento",
      summary: "Resumen de precios",
      selectDates: "Selecciona fechas para ver el precio"
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
      guest: "person",
      guests_plural: "people",
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
          description: "Shared room with 8 beds, perfect for surfers looking for a social and affordable experience.",
          features: ["Shared", "Affordable", "Social"]
        },
        "casitas-privadas": {
          name: "Private Cottages",
          description: "Independent cottages with total privacy, ideal for couples or travelers seeking tranquility.",
          features: ["Private", "Quiet", "Independent"]
        },
        "casas-deluxe": {
          name: "Deluxe Houses",
          description: "Premium houses with all amenities, perfect for those seeking luxury and comfort.",
          features: ["Premium", "Spacious", "Deluxe Amenities"]
        }
      },
      pricePerNight: "per night",
      total: "Total",
      notAvailable: "Not available"
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
      }
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
        phone: "+1 234 567 890",
        dni: "12345678"
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
      summary: "Final summary",
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
        card: "Credit/Debit Card",
        cardDescription: "Pay securely with card",
        crypto: "Cryptocurrencies",
        cryptoDescription: "Pay with Bitcoin, Ethereum and other cryptos",
        demo: "Demo Payment",
        demoDescription: "For demonstration purposes (no real charge)"
      },
      secure: {
        title: "100% Secure Payment",
        description: "Your information is protected with SSL encryption"
      },
      processing: "Processing payment...",
      payButton: "Confirm and Pay",
      error: {
        title: "Confirmation Error",
        missingData: "Missing data for payment. Please review your booking information.",
        processing: "Error processing payment"
      }
    },
    success: {
      title: "Booking Confirmed!",
      subtitle: "Your booking has been processed successfully",
      bookingReference: "Booking reference",
      confirmationSent: "A confirmation has been sent to your email",
      whatsappSent: "You will also receive a WhatsApp message",
      needHelp: "Need Help?",
      helpText: "If you have any questions about your booking, don't hesitate to contact us",
      phone: "Phone",
      email: "Email",
      location: "Location",
      newReservation: "Make New Reservation",
      thankYou: "Thank you for choosing SurfCamp Santa Teresa!"
    },
    prices: {
      perNight: "per night",
      total: "Total",
      activities: "Activities",
      accommodation: "Accommodation",
      summary: "Price summary",
      selectDates: "Select dates to see price"
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
function getNestedTranslation(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : path;
  }, obj);
}

// Provider
export function I18nProvider({ children, initialLocale = 'es' }: { children: ReactNode; initialLocale?: Locale }) {
  console.log('🌍 I18nProvider - Iniciando con initialLocale:', initialLocale);
  console.log('🌍 I18nProvider - Tipo de initialLocale:', typeof initialLocale);
  console.log('🌍 I18nProvider - Locale válido:', ['es', 'en'].includes(initialLocale));

  const [locale, setLocale] = useState<Locale>(initialLocale);

  console.log('🌍 I18nProvider - Estado locale actual:', locale);

  const t = (key: string): string => {
    const translation = getNestedTranslation(translations[locale], key);
    const result = typeof translation === 'string' ? translation : key;
    console.log(`🌍 I18nProvider - Traducción: "${key}" -> "${result}" (locale: ${locale})`);
    return result;
  };

  console.log('✅ I18nProvider - Renderizando con locale:', locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
} 