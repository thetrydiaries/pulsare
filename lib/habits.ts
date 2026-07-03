import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { Habit, Phase, HabitGroup, User } from '@/types';
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
};

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
    group,
    locked,
    isCustom: false,
    suggestedId,
    active: true,
    createdAt: new Date().toISOString(),
  };
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

export function getPresenceThreshold(activeHabitCount: number): number {
  return Math.ceil(activeHabitCount / 2);
}

export function isDayPresent(habitsComplete: number, activeHabitCount: number): boolean {
  return habitsComplete >= getPresenceThreshold(activeHabitCount);
}

// ─── Get active habits for a phase (sorted morning then evening) ─────────────

export function getActiveHabits(phase: Phase): Habit[] {
  const habits = getHabits();
  return Object.values(habits)
    .filter((h) => h.active && h.phase <= phase)
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
