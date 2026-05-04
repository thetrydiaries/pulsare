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
}

export interface Habit {
  id: string;
  label: string;
  microExplanation: string | null;
  phase: Phase;
  group: HabitGroup;
  locked: boolean;
  isCustom: boolean;
  suggestedId: string | null;
  active: boolean;
  createdAt: string; // ISO timestamp
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
