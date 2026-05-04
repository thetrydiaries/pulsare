import {
  getLogEntry,
  getAllLogDates,
  getStreakData,
  setStreakData,
  getActiveHabitsForPhase,
  getUser,
} from './storage';
import { getLogicalDate, dateRangeFromStart, parseDate, formatDate } from './dayBoundary';
import { isDayPresent } from './habits';
import type { DayStats, StarState } from '@/types';

// ─── Compute stats for a single date ─────────────────────────────────────────

export function getDayStats(date: string): DayStats {
  const user = getUser();
  const phase = user?.currentPhase ?? 1;
  const activeHabits = getActiveHabitsForPhase(phase);
  const entry = getLogEntry(date);

  if (!entry) {
    const today = getLogicalDate();
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

// ─── Compute stats across a date range ───────────────────────────────────────

export function getRangeStats(dates: string[]): DayStats[] {
  return dates.map(getDayStats);
}

// ─── Count present days since start ──────────────────────────────────────────

export function getPresentDaysCount(startDate: string): number {
  const dates = dateRangeFromStart(startDate);
  return dates.filter((d) => {
    const s = getDayStats(d);
    return s.state === 'full' || s.state === 'return';
  }).length;
}

// ─── Presence rate ────────────────────────────────────────────────────────────

export function getPresenceRate(startDate: string): number {
  const dates = dateRangeFromStart(startDate);
  if (dates.length === 0) return 0;
  const present = getPresentDaysCount(startDate);
  return Math.round((present / dates.length) * 100);
}

// ─── Recalculate and persist streak ──────────────────────────────────────────

export function recalculateStreak(): void {
  const user = getUser();
  if (!user) return;

  const today = getLogicalDate();
  const dates = dateRangeFromStart(user.startDate);
  const relevantDates = dates.filter((d) => d <= today);

  let streak = 0;
  // Walk backward from yesterday (today may be in progress)
  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const d = relevantDates[i];
    if (d === today) continue; // don't count today in streak yet
    const s = getDayStats(d);
    if (s.state === 'full' || s.state === 'return') {
      streak++;
    } else {
      break;
    }
  }

  // If today is already present, add it
  const todayStats = getDayStats(today);
  if (todayStats.state === 'full' || todayStats.state === 'return') {
    streak++;
  }

  const prev = getStreakData();
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
  const dates = dateRangeFromStart(user.startDate).filter((d) => d < today);

  let missed = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const s = getDayStats(dates[i]);
    if (s.habitsComplete === 0 && s.state !== 'return') {
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
