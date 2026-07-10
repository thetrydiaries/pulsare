import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { Habit, Phase, HabitGroup, DayPhase, User } from '@/types';
import { getHabits, upsertHabit, setHabits, storage } from './storage';

// ─── Micro-explanations by suggestedId ──────────────────────────────────────

export const MICRO_EXPLANATIONS: Record<string, string> = {
  'wake-anchor':
    'your body clock regulates everything else. this is where it starts.',
  'morning-light':
    'bright light within 30 minutes of waking sets your circadian clock for the whole day.',
  'water-before-coffee':
    'cortisol peaks at wake. caffeine on dehydration amplifies the spike.',
  'morning-movement':
    'a signal, not a workout. you\'re telling your nervous system the day is safe.',
  'nervous-system-reset':
    'the exhale activates your vagus nerve. two minutes is enough.',
  'consistent-bedtime':
    'your sleep window matters as much as its length. your body clock is listening.',
  breakfast:
    'eating within 90 min of waking supports cortisol regulation and blood sugar stability.',
  'morning-pages':
    'this isn\'t journalling for insight. it\'s a pressure valve. get it out of your head.',
  'phone-off-reading':
    'narrative fiction reduces cortisol more measurably than non-fiction or scrolling.',
  'project-hour':
    'open the file. that\'s the first two minutes. nothing else is required yet.',
  'diet-anchor':
    'one approach. not a diet. your gut microbiome affects mood and cortisol — this is infrastructure.',
  'protected-sleep':
    'sleep is now tracked. bedtime within 30 min of target counts as complete.',
  'project-output':
    'the hour becomes 90 minutes. initiation is still the only real threshold.',
  'calorie-log':
    'you can\'t change what you don\'t see. logging is the whole habit — the number just follows.',
  'evening-journal':
    'clear the buffer. three sentences. what happened, what stuck, what tomorrow needs.',
  nsdr:
    'ten minutes of non-sleep deep rest. restores dopamine and focus without needing to fall asleep.',
};

// ─── Default dayPhase mapping by suggestedId (Huberman: phase 1 vs phase 2) ──

export const DAY_PHASE_BY_SUGGESTED_ID: Record<string, DayPhase> = {
  'wake-anchor': 'phase1',
  'morning-light': 'phase1',
  'water-before-coffee': 'phase1',
  'morning-movement': 'phase1',
  breakfast: 'phase1',
  'nervous-system-reset': 'phase1',
  'morning-pages': 'phase1',
  'project-hour': 'phase1',
  // phase 2 — low friction, wind-down window
  'calorie-log': 'phase2',
  'evening-journal': 'phase2',
  'evening-anchor': 'phase2',
  'consistent-bedtime': 'phase2',
  'phone-off-reading': 'phase2',
  'protected-sleep': 'phase2',
  'diet-anchor': 'phase2',
  nsdr: 'phase2',
};

/** Default day-phase for a habit — falls back to `group` when suggestedId is unknown. */
export function resolveDayPhase(habit: Pick<Habit, 'dayPhase' | 'group' | 'suggestedId'>): DayPhase {
  if (habit.dayPhase) return habit.dayPhase;
  if (habit.suggestedId && DAY_PHASE_BY_SUGGESTED_ID[habit.suggestedId]) {
    return DAY_PHASE_BY_SUGGESTED_ID[habit.suggestedId];
  }
  return habit.group === 'morning' ? 'phase1' : 'phase2';
}

// ─── Evening micro-explanations by habit type ────────────────────────────────

export const EVENING_MICRO: Record<string, string> = {
  reading: 'narrative wind-down. your nervous system needs a consistent signal the day is ending.',
  'phone-off': 'screens off. light off. cortisol down. the signal your body is waiting for.',
  breathwork: 'a wind-down practice. two minutes of slow exhales and the day is done.',
  journalling: 'three sentences. clear the buffer. then rest.',
  custom: 'your evening anchor. the consistent signal that the day is ending.',
};

// ─── Create habits from onboarding data ─────────────────────────────────────

