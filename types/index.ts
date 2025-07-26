export interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxParticipants: number;
  category: 'surf' | 'yoga' | 'ice_bath' | 'transport' | 'other';
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