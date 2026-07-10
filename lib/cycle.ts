// Cycle math for the Huberman × 75 Hard model.
// Program = 75-day arc, split into 21-day cycles with review beats.
// Cycle 1: days 1–21. Cycle 2: 22–42. Cycle 3: 43–63. Beyond that = integration.

import { getUser, updateUser } from '@/lib/storage';
import { getLogicalDate, daysSinceStart, formatDate, parseDate } from '@/lib/dayBoundary';

export const CYCLE_LENGTH = 21;
export const PROGRAM_LENGTH = 75;

/** 1-based day within the program (from user.startDate). */
export function getProgramDay(startDate: string): number {
  return Math.max(1, daysSinceStart(startDate));
}

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

/** True when the program's 75-day arc has been reached. */
export function isProgramComplete(startDate: string): boolean {
  return getProgramDay(startDate) >= PROGRAM_LENGTH;
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
 * For users created before the Huberman migration, initialises cycle 1 to startDate.
 */
export function ensureCycleFields(): void {
  const user = getUser();
  if (!user) return;
  const patch: Partial<typeof user> = {};
  if (!user.cycleStartDate) patch.cycleStartDate = user.startDate;
  if (!user.cycleNumber) patch.cycleNumber = 1;
  if (!user.programLength) patch.programLength = PROGRAM_LENGTH;
  if (Object.keys(patch).length) updateUser(patch);
}

/** Sunday YYYY-MM-DD for the week containing the given date (used for capstone check-in). */
export function getSundayOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  const dow = d.getDay(); // 0 = Sun
  const diff = dow === 0 ? 0 : 7 - dow;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}
