export interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxParticipants: number;
  category: 'surf' | 'yoga' | 'ice_bath' | 'transport' | 'hosting' | 'other';
  timeSlot?: '7:00 AM' | '3:00 PM';
  yogaPackage?: '1-class' | '3-classes' | '10-classes';
  surfPackage?: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes';
}

export interface Room {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  capacity: number;
  price: number;
  available: boolean;
}

export interface LobbyPMSAvailabilityResponse {
  success: boolean;
  available: boolean;
  rooms?: Room[];
  message?: string;
  demoMode?: boolean;
}

export interface LobbyPMSBookingResponse {
  success: boolean;
  booking_id?: string;
  reservation_id?: string;
  status?: string;
  message?: string;
  demoMode?: boolean;
}

export interface LobbyPMSBooking {
  id?: string;
  booking_id?: string;
  reservation_id?: string;
  status?: string;
  message?: string;
  demoMode?: boolean;
  booking?: {
    booking_id?: string;
    reservation_id?: string;
    id?: string;
    [key: string]: unknown;
  };
}

export interface LobbyPMSReservationRequest {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomTypeId: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string;
  };
  notes?: string;
  source?: string;
}

export interface BookingRequest {
  checkIn: string | Date;
  checkOut: string | Date;
  guests: number;
  roomTypeId: string;
  activityIds: string[];
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string;
  };
}

export interface PriceBreakdown {
  accommodation: number;
  activities: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface AvailabilityCheck {
  available: boolean;
  rooms: Room[];
  message?: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface WhatsAppMessage {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string;
}

export interface BookingData {
  checkIn?: string | Date;
  checkOut?: string | Date;
  guests?: number;
  roomTypeId?: string;
  activityIds?: string[];
  contactInfo?: ContactFormData;
}

export interface BookingStore {
  bookingData: Partial<BookingData>;
  selectedActivities: Activity[];
  activityQuantities: Record<string, number>;
  priceBreakdown: PriceBreakdown | null;
  availabilityCheck: AvailabilityCheck | null;
  availableRooms: Room[] | null;
  selectedRoom: Room | null;
  currentStep: 'dates' | 'accommodation' | 'activities' | 'contact' | 'confirmation' | 'payment' | 'success';
  isLoading: boolean;
  error: string | null;
} 
