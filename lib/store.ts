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
  yogaClasses: Record<string, number>; // activityId -> number of yoga classes
  yogaUsePackDiscount: Record<string, boolean>; // activityId -> whether using 10-class pack discount
  selectedYogaPackages: Record<string, '1-class' | '3-classes' | '10-classes'>; // deprecated - for backwards compatibility
  selectedSurfPackages: Record<string, '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes'>;
  selectedSurfClasses: Record<string, number>;
  hasPrivateCoaching: boolean; // Whether this participant selected 1:1 private coaching
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
  yogaClasses: Record<string, number>; // activityId -> number of yoga classes
  yogaUsePackDiscount: Record<string, boolean>; // activityId -> whether using 10-class pack discount
  selectedYogaPackages: Record<string, '1-class' | '3-classes' | '10-classes'>; // deprecated - for backwards compatibility
  selectedSurfPackages: Record<string, '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes'>; // activityId -> surfPackage
  selectedSurfClasses: Record<string, number>; // activityId -> number of classes
  isPrivateUpgrade: boolean; // Whether user selected 1:1 private coaching upgrade

  personalizationName: string;
  priceBreakdown: PriceBreakdown | null;
  availabilityCheck: AvailabilityCheck | null;
  
  // Accommodation data
  availableRooms: Room[] | null;
  selectedRoom: Room | null;
  
  // UI state
  currentStep: 'activities' | 'dates' | 'accommodation' | 'contact' | 'confirmation' | 'payment' | 'success';
  previousStep: 'activities' | 'dates' | null; // Track where user came from before going to contact
  isLoading: boolean;
  error: string | null;

  // Activity flow state (sequential guided experience)
  activityFlowStep: 'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete';
  activityFlowDirection: 'forward' | 'backward';
  
  // Actions
  setBookingData: (data: Partial<BookingRequest>) => void;

  // Multi-participant actions
  setActiveParticipant: (participantId: string) => void;
  updateParticipantName: (participantId: string, name: string) => void;
  addParticipant: () => void;
  removeParticipant: (participantId: string) => void;
  copyChoicesToAll: (fromParticipantId: string) => void;
  copyChoicesToParticipant: (fromParticipantId: string, toParticipantId: string) => void;
  syncParticipantsWithGuests: (guestCount: number) => void;
  getActiveParticipant: () => ParticipantData | undefined;

  // Legacy single-participant actions (will use activeParticipantId internally)
  setSelectedActivities: (activities: Activity[]) => void;
  setActivityQuantity: (activityId: string, quantity: number) => void;
  setSelectedTimeSlot: (activityId: string, timeSlot: '7:00 AM' | '3:00 PM') => void;
  setYogaClasses: (activityId: string, classes: number) => void;
  setYogaUsePackDiscount: (activityId: string, useDiscount: boolean) => void;
  setSelectedYogaPackage: (activityId: string, yogaPackage: '1-class' | '3-classes' | '10-classes') => void; // deprecated
  setSelectedSurfPackage: (activityId: string, surfPackage: '3-classes' | '4-classes' | '5-classes' | '6-classes' | '7-classes' | '8-classes' | '9-classes' | '10-classes') => void;
  setSelectedSurfClasses: (activityId: string, classes: number) => void;
  setIsPrivateUpgrade: (isUpgrade: boolean) => void;
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
  goToActivityStep: (step: 'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete') => void;
  resetActivityFlow: () => void;
}

const createEmptyParticipant = (id: string, name: string, isYou: boolean): ParticipantData => ({
  id,
  name,
  isYou,
  selectedActivities: [],
  activityQuantities: {},
  selectedTimeSlots: {},
  yogaClasses: {},
  yogaUsePackDiscount: {},
  selectedYogaPackages: {},
  selectedSurfPackages: {},
  selectedSurfClasses: {},
  hasPrivateCoaching: false,
});

const initialState = {
  bookingData: {},
  participants: [createEmptyParticipant('participant-1', 'Participant 1', true)],
  activeParticipantId: 'participant-1',
  selectedActivities: [],
  activityQuantities: {},
  selectedTimeSlots: {},
  yogaClasses: {},
  yogaUsePackDiscount: {},
  selectedYogaPackages: {},
  selectedSurfPackages: {},
  selectedSurfClasses: {},
  isPrivateUpgrade: false,
  personalizationName: '',
  priceBreakdown: null,
  availabilityCheck: null,
  availableRooms: null,
  selectedRoom: null,
  currentStep: 'activities' as const,
  previousStep: null,
  isLoading: false,
  error: null,
  activityFlowStep: 'surf' as const,
  activityFlowDirection: 'forward' as const,
};

