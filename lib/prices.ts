// Configuración de precios para todas las actividades
// Estos precios deben coincidir con los de la API del sistema de reservas

export const ACTIVITY_PRICES = {
  // Precios base por clase/sesión
  yoga: {
    basePrice: 12, // Precio por clase individual
    packages: {
      '1-class': 1,      // 1 clase = $12
      '3-classes': 3,    // 3 clases = $36
      '10-classes': 10   // 10 clases = $120
    }
  },
  
  surf: {
    basePrice: 100, // Precio por clase individual (4 clases = $400, entonces $100 por clase)
    packages: {
      '4-classes': 4,    // 4 clases = $400
      '5-classes': 5,    // 5 clases = $500
      '6-classes': 6     // 6 clases = $600
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

// Función para calcular el precio de un paquete de yoga
export const getYogaPackagePrice = (packageType: '1-class' | '3-classes' | '10-classes'): number => {
  const basePrice = ACTIVITY_PRICES.yoga.basePrice;
  const multiplier = ACTIVITY_PRICES.yoga.packages[packageType];
  return basePrice * multiplier;
};

// Función para calcular el precio de un paquete de surf
export const getSurfPackagePrice = (packageType: '4-classes' | '5-classes' | '6-classes'): number => {
  const basePrice = ACTIVITY_PRICES.surf.basePrice;
  const multiplier = ACTIVITY_PRICES.surf.packages[packageType];
  return basePrice * multiplier;
};

// Función para obtener el precio base de una actividad
export const getActivityBasePrice = (category: string): number => {
  return ACTIVITY_PRICES[category as keyof typeof ACTIVITY_PRICES]?.basePrice || 0;
};

// Función para calcular el precio total de una actividad con paquete
export const getActivityTotalPrice = (
  category: string, 
  packageType?: string, 
  guests: number = 1
): number => {
  if (category === 'yoga' && packageType) {
    return getYogaPackagePrice(packageType as any) * guests;
  } else if (category === 'surf' && packageType) {
    return getSurfPackagePrice(packageType as any) * guests;
  } else {
    const basePrice = getActivityBasePrice(category);
    return basePrice * guests;
  }
};
