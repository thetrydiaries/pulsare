export type Phase = 1 | 2 | 3;
export type HabitGroup = 'morning' | 'evening';
export type DayPhase = 'phase1' | 'phase2'; // Huberman: phase 1 = 0–8h post-wake (hard), phase 2 = 9–15h (low friction)
export type PhaseUnlockState = 'active' | 'pending' | 'dismissed';
export type EveningHabitType = 'reading' | 'phone-off' | 'breathwork' | 'journalling' | 'custom';
export type StarState = 'full' | 'partial' | 'missed' | 'return' | 'future';
export type CapstoneType = 'weight' | 'other';

export interface NotificationTimes {
  morning: string; // HH:MM
  movement: string; // HH:MM
  windDown: string; // HH:MM
}

export interface Capstone {
  goal: string; // free-text label, e.g. "lose 15kg"
  type: CapstoneType;
  targetValue?: number; // kg for weight; unit implied by type
  startValue?: number;  // starting weight at cycle 1 day 1
  unit?: string;        // 'kg', 'lb', etc.
}

export interface User {
  name: string;
  startDate: string; // YYYY-MM-DD — day 1 of the program (never reset)
  currentPhase: Phase; // legacy — retired by Huberman migration, retained for back-compat until cleanup
  phaseUnlockState: PhaseUnlockState; // legacy
  wakeTime: string; // HH:MM
  movementType: string;
  breathworkExperience: 'yes' | 'no';
  breathworkPractice: string | null;
  eveningHabitType: EveningHabitType;
  eveningHabitLabel: string;
  projectName: string | null;
  notificationTimes: NotificationTimes;
  startingMood: string;
  breathworkDefault?: 'physiological-sigh' | 'cyclic-sigh' | 'box-breathing' | 'rotating' | null;
  // ─── Huberman × 75 Hard model ─────────────────────────────────────────────
  capstone?: Capstone;
  cycleStartDate?: string; // YYYY-MM-DD — day 1 of current 21-day cycle
  cycleNumber?: number;    // 1-based
  programLength?: number;  // total arc, default 75
}

export interface HabitLearnContent {
  reframe: string;
  science: string;
}

export interface Habit {
  id: string;
  label: string;
  userLabel?: string; // user-defined display name; overrides label everywhere it's shown
  microExplanation: string | null;
  learnContent?: HabitLearnContent; // AI-generated for custom habits
  phase: Phase; // legacy — retired; superseded by dayPhase in Huberman migration
  dayPhase?: DayPhase; // phase1 = morning window, phase2 = evening window
  group: HabitGroup;
  locked: boolean;
  isCustom: boolean;
  suggestedId: string | null;
  active: boolean;
  createdAt: string; // ISO timestamp
  customNotificationTime?: string | null; // HH:MM — only on custom habits
  personalReason?: string | null; // "why does this matter to you" — drives Learn accordion body
}

export interface CapstoneEntry {
  date: string;      // YYYY-MM-DD (Sunday of the week captured)
  value?: number;    // weight or metric
  photoUri?: string; // local URI (device-only, never uploaded)
  note?: string;
}

export interface PersonalisedCopy {
  habitExplanations: Record<string, string>;
  completionAcknowledgements: Record<string, string>;
  greetingVariations: {
    morning: string[];
    afternoon: string[];
    evening: string[];
    latenight: string[];
  };
  milestoneGreetings?: {
    day3: string;
    day7: string;
    day21: string;
  };
  breathworkIntros?: {
    'physiological-sigh': string;
    'cyclic-sigh': string;
    'box-breathing': string;
  };
  shownMilestones?: string[];
}

export interface PhaseUnlockRecord {
  // 'pending' = user tapped "not yet"; 'active' = accepted and phase advanced
  state: 'pending' | 'active';
  offeredAt?: string; // YYYY-MM-DD — last time the unlock was offered (re-offer cooldown)
  acceptedAt?: string; // YYYY-MM-DD — when accepted
}

export interface ProgressionState {
  phase2?: PhaseUnlockRecord;
  phase3?: PhaseUnlockRecord;
  lastUnlockAt?: string; // YYYY-MM-DD of the most recent accepted unlock (min-gap pacing)
  shownGalaxyMilestones?: string[]; // e.g. ['m7', 'm14', 'm21', 'm30']
  shownBeats?: string[]; // one-off narrative beats already shown, e.g. ['projectTease']
}

export interface HabitLogEntry {
  habits: Record<string, boolean>;
  bodyCheckWord: string | null;
  isReturnDay: boolean;
  dayBoundaryApplied: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastPresentDay: string | null; // YYYY-MM-DD
}

export interface WeeklyReflection {
  answers: string[];
}

export interface AppStorage {
  user: User | null;
  habits: Record<string, Habit>;
  habitLog: Record<string, HabitLogEntry>;
  streakData: StreakData;
  weeklyReflections: Record<string, WeeklyReflection>;
  onboardingComplete: boolean;
  capstoneLog: CapstoneEntry[];
  cycleReviews: Record<number, CycleReview>; // key = cycleNumber
}

export interface CycleReview {
  cycleNumber: number;
  completedAt: string;   // YYYY-MM-DD
  stuck: string[];       // habit IDs marked "automatic"
  willpower: string[];   // habit IDs still requiring effort
  dropped: string[];     // habit IDs deselected for next cycle
  replacedWith: Record<string, string>; // dropped id → new habit id
  note?: string;
}

export interface DayStats {
  date: string;
  state: StarState;
  habitsComplete: number;
  habitsTotal: number;
}
