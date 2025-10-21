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

  // Activity flow state (sequential guided experience)
  activityFlowStep: 'surf' | 'yoga' | 'ice-bath' | 'complete';
  activityFlowDirection: 'forward' | 'backward';
  
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

  // Activity flow actions
  nextActivityStep: () => void;
  previousActivityStep: () => void;
  skipCurrentActivity: () => void;
  goToActivityStep: (step: 'surf' | 'yoga' | 'ice-bath' | 'complete') => void;
  resetActivityFlow: () => void;
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
  activityFlowStep: 'surf' as const,
  activityFlowDirection: 'forward' as const,
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
      console.log('[STORE] setActiveParticipant called', { participantId });
      const participant = state.participants.find(p => p.id === participantId);
      if (!participant) {
        console.log('[STORE] setActiveParticipant - participant not found');
        return state;
      }

      console.log('[STORE] setActiveParticipant - switching to participant', {
        participantId,
        name: participant.name,
        selectedActivities: participant.selectedActivities,
        activityQuantities: participant.activityQuantities,
        selectedYogaPackages: participant.selectedYogaPackages,
        selectedSurfClasses: participant.selectedSurfClasses,
      });

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
        activeParticipantId: newId, // Set the new participant as active
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
      console.log('[STORE] syncParticipantsWithGuests called', {
        guestCount,
        currentCount: state.participants.length,
        currentParticipants: state.participants.map(p => ({
          id: p.id,
          name: p.name,
          activitiesCount: p.selectedActivities.length,
        })),
      });

      const currentCount = state.participants.length;

      if (guestCount === currentCount) {
        console.log('[STORE] syncParticipantsWithGuests - counts match, no change');
        return state;
      }

      if (guestCount > currentCount) {
        // Add new participants
        console.log('[STORE] syncParticipantsWithGuests - adding participants', {
          adding: guestCount - currentCount,
        });
        const newParticipants = Array.from(
          { length: guestCount - currentCount },
          (_, i) => createEmptyParticipant(
            `participant-${currentCount + i + 1}`,
            `Participant ${currentCount + i + 1}`,
            false
          )
        );
        const updatedParticipants = [...state.participants, ...newParticipants];
        console.log('[STORE] syncParticipantsWithGuests - after adding',
          updatedParticipants.map(p => ({
            id: p.id,
            name: p.name,
            activitiesCount: p.selectedActivities.length,
          }))
        );
        return {
          participants: updatedParticipants,
        };
      } else {
        // Remove excess participants (keep first guestCount)
        console.log('[STORE] syncParticipantsWithGuests - removing participants', {
          removing: currentCount - guestCount,
        });
        const kept = state.participants.slice(0, guestCount);
        const newActiveId = kept.find(p => p.id === state.activeParticipantId)
          ? state.activeParticipantId
          : kept[0].id;
        console.log('[STORE] syncParticipantsWithGuests - after removing',
          kept.map(p => ({
            id: p.id,
            name: p.name,
            activitiesCount: p.selectedActivities.length,
          }))
        );
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
    set((state) => {
      console.log('[STORE] setSelectedActivities called', {
        activeParticipantId: state.activeParticipantId,
        activities: activities.map(a => ({ id: a.id, name: a.name })),
      });

      const updatedParticipants = state.participants.map(p =>
        p.id === state.activeParticipantId
          ? { ...p, selectedActivities: activities }
          : p
      );

      console.log('[STORE] setSelectedActivities - updated participants',
        updatedParticipants.map(p => ({
          id: p.id,
          name: p.name,
          activitiesCount: p.selectedActivities.length,
          activities: p.selectedActivities.map(a => a.name),
        }))
      );

      return {
        selectedActivities: activities,
        participants: updatedParticipants,
      };
    }),
  
  setActivityQuantity: (activityId, quantity) =>
    set((state) => {
      console.log('[STORE] setActivityQuantity called', {
        activeParticipantId: state.activeParticipantId,
        activityId,
        quantity,
      });

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.log('[STORE] setActivityQuantity - active participant not found');
        return state;
      }

      console.log('[STORE] setActivityQuantity - before', {
        participantName: activeParticipant.name,
        currentQuantities: activeParticipant.activityQuantities,
      });

      const newQuantities = { ...activeParticipant.activityQuantities, [activityId]: quantity };

      console.log('[STORE] setActivityQuantity - after', {
        newQuantities,
      });

      const updatedParticipants = state.participants.map(p =>
        p.id === state.activeParticipantId
          ? { ...p, activityQuantities: newQuantities }
          : p
      );

      console.log('[STORE] setActivityQuantity - all participants',
        updatedParticipants.map(p => ({
          id: p.id,
          name: p.name,
          quantities: p.activityQuantities,
        }))
      );

      return {
        activityQuantities: newQuantities,
        participants: updatedParticipants,
      };
    }),

  setSelectedTimeSlot: (activityId, timeSlot) =>
    set((state) => {
      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) return state;

      const newTimeSlots = { ...activeParticipant.selectedTimeSlots, [activityId]: timeSlot };
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
      console.log('[STORE] setSelectedYogaPackage called', {
        activeParticipantId: state.activeParticipantId,
        activityId,
        yogaPackage,
      });

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.log('[STORE] setSelectedYogaPackage - active participant not found');
        return state;
      }

      console.log('[STORE] setSelectedYogaPackage - before', {
        participantName: activeParticipant.name,
        currentPackages: activeParticipant.selectedYogaPackages,
      });

      const newSelectedYogaPackages = { ...activeParticipant.selectedYogaPackages, [activityId]: yogaPackage };

      console.log('[STORE] setSelectedYogaPackage - after', {
        newSelectedYogaPackages,
      });

      const updatedParticipants = state.participants.map(p =>
        p.id === state.activeParticipantId
          ? { ...p, selectedYogaPackages: newSelectedYogaPackages }
          : p
      );

      console.log('[STORE] setSelectedYogaPackage - all participants',
        updatedParticipants.map(p => ({
          id: p.id,
          name: p.name,
          yogaPackages: p.selectedYogaPackages,
        }))
      );

      return {
        selectedYogaPackages: newSelectedYogaPackages,
        participants: updatedParticipants,
      };
    }),

  setSelectedSurfPackage: (activityId, surfPackage) =>
    set((state) => {
      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) return state;

      const newSelectedSurfPackages = { ...activeParticipant.selectedSurfPackages, [activityId]: surfPackage };
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
      console.log('[STORE] setSelectedSurfClasses called', {
        activeParticipantId: state.activeParticipantId,
        activityId,
        classes,
      });

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.log('[STORE] setSelectedSurfClasses - active participant not found');
        return state;
      }

      console.log('[STORE] setSelectedSurfClasses - before', {
        participantName: activeParticipant.name,
        currentClasses: activeParticipant.selectedSurfClasses,
      });

      const newSelectedSurfClasses = { ...activeParticipant.selectedSurfClasses, [activityId]: classes };

      console.log('[STORE] setSelectedSurfClasses - after', {
        newSelectedSurfClasses,
      });

      const updatedParticipants = state.participants.map(p =>
        p.id === state.activeParticipantId
          ? { ...p, selectedSurfClasses: newSelectedSurfClasses }
          : p
      );

      console.log('[STORE] setSelectedSurfClasses - all participants',
        updatedParticipants.map(p => ({
          id: p.id,
          name: p.name,
          surfClasses: p.selectedSurfClasses,
        }))
      );

      return {
        selectedSurfClasses: newSelectedSurfClasses,
        participants: updatedParticipants,
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

  // Activity flow implementations
  nextActivityStep: () =>
    set((state) => {
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'complete'];
      const currentIndex = stepOrder.indexOf(state.activityFlowStep);
      const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
      return {
        activityFlowStep: stepOrder[nextIndex],
        activityFlowDirection: 'forward',
      };
    }),

  previousActivityStep: () =>
    set((state) => {
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'complete'];
      const currentIndex = stepOrder.indexOf(state.activityFlowStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        activityFlowStep: stepOrder[prevIndex],
        activityFlowDirection: 'backward',
      };
    }),

  skipCurrentActivity: () =>
    set((state) => {
      // Same as nextActivityStep, just skip without selection
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'complete'];
      const currentIndex = stepOrder.indexOf(state.activityFlowStep);
      const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
      return {
        activityFlowStep: stepOrder[nextIndex],
        activityFlowDirection: 'forward',
      };
    }),

  goToActivityStep: (step) =>
    set((state) => ({
      activityFlowStep: step,
      activityFlowDirection: 'forward',
    })),

  resetActivityFlow: () =>
    set(() => ({
      activityFlowStep: 'surf',
      activityFlowDirection: 'forward',
    })),
})); 