export const useBookingStore: UseBoundStore<StoreApi<BookingStore>> = create<BookingStore>((set) => ({
  ...initialState,
  
  setBookingData: (data) =>
    set((state) => {
      const minGuests = Math.max(1, state.participants.length);
      const updatedBookingData = { ...state.bookingData, ...data };

      if (typeof data.guests === 'number' && Number.isFinite(data.guests)) {
        updatedBookingData.guests = Math.max(minGuests, Math.round(data.guests));
      } else if (typeof updatedBookingData.guests === 'number' && Number.isFinite(updatedBookingData.guests)) {
        updatedBookingData.guests = Math.max(minGuests, Math.round(updatedBookingData.guests));
      }

      return {
        bookingData: updatedBookingData,
      };
    }),

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
      const nextCount = state.participants.length + 1;
      const newId = `participant-${nextCount}`;
      const newParticipant = createEmptyParticipant(
        newId,
        `Participant ${nextCount}`,
        false
      );
      const updatedParticipants = [...state.participants, newParticipant];
      const enforcedGuests = Math.max(
        nextCount,
        typeof state.bookingData.guests === 'number' && Number.isFinite(state.bookingData.guests)
          ? Math.round(state.bookingData.guests)
          : nextCount
      );
      return {
        participants: updatedParticipants,
        activeParticipantId: newId, // Set the new participant as active
        bookingData: {
          ...state.bookingData,
          guests: enforcedGuests,
        },
      };
    }),

  removeParticipant: (participantId) =>
    set((state) => {
      const filtered = state.participants.filter(p => p.id !== participantId);

      // If removing the last participant, create a new empty one
      if (filtered.length === 0) {
        const newParticipant: ParticipantData = {
          id: `participant-${Date.now()}`,
          name: 'Participant 1',
          isYou: true,
          selectedActivities: [],
          activityQuantities: {},
          selectedTimeSlots: {},
          yogaClasses: {},
          yogaUsePackDiscount: {},
          selectedYogaPackages: {},
          selectedSurfClasses: {},
          selectedSurfPackages: {},
          hasPrivateCoaching: false,
        };
        return {
          participants: [newParticipant],
          activeParticipantId: newParticipant.id,
        };
      }

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
          yogaClasses: { ...sourceParticipant.yogaClasses },
          yogaUsePackDiscount: { ...sourceParticipant.yogaUsePackDiscount },
          selectedYogaPackages: { ...sourceParticipant.selectedYogaPackages },
          selectedSurfPackages: { ...sourceParticipant.selectedSurfPackages },
          selectedSurfClasses: { ...sourceParticipant.selectedSurfClasses },
        })),
      };
    }),

  copyChoicesToParticipant: (fromParticipantId, toParticipantId) =>
    set((state) => {
      const sourceParticipant = state.participants.find(p => p.id === fromParticipantId);
      const targetParticipant = state.participants.find(p => p.id === toParticipantId);

      if (!sourceParticipant || !targetParticipant) return state;

      console.log('[STORE] copyChoicesToParticipant', {
        from: sourceParticipant.name,
        to: targetParticipant.name,
        activities: sourceParticipant.selectedActivities.map(a => a.name),
      });

      return {
        participants: state.participants.map(p =>
          p.id === toParticipantId
            ? {
                ...p,
                selectedActivities: [...sourceParticipant.selectedActivities],
                activityQuantities: { ...sourceParticipant.activityQuantities },
                selectedTimeSlots: { ...sourceParticipant.selectedTimeSlots },
                yogaClasses: { ...sourceParticipant.yogaClasses },
                yogaUsePackDiscount: { ...sourceParticipant.yogaUsePackDiscount },
                selectedYogaPackages: { ...sourceParticipant.selectedYogaPackages },
                selectedSurfPackages: { ...sourceParticipant.selectedSurfPackages },
                selectedSurfClasses: { ...sourceParticipant.selectedSurfClasses },
              }
            : p
        ),
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

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.warn('[STORE] setSelectedActivities - active participant not found');
        return state;
      }

      // Initialize yogaClasses for any new yoga activities
      const newYogaClasses = { ...activeParticipant.yogaClasses };
      const newSurfClasses = { ...activeParticipant.selectedSurfClasses };

      activities.forEach(activity => {
        // Initialize yoga classes to 1 if not already set
        if (activity.category === 'yoga' && !(activity.id in newYogaClasses)) {
          newYogaClasses[activity.id] = 1;
          console.log(`[STORE] Initialized yogaClasses for ${activity.id} to 1`);
        }
        // Initialize surf classes to 4 if not already set
        if (activity.category === 'surf' && !(activity.id in newSurfClasses)) {
          newSurfClasses[activity.id] = 4;
          console.log(`[STORE] Initialized surfClasses for ${activity.id} to 4`);
        }
      });

      const updatedParticipants = state.participants.map(p =>
        p.id === state.activeParticipantId
          ? {
              ...p,
              selectedActivities: activities,
              yogaClasses: newYogaClasses,
              selectedSurfClasses: newSurfClasses
            }
          : p
      );

      console.log('[STORE] setSelectedActivities - updated participants',
        updatedParticipants.map(p => ({
          id: p.id,
          name: p.name,
          activitiesCount: p.selectedActivities.length,
          activities: p.selectedActivities.map(a => a.name),
          yogaClasses: p.yogaClasses,
          surfClasses: p.selectedSurfClasses
        }))
      );

      return {
        selectedActivities: activities,
        yogaClasses: newYogaClasses,
        selectedSurfClasses: newSurfClasses,
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

  setYogaClasses: (activityId, classes) =>
    set((state) => {
      console.log('[STORE] setYogaClasses called', {
        activeParticipantId: state.activeParticipantId,
        activityId,
        classes,
      });

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.log('[STORE] setYogaClasses - active participant not found');
        return state;
      }

      const newYogaClasses = { ...activeParticipant.yogaClasses, [activityId]: classes };

      return {
        yogaClasses: newYogaClasses,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, yogaClasses: newYogaClasses }
            : p
        ),
      };
    }),

  setYogaUsePackDiscount: (activityId, useDiscount) =>
    set((state) => {
      console.log('[STORE] setYogaUsePackDiscount called', {
        activeParticipantId: state.activeParticipantId,
        activityId,
        useDiscount,
      });

      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (!activeParticipant) {
        console.log('[STORE] setYogaUsePackDiscount - active participant not found');
        return state;
      }

      const newYogaUsePackDiscount = { ...activeParticipant.yogaUsePackDiscount, [activityId]: useDiscount };

      return {
        yogaUsePackDiscount: newYogaUsePackDiscount,
        participants: state.participants.map(p =>
          p.id === state.activeParticipantId
            ? { ...p, yogaUsePackDiscount: newYogaUsePackDiscount }
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

  setIsPrivateUpgrade: (isUpgrade) =>
    set((state) => {
      // Update hasPrivateCoaching for the active participant
      const updatedParticipants = state.participants.map((p) =>
        p.id === state.activeParticipantId
          ? { ...p, hasPrivateCoaching: isUpgrade }
          : p
      );

      return {
        isPrivateUpgrade: isUpgrade, // Keep for backward compatibility
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
    set((state) => {
      console.log('[STORE] setCurrentStep called', {
        from: state.currentStep,
        to: step,
        checkIn: state.bookingData.checkIn,
        checkOut: state.bookingData.checkOut,
        selectedRoom: state.selectedRoom,
      });

      // Track previous step when going to contact
      let newPreviousStep = state.previousStep;
      if (step === 'contact') {
        // Remember where we came from (activities or dates)
        if (state.currentStep === 'activities' || state.currentStep === 'dates') {
          newPreviousStep = state.currentStep;
          console.log('[STORE] setCurrentStep - tracking previousStep:', newPreviousStep);
        }
      }

      // Reset dates and accommodation when coming from activities OR when going back to dates/accommodation
      const shouldReset =
        // Going to dates from activities (fresh start)
        (step === 'dates' && state.currentStep === 'activities') ||
        // Going to accommodation from activities (bypassing dates)
        (step === 'accommodation' && state.currentStep === 'activities') ||
        // Going back to dates from any other step
        (step === 'dates' && state.currentStep !== 'activities');

      if (shouldReset) {
        console.log('[STORE] setCurrentStep - RESETTING dates and accommodation');
        return {
          currentStep: step,
          previousStep: newPreviousStep,
          bookingData: {
            ...state.bookingData,
            checkIn: undefined,
            checkOut: undefined,
          },
          availableRooms: null,
          selectedRoom: null,
        };
      }

      console.log('[STORE] setCurrentStep - NOT resetting (normal step change)');
      return { currentStep: step, previousStep: newPreviousStep };
    }),

  goBack: () =>
    set((state) => {
      console.log('[STORE] goBack called', {
        currentStep: state.currentStep,
        previousStep: state.previousStep,
      });

      // Special handling for contact step - go back to where we came from
      if (state.currentStep === 'contact' && state.previousStep) {
        console.log('[STORE] goBack - returning to previousStep:', state.previousStep);
        return { currentStep: state.previousStep };
      }

      const stepOrder: Array<'activities' | 'dates' | 'accommodation' | 'contact' | 'confirmation' | 'payment' | 'success'> = [
        'activities', 'dates', 'accommodation', 'contact', 'confirmation', 'payment', 'success'
      ];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      if (currentIndex > 0) {
        const previousStep = stepOrder[currentIndex - 1];
        console.log('[STORE] goBack - going to step:', previousStep);
        return { currentStep: previousStep };
      }
      console.log('[STORE] goBack - cannot go back');
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
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'hosting', 'complete'];
      const currentIndex = stepOrder.indexOf(state.activityFlowStep);
      const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
      return {
        activityFlowStep: stepOrder[nextIndex],
        activityFlowDirection: 'forward',
      };
    }),

  previousActivityStep: () =>
    set((state) => {
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'hosting', 'complete'];
      const currentIndex = stepOrder.indexOf(state.activityFlowStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        activityFlowStep: stepOrder[prevIndex],
        activityFlowDirection: 'backward',
      };
    }),

  skipCurrentActivity: () =>
    set((state) => {
      console.log('[STORE] skipCurrentActivity called', {
        currentStep: state.activityFlowStep,
        activeParticipantId: state.activeParticipantId,
      });

      // Map activity flow step to activity ID
      const activityIdMap: Record<string, string> = {
        'surf': 'surf-package',
        'yoga': 'yoga-package',
        'ice-bath': 'ice-bath-session',
        'hosting': 'hosting-service',
      };

      const activityIdToRemove = activityIdMap[state.activityFlowStep];

      // Remove this activity from the active participant's selections
      const activeParticipant = state.participants.find(p => p.id === state.activeParticipantId);
      if (activeParticipant && activityIdToRemove) {
        console.log('[STORE] skipCurrentActivity - removing activity', {
          activityId: activityIdToRemove,
          currentActivities: activeParticipant.selectedActivities.map(a => a.id),
        });

        const updatedActivities = activeParticipant.selectedActivities.filter(
          activity => activity.id !== activityIdToRemove
        );

        // Clean up related data for this activity
        const newActivityQuantities = { ...activeParticipant.activityQuantities };
        delete newActivityQuantities[activityIdToRemove];

        const newSelectedTimeSlots = { ...activeParticipant.selectedTimeSlots };
        delete newSelectedTimeSlots[activityIdToRemove];

        const newYogaClasses = { ...activeParticipant.yogaClasses };
        delete newYogaClasses[activityIdToRemove];

        const newYogaUsePackDiscount = { ...activeParticipant.yogaUsePackDiscount };
        delete newYogaUsePackDiscount[activityIdToRemove];

        const newSelectedYogaPackages = { ...activeParticipant.selectedYogaPackages };
        delete newSelectedYogaPackages[activityIdToRemove];

        const newSelectedSurfPackages = { ...activeParticipant.selectedSurfPackages };
        delete newSelectedSurfPackages[activityIdToRemove];

        const newSelectedSurfClasses = { ...activeParticipant.selectedSurfClasses };
        delete newSelectedSurfClasses[activityIdToRemove];

        const updatedParticipants = state.participants.map(p =>
          p.id === state.activeParticipantId
            ? {
                ...p,
                selectedActivities: updatedActivities,
                activityQuantities: newActivityQuantities,
                selectedTimeSlots: newSelectedTimeSlots,
                yogaClasses: newYogaClasses,
                yogaUsePackDiscount: newYogaUsePackDiscount,
                selectedYogaPackages: newSelectedYogaPackages,
                selectedSurfPackages: newSelectedSurfPackages,
                selectedSurfClasses: newSelectedSurfClasses,
              }
            : p
        );

        console.log('[STORE] skipCurrentActivity - after removal', {
          updatedActivities: updatedActivities.map(a => a.id),
        });

        // Move to next step
        const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'hosting', 'complete'];
        const currentIndex = stepOrder.indexOf(state.activityFlowStep);
        const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);

        return {
          participants: updatedParticipants,
          selectedActivities: updatedActivities,
          activityQuantities: newActivityQuantities,
          selectedTimeSlots: newSelectedTimeSlots,
          yogaClasses: newYogaClasses,
          yogaUsePackDiscount: newYogaUsePackDiscount,
          selectedYogaPackages: newSelectedYogaPackages,
          selectedSurfPackages: newSelectedSurfPackages,
          selectedSurfClasses: newSelectedSurfClasses,
          activityFlowStep: stepOrder[nextIndex],
          activityFlowDirection: 'forward',
        };
      }

      // If no activity to remove, just move to next step
      const stepOrder: Array<'surf' | 'yoga' | 'ice-bath' | 'hosting' | 'complete'> = ['surf', 'yoga', 'ice-bath', 'hosting', 'complete'];
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
