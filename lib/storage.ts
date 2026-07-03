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
let _initPromise: Promise<void> | null = null;

export function initStorage(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const keys = await AsyncStorage.getAllKeys();
    if (!keys.length) return;
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    for (const [key, value] of pairs) {
      if (key && value !== null) memCache[key] = value;
    }
  })();
  return _initPromise;
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
    AsyncStorage.setItem(key, serialized).catch((e) =>
      console.error('[storage] setItem failed', key, e)
    );
  },
  remove(key: string): void {
    delete memCache[key];
    AsyncStorage.removeItem(key).catch((e) =>
      console.error('[storage] removeItem failed', key, e)
    );
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
  AsyncStorage.setItem(key, serialized).catch((e) =>
    console.error('[storage] setItem failed', key, e)
  );
}

function remove(key: string): void {
  delete memCache[key];
  AsyncStorage.removeItem(key).catch((e) =>
    console.error('[storage] removeItem failed', key, e)
  );
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  return memCache['onboardingComplete'] === 'true';
}

export function setOnboardingComplete(): void {
  memCache['onboardingComplete'] = 'true';
  AsyncStorage.setItem('onboardingComplete', 'true').catch((e) =>
    console.error('[storage] setOnboardingComplete failed', e)
  );
}

// Returns -1 if no progress saved.
export function getOnboardingLastScreen(): number {
  const raw = memCache['onboarding.lastCompletedScreen'];
  if (!raw) return -1;
  const n = parseInt(raw, 10);
  return isNaN(n) ? -1 : n;
}

export function setOnboardingLastScreen(screen: number): void {
  storage.set('onboarding.lastCompletedScreen', String(screen));
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

// ─── Backup: export / import ─────────────────────────────────────────────────

export interface BackupFile {
  app: 'pulsare';
  backupVersion: 1;
  exportedAt: string;
  data: Record<string, string>;
}

export function exportAllData(): string {
  const backup: BackupFile = {
    app: 'pulsare',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { ...memCache },
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Full restore: validates the backup, then replaces all stored data with it.
 * Throws before touching anything if the file isn't a valid Pulsare backup.
 */
export async function importAllData(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('not a valid backup file');
  }
  const backup = parsed as Partial<BackupFile>;
  if (
    backup?.app !== 'pulsare' ||
    backup.backupVersion !== 1 ||
    typeof backup.data !== 'object' ||
    backup.data === null
  ) {
    throw new Error('not a valid pulsare backup');
  }
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(backup.data)) {
    if (typeof value === 'string') pairs.push([key, value]);
  }
  if (pairs.length === 0) {
    throw new Error('backup file is empty');
  }

  const prior: [string, string][] = Object.entries(memCache);
  await clearAllData();
  try {
    await AsyncStorage.multiSet(pairs);
  } catch (e) {
    // Restore failed mid-write — put the pre-import data back so a bad
    // restore is never a data-loss event.
    await AsyncStorage.multiSet(prior).catch(() => {});
    for (const [key, value] of prior) {
      memCache[key] = value;
    }
    throw new Error('restore failed. your existing data was kept.');
  }
  for (const [key, value] of pairs) {
    memCache[key] = value;
  }
}

// ─── Dev / testing ───────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys as string[]);
  for (const key of Object.keys(memCache)) {
    delete memCache[key];
  }
  _initPromise = null;
}
