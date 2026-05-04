/**
 * A calendar day ends at 3:00am. Habit completions between midnight and 3:00am
 * count toward the previous calendar day.
 */

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Returns the logical calendar date for the given moment, respecting the 3am boundary. */
export function getLogicalDate(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 3) {
    // Before 3am — count toward yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
  return formatDate(now);
}

/** Returns true if the given date string is today's logical date. */
export function isToday(dateStr: string): boolean {
  return dateStr === getLogicalDate();
}

/** Returns YYYY-MM-DD for N days ago (logical). */
export function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

/** Parse a YYYY-MM-DD string into a local midnight Date. */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Number of calendar days elapsed since startDate (inclusive of today). */
export function daysSinceStart(startDate: string): number {
  const start = parseDate(startDate);
  const today = parseDate(getLogicalDate());
  const diff = today.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/** Returns an array of all YYYY-MM-DD strings from startDate through today. */
export function dateRangeFromStart(startDate: string): string[] {
  const start = parseDate(startDate);
  const today = parseDate(getLogicalDate());
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Add N minutes to an HH:MM string, returns HH:MM. Handles negative totals correctly. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const newH = Math.floor(normalized / 60);
  const newM = normalized % 60;
  return `${pad(newH)}:${pad(newM)}`;
}

/** Subtract N hours from an HH:MM string, returns HH:MM. */
export function subtractHours(time: string, hours: number): string {
  return addMinutes(time, -hours * 60);
}

/** Compare two HH:MM strings. Returns true if a >= b. */
export function timeIsAtOrAfter(a: string, b: string): boolean {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am >= bh * 60 + bm;
}

/** Get current HH:MM string. */
export function currentTime(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
