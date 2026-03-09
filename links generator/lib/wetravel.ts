export type BookingMode = 'new' | 'existing';
export type Locale = 'es' | 'en';
export type SurfProgram = 'fundamental' | 'progressionPlus' | 'highPerformance';

export interface ParticipantInput {
  id: string;
  name: string;
  surfProgram: SurfProgram | '';
  hasPrivateCoaching: boolean;
}

interface SurfProgramPricing {
  userPays: number;
  difference: number;
  coachingCost: number;
}

interface SurfProgramContent {
  title: string;
  tagline: string;
  includes: string[];
  focusAreas: string[];
}

const SURF_PROGRAM_PRICING: Record<SurfProgram, SurfProgramPricing> = {
  fundamental: {
    userPays: 390,
    difference: 70,
    coachingCost: 90,
  },
  progressionPlus: {
    userPays: 540,
    difference: 90,
    coachingCost: 110,
  },
  highPerformance: {
    userPays: 850,
    difference: 70,
    coachingCost: 130,
  },
};

const SURF_PROGRAM_CONTENT: Record<SurfProgram, SurfProgramContent> = {
  fundamental: {
    title: 'Core Surf Program',
    tagline: 'Fast start, strong foundation, personalized coaching',
    includes: [
      '4 surf sessions',
      '2 video analysis sessions',
      'Gear (board + lycra)',
      'Surf theory',
      'Photo session',
      'Continuity plan',
    ],
    focusAreas: [
      'Technique & biomechanics: Essential fundamentals adapted to your level — paddling, pop-up, stance, and transitions',
      'Mindset & confidence: Accelerated development from basic safety to complex wave reading',
      'Nutrition & recovery: Fueling and hydration strategies to maintain energy over 4 days',
      'Visual feedback: Video analysis at key moments to adjust focus and maximize results',
    ],
  },
  progressionPlus: {
    title: 'Intensive Surf Program',
    tagline: 'Consistent progress through repetition, coaching and feedback',
    includes: [
      '6 surf sessions',
      '4 video analysis sessions',
      'Transport to nearby surf spots',
      'Gear (board + lycra)',
      'Surf theory',
      'Final practice plan',
    ],
    focusAreas: [
      'Technique & biomechanics: Refinement of specific movement patterns, from fundamentals to intermediate maneuvers',
      'Mindset & confidence: Development of intuition and decision-making in varying conditions',
      'Nutrition & recovery: Personalized nutrition planning to optimize each session',
      'Visual feedback: Multiple video analyses plus personalized post-camp plan',
    ],
  },
  highPerformance: {
    title: 'Elite Surf Program',
    tagline: 'Deep technical transformation and high-quality analysis',
    includes: [
      '8 surf sessions',
      '5 advanced video analysis sessions',
      'Transport to nearby surf spots',
      'Gear (board + lycra)',
      'Surf theory',
      'Extended final review',
    ],
    focusAreas: [
      'Technique & biomechanics: Deep biomechanical analysis to create lasting changes in your specific patterns',
      'Mindset & confidence: Development of resilience, adaptability, and flow state in your optimal zone',
      'Nutrition & recovery: Complete sports protocols with periodization and personalized strategies',
      'Visual feedback: Comprehensive analysis plus detailed continuity plan',
    ],
  },
};

export interface LinkRequestPayload {
  bookingMode: BookingMode;
  locale: Locale;
  firstName: string;
  lastName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomLabel: string;
  fullPrice: number;
  accommodationTotal: number;
  existingReservationId?: string;
  participants: ParticipantInput[];
}

export interface WeTravelPaymentBreakdown {
  depositAmount: number;
  remainingBalance: number;
  accommodationDeposit: number;
  programDifference: number;
  coachingCost: number;
  detectedPrograms: SurfProgram[];
  coachingPrograms: SurfProgram[];
}

