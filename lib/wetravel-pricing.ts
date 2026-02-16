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
    userPays: 390,
    lobbyPMSValue: 320,
    difference: 70,
    coachingCost: 90
  },
  progressionPlus: {
    userPays: 540,
    lobbyPMSValue: 450,
    difference: 90,
    coachingCost: 110
  },
  highPerformance: {
    userPays: 850,
    lobbyPMSValue: 780,
    difference: 70,
    coachingCost: 130
  }
};

interface CalculateWeTravelPaymentParams {
  surfPrograms: SurfProgram[];  // Array of programs, one per participant
  coachingPrograms: SurfProgram[];  // Array of programs for participants WITH coaching
  accommodationTotal: number;
}

interface WeTravelPaymentBreakdown {
  programDifference: number;
  accommodationDeposit: number;  // 10% of accommodation
  coachingCost: number;
  total: number;
  participantCount: number;
  coachingParticipants: number;
}

/**
 * Calculate the WeTravel payment amount based on surf program selections
 * Now supports multiple participants with different programs and individual coaching costs
 */
export function calculateWeTravelPayment({
  surfPrograms,
  coachingPrograms,
  accommodationTotal
}: CalculateWeTravelPaymentParams): WeTravelPaymentBreakdown {
  // Calculate total program difference (sum of all participants' programs)
  let totalProgramDifference = 0;
  let totalCoachingCost = 0;

  for (const program of surfPrograms) {
    const programPricing = SURF_PROGRAM_PRICING[program];
    totalProgramDifference += programPricing.difference;
  }

  // Calculate coaching cost per participant based on THEIR program
  for (const program of coachingPrograms) {
    const programPricing = SURF_PROGRAM_PRICING[program];
    totalCoachingCost += programPricing.coachingCost;
    console.log(`💰 [COACHING] Participant with ${program} + coaching = $${programPricing.coachingCost}`);
  }

  const accommodationDeposit = Math.round(accommodationTotal * 0.10);
  const total = totalProgramDifference + accommodationDeposit + totalCoachingCost;

  console.log('💰 [WETRAVEL-PRICING] Calculation breakdown:', {
    surfPrograms,
    participantCount: surfPrograms.length,
    coachingPrograms,
    coachingCount: coachingPrograms.length,
    accommodationTotal,
    programDifference: totalProgramDifference,
    accommodationDeposit,
    coachingCost: totalCoachingCost,
    total
  });

  return {
    programDifference: totalProgramDifference,
    accommodationDeposit,
    coachingCost: totalCoachingCost,
    total,
    participantCount: surfPrograms.length,
    coachingParticipants: coachingPrograms.length
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
 * Get surf programs from ALL participants
 * Returns an array of programs, one per participant that selected surf
 */
export function detectSurfPrograms(
  participants: any[],
  selectedActivities?: any[]
): SurfProgram[] {
  const programs: SurfProgram[] = [];

  // Detect from participants (each participant can have their own program)
  if (participants && participants.length > 0) {
    for (const participant of participants) {
      let participantProgram: SurfProgram | null = null;

      // Check selectedSurfProgram
      if (participant.selectedSurfProgram) {
        const progs = Object.values(participant.selectedSurfProgram);
        if (progs.length > 0 && progs[0]) {
          participantProgram = progs[0] as SurfProgram;
        }
      }

      // Check selectedActivities for surfProgram or classCount
      if (!participantProgram && participant.selectedActivities) {
        for (const activity of participant.selectedActivities) {
          if (activity.surfProgram) {
            participantProgram = activity.surfProgram as SurfProgram;
            break;
          }
          if (activity.category === 'surf' && activity.program) {
            participantProgram = activity.program as SurfProgram;
            break;
          }
          if (activity.category === 'surf' && activity.classCount) {
            participantProgram = classCountToProgram(activity.classCount);
            break;
          }
        }
      }

      // Check selectedSurfClasses (stored as object like { activityId: classCount })
      if (!participantProgram && participant.selectedSurfClasses) {
        const classCounts = Object.values(participant.selectedSurfClasses);
        if (classCounts.length > 0 && typeof classCounts[0] === 'number') {
          participantProgram = classCountToProgram(classCounts[0] as number);
        }
      }

      if (participantProgram) {
        console.log(`🏄 [DETECT] Participant "${participant.name || participant.id}" has program: ${participantProgram}`);
        programs.push(participantProgram);
      }
    }
  }

  if (programs.length === 0) {
    console.log('⚠️ [DETECT] Could not detect any surf programs from participants');
  } else {
    console.log(`✅ [DETECT] Found ${programs.length} surf program(s):`, programs);
  }

  return programs;
}

/**
 * Legacy function for backward compatibility
 * Returns the first program found
 */
export function detectSurfProgram(
  participants: any[],
  selectedActivities?: any[]
): SurfProgram | null {
  const programs = detectSurfPrograms(participants, selectedActivities);
  return programs.length > 0 ? programs[0] : null;
}

/**
 * Get surf programs for participants WITH coaching
 * Returns an array of programs for participants who selected 1:1 coaching
 */
export function getCoachingPrograms(
  participants: any[],
  selectedActivities?: any[]
): SurfProgram[] {
  const coachingPrograms: SurfProgram[] = [];

  // Check participants
  if (participants && participants.length > 0) {
    for (const participant of participants) {
      let hasCoaching = false;

      // Check for coaching flag
      if (participant.hasPrivateCoaching || participant.hasCoaching) {
        hasCoaching = true;
      }

      // Check selectedActivities for coaching
      if (!hasCoaching && participant.selectedActivities) {
        for (const activity of participant.selectedActivities) {
          if (activity.isPrivateCoaching || activity.coaching) {
            hasCoaching = true;
            break;
          }
        }
      }

      if (hasCoaching) {
        // Find this participant's surf program
        let participantProgram: SurfProgram | null = null;

        // Check selectedSurfProgram
        if (participant.selectedSurfProgram) {
          const progs = Object.values(participant.selectedSurfProgram);
          if (progs.length > 0 && progs[0]) {
            participantProgram = progs[0] as SurfProgram;
          }
        }

        // Check selectedActivities for surfProgram or classCount
        if (!participantProgram && participant.selectedActivities) {
          for (const activity of participant.selectedActivities) {
            if (activity.surfProgram) {
              participantProgram = activity.surfProgram as SurfProgram;
              break;
            }
            if (activity.category === 'surf' && activity.program) {
              participantProgram = activity.program as SurfProgram;
              break;
            }
            if (activity.category === 'surf' && activity.classCount) {
              participantProgram = classCountToProgram(activity.classCount);
              break;
            }
          }
        }

        // Check selectedSurfClasses
        if (!participantProgram && participant.selectedSurfClasses) {
          const classCounts = Object.values(participant.selectedSurfClasses);
          if (classCounts.length > 0 && typeof classCounts[0] === 'number') {
            participantProgram = classCountToProgram(classCounts[0] as number);
          }
        }

        if (participantProgram) {
          console.log(`👨‍🏫 [DETECT] Participant "${participant.name || participant.id}" has ${participantProgram} + coaching`);
          coachingPrograms.push(participantProgram);
        } else {
          console.log(`⚠️ [DETECT] Participant "${participant.name || participant.id}" has coaching but no program detected`);
        }
      }
    }
  }

  console.log(`✅ [DETECT] Found ${coachingPrograms.length} participant(s) with coaching:`, coachingPrograms);
  return coachingPrograms;
}

/**
 * Count how many participants selected 1:1 coaching
 * Returns the number of participants with private coaching
 */
export function countPrivateCoaching(
  participants: any[],
  selectedActivities?: any[]
): number {
  return getCoachingPrograms(participants, selectedActivities).length;
}

/**
 * Legacy function for backward compatibility
 * Returns true if any participant has coaching
 */
export function hasPrivateCoaching(
  participants: any[],
  selectedActivities?: any[]
): boolean {
  return countPrivateCoaching(participants, selectedActivities) > 0;
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
