export type Phase = 1 | 2 | 3;
export type HabitGroup = 'morning' | 'evening';
export type PhaseUnlockState = 'active' | 'pending' | 'dismissed';
export type EveningHabitType = 'reading' | 'phone-off' | 'breathwork' | 'journalling' | 'custom';
export type StarState = 'full' | 'partial' | 'missed' | 'return' | 'future';

export interface NotificationTimes {
  morning: string; // HH:MM
  movement: string; // HH:MM
  windDown: string; // HH:MM
}

export interface User {
  name: string;
  startDate: string; // YYYY-MM-DD
  currentPhase: Phase;
  phaseUnlockState: PhaseUnlockState;
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
  phase: Phase;
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
}

export interface DayStats {
  date: string;
  state: StarState;
  habitsComplete: number;
  habitsTotal: number;
}
