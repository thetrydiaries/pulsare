/**
 * Progression engine — the one-off narrative beats (project tease, galaxy
 * milestones) that keep the week 2–4 fall-off window alive.
 *
 * The old phase 1→2→3 unlock system is retired: the day-21 cycle review is
 * the progression now. Habit additions between reviews are user-initiated
 * via the "+" on home — nothing pushes them.
 *
 * Pure logic, no UI — safe to unit test.
 */

import type { ProgressionState } from '@/types';
import { getUser, getProgressionState, setProgressionState } from './storage';
import { daysSinceStart } from './dayBoundary';

// ─── Schedule ────────────────────────────────────────────────────────────────
// day 1 = start day. The project tease lands inside the fall-off window on purpose.

export const PROJECT_TEASE_DAY = 15;

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

// ─── Project tease (week 3, ~day 15) ─────────────────────────────────────────

/**
 * The week-3 project tease card, or null. Keeps the narrative alive through the
 * deepest part of the fall-off window. Shows until dismissed.
 * `projectName` is null when the user never named one — that's the card's own cue
 * to ask them to name it now (the beat becomes an action).
 */
export function getProjectTease(): { projectName: string | null } | null {
  const user = getUser();
  if (!user) return null;
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
