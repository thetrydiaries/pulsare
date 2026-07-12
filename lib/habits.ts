import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { Habit, Phase, HabitGroup, DayPhase, User } from '@/types';
import { getHabits, upsertHabit, setHabits, storage } from './storage';

// ─── Micro-explanations by suggestedId ──────────────────────────────────────

export const MICRO_EXPLANATIONS: Record<string, string> = {
  'wake-anchor':
    'same wake time, then light within 10 minutes. this sets your body clock for the whole day.',
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
    'the one daily action that serves your north star. presence, not numbers.',
  'evening-journal':
    'clear the buffer. three sentences. what happened, what stuck, what tomorrow needs.',
  nsdr:
    'ten minutes of non-sleep deep rest. restores dopamine and focus without needing to fall asleep.',
};

// ─── Default dayPhase mapping by suggestedId (phase 1 = activation, phase 2 = wind-down) ──

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
 * safe to run at app startup for users created before the cycle-model migration.
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

/**
 * Merge migration: "wake up alarm" + "morning light" became one "wake ritual"
 * anchor. Deactivates any active morning-light habit (logs untouched — history
 * keeps counting) and refreshes the wake-anchor label/micro where they still
 * carry the old defaults. Runs exactly once per install (flag-gated) so a
 * deliberately resumed morning-light habit is never re-paused by a later boot.
 */
const WAKE_LIGHT_MERGE_FLAG = 'migration.wakeLightMerged';

export function mergeWakeLightHabits(): void {
  if (storage.getBoolean(WAKE_LIGHT_MERGE_FLAG)) return;
  const habits = getHabits();
  let dirty = false;
  for (const [id, h] of Object.entries(habits)) {
    if (h.suggestedId === 'morning-light' && h.active) {
      habits[id] = { ...h, active: false };
      dirty = true;
    }
    if (h.suggestedId === 'wake-anchor') {
      const next = { ...h };
      if (next.label === 'wake up alarm' || next.label === 'wake time consistency') {
        next.label = HABIT_LABELS['wake-anchor'];
        dirty = true;
      }
      if (next.microExplanation !== MICRO_EXPLANATIONS['wake-anchor']) {
        next.microExplanation = MICRO_EXPLANATIONS['wake-anchor'];
        dirty = true;
      }
      habits[id] = next;
    }
    // Same pass: nothing is locked anymore — every anchor can be renamed,
    // paused, or swapped.
    if (habits[id].locked) {
      habits[id] = { ...habits[id], locked: false };
      dirty = true;
    }
  }
  if (dirty) setHabits(habits);
  // Flag last, so a failure above retries on the next boot.
  storage.set(WAKE_LIGHT_MERGE_FLAG, true);
}

// ─── Onboarding seed: instantiate the 6 habits picked in onboarding ─────────

const HABIT_LABELS: Record<string, string> = {
  'wake-anchor': 'wake ritual',
  'morning-light': 'morning light',
  'water-before-coffee': 'delay caffeine 90 min',
  'morning-movement': 'movement',
  breakfast: 'protein-first breakfast',
  'nervous-system-reset': 'breathwork',
  'calorie-log': 'north star anchor',
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

/**
 * Seed habits from the onboarding picker. Replaces the old phase-1/2/3
 * progression seed; every selected habit is active immediately. Nothing is
 * locked — every anchor can be renamed, paused, or swapped.
 */
export function seedHabits(user: User, selectedIds: string[]): void {
  const habits: Record<string, Habit> = {};
  for (const id of selectedIds) {
    const label = resolveSeedLabel(id, user);
    const group = HABIT_GROUP[id] ?? 'morning';
    const habit = makeHabit(id, label, 1, group, false);
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

// ─── Bench: seed habits not currently active, offerable as swaps ─────────────

export interface BenchOption {
  suggestedId: string;
  label: string;
  group: HabitGroup;
}

/** Every known seed habit that isn't currently active — the swap bench. */
export function getBenchOptions(user: User): BenchOption[] {
  const active = new Set(
    Object.values(getHabits())
      .filter((h) => h.active && h.suggestedId)
      .map((h) => h.suggestedId as string),
  );
  return Object.keys(HABIT_LABELS)
    .filter((id) => !active.has(id))
    .map((id) => ({
      suggestedId: id,
      label: resolveSeedLabel(id, user),
      group: HABIT_GROUP[id] ?? 'morning',
    }));
}

/**
 * Instantiate one bench habit. Idempotent: if a habit with the same
 * suggestedId already exists, it's reactivated rather than duplicated.
 * Returns the habit, or null for an unknown suggestedId.
 */
export function instantiateSeedHabit(suggestedId: string, user: User): Habit | null {
  if (!HABIT_LABELS[suggestedId]) return null;

  const habits = getHabits();
  const existing = Object.values(habits).find((h) => h.suggestedId === suggestedId);
  if (existing) {
    if (!existing.active) upsertHabit({ ...existing, active: true });
    return getHabits()[existing.id];
  }

  const habit = makeHabit(
    suggestedId,
    resolveSeedLabel(suggestedId, user),
    1,
    HABIT_GROUP[suggestedId] ?? 'morning',
    false,
  );
  upsertHabit(habit);
  return habit;
}

/** Pause / resume an anchor. Logs are untouched — history keeps counting. */
export function setHabitActive(habitId: string, active: boolean): void {
  const habits = getHabits();
  const habit = habits[habitId];
  if (!habit || habit.active === active) return;
  habits[habitId] = { ...habit, active };
  setHabits(habits);
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

// 4-of-6 rule: present = 4 habits/day. Clamps when someone has fewer than 4
// active habits (rare mid-migration state) so partial setups still work.
// INTENTIONAL: the target stays 4 no matter how many habits are active —
// adding habits must never raise the bar to be "present". That's engineered
// slack, not a bug. Do not "fix" this to scale with habit count.
export const PRESENCE_TARGET = 4;
export function getPresenceThreshold(activeHabitCount: number): number {
  return Math.min(PRESENCE_TARGET, Math.max(1, activeHabitCount));
}

export function isDayPresent(habitsComplete: number, activeHabitCount: number): boolean {
  return habitsComplete >= getPresenceThreshold(activeHabitCount);
}

// ─── Get active habits (sorted morning then evening) ─────────────────────────
// Phase progression retired — habits gate on `active` only.

export function getActiveHabits(): Habit[] {
  const habits = getHabits();
  return Object.values(habits)
    .filter((h) => h.active)
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
  if (!existing) return;

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