function makeHabit(
  suggestedId: string,
  label: string,
  phase: Phase,
  group: HabitGroup,
  locked: boolean,
  microExplanation: string | null = null,
): Habit {
  return {
    id: `habit_${uuidv4()}`,
    label,
    microExplanation: microExplanation ?? MICRO_EXPLANATIONS[suggestedId] ?? null,
    phase,
    dayPhase: DAY_PHASE_BY_SUGGESTED_ID[suggestedId] ?? (group === 'morning' ? 'phase1' : 'phase2'),
    group,
    locked,
    isCustom: false,
    suggestedId,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Backfill dayPhase on any existing habits missing the field. Idempotent —
 * safe to run at app startup for users created before the Huberman migration.
 */
export function backfillDayPhase(): void {
  const habits = getHabits();
  let dirty = false;
  for (const [id, h] of Object.entries(habits)) {
    if (!h.dayPhase) {
      habits[id] = { ...h, dayPhase: resolveDayPhase(h) };
      dirty = true;
    }
  }
  if (dirty) setHabits(habits);
}

export function initPhase1Habits(user: User): void {
  const habits: Record<string, Habit> = {};

  const wakeAnchor = makeHabit('wake-anchor', 'wake up alarm', 1, 'morning', true);
  habits[wakeAnchor.id] = wakeAnchor;

  const morningLight = makeHabit('morning-light', 'morning light', 1, 'morning', false);
  habits[morningLight.id] = morningLight;

  const water = makeHabit('water-before-coffee', 'water before coffee', 1, 'morning', true);
  habits[water.id] = water;

  const movementLabel = user.movementType || 'morning movement';
  const movement = makeHabit('morning-movement', movementLabel, 1, 'morning', false);
  const movementUserLabel = storage.getString('onboarding.movementUserLabel')?.trim();
  if (movementUserLabel) movement.userLabel = movementUserLabel;
  habits[movement.id] = movement;

  const breathLabel =
    user.breathworkExperience === 'yes' && user.breathworkPractice
      ? user.breathworkPractice
      : 'nervous system reset';
  const breathMicro =
    user.breathworkExperience === 'yes'
      ? 'your existing practice. just do it.'
      : MICRO_EXPLANATIONS['nervous-system-reset'];
  const breath = makeHabit('nervous-system-reset', breathLabel, 1, 'morning', false, breathMicro);
  const breathUserLabel = storage.getString('onboarding.breathworkUserLabel')?.trim();
  if (breathUserLabel) breath.userLabel = breathUserLabel;
  habits[breath.id] = breath;

  const eveningMicro =
    EVENING_MICRO[user.eveningHabitType] ?? EVENING_MICRO['custom'];
  const evening = makeHabit(
    'evening-anchor',
    user.eveningHabitLabel,
    1,
    'evening',
    false,
    eveningMicro,
  );
  const eveningUserLabel = storage.getString('onboarding.eveningUserLabel')?.trim();
  if (eveningUserLabel) evening.userLabel = eveningUserLabel;
  habits[evening.id] = evening;

  setHabits(habits);
}

// ─── Huberman seed: instantiate the 6 habits picked in onboarding ───────────

const HABIT_LABELS: Record<string, string> = {
  'wake-anchor': 'wake up alarm',
  'morning-light': 'morning light',
  'water-before-coffee': 'delay caffeine 90 min',
  'morning-movement': 'movement',
  breakfast: 'protein-first breakfast',
  'nervous-system-reset': 'breathwork',
  'calorie-log': 'capstone anchor',
  'evening-journal': 'journal (3 sentences)',
  'evening-anchor': 'wind-down ritual',
  'consistent-bedtime': 'consistent bedtime',
  'phone-off-reading': 'read fiction',
  nsdr: 'nsdr / yoga nidra',
};

const HABIT_GROUP: Record<string, HabitGroup> = {
  'wake-anchor': 'morning',
  'morning-light': 'morning',
  'water-before-coffee': 'morning',
  'morning-movement': 'morning',
  breakfast: 'morning',
  'nervous-system-reset': 'morning',
  'calorie-log': 'evening',
  'evening-journal': 'evening',
  'evening-anchor': 'evening',
  'consistent-bedtime': 'evening',
  'phone-off-reading': 'evening',
  nsdr: 'evening',
};

const HABIT_LOCKED: Record<string, boolean> = {
  'wake-anchor': true,
  'water-before-coffee': true,
};

/**
 * Seed habits from the onboarding picker. Replaces the old phase-1/2/3
 * progression seed; every selected habit is active immediately.
 */
export function initHubermanHabits(user: User, selectedIds: string[]): void {
  const habits: Record<string, Habit> = {};
  for (const id of selectedIds) {
    const label = resolveSeedLabel(id, user);
    const group = HABIT_GROUP[id] ?? 'morning';
    const locked = HABIT_LOCKED[id] ?? false;
    const habit = makeHabit(id, label, 1, group, locked);
    habits[habit.id] = habit;
  }
  setHabits(habits);
}

function resolveSeedLabel(id: string, user: User): string {
  if (id === 'morning-movement' && user.movementType) return user.movementType;
  if (id === 'evening-anchor' && user.eveningHabitLabel) return user.eveningHabitLabel;
  if (id === 'nervous-system-reset' && user.breathworkExperience === 'yes' && user.breathworkPractice) {
    return user.breathworkPractice;
  }
  return HABIT_LABELS[id] ?? id;
}

// ─── Phase 2 / 3 catalog (unlocked progressively, not at onboarding) ─────────
// Each candidate stacks onto an existing anchor — adopting one at a time is how
// habits actually form, so the unlock screen offers these as a choice, never a dump.

export interface PhaseCandidate {
  suggestedId: string;
  label: string;
  group: HabitGroup;
  phase: Phase;
  stackIntro: string; // shown at the moment of adoption — anchors the new habit to an old one
  headline?: boolean; // the defining habit of the phase (pre-selected on the unlock screen)
}

const PHASE_CATALOG: PhaseCandidate[] = [
  // Phase 2 · build
  { suggestedId: 'consistent-bedtime', label: 'consistent bedtime', group: 'evening', phase: 2, stackIntro: 'stacks onto your evening anchor', headline: true },
  { suggestedId: 'breakfast', label: 'breakfast within 90 min', group: 'morning', phase: 2, stackIntro: 'stacks onto morning light' },
  { suggestedId: 'morning-pages', label: 'morning pages', group: 'morning', phase: 2, stackIntro: 'stacks onto water before coffee' },
  { suggestedId: 'phone-off-reading', label: 'phone-off reading', group: 'evening', phase: 2, stackIntro: 'stacks onto your evening wind-down' },
  // Phase 3 · raise the stakes
  { suggestedId: 'project-hour', label: 'project hour', group: 'morning', phase: 3, stackIntro: 'the first two minutes are the whole habit', headline: true },
  { suggestedId: 'protected-sleep', label: 'protected sleep', group: 'evening', phase: 3, stackIntro: 'your bedtime becomes a tracked anchor' },
  { suggestedId: 'diet-anchor', label: 'diet anchor', group: 'morning', phase: 3, stackIntro: 'one approach, not a diet — infrastructure' },
];

/** Candidate label resolved against user data (project hour shows the project name). */
function resolveCandidateLabel(c: PhaseCandidate, user: User): string {
  if (c.suggestedId === 'project-hour' && user.projectName?.trim()) {
    return user.projectName.trim();
  }
  return c.label;
}

/** Returns the phase's candidates, each flagged with whether it's already active. */
export function getPhaseCandidates(phase: Phase, user: User): (PhaseCandidate & { label: string; alreadyActive: boolean })[] {
  const active = new Set(
    Object.values(getHabits())
      .filter((h) => h.active && h.suggestedId)
      .map((h) => h.suggestedId as string),
  );
  return PHASE_CATALOG.filter((c) => c.phase === phase).map((c) => ({
    ...c,
    label: resolveCandidateLabel(c, user),
    alreadyActive: active.has(c.suggestedId),
  }));
}

/**
 * Instantiate one catalog habit. Idempotent: if a habit with the same
 * suggestedId already exists, it's reactivated rather than duplicated.
 * Returns the habit, or null if the suggestedId isn't in the catalog.
 */
export function instantiatePhaseHabit(suggestedId: string, user: User): Habit | null {
  const candidate = PHASE_CATALOG.find((c) => c.suggestedId === suggestedId);
  if (!candidate) return null;

  const habits = getHabits();
  const existing = Object.values(habits).find((h) => h.suggestedId === suggestedId);
  if (existing) {
    if (!existing.active) upsertHabit({ ...existing, active: true });
    return habits[existing.id];
  }

  const habit = makeHabit(
    candidate.suggestedId,
    resolveCandidateLabel(candidate, user),
    candidate.phase,
    candidate.group,
    false,
  );
  upsertHabit(habit);
  return habit;
}

// ─── Week-1 gradual reveal ───────────────────────────────────────────────────
// All phase-1 habits exist from day 1 (so presence/stats are never retroactively
// affected), but the home screen only *shows* them as the first week unfolds —
// three circadian anchors on day 1, the rest joining over the week. This is a
// display concern only; nothing here touches logging or presence math.

const REVEAL_DAY: Record<string, number> = {
  'wake-anchor': 1,
  'morning-light': 1,
  'water-before-coffee': 1,
  'evening-anchor': 2,
  'morning-movement': 4,
  'nervous-system-reset': 6,
};

/** The day (since start) a habit becomes visible on home. Custom/phase-2+ habits show immediately. */
export function habitRevealDay(habit: Habit): number {
  if (!habit.suggestedId) return 1;
  return REVEAL_DAY[habit.suggestedId] ?? 1;
}

/** Filter a habit list down to what should be visible on `dayNumber` (daysSinceStart). */
export function getRevealedHabits(habits: Habit[], dayNumber: number): Habit[] {
  return habits.filter((h) => dayNumber >= habitRevealDay(h));
}

// ─── Presence threshold ──────────────────────────────────────────────────────

// Huberman 4-of-6 rule: present = 4 habits/day. Clamps when someone has fewer
// than 4 active habits (rare mid-migration state) so partial setups still work.
export const PRESENCE_TARGET = 4;
export function getPresenceThreshold(activeHabitCount: number): number {
  return Math.min(PRESENCE_TARGET, Math.max(1, activeHabitCount));
}

export function isDayPresent(habitsComplete: number, activeHabitCount: number): boolean {
  return habitsComplete >= getPresenceThreshold(activeHabitCount);
}

// ─── Get active habits (sorted morning then evening) ─────────────────────────
// Phase progression retired — habits gate on `active` only. Optional `phase`
// arg kept for legacy callers during the Huberman-model migration.

export function getActiveHabits(phase?: Phase): Habit[] {
  const habits = getHabits();
  return Object.values(habits)
    .filter((h) => {
      if (!h.active) return false;
      if (phase !== undefined && h.phase > phase) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.group === b.group) return 0;
      return a.group === 'morning' ? -1 : 1;
    });
}

// ─── Replace a replaceable habit ─────────────────────────────────────────────

export function replaceHabit(
  existingId: string,
  newLabel: string,
  newMicroExplanation: string | null = null,
): void {
  const habits = getHabits();
  const existing = habits[existingId];
  if (!existing || existing.locked) return;

  const updated: Habit = {
    ...existing,
    label: newLabel,
    microExplanation: newMicroExplanation,
    isCustom: true,
  };
  habits[existingId] = updated;
  setHabits(habits);
}

// ─── Add custom habit ─────────────────────────────────────────────────────────

export function addCustomHabit(
  label: string,
  group: HabitGroup,
  phase: Phase,
  customNotificationTime?: string | null,
  personalReason?: string | null,
): Habit {
  const habit: Habit = {
    id: `habit_${uuidv4()}`,
    label,
    microExplanation: null,
    phase,
    group,
    locked: false,
    isCustom: true,
    suggestedId: null,
    active: true,
    createdAt: new Date().toISOString(),
    customNotificationTime: customNotificationTime ?? null,
    personalReason: personalReason ?? null,
  };
  upsertHabit(habit);
  return habit;
}

// ─── Edit custom habit ────────────────────────────────────────────────────────

export function editCustomHabit(
  habitId: string,
  label: string,
  group: HabitGroup,
  customNotificationTime: string | null,
  personalReason: string | null,
): void {
  const habits = getHabits();
  const existing = habits[habitId];
  if (!existing || !existing.isCustom) return;
  const updated: Habit = {
    ...existing,
    label,
    group,
    customNotificationTime,
    personalReason,
  };
  habits[habitId] = updated;
  setHabits(habits);
}
