export type Phase = 1 | 2 | 3;
export type HabitGroup = 'morning' | 'evening';
export type DayPhase = 'phase1' | 'phase2'; // phase 1 = 0–8h post-wake (hard), phase 2 = 9–15h (low friction)
export type PhaseUnlockState = 'active' | 'pending' | 'dismissed';
export type EveningHabitType = 'reading' | 'phone-off' | 'breathwork' | 'journalling' | 'custom';
export type StarState = 'full' | 'partial' | 'missed' | 'return' | 'future';

export interface NotificationTimes {
  morning: string; // HH:MM
  movement: string; // HH:MM
  windDown: string; // HH:MM
}

// The north star: a free-text direction for the season. No numbers, no
// tracking — presence is what's scored. (Storage key stays `capstone` for
// continuity; old stored objects may carry legacy fields — read `goal` only,
// never crash on the rest.)
export interface Capstone {
  goal: string;
  type?: string;        // legacy — unread
  targetValue?: number; // legacy — unread
  startValue?: number;  // legacy — unread
  unit?: string;        // legacy — unread
}

export interface User {
  name: string;
  startDate: string; // YYYY-MM-DD — day 1 of the program (never reset)
  currentPhase: Phase; // legacy — always 1; presence math still filters by it
  phaseUnlockState?: PhaseUnlockState; // legacy — no longer written or read
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
  // ─── Cycle model ──────────────────────────────────────────────────────────
  capstone?: Capstone;
  cycleStartDate?: string; // YYYY-MM-DD — day 1 of current 21-day cycle
  cycleNumber?: number;    // 1-based
  programLength?: number;  // legacy 75-day arc — no longer written or shown; kept readable for old data
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
  phase: Phase; // legacy — retired; superseded by dayPhase in cycle-model migration
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
