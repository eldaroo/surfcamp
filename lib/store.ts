import { create, StoreApi, UseBoundStore } from 'zustand';
import { Activity, BookingRequest, PriceBreakdown, AvailabilityCheck } from '@/types';

interface Room {
  roomTypeId: string;
  roomTypeName: string;
  availableRooms: number;
  pricePerNight: number;
  maxGuests: number;
  totalCapacity?: number;
  canAccommodateRequestedGuests?: boolean;
  isSharedRoom?: boolean;
}

interface BookingStore {
  // Booking data
  bookingData: Partial<BookingRequest>;
  selectedActivities: Activity[];
  activityQuantities: Record<string, number>; // activityId -> quantity
  selectedTimeSlots: Record<string, '7:00 AM' | '3:00 PM'>; // activityId -> timeSlot
  selectedYogaPackages: Record<string, '1-class' | '3-classes' | '10-classes'>; // activityId -> yogaPackage
  selectedSurfPackages: Record<string, '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes'>; // activityId -> surfPackage
  selectedSurfClasses: Record<string, number>; // activityId -> number of classes
  personalizationName: string;
  priceBreakdown: PriceBreakdown | null;
  availabilityCheck: AvailabilityCheck | null;
  
  // Accommodation data
  availableRooms: Room[] | null;
  selectedRoom: Room | null;
  
  // UI state
  currentStep: 'activities' | 'dates' | 'accommodation' | 'contact' | 'confirmation' | 'payment' | 'success';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBookingData: (data: Partial<BookingRequest>) => void;
  setSelectedActivities: (activities: Activity[]) => void;
  setActivityQuantity: (activityId: string, quantity: number) => void;
  setSelectedTimeSlot: (activityId: string, timeSlot: '7:00 AM' | '3:00 PM') => void;
  setSelectedYogaPackage: (activityId: string, yogaPackage: '1-class' | '3-classes' | '10-classes') => void;
  setSelectedSurfPackage: (activityId: string, surfPackage: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes') => void;
  setSelectedSurfClasses: (activityId: string, classes: number) => void;
  setPersonalizationName: (name: string) => void;

  setPriceBreakdown: (breakdown: PriceBreakdown | null) => void;
  setAvailabilityCheck: (check: AvailabilityCheck | null) => void;
  setAvailableRooms: (rooms: Room[] | null) => void;
  setSelectedRoom: (room: Room | null) => void;
  setCurrentStep: (step: 'activities' | 'dates' | 'accommodation' | 'contact' | 'confirmation' | 'payment' | 'success') => void;
  goBack: () => void;
  canGoBack: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  bookingData: {},
  selectedActivities: [],
  activityQuantities: {},
  selectedTimeSlots: {},
  selectedYogaPackages: {},
  selectedSurfPackages: {},
  selectedSurfClasses: {},
  personalizationName: '',
  priceBreakdown: null,
  availabilityCheck: null,
  availableRooms: null,
  selectedRoom: null,
  currentStep: 'activities' as const,
  isLoading: false,
  error: null,
};

export const useBookingStore: UseBoundStore<StoreApi<BookingStore>> = create<BookingStore>((set) => ({
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
  
  setSelectedTimeSlot: (activityId, timeSlot) =>
    set((state) => ({
      selectedTimeSlots: { ...state.selectedTimeSlots, [activityId]: timeSlot },
    })),
  
  setSelectedYogaPackage: (activityId, yogaPackage) =>
    set((state) => {
      const newSelectedYogaPackages = { ...state.selectedYogaPackages, [activityId]: yogaPackage };
      return { selectedYogaPackages: newSelectedYogaPackages };
    }),
  
  setSelectedSurfPackage: (activityId, surfPackage) =>
    set((state) => {
      const newSelectedSurfPackages = { ...state.selectedSurfPackages, [activityId]: surfPackage };
      return { selectedSurfPackages: newSelectedSurfPackages };
    }),

  setSelectedSurfClasses: (activityId, classes) =>
    set((state) => {
      const newSelectedSurfClasses = { ...state.selectedSurfClasses, [activityId]: classes };
      return { selectedSurfClasses: newSelectedSurfClasses };
    }),
  

  setPersonalizationName: (name) =>
    set(() => ({ personalizationName: name })),

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

  goBack: () =>
    set((state) => {
      const stepOrder: Array<'activities' | 'dates' | 'accommodation' | 'contact' | 'confirmation' | 'payment' | 'success'> = [
        'activities', 'dates', 'accommodation', 'contact', 'confirmation', 'payment', 'success'
      ];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      if (currentIndex > 0) {
        return { currentStep: stepOrder[currentIndex - 1] };
      }
      return state;
    }),

  canGoBack: () => {
    const state = useBookingStore.getState();
    return state.currentStep !== 'activities' && state.currentStep !== 'success';
  },

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setError: (error) =>
    set({ error }),

  reset: () => set(initialState),
})); 
