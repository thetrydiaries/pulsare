import {
  getLogEntry,
  getStreakData,
  setStreakData,
  getActiveHabitsForPhase,
  getUser,
  getAllLogDates,
} from './storage';
import { getLogicalDate, dateRangeFromStart } from './dayBoundary';
import { isDayPresent } from './habits';
import type { DayStats, Habit, StarState } from '@/types';

// ─── Internal helper: compute stats with pre-resolved context ────────────────
// Hoists getUser/getActiveHabitsForPhase out of per-date loops.

function computeDayStats(
  date: string,
  today: string,
  activeHabits: Habit[],
): DayStats {
  const entry = getLogEntry(date);

  if (!entry) {
    return {
      date,
      state: date <= today ? 'missed' : 'future',
      habitsComplete: 0,
      habitsTotal: activeHabits.length,
    };
  }

  const complete = activeHabits.filter((h) => entry.habits[h.id]).length;
  let state: StarState;

  if (entry.isReturnDay) {
    state = 'return';
  } else if (isDayPresent(complete, activeHabits.length)) {
    state = 'full';
  } else if (complete > 0) {
    state = 'partial';
  } else {
    state = 'missed';
  }

  return { date, state, habitsComplete: complete, habitsTotal: activeHabits.length };
}

// ─── Public single-date helper (used by galaxy screen per-cell) ───────────────

export function getDayStats(date: string): DayStats {
  const user = getUser();
  const phase = user?.currentPhase ?? 1;
  const activeHabits = getActiveHabitsForPhase(phase);
  const today = getLogicalDate();
  return computeDayStats(date, today, activeHabits);
}

// ─── Compute stats across a date range ───────────────────────────────────────

export function getRangeStats(dates: string[]): DayStats[] {
  const user = getUser();
  const phase = user?.currentPhase ?? 1;
  const activeHabits = getActiveHabitsForPhase(phase);
  const today = getLogicalDate();
  return dates.map((d) => computeDayStats(d, today, activeHabits));
}

// ─── All dates that should be counted (official range + any retroactive logs) ─

export function getEffectiveDates(startDate: string): string[] {
  const today = getLogicalDate();
  const official = new Set(dateRangeFromStart(startDate));
  const logged = getAllLogDates().filter((d) => d <= today);
  const all = [...new Set([...official, ...logged])];
  return all.sort();
}

// ─── Count present days since start ──────────────────────────────────────────

export function getPresentDaysCount(startDate: string): number {
  const user = getUser();
  const phase = user?.currentPhase ?? 1;
  const activeHabits = getActiveHabitsForPhase(phase);
  const today = getLogicalDate();
  return getEffectiveDates(startDate).filter((d) => {
    const s = computeDayStats(d, today, activeHabits);
    return s.state === 'full' || s.state === 'return';
  }).length;
}

// ─── Presence rate ────────────────────────────────────────────────────────────

export function getPresenceRate(startDate: string): number {
  const dates = getEffectiveDates(startDate);
  if (dates.length === 0) return 0;
  const present = getPresentDaysCount(startDate);
  return Math.round((present / dates.length) * 100);
}

// ─── Recalculate and persist streak ──────────────────────────────────────────

export function recalculateStreak(): void {
  const user = getUser();
  if (!user) return;

  const today = getLogicalDate();
  const phase = user.currentPhase;
  const activeHabits = getActiveHabitsForPhase(phase);
  const relevantDates = getEffectiveDates(user.startDate).filter((d) => d <= today);

  let streak = 0;
  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const d = relevantDates[i];
    if (d === today) continue;
    const s = computeDayStats(d, today, activeHabits);
    if (s.state === 'full' || s.state === 'return') {
      streak++;
    } else {
      break;
    }
  }

  const todayStats = computeDayStats(today, today, activeHabits);
  if (todayStats.state === 'full' || todayStats.state === 'return') {
    streak++;
  }

  const prev = getStreakData();
  // Always update lastPresentDay when streak > 0; preserve previous value only
  // if the streak has been broken (so it records when the last run ended).
  setStreakData({
    currentStreak: streak,
    lastPresentDay: streak > 0 ? today : prev.lastPresentDay,
  });
}

// ─── Fall-off detection ───────────────────────────────────────────────────────

export function getConsecutiveMissedDays(): number {
  const user = getUser();
  if (!user) return 0;

  const today = getLogicalDate();
  const phase = user.currentPhase;
  const activeHabits = getActiveHabitsForPhase(phase);
  const dates = dateRangeFromStart(user.startDate).filter((d) => d < today);

  let missed = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const s = computeDayStats(dates[i], today, activeHabits);
    if (s.state === 'missed') {
      missed++;
    } else {
      break;
    }
  }
  return missed;
}

export function isFallOff(): boolean {
  return getConsecutiveMissedDays() >= 2;
}

export function isMissedOneDayOnly(): boolean {
  return getConsecutiveMissedDays() === 1;
}
