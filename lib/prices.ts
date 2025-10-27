// Configuración de precios para todas las actividades
// Estos precios deben coincidir con los de la API del sistema de reservas

export const ACTIVITY_PRICES = {
  // Precios base por clase/sesión
  yoga: {
    basePrice: 10, // Precio por clase individual
    packages: {
      '10-classes': 80 // 10 clases = $80 (save $20)
    }
  },
  
  surf: {
    basePrice: 100, // Precio por clase individual
    packages: {
      '3-classes': 300,   // 3 clases = $300
      '4-classes': 400,   // 4 clases = $400 (+$100)
      '5-classes': 485,   // 5 clases = $485 (+$85)
      '6-classes': 570,   // 6 clases = $570 (+$85)
      '7-classes': 655,   // 7 clases = $655 (+$85)
      '8-classes': 740,   // 8 clases = $740 (+$85)
      '9-classes': 815,   // 9 clases = $815 (+$75)
      '10-classes': 890   // 10 clases = $890 (+$75)
    }
  },
  
  // Otras actividades con precios fijos
  ice_bath: {
    basePrice: 50, // Precio por sesión
    packages: {}
  },
  
  transport: {
    basePrice: 50, // Precio por viaje
    packages: {}
  },
  
  hosting: {
    basePrice: 100, // Precio por estadía
    packages: {}
  }
};

// Función para calcular el precio de yoga según cantidad de clases
export const calculateYogaPrice = (classes: number, usePackDiscount: boolean = false): number => {
  // Si se selecciona el pack de 10 clases con descuento
  if (usePackDiscount && classes === 10) {
    return ACTIVITY_PRICES.yoga.packages['10-classes'];
  }
  // Precio por clases individuales
  return classes * ACTIVITY_PRICES.yoga.basePrice;
};

// Función legacy para compatibilidad (deprecated)
export const getYogaPackagePrice = (packageType: '1-class' | '3-classes' | '10-classes'): number => {
  if (packageType === '10-classes') return ACTIVITY_PRICES.yoga.packages['10-classes'];
  if (packageType === '3-classes') return 3 * ACTIVITY_PRICES.yoga.basePrice;
  return ACTIVITY_PRICES.yoga.basePrice;
};

// Función para calcular el precio de un paquete de surf
export const getSurfPackagePrice = (packageType: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes'): number => {
  return ACTIVITY_PRICES.surf.packages[packageType];
};

// Función para obtener el precio base de una actividad
export const getActivityBasePrice = (category: string): number => {
  return ACTIVITY_PRICES[category as keyof typeof ACTIVITY_PRICES]?.basePrice || 0;
};

// Progressive pricing calculation for surf classes
export const calculateSurfPrice = (classes: number): number => {
  // Price points: 3 classes = $300, 5 classes = $460, 10 classes = $890
  if (classes <= 3) return 300;
  if (classes <= 5) {
    // Interpolate between 3 and 5 classes
    const ratio = (classes - 3) / (5 - 3);
    return Math.round(300 + (460 - 300) * ratio);
  }
  if (classes <= 10) {
    // Interpolate between 5 and 10 classes
    const ratio = (classes - 5) / (10 - 5);
    return Math.round(460 + (890 - 460) * ratio);
  }
  return 890;
};

// Función para calcular el precio total de una actividad con paquete
export const getActivityTotalPrice = (
  category: string,
  packageType?: string,
  guests: number = 1,
  surfClasses?: number // Add optional parameter for surf classes
): number => {
  if (category === 'yoga' && packageType) {
    return getYogaPackagePrice(packageType as any) * guests;
  } else if (category === 'surf') {
    if (surfClasses) {
      // Use progressive pricing for surf if classes are provided
      return calculateSurfPrice(surfClasses) * guests;
    } else if (packageType) {
      // Fallback to package pricing
      return getSurfPackagePrice(packageType as any) * guests;
    } else {
      // Default to 4 classes if no package or class count specified
      return calculateSurfPrice(4) * guests;
    }
  } else {
    const basePrice = getActivityBasePrice(category);
    return basePrice * guests;
  }
};
