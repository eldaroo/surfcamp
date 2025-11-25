/**
 * WeTravel pricing calculation based on surf program and coaching selection
 *
 * The WeTravel payment covers:
 * 1. The difference between what the user pays for the surf program and what goes to LobbyPMS
 * 2. 10% of the accommodation value
 * 3. 1:1 coaching cost (if selected)
 */

export type SurfProgram = 'fundamental' | 'progressionPlus' | 'highPerformance';

interface SurfProgramPricing {
  userPays: number;        // What the user sees and pays
  lobbyPMSValue: number;   // What gets registered in LobbyPMS
  difference: number;      // Difference that goes to WeTravel
  coachingCost: number;    // Cost of 1:1 coaching for this program
}

// Surf program pricing configuration
const SURF_PROGRAM_PRICING: Record<SurfProgram, SurfProgramPricing> = {
  fundamental: {
    userPays: 450,
    lobbyPMSValue: 360,
    difference: 90,
    coachingCost: 90
  },
  progressionPlus: {
    userPays: 650,
    lobbyPMSValue: 540,
    difference: 110,
    coachingCost: 110
  },
  highPerformance: {
    userPays: 910,
    lobbyPMSValue: 780,
    difference: 130,
    coachingCost: 130
  }
};

interface CalculateWeTravelPaymentParams {
  surfProgram: SurfProgram;
  hasCoaching: boolean;
  accommodationTotal: number;
}

interface WeTravelPaymentBreakdown {
  programDifference: number;
  accommodationDeposit: number;  // 10% of accommodation
  coachingCost: number;
  total: number;
}

/**
 * Calculate the WeTravel payment amount based on surf program selection
 */
export function calculateWeTravelPayment({
  surfProgram,
  hasCoaching,
  accommodationTotal
}: CalculateWeTravelPaymentParams): WeTravelPaymentBreakdown {
  const programPricing = SURF_PROGRAM_PRICING[surfProgram];

  const programDifference = programPricing.difference;
  const accommodationDeposit = Math.round(accommodationTotal * 0.10);
  const coachingCost = hasCoaching ? programPricing.coachingCost : 0;

  const total = programDifference + accommodationDeposit + coachingCost;

  console.log('💰 [WETRAVEL-PRICING] Calculation breakdown:', {
    surfProgram,
    hasCoaching,
    accommodationTotal,
    programDifference,
    accommodationDeposit,
    coachingCost,
    total
  });

  return {
    programDifference,
    accommodationDeposit,
    coachingCost,
    total
  };
}

/**
 * Convert class count to surf program
 * Frontend stores class count, not program name
 */
function classCountToProgram(classCount: number): SurfProgram | null {
  if (classCount <= 4) return 'fundamental';
  if (classCount <= 6) return 'progressionPlus';
  if (classCount >= 8) return 'highPerformance';
  return null;
}

/**
 * Get surf program from various possible formats
 */
export function detectSurfProgram(
  participants: any[],
  selectedActivities?: any[]
): SurfProgram | null {
  // Try to detect from participants
  if (participants && participants.length > 0) {
    for (const participant of participants) {
      // Check selectedSurfProgram
      if (participant.selectedSurfProgram) {
        const programs = Object.values(participant.selectedSurfProgram);
        if (programs.length > 0 && programs[0]) {
          return programs[0] as SurfProgram;
        }
      }

      // Check selectedActivities for surfProgram or classCount
      if (participant.selectedActivities) {
        for (const activity of participant.selectedActivities) {
          if (activity.surfProgram) {
            return activity.surfProgram as SurfProgram;
          }
          if (activity.category === 'surf' && activity.program) {
            return activity.program as SurfProgram;
          }
          // NEW: Check for classCount and convert to program
          if (activity.category === 'surf' && activity.classCount) {
            const program = classCountToProgram(activity.classCount);
            if (program) {
              console.log(`🏄 [DETECT] Found surf program from classCount ${activity.classCount} → ${program}`);
              return program;
            }
          }
        }
      }

      // NEW: Check selectedSurfClasses (stored as object like { activityId: classCount })
      if (participant.selectedSurfClasses) {
        const classCounts = Object.values(participant.selectedSurfClasses);
        if (classCounts.length > 0 && typeof classCounts[0] === 'number') {
          const program = classCountToProgram(classCounts[0] as number);
          if (program) {
            console.log(`🏄 [DETECT] Found surf program from selectedSurfClasses ${classCounts[0]} → ${program}`);
            return program;
          }
        }
      }
    }
  }

  // Try to detect from selectedActivities
  if (selectedActivities) {
    for (const activity of selectedActivities) {
      if (activity.surfProgram) {
        return activity.surfProgram as SurfProgram;
      }
      if (activity.category === 'surf' && activity.program) {
        return activity.program as SurfProgram;
      }
      // NEW: Check for classCount in selectedActivities
      if (activity.category === 'surf' && activity.classCount) {
        const program = classCountToProgram(activity.classCount);
        if (program) {
          console.log(`🏄 [DETECT] Found surf program from activity classCount ${activity.classCount} → ${program}`);
          return program;
        }
      }
    }
  }

  console.log('⚠️ [DETECT] Could not detect surf program from participants or activities');
  return null;
}

/**
 * Check if any participant selected 1:1 coaching
 */
export function hasPrivateCoaching(
  participants: any[],
  selectedActivities?: any[]
): boolean {
  // Check participants
  if (participants && participants.length > 0) {
    for (const participant of participants) {
      // Check for coaching flag
      if (participant.hasPrivateCoaching || participant.hasCoaching) {
        return true;
      }

      // Check selectedActivities for coaching
      if (participant.selectedActivities) {
        for (const activity of participant.selectedActivities) {
          if (activity.isPrivateCoaching || activity.coaching) {
            return true;
          }
        }
      }
    }
  }

  // Check selectedActivities
  if (selectedActivities) {
    for (const activity of selectedActivities) {
      if (activity.isPrivateCoaching || activity.coaching) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get accommodation total from price breakdown
 */
export function getAccommodationTotal(priceBreakdown?: any): number {
  if (!priceBreakdown) return 0;

  // Try different possible field names
  return priceBreakdown.accommodation ||
         priceBreakdown.accommodationTotal ||
         priceBreakdown.room ||
         0;
}
