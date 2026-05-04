import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  Habit,
  HabitLogEntry,
  StreakData,
  WeeklyReflection,
  PersonalisedCopy,
} from '@/types';

// ─── In-memory cache (keeps the synchronous API intact) ─────────────────────
// All values stored as strings. Call initStorage() once at app startup to
// populate the cache from AsyncStorage before any synchronous reads happen.

const memCache: Record<string, string> = {};

export async function initStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  if (!keys.length) return;
  const pairs = await AsyncStorage.multiGet(keys as string[]);
  for (const [key, value] of pairs) {
    if (key && value !== null) memCache[key] = value;
  }
}

// ─── MMKV-compatible storage object (used directly by screens) ───────────────

export const storage = {
  getString(key: string): string | undefined {
    return memCache[key];
  },
  getBoolean(key: string): boolean | undefined {
    const v = memCache[key];
    if (v === undefined) return undefined;
    return v === 'true';
  },
  set(key: string, value: string | boolean | number): void {
    const serialized = String(value);
    memCache[key] = serialized;
    AsyncStorage.setItem(key, serialized);
  },
  remove(key: string): void {
    delete memCache[key];
    AsyncStorage.removeItem(key);
  },
  getAllKeys(): string[] {
    return Object.keys(memCache);
  },
};

// ─── Generic helpers ────────────────────────────────────────────────────────

function get<T>(key: string): T | null {
  const raw = memCache[key];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memCache[key] = serialized;
  AsyncStorage.setItem(key, serialized);
}

function remove(key: string): void {
  delete memCache[key];
  AsyncStorage.removeItem(key);
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  return memCache['onboardingComplete'] === 'true';
}

export function setOnboardingComplete(): void {
  memCache['onboardingComplete'] = 'true';
  AsyncStorage.setItem('onboardingComplete', 'true');
}

// ─── User ────────────────────────────────────────────────────────────────────

export function getUser(): User | null {
  return get<User>('user');
}

export function setUser(user: User): void {
  set('user', user);
}

export function updateUser(partial: Partial<User>): void {
  const existing = getUser();
  if (!existing) return;
  set('user', { ...existing, ...partial });
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export function getHabits(): Record<string, Habit> {
  return get<Record<string, Habit>>('habits') ?? {};
}

export function setHabits(habits: Record<string, Habit>): void {
  set('habits', habits);
}

export function upsertHabit(habit: Habit): void {
  const habits = getHabits();
  habits[habit.id] = habit;
  set('habits', habits);
}

export function getActiveHabitsForPhase(phase: number): Habit[] {
  const habits = getHabits();
  return Object.values(habits).filter(
    (h) => h.active && h.phase <= phase
  );
}

// ─── Habit Log ───────────────────────────────────────────────────────────────

export function getLogEntry(date: string): HabitLogEntry | null {
  return get<HabitLogEntry>(`habitLog:${date}`);
}

export function setLogEntry(date: string, entry: HabitLogEntry): void {
  set(`habitLog:${date}`, entry);
}

export function updateLogEntry(date: string, partial: Partial<HabitLogEntry>): void {
  const existing = getLogEntry(date) ?? {
    habits: {},
    bodyCheckWord: null,
    isReturnDay: false,
    dayBoundaryApplied: false,
  };
  set(`habitLog:${date}`, { ...existing, ...partial });
}

export function getAllLogDates(): string[] {
  return storage.getAllKeys()
    .filter((k: string) => k.startsWith('habitLog:'))
    .map((k: string) => k.replace('habitLog:', ''))
    .sort();
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export function getStreakData(): StreakData {
  return get<StreakData>('streakData') ?? { currentStreak: 0, lastPresentDay: null };
}

export function setStreakData(data: StreakData): void {
  set('streakData', data);
}

// ─── Weekly Reflections ──────────────────────────────────────────────────────

export function getReflection(date: string): WeeklyReflection | null {
  return get<WeeklyReflection>(`reflection:${date}`);
}

export function setReflection(date: string, reflection: WeeklyReflection): void {
  set(`reflection:${date}`, reflection);
}

export function getAllReflectionDates(): string[] {
  return storage.getAllKeys()
    .filter((k: string) => k.startsWith('reflection:'))
    .map((k: string) => k.replace('reflection:', ''))
    .sort();
}

export { remove };

// ─── Personalised copy ───────────────────────────────────────────────────────

export function getPersonalisedCopy(): PersonalisedCopy | null {
  return get<PersonalisedCopy>('personalisedCopy');
}

export function setPersonalisedCopy(copy: PersonalisedCopy): void {
  set('personalisedCopy', copy);
}

// ─── Dev / testing ───────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys as string[]);
  for (const key of Object.keys(memCache)) {
    delete memCache[key];
  }
}