export function calculateWeTravelPayment(input: LinkRequestPayload): WeTravelPaymentBreakdown {
  const detectedPrograms = input.participants
    .map((participant) => participant.surfProgram)
    .filter((program): program is SurfProgram => Boolean(program));

  const coachingPrograms = input.participants
    .filter((participant) => participant.surfProgram && participant.hasPrivateCoaching)
    .map((participant) => participant.surfProgram as SurfProgram);

  if (input.fullPrice === 0) {
    return {
      depositAmount: 0,
      remainingBalance: 0,
      accommodationDeposit: 0,
      programDifference: 0,
      coachingCost: 0,
      detectedPrograms,
      coachingPrograms,
    };
  }

  if (detectedPrograms.length === 0) {
    const depositAmount = Math.min(input.fullPrice, Math.round(input.fullPrice * 0.1));
    return {
      depositAmount,
      remainingBalance: Math.max(0, input.fullPrice - depositAmount),
      accommodationDeposit: Math.round(
        (input.bookingMode === 'existing' ? 0 : input.accommodationTotal) * 0.1
      ),
      programDifference: 0,
      coachingCost: 0,
      detectedPrograms,
      coachingPrograms,
    };
  }

  const programDifference = detectedPrograms.reduce((sum, program) => {
    return sum + SURF_PROGRAM_PRICING[program].difference;
  }, 0);

  const coachingCost = coachingPrograms.reduce((sum, program) => {
    return sum + SURF_PROGRAM_PRICING[program].coachingCost;
  }, 0);

  const effectiveAccommodationTotal = input.bookingMode === 'existing' ? 0 : input.accommodationTotal;
  const accommodationDeposit = Math.round(effectiveAccommodationTotal * 0.1);
  const rawDepositAmount = programDifference + coachingCost + accommodationDeposit;
  const depositAmount = Math.min(input.fullPrice, rawDepositAmount);

  return {
    depositAmount,
    remainingBalance: Math.max(0, input.fullPrice - depositAmount),
    accommodationDeposit,
    programDifference,
    coachingCost,
    detectedPrograms,
    coachingPrograms,
  };
}

export function buildMinimalPayload(input: {
  fullName: string;
  surfProgram: SurfProgram | '';
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}): LinkRequestPayload {
  const splitName = splitFullName(input.fullName);
  const emailLocalPart = slugify(splitName.fullName || 'guest');
  const generatedEmail = `${emailLocalPart || 'guest'}+${Date.now()}@surfcamp.local`;

  const accommodationTotal = inferAccommodationTotal(input.totalPrice, input.surfProgram);

  return {
    bookingMode: 'new',
    locale: 'es',
    firstName: splitName.firstName,
    lastName: splitName.lastName,
    email: generatedEmail,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: 1,
    roomLabel: 'Manual booking',
    fullPrice: input.totalPrice,
    accommodationTotal,
    existingReservationId: '',
    participants: [
      {
        id: 'participant-1',
        name: splitName.fullName,
        surfProgram: input.surfProgram,
        hasPrivateCoaching: false,
      },
    ],
  };
}

