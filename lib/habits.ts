import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { Habit, Phase, HabitGroup, User } from '@/types';
import { getHabits, upsertHabit, setHabits, storage } from './storage';

// ─── Micro-explanations by suggestedId ──────────────────────────────────────

export const MICRO_EXPLANATIONS: Record<string, string> = {
  'wake-anchor':
    'your body clock regulates everything else. this is where it starts.',
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
  };
  upsertHabit(habit);
  return habit;
}
