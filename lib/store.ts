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

// Participant data structure
interface ParticipantData {
  id: string;
  name: string;
  isYou: boolean;
  selectedActivities: Activity[];
  activityQuantities: Record<string, number>;
  selectedTimeSlots: Record<string, '7:00 AM' | '3:00 PM'>;
  selectedYogaPackages: Record<string, '1-class' | '3-classes' | '10-classes'>;
  selectedSurfPackages: Record<string, '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes'>;
  selectedSurfClasses: Record<string, number>;
}

interface BookingStore {
  // Booking data
  bookingData: Partial<BookingRequest>;

  // Multi-participant support
  participants: ParticipantData[];
  activeParticipantId: string;

  // Legacy single-selection support (for backwards compatibility)
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

  // Multi-participant actions
  setActiveParticipant: (participantId: string) => void;
  updateParticipantName: (participantId: string, name: string) => void;
  addParticipant: () => void;
  removeParticipant: (participantId: string) => void;
  copyChoicesToAll: (fromParticipantId: string) => void;
  syncParticipantsWithGuests: (guestCount: number) => void;
  getActiveParticipant: () => ParticipantData | undefined;

  // Legacy single-participant actions (will use activeParticipantId internally)
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

const createEmptyParticipant = (id: string, name: string, isYou: boolean): ParticipantData => ({
  id,
  name,
  isYou,
  selectedActivities: [],
  activityQuantities: {},
  selectedTimeSlots: {},
  selectedYogaPackages: {},
  selectedSurfPackages: {},
  selectedSurfClasses: {},
});

const initialState = {
  bookingData: {},
  participants: [createEmptyParticipant('participant-1', 'Participant 1', true)],
  activeParticipantId: 'participant-1',
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

  // Multi-participant action implementations
  setActiveParticipant: (participantId) =>
    set((state) => {
      const participant = state.participants.find(p => p.id === participantId);
      if (!participant) return state;

      return {
        activeParticipantId: participantId,
        // Sync legacy state with active participant
        selectedActivities: participant.selectedActivities,
        activityQuantities: participant.activityQuantities,
        selectedTimeSlots: participant.selectedTimeSlots,
        selectedYogaPackages: participant.selectedYogaPackages,
        selectedSurfPackages: participant.selectedSurfPackages,
        selectedSurfClasses: participant.selectedSurfClasses,
      };
    }),

  updateParticipantName: (participantId, name) =>
    set((state) => {
      const updatedParticipants = state.participants.map(p =>
        p.id === participantId ? { ...p, name } : p
      );

      // If the first participant's name is changed, also update personalizationName
      const isFirstParticipant = state.participants.findIndex(p => p.id === participantId) === 0;

      return {
        participants: updatedParticipants,
        ...(isFirstParticipant && { personalizationName: name })
      };
    }),

  addParticipant: () =>
    set((state) => {
      const newId = `participant-${state.participants.length + 1}`;
      const newParticipant = createEmptyParticipant(
        newId,
        `Participant ${state.participants.length + 1}`,
        false
      );
      return {
        participants: [...state.participants, newParticipant],
      };
    }),

  removeParticipant: (participantId) =>
    set((state) => {
      if (state.participants.length <= 1) return state;
      const filtered = state.participants.filter(p => p.id !== participantId);
      const newActiveId = state.activeParticipantId === participantId
        ? filtered[0].id
        : state.activeParticipantId;
      return {
        participants: filtered,
        activeParticipantId: newActiveId,
      };
    }),

  copyChoicesToAll: (fromParticipantId) =>
    set((state) => {
      const sourceParticipant = state.participants.find(p => p.id === fromParticipantId);
      if (!sourceParticipant) return state;

      return {
        participants: state.participants.map(p => ({
          ...p,
          selectedActivities: [...sourceParticipant.selectedActivities],
          activityQuantities: { ...sourceParticipant.activityQuantities },
          selectedTimeSlots: { ...sourceParticipant.selectedTimeSlots },
          selectedYogaPackages: { ...sourceParticipant.selectedYogaPackages },
          selectedSurfPackages: { ...sourceParticipant.selectedSurfPackages },
          selectedSurfClasses: { ...sourceParticipant.selectedSurfClasses },
        })),
      };
    }),

  syncParticipantsWithGuests: (guestCount) =>
    set((state) => {
      const currentCount = state.participants.length;

      if (guestCount === currentCount) return state;

      if (guestCount > currentCount) {
        // Add new participants
        const newParticipants = Array.from(
          { length: guestCount - currentCount },
          (_, i) => createEmptyParticipant(
            `participant-${currentCount + i + 1}`,
            `Participant ${currentCount + i + 1}`,
            false
          )
        );
        return {
          participants: [...state.participants, ...newParticipants],
        };
      } else {
        // Remove excess participants (keep first guestCount)
        const kept = state.participants.slice(0, guestCount);
        const newActiveId = kept.find(p => p.id === state.activeParticipantId)
          ? state.activeParticipantId
          : kept[0].id;
        return {
          participants: kept,
          activeParticipantId: newActiveId,
        };
      }
    }),

  getActiveParticipant: () => {
    const state = useBookingStore.getState();
    return state.participants.find(p => p.id === state.activeParticipantId);
  },

  // Updated legacy actions to work with active participant
  setSelectedActivities: (activities) =>
    set((state) => ({
      selectedActivities: activities,
      participants: state.participants.map(p =>
        p.id === state.activeParticipantId
          ? { ...p, selectedActivities: activities }
          : p
      ),
    })),
  
  setActivityQuantity: (activityId, quantity) =>
    set((state) => {
      const newQuantities = { ...state.activityQuantities, [activityId]: quantity };
      return {
        activityQuantities: newQuantities,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, activityQuantities: newQuantities }
            : p
        ),
      };
    }),

  setSelectedTimeSlot: (activityId, timeSlot) =>
    set((state) => {
      const newTimeSlots = { ...state.selectedTimeSlots, [activityId]: timeSlot };
      return {
        selectedTimeSlots: newTimeSlots,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, selectedTimeSlots: newTimeSlots }
            : p
        ),
      };
    }),

  setSelectedYogaPackage: (activityId, yogaPackage) =>
    set((state) => {
      const newSelectedYogaPackages = { ...state.selectedYogaPackages, [activityId]: yogaPackage };
      return {
        selectedYogaPackages: newSelectedYogaPackages,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, selectedYogaPackages: newSelectedYogaPackages }
            : p
        ),
      };
    }),

  setSelectedSurfPackage: (activityId, surfPackage) =>
    set((state) => {
      const newSelectedSurfPackages = { ...state.selectedSurfPackages, [activityId]: surfPackage };
      return {
        selectedSurfPackages: newSelectedSurfPackages,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, selectedSurfPackages: newSelectedSurfPackages }
            : p
        ),
      };
    }),

  setSelectedSurfClasses: (activityId, classes) =>
    set((state) => {
      const newSelectedSurfClasses = { ...state.selectedSurfClasses, [activityId]: classes };
      return {
        selectedSurfClasses: newSelectedSurfClasses,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, selectedSurfClasses: newSelectedSurfClasses }
            : p
        ),
      };
    }),
  

  setPersonalizationName: (name) =>
    set((state) => {
      const normalizedName = (name || '').trim();
      console.log('[STORE] setPersonalizationName called', {
        incoming: name,
        normalized: normalizedName,
      });

      // Also update the first participant's name
      const updatedParticipants = state.participants.map((p, index) =>
        index === 0 ? { ...p, name: normalizedName || 'Participant 1' } : p
      );

      return {
        personalizationName: normalizedName,
        participants: updatedParticipants
      };
    }),

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
