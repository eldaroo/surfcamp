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
      iceBathAuthority: "Seguro y supervisado por entrenadores certificados.",
      edit: "Editar Actividades"
    },
    surfPrograms: {
      title: "Elige tu Programa de Surf",
      subtitle: "Programas diseñados para llevar tu surf al siguiente nivel",
      method: {
        title: "Nuestro Método Integrado de Coaching de Surf",
        subtitle: "En cada sesión trabajamos en:",
        pillars: {
          biomechanics: {
            title: "Biomecánica & memoria muscular",
            description: "Técnica correcta desde el inicio para maximizar tu progreso"
          },
          coaching: {
            title: "Equipo de coaching de alto nivel",
            description: "Instructores certificados con años de experiencia en Santa Teresa"
          },
          feedback: {
            title: "Feedback técnico basado en video",
            description: "Análisis visual de tus olas para acelerar tu aprendizaje"
          },
          mindset: {
            title: "Mentalidad, seguridad & nutrición práctica",
            description: "Enfoque integral para convertirte en un surfista completo"
          }
        }
      },
      programs: {
        fundamental: {
          name: "Core Surf Program",
          level: "Principiante - Nivel 1.1, 1.2, 1.3",
          tagline: "Construye una base sólida y evita malos hábitos desde el día uno",
          price: "450",
          includes: {
            title: "Incluye:",
            items: [
              "4 sesiones de surf",
              "2 sesiones de videoanálisis",
              "Tabla + lycra + transporte",
              "Sesión de fotos opcional",
              "Plan de continuidad"
            ]
          },
          sessions: {
            title: "En cada sesión trabajaremos en:",
            items: [
              "Técnica & biomecánica: Popup, postura, balance en la tabla",
              "Mentalidad & confianza en el océano: Lectura de olas, posicionamiento básico",
              "Nutrición práctica & recuperación: Hidratación, comidas pre-surf",
              "Feedback visual & seguimiento de progreso: Revisión de video de tus primeras olas"
            ]
          }
        },
        progression: {
          name: "Intensive Surf Program",
          level: "Principiante con experiencia / Intermedio temprano - Nivel 1.2, 1.3, 2.1",
          tagline: "Corrige patrones clave, lee mejor las olas y desbloquea tu siguiente nivel",
          price: "650",
          includes: {
            title: "Incluye:",
            items: [
              "6 sesiones de surf",
              "4 sesiones de videoanálisis",
              "1 sesión de fotos",
              "Plan de práctica final"
            ]
          },
          sessions: {
            title: "En cada sesión trabajaremos en:",
            items: [
              "Técnica & biomecánica: Giros básicos, generación de velocidad, línea de olas",
              "Mentalidad & confianza en el océano: Selección de olas, timing de take-off",
              "Nutrición práctica & recuperación: Snacks energéticos, descanso activo",
              "Feedback visual & seguimiento de progreso: Comparación antes/después, correcciones en tiempo real"
            ]
          }
        },
        highPerformance: {
          name: "Elite Surf Program",
          level: "Intermedio-Avanzado - Nivel 2.1, 2.2",
          tagline: "Entrena como un atleta y transforma tu manera de surfear",
          price: "910",
          includes: {
            title: "Incluye:",
            items: [
              "8 sesiones de alto rendimiento",
              "5 sesiones de videoanálisis avanzado",
              "Sesión de fotos + drone",
              "Revisión final extendida"
            ]
          },
          sessions: {
            title: "En cada sesión trabajaremos en:",
            items: [
              "Técnica & biomecánica: Maniobras verticales, cutbacks, floaters",
              "Mentalidad & confianza en el océano: Surf en olas más grandes, manejo de wipeouts",
              "Nutrición práctica & recuperación: Planes de comidas, estiramientos específicos",
              "Feedback visual & seguimiento de progreso: Análisis cuadro por cuadro, métricas de rendimiento"
            ]
          }
        }
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
      invalidPhone: "Formato inválido. Debe incluir código de país (ej: +54 11 1234 5678)"
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
      thankYou: "¡Gracias por elegir Zeneidas Surf Garden!",
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
    },
    landing: {
      navigation: {
        home: "Inicio",
        experience: "Experiencia",
        stories: "Historias",
        accommodation: "Alojamiento",
        activities: "Actividades",
        faqs: "Preguntas",
        contact: "Contacto",
        bookNow: "Reservar Ahora"
      },
      hero: {
        title: "Santa Teresa Surf",
        subtitle: "Experimenta el mejor programa de surf en Costa Rica en Zeneidas Surf Garden",
        tagline: "Surf, Yoga, Meditación & Baños de Hielo en Santa Teresa",
        bookNow: "Reservar Ahora",
        exploreActivities: "Explorar Actividades"
      },
      accommodationShowcase: {
        title: "Tu Hogar en el Paraíso",
        subtitle: "Despierta con vistas al océano y duerme con el sonido de las olas. Elige el espacio perfecto para tu aventura de surf."
      },
      activitiesShowcase: {
        title: "Prueba Nuestras Actividades",
        subtitle: "Descubre las experiencias transformadoras que te esperan",
        clickToPlay: "Click para reproducir",
        surfProgram: {
          title: "Programa de Surf",
          description: "Cabalga la Ola - Experimenta la emoción del surf en las aguas cristalinas de Santa Teresa."
        },
        breathwork: {
          title: "Respiraciones",
          description: "Aprende técnicas de respiración poderosas para autorregular tus emociones y liberar el estrés."
        },
        soundHealing: {
          title: "Sanación Sonora & Kirtan",
          description: "Conéctate con energías sutiles a través de canciones sagradas y ceremonias de sanación sonora."
        },
        creativeArts: {
          title: "Artes Creativas",
          description: "Exprésate a través de la cerámica y otras actividades creativas en nuestro estudio de arte."
        }
      },
      reviews: {
        title: "Experiencia Transformadora",
        subtitle: "Descubre las historias de nuestros participantes",
        years: "años",
        data: [
          {
            id: 1,
            name: 'Luján Sánchez',
            age: 44,
            country: 'Argentina',
            occupation: 'Dentista',
            avatar: '/assets/reviews/reviews-lujan.jpg',
            quote: '"La gente, la conexión con la naturaleza, el surf..."',
            review: 'La gente, la conexión con la naturaleza, el surf... Encontré en Santa Teresa lo que estaba buscando cuando dejé mi país el año pasado. Me encanta vivir en Zeneidas, se siente como en casa, lo que necesito ahora. Esta experiencia abre mi mente y me permite ser una mejor persona. Estoy muy feliz. ♥️',
          },
          {
            id: 2,
            name: 'Catherine Cormier',
            age: 25,
            country: 'Canadá',
            occupation: 'Estudiante',
            avatar: '/assets/reviews/review-catherine.jpg',
            quote: '"Este lugar rápidamente comenzó a sentirse como en casa"',
            review: '¡Este lugar rápidamente comenzó a sentirse como en casa y las personas que trabajan y viven aquí realmente son como una familia! Me encantó el equilibrio entre tener actividades organizadas y tiempo libre. Siempre había algo que hacer, pero nunca se sentía abrumador. La comida era deliciosa y la ubicación es perfecta. Hice tantos recuerdos increíbles que nunca olvidaré y conocí a personas realmente maravillosas ♥️',
          },
          {
            id: 3,
            name: 'Taylor Evans',
            age: 32,
            country: 'Sudáfrica',
            occupation: 'Profesor',
            avatar: '/assets/reviews/review-taylor.jpg',
            quote: '"Vine aquí sin saber qué esperar..."',
            review: 'Vine aquí sin saber qué esperar y quedé impresionado por la comunidad, las actividades y el ambiente en general. Las clases de surf fueron increíbles, las sesiones de yoga fueron exactamente lo que necesitaba, y el trabajo de respiración cambió mi vida. Los facilitadores son muy conocedores y cariñosos. Esta experiencia realmente me ha transformado.',
          },
          {
            id: 4,
            name: 'Marcelo',
            age: 60,
            country: 'Argentina',
            occupation: 'Jubilado',
            avatar: '/assets/reviews/reviews-marcelo.jpg',
            quote: '"A mi edad, nunca pensé que podría aprender a surfear..."',
            review: 'A mi edad, nunca pensé que podría aprender a surfear, ¡pero los instructores aquí lo hicieron posible y muy divertido! Toda la experiencia fue rejuvenecedora - desde el yoga matutino hasta las reuniones nocturnas. Me sentí bienvenido y apoyado todos los días. Este lugar tiene una magia especial que une a las personas.',
          },
          {
            id: 5,
            name: 'Eilin Annika Orgland',
            age: 22,
            country: 'Suiza',
            occupation: 'Fotógrafa',
            avatar: '/assets/reviews/reviews-eilin.jpg',
            quote: '"Los atardeceres más hermosos, las personas más cálidas..."',
            review: 'Los atardeceres más hermosos, las personas más cálidas y la energía más increíble. Vine aquí sola y me fui con una familia. Cada actividad fue cuidadosamente planificada y los facilitadores realmente se preocupan por tu crecimiento y bienestar. ¡El surf camp superó todas mis expectativas y no puedo esperar para volver!',
          },
        ]
      }
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
          name: "Private House",
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
      iceBathAuthority: "Safe & supervised by certified coaches.",
      edit: "Edit Activities"
    },
    surfPrograms: {
      title: "Choose Your Surf Program",
      subtitle: "Programs designed to take your surfing to the next level",
      method: {
        title: "Our Integrated Surf Coaching Method",
        subtitle: "In each session we work on:",
        pillars: {
          biomechanics: {
            title: "Biomechanics & muscle memory",
            description: "Correct technique from day one to maximize your progress"
          },
          coaching: {
            title: "High-level coaching team",
            description: "Certified instructors with years of experience in Santa Teresa"
          },
          feedback: {
            title: "Video-based technical feedback",
            description: "Visual analysis of your waves to accelerate your learning"
          },
          mindset: {
            title: "Mindset, safety & practical nutrition",
            description: "Comprehensive approach to become a complete surfer"
          }
        }
      },
      programs: {
        fundamental: {
          name: "Core Surf Program",
          level: "Beginner - Level 1.1, 1.2, 1.3",
          tagline: "Build a strong foundation and avoid bad habits from day one",
          price: "450",
          includes: {
            title: "Includes:",
            items: [
              "4 surf sessions",
              "2 video analysis sessions",
              "Board + wetsuit + transport",
              "Optional photo session",
              "Continuity plan"
            ]
          },
          sessions: {
            title: "In each session we'll work on:",
            items: [
              "Technique & biomechanics: Popup, posture, balance on board",
              "Mindset & confidence in the ocean: Wave reading, basic positioning",
              "Practical nutrition & recovery: Hydration, pre-surf meals",
              "Visual feedback & progression tracking: Video review of your first waves"
            ]
          }
        },
        progression: {
          name: "Intensive Surf Program",
          level: "Early Intermediate - Level 1.2, 1.3, 2.1",
          tagline: "Correct key patterns, read waves better and unlock your next level",
          price: "650",
          includes: {
            title: "Includes:",
            items: [
              "6 surf sessions",
              "4 video analysis sessions",
              "1 photo session",
              "Final practice plan"
            ]
          },
          sessions: {
            title: "In each session we'll work on:",
            items: [
              "Technique & biomechanics: Basic turns, speed generation, wave line",
              "Mindset & confidence in the ocean: Wave selection, take-off timing",
              "Practical nutrition & recovery: Energy snacks, active rest",
              "Visual feedback & progression tracking: Before/after comparison, real-time corrections"
            ]
          }
        },
        highPerformance: {
          name: "Elite Surf Program",
          level: "Intermediate-Advanced - Level 2.1, 2.2",
          tagline: "Train like an athlete and transform the way you surf",
          price: "910",
          includes: {
            title: "Includes:",
            items: [
              "8 high-performance sessions",
              "5 advanced video analysis sessions",
              "Photo + drone session",
              "Extended final review"
            ]
          },
          sessions: {
            title: "In each session we'll work on:",
            items: [
              "Technique & biomechanics: Vertical maneuvers, cutbacks, floaters",
              "Mindset & confidence in the ocean: Bigger waves, wipeout management",
              "Practical nutrition & recovery: Meal plans, specific stretching",
              "Visual feedback & progression tracking: Frame-by-frame analysis, performance metrics"
            ]
          }
        }
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
      invalidPhone: "Invalid format. Must include country code (e.g., +1 786 224 7287)"
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
      thankYou: "Thank you for choosing Zeneidas Surf Garden!",
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
    },
    landing: {
      navigation: {
        home: "Home",
        experience: "Experience",
        stories: "Stories",
        accommodation: "Accommodation",
        activities: "Activities",
        faqs: "FAQs",
        contact: "Contact",
        bookNow: "Book Now"
      },
      hero: {
        title: "Santa Teresa Surf",
        subtitle: "Experience the best surf program in Costa Rica at Zeneidas Surf Garden",
        tagline: "Surf, Yoga, Meditation & Ice Baths in Santa Teresa",
        bookNow: "Book Now",
        exploreActivities: "Explore Activities"
      },
      accommodationShowcase: {
        title: "Your Home in Paradise",
        subtitle: "Wake up to ocean views and fall asleep to the sound of waves. Choose the perfect space for your surf adventure."
      },
      activitiesShowcase: {
        title: "Get a Taste of Our Activities",
        subtitle: "Discover the transformative experiences that await you",
        clickToPlay: "Click to play",
        surfProgram: {
          title: "Surf Program",
          description: "Ride the Wave - Experience the thrill of surfing in the pristine waters of Santa Teresa."
        },
        breathwork: {
          title: "Breathwork",
          description: "Learn powerful breathing techniques to auto-regulate your emotions and release stress."
        },
        soundHealing: {
          title: "Sound Healing & Kirtan",
          description: "Connect with subtle energies through sacred songs and sound healing ceremonies."
        },
        creativeArts: {
          title: "Creative Arts",
          description: "Express yourself through ceramics and other creative activities in our art studio."
        }
      },
      reviews: {
        title: "Life-Changing Experience",
        subtitle: "Discover the stories of our participants",
        years: "years",
        data: [
          {
            id: 1,
            name: 'Luján Sánchez',
            age: 44,
            country: 'Argentina',
            occupation: 'Dentist',
            avatar: '/assets/reviews/reviews-lujan.jpg',
            quote: '"The people, the connection with the nature, the surf..."',
            review: 'The people, the connection with the nature, the surf... I found in Santa Teresa what I was looking for when I left my country last year. I love to live at Zeneidas, it feels like home, what I need right now. This experience opens my mind and allows me to be a better person. I am very happy. ♥️',
          },
          {
            id: 2,
            name: 'Catherine Cormier',
            age: 25,
            country: 'Canada',
            occupation: 'Student',
            avatar: '/assets/reviews/review-catherine.jpg',
            quote: '"This place quickly started to feel like home"',
            review: 'This place quickly started to feel like home and the people who work and live here really are like family! I loved the balance between having organized activities and free time. There was always something to do, but it never felt overwhelming. The food was so delicious and the location is perfect. I made so many incredible memories that I will never forget and met some truly wonderful people ♥️',
          },
          {
            id: 3,
            name: 'Taylor Evans',
            age: 32,
            country: 'South Africa',
            occupation: 'Teacher',
            avatar: '/assets/reviews/review-taylor.jpg',
            quote: '"I came here not knowing what to expect..."',
            review: 'I came here not knowing what to expect and was blown away by the community, the activities, and the overall vibe. The surf lessons were amazing, the yoga sessions were exactly what I needed, and the breathwork changed my life. The facilitators are so knowledgeable and caring. This experience has truly transformed me.',
          },
          {
            id: 4,
            name: 'Marcelo',
            age: 60,
            country: 'Argentina',
            occupation: 'Retired',
            avatar: '/assets/reviews/reviews-marcelo.jpg',
            quote: '"At my age, I never thought I could learn to surf..."',
            review: 'At my age, I never thought I could learn to surf, but the instructors here made it possible and so much fun! The whole experience was rejuvenating - from the morning yoga to the evening gatherings. I felt welcomed and supported every single day. This place has a special magic that brings people together.',
          },
          {
            id: 5,
            name: 'Eilin Annika Orgland',
            age: 22,
            country: 'Switzerland',
            occupation: 'Photographer',
            avatar: '/assets/reviews/reviews-eilin.jpg',
            quote: '"The most beautiful sunsets, the warmest people..."',
            review: 'The most beautiful sunsets, the warmest people, and the most incredible energy. I came here solo and left with a family. Every activity was thoughtfully planned and the facilitators truly care about your growth and wellbeing. The surfcamp exceeded all my expectations and I can\'t wait to come back!',
          },
        ]
      }
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