export function buildTripDates(input: LinkRequestPayload) {
  if (input.bookingMode === 'new') {
    return {
      startDate: input.checkIn,
      endDate: input.checkOut,
    };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const checkOutDate = new Date(input.checkOut);

  return {
    startDate: toDateString(tomorrow),
    endDate: checkOutDate > dayAfterTomorrow ? input.checkOut : toDateString(dayAfterTomorrow),
  };
}

export function buildTripTitle(input: LinkRequestPayload) {
  const selectedProgram = input.participants.find((participant) => participant.surfProgram)?.surfProgram;
  if (selectedProgram) {
    return `${SURF_PROGRAM_CONTENT[selectedProgram].title} + Accommodation - Deposit`;
  }

  return 'Accommodation - Deposit';
}

export function buildTripDescription(input: LinkRequestPayload) {
  const selectedProgram = input.participants.find((participant) => participant.surfProgram)?.surfProgram;

  if (!selectedProgram) {
    return 'Manual surf booking deposit generated from links generator.';
  }

  const program = SURF_PROGRAM_CONTENT[selectedProgram];
  return [
    program.tagline,
    '',
    ...program.includes,
    '',
    ...program.focusAreas,
  ].join('\n');
}

export function getNightCount(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function sanitizePayload(raw: unknown): LinkRequestPayload {
  const payload = raw as Partial<LinkRequestPayload>;

  const participants = Array.isArray(payload.participants)
    ? payload.participants.map((participant, index) => ({
        id: String(participant?.id || `participant-${index + 1}`),
        name: String(participant?.name || `Participant ${index + 1}`),
        surfProgram: isSurfProgram(participant?.surfProgram) ? participant.surfProgram : '',
        hasPrivateCoaching: Boolean(participant?.hasPrivateCoaching),
      }))
    : [];

  return {
    bookingMode: payload.bookingMode === 'existing' ? 'existing' : 'new',
    locale: payload.locale === 'en' ? 'en' : 'es',
    firstName: String(payload.firstName || '').trim(),
    lastName: String(payload.lastName || '').trim(),
    email: String(payload.email || '').trim(),
    checkIn: String(payload.checkIn || ''),
    checkOut: String(payload.checkOut || ''),
    guests: clampInteger(payload.guests, 1),
    roomLabel: String(payload.roomLabel || '').trim(),
    fullPrice: clampNumber(payload.fullPrice),
    accommodationTotal: clampNumber(payload.accommodationTotal),
    existingReservationId: payload.existingReservationId ? String(payload.existingReservationId) : '',
    participants,
  };
}

export function validatePayload(payload: LinkRequestPayload) {
  const errors: string[] = [];

  if (!payload.firstName) errors.push('First name is required.');
  if (!payload.lastName) errors.push('Last name is required.');
  if (!payload.email) errors.push('Email is required.');
  if (!payload.checkIn) errors.push('Check-in is required.');
  if (!payload.checkOut) errors.push('Check-out is required.');
  if (payload.fullPrice < 0) errors.push('Full price must be 0 or higher.');
  if (payload.accommodationTotal < 0) errors.push('Accommodation total must be 0 or higher.');
  if (new Date(payload.checkOut).getTime() < new Date(payload.checkIn).getTime()) {
    errors.push('Check-out must be after check-in.');
  }
  if (payload.bookingMode === 'existing' && !payload.existingReservationId) {
    errors.push('Existing reservation ID is required for existing reservation mode.');
  }

  return errors;
}

export function sanitizeMinimalPayload(raw: unknown) {
  const payload = raw as Partial<{
    fullName: string;
    surfProgram: SurfProgram | '';
    checkIn: string;
    checkOut: string;
    totalPrice: number | string;
  }>;

  return {
    fullName: String(payload.fullName || '').trim(),
    surfProgram: isSurfProgram(payload.surfProgram) ? payload.surfProgram : '',
    checkIn: String(payload.checkIn || ''),
    checkOut: String(payload.checkOut || ''),
    totalPrice: clampNumber(payload.totalPrice),
  };
}

export function validateMinimalPayload(payload: {
  fullName: string;
  surfProgram: SurfProgram | '';
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  const errors: string[] = [];

  if (!payload.fullName) errors.push('Name is required.');
  if (!payload.checkIn) errors.push('Check-in is required.');
  if (!payload.checkOut) errors.push('Check-out is required.');
  if (payload.totalPrice < 0) errors.push('Total price must be 0 or higher.');
  if (new Date(payload.checkOut).getTime() < new Date(payload.checkIn).getTime()) {
    errors.push('Check-out must be after check-in.');
  }

  return errors;
}

function clampNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Number(value));
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return 0;
}

function clampInteger(value: unknown, fallback: number) {
  const num = clampNumber(value);
  return Math.max(fallback, Math.round(num));
}

function toDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function isSurfProgram(value: unknown): value is SurfProgram {
  return value === 'fundamental' || value === 'progressionPlus' || value === 'highPerformance';
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Guest';
  const lastName = parts.slice(1).join(' ') || 'Manual';

  return {
    fullName: [firstName, lastName].join(' ').trim(),
    firstName,
    lastName,
  };
}

function inferAccommodationTotal(totalPrice: number, surfProgram: SurfProgram | '') {
  if (!surfProgram) {
    return totalPrice;
  }

  const estimated = totalPrice - SURF_PROGRAM_PRICING[surfProgram].userPays;
  return Math.max(0, estimated);
}

export function getSurfProgramContent(program: SurfProgram | '') {
  return program ? SURF_PROGRAM_CONTENT[program] : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
