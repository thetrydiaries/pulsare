// Cycle math. 21-day cycles with a review beat at day 21; cycles run
// indefinitely — after three cycles the app is in integration.

import { getUser, updateUser } from '@/lib/storage';
import { getLogicalDate, daysSinceStart } from '@/lib/dayBoundary';

export const CYCLE_LENGTH = 21;

/** 1-based cycle number derived from cycleStartDate. Defaults to cycleStartDate = startDate. */
export function getCycleNumber(user: { cycleNumber?: number }): number {
  return user.cycleNumber ?? 1;
}

/** 1-based day within the current 21-day cycle (1..21). */
export function getCycleDay(cycleStartDate: string): number {
  const days = daysSinceStart(cycleStartDate);
  return Math.min(Math.max(days, 1), CYCLE_LENGTH);
}

/** True when today is the last day of the current cycle. */
export function isCycleReviewDay(cycleStartDate: string): boolean {
  return getCycleDay(cycleStartDate) === CYCLE_LENGTH;
}

/**
 * Advance to the next cycle: sets cycleStartDate to today and bumps cycleNumber.
 * Called from the day-21 review sheet after the user confirms.
 */
export function advanceCycle(): void {
  const user = getUser();
  if (!user) return;
  const nextNumber = (user.cycleNumber ?? 1) + 1;
  updateUser({
    cycleStartDate: getLogicalDate(),
    cycleNumber: nextNumber,
  });
}

/**
 * Ensure cycle fields exist on the user. Idempotent — safe to call on every app load.
 * For users created before the cycle-model migration, initialises cycle 1 to startDate.
 */
export function ensureCycleFields(): void {
  const user = getUser();
  if (!user) return;
  const patch: Partial<typeof user> = {};
  if (!user.cycleStartDate) patch.cycleStartDate = user.startDate;
  if (!user.cycleNumber) patch.cycleNumber = 1;
  if (Object.keys(patch).length) updateUser(patch);
}
