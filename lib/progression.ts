/**
 * Progression engine — the spine of the week 2–4 reward beats.
 *
 * The app promises phase 2 ("build") and phase 3 ("raise the stakes") but never
 * advanced anyone past phase 1: currentPhase was set once at onboarding and left
 * there. This module computes when a phase should unlock, paces the unlocks so a
 * user who's already past both day-thresholds doesn't get everything at once, and
 * tracks the one-off narrative beats (project tease, galaxy milestones).
 *
 * Pure logic, no UI — safe to unit test.
 */

import type { Phase, PhaseUnlockRecord, ProgressionState } from '@/types';
import {
  getUser,
  updateUser,
  getProgressionState,
  setProgressionState,
} from './storage';
import { daysSinceStart, getLogicalDate, parseDate } from './dayBoundary';
import { instantiatePhaseHabit } from './habits';

// ─── Schedule ────────────────────────────────────────────────────────────────
// day 1 = start day. Week 2 begins day 8, week 3 day 15, week 4 day 22.
// The beats land inside the week-2-to-4 fall-off window on purpose.

export const PHASE2_DAY = 8;
export const PHASE3_DAY = 22;
export const PROJECT_TEASE_DAY = 15;

// Pacing: never advance more than one phase per app-open, and keep at least this
// many days between two accepted unlocks so the backfill for an existing user
// (like Shirley, already past day 22) is lived through, not skipped.
const MIN_UNLOCK_GAP_DAYS = 3;
// If the user taps "not yet", wait this long before re-offering.
const REOFFER_DAYS = 3;

interface Milestone {
  key: string;
  days: number; // present days required
  level: number; // persistent galaxy deepening level
}

const MILESTONES: Milestone[] = [
  { key: 'm7', days: 7, level: 1 },
  { key: 'm14', days: 14, level: 2 },
  { key: 'm21', days: 21, level: 3 },
  { key: 'm30', days: 30, level: 4 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Whole days from a → b (both YYYY-MM-DD). Negative if b is before a. */
function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

function phaseRecord(prog: ProgressionState, phase: 2 | 3): PhaseUnlockRecord | undefined {
  return phase === 2 ? prog.phase2 : prog.phase3;
}

function writePhaseRecord(
  phase: 2 | 3,
  record: PhaseUnlockRecord,
  extra?: Partial<ProgressionState>,
): void {
  const next: ProgressionState = { ...getProgressionState(), ...extra };
  if (phase === 2) next.phase2 = record;
  else next.phase3 = record;
  setProgressionState(next);
}

// ─── Phase unlocks ─────────────────────────────────────────────────────────────

/**
 * The phase whose unlock the home screen should route to right now, or null.
 * Only ever returns the single next phase — pacing prevents stacking.
 * Note: when the user is mid-lapse the home screen redirects to /falloff before
 * this runs, so a due unlock naturally waits and fires on the return day instead.
 */
export function getPendingUnlock(): 2 | 3 | null {
  const user = getUser();
  if (!user) return null;

  const nextPhase = (user.currentPhase + 1) as Phase;
  if (nextPhase > 3) return null;

  const days = daysSinceStart(user.startDate);
  const thresholdDay = nextPhase === 2 ? PHASE2_DAY : PHASE3_DAY;
  if (days < thresholdDay) return null;

  const prog = getProgressionState();
  const today = getLogicalDate();

  // Min gap since the last accepted unlock — paces the backfill.
  if (prog.lastUnlockAt && daysBetween(prog.lastUnlockAt, today) < MIN_UNLOCK_GAP_DAYS) {
    return null;
  }

  const record = phaseRecord(prog, nextPhase as 2 | 3);
  if (record?.state === 'active') return null; // already taken
  if (
    record?.state === 'pending' &&
    record.offeredAt &&
    daysBetween(record.offeredAt, today) < REOFFER_DAYS
  ) {
    return null; // still in "not yet" cooldown
  }

  return nextPhase as 2 | 3;
}

/**
 * Accept a phase unlock: instantiate the chosen habits, advance the phase, and
 * record the acceptance (which also resets the min-gap clock for the next phase).
 */
export function acceptPhaseUnlock(phase: 2 | 3, selectedSuggestedIds: string[]): void {
  const user = getUser();
  if (!user) return;

  for (const id of selectedSuggestedIds) {
    instantiatePhaseHabit(id, user);
  }

  updateUser({ currentPhase: phase, phaseUnlockState: 'active' });

  const today = getLogicalDate();
  writePhaseRecord(
    phase,
    { state: 'active', acceptedAt: today, offeredAt: today },
    { lastUnlockAt: today },
  );
}

/** Defer a phase unlock ("not yet"): phase does not advance; re-offered after a cooldown. */
export function deferPhaseUnlock(phase: 2 | 3): void {
  writePhaseRecord(phase, { state: 'pending', offeredAt: getLogicalDate() });
}

// ─── Project tease (week 3, ~day 15) ─────────────────────────────────────────

/**
 * The week-3 project tease card, or null. Keeps the narrative alive through the
 * deepest part of the fall-off window. Shows until dismissed or until the project
 * actually enters the protocol at phase 3.
 * `projectName` is null when the user never named one — that's the card's own cue
 * to ask them to name it now (the beat becomes an action).
 */
export function getProjectTease(): { projectName: string | null } | null {
  const user = getUser();
  if (!user) return null;
  if (user.currentPhase >= 3) return null; // project has already entered
  if (daysSinceStart(user.startDate) < PROJECT_TEASE_DAY) return null;

  const shown = getProgressionState().shownBeats ?? [];
  if (shown.includes('projectTease')) return null;

  return { projectName: user.projectName?.trim() || null };
}

export function markBeatShown(beat: string): void {
  const prog = getProgressionState();
  const shown = prog.shownBeats ?? [];
  if (shown.includes(beat)) return;
  setProgressionState({ ...prog, shownBeats: [...shown, beat] });
}

// ─── Galaxy milestones ─────────────────────────────────────────────────────────

/**
 * Persistent deepening level (0–4) for the galaxy background — derived purely
 * from present-day count, so the galaxy keeps gaining depth as she accumulates
 * days instead of plateauing. Never decreases.
 */
export function getGalaxyMilestoneLevel(presentDays: number): number {
  let level = 0;
  for (const m of MILESTONES) if (presentDays >= m.days) level = m.level;
  return level;
}

/**
 * The highest milestone crossed but not yet celebrated, for the one-time card.
 * Returns null once every crossed milestone has been acknowledged.
 */
export function getUnshownMilestone(
  presentDays: number,
): { key: string; days: number; level: number } | null {
  const shown = new Set(getProgressionState().shownGalaxyMilestones ?? []);
  let result: Milestone | null = null;
  for (const m of MILESTONES) {
    if (presentDays >= m.days && !shown.has(m.key)) result = m;
  }
  return result;
}

export function markMilestoneShown(key: string): void {
  const prog = getProgressionState();
  const shown = prog.shownGalaxyMilestones ?? [];
  if (shown.includes(key)) return;
  setProgressionState({ ...prog, shownGalaxyMilestones: [...shown, key] });
}
