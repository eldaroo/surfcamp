export interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  maxParticipants: number;
  category: 'surf' | 'yoga' | 'ice_bath' | 'transport' | 'other';
}

export interface BookingRequest {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  activities: string[]; // Activity IDs
  roomTypeId?: string; // Selected room type
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string; // Documento Nacional de Identidad obligatorio
  };
}

export interface PriceBreakdown {
  accommodation: number;
  activities: Array<{
    activityId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
}

export interface AvailabilityCheck {
  available: boolean;
  maxGuests?: number;
  conflictingDates?: Date[];
  availableRooms?: Room[];
}

export interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  maxGuests: number;
}

export interface Reservation {
  id: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  booking: BookingRequest;
  priceBreakdown: PriceBreakdown;
  lobbyPMSReservationId?: string;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LobbyPMSAvailabilityResponse {
  available: boolean;
  rooms: Array<{
    roomTypeId: string;
    roomTypeName: string;
    availableRooms: number;
    pricePerNight: number;
  }>;
}

export interface LobbyPMSReservationRequest {
  arrivalDate: string;
  departureDate: string;
  guestCount: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string; // DNI también requerido en LobbyPMS
  };
  roomTypeId: string;
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  paymentMethodId: string;
}

export interface LobbyPMSBooking {
  id?: string;
  reservation_id?: string;
  start_date: string;          // LobbyPMS API expects start_date for bookings
  end_date: string;            // LobbyPMS API expects end_date for bookings
  arrival_date?: string;       // Optional, might be returned by API
  departure_date?: string;     // Optional, might be returned by API
  guest_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_document?: string;     // DNI for LobbyPMS
  room_type_id: string;
  category_id?: number;        // Required for creating bookings
  booking_reference: string;
  status?: string;
  source?: string;
  payment_intent_id?: string;
  notes?: string;              // Notes for LobbyPMS
} 