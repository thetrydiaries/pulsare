import type { User } from '@/types';

export async function requestPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleAllNotifications(_user: User): Promise<void> {}

export async function scheduleCustomHabitNotification(_label: string, _hhmm: string): Promise<void> {}

export async function cancelCustomHabitNotification(): Promise<void> {}

export async function scheduleNeverMissTwiceNudge(_user: User): Promise<void> {}

export async function scheduleFallOffNotification(_user: User): Promise<void> {}

export async function scheduleEveningNotification(_user: User): Promise<void> {}
