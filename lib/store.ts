import { create } from 'zustand';
import { Activity, BookingRequest, PriceBreakdown, AvailabilityCheck } from '@/types';

interface Room {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
}

interface BookingStore {
  // Booking data
  bookingData: Partial<BookingRequest>;
  selectedActivities: Activity[];
  activityQuantities: Record<string, number>; // activityId -> quantity
  priceBreakdown: PriceBreakdown | null;
  availabilityCheck: AvailabilityCheck | null;
  
  // Accommodation data
  availableRooms: Room[] | null;
  selectedRoom: Room | null;
  
  // UI state
  currentStep: 'dates' | 'accommodation' | 'activities' | 'contact' | 'confirmation' | 'payment' | 'success';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBookingData: (data: Partial<BookingRequest>) => void;
  setSelectedActivities: (activities: Activity[]) => void;
  setActivityQuantity: (activityId: string, quantity: number) => void;
  setPriceBreakdown: (breakdown: PriceBreakdown | null) => void;
  setAvailabilityCheck: (check: AvailabilityCheck | null) => void;
  setAvailableRooms: (rooms: Room[] | null) => void;
  setSelectedRoom: (room: Room | null) => void;
  setCurrentStep: (step: 'dates' | 'accommodation' | 'activities' | 'contact' | 'confirmation' | 'payment' | 'success') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  bookingData: {},
  selectedActivities: [],
  activityQuantities: {},
  priceBreakdown: null,
  availabilityCheck: null,
  availableRooms: null,
  selectedRoom: null,
  currentStep: 'dates' as const,
  isLoading: false,
  error: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  ...initialState,
  
  setBookingData: (data) =>
    set((state) => ({
      bookingData: { ...state.bookingData, ...data },
    })),
  
  setSelectedActivities: (activities) =>
    set({ selectedActivities: activities }),
  
  setActivityQuantity: (activityId, quantity) =>
    set((state) => ({
      activityQuantities: { ...state.activityQuantities, [activityId]: quantity },
    })),
  
  setPriceBreakdown: (breakdown) =>
    set({ priceBreakdown: breakdown }),
  
  setAvailabilityCheck: (check) =>
    set({ availabilityCheck: check }),
  
  setAvailableRooms: (rooms) =>
    set({ availableRooms: rooms }),
  
  setSelectedRoom: (room) =>
    set({ selectedRoom: room }),
  
  setCurrentStep: (step) =>
    set({ currentStep: step }),
  
  setLoading: (loading) =>
    set({ isLoading: loading }),
  
  setError: (error) =>
    set({ error }),
  
  reset: () => set(initialState),
})); 