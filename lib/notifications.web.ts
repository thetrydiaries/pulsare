import type { User } from '@/types';
import { getStreakData } from './storage';

// Web push for the installed PWA. On iOS this only works when Pulsare is
// added to the home screen (iOS 16.4+); in a plain Safari tab push is
// unavailable and everything here degrades to a silent no-op.

const VAPID_PUBLIC_KEY =
  'BLIew5C9jDgQ7Hq5XtGGG2dPx4s-insfjfRA7xLLSWhNK5F7SoGOi25MwKXaefKC201F6EVkhN_OysDR7WVzsMo';

export type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied';

function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushStatus(): PushStatus {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission as PushStatus;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function requestPermissions(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

async function getOrCreateSubscription(): Promise<PushSubscription | null> {
  // getRegistration (not .ready) so this resolves instead of hanging when no
  // service worker exists, e.g. the local dev server.
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !reg.active) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });
}

export async function scheduleAllNotifications(user: User): Promise<void> {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  try {
    const sub = await getOrCreateSubscription();
    if (!sub) return;
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        times: user.notificationTimes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        wakeTime: user.wakeTime,
        eveningHabitLabel: user.eveningHabitLabel,
        lastPresentDay: getStreakData().lastPresentDay,
      }),
    });
  } catch {
    // silent — reminders are a layer on top, never a blocker
  }
}

let syncedThisSession = false;

/**
 * Re-send the subscription with fresh times and lastPresentDay. Called on app
 * open so the server's never-miss-twice copy stays accurate. Throttled to
 * once per session.
 */
export async function syncPush(user: User): Promise<void> {
  if (syncedThisSession) return;
  syncedThisSession = true;
  await scheduleAllNotifications(user);
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  } catch {
    // silent
  }
}

// Custom habit reminders and local nudges are native-only for now; the
// server-side tick covers the three anchors and the never-miss-twice copy.
export async function scheduleCustomHabitNotification(_label: string, _hhmm: string): Promise<void> {}

export async function cancelCustomHabitNotification(): Promise<void> {}

export async function scheduleNeverMissTwiceNudge(_user: User): Promise<void> {}

export async function scheduleFallOffNotification(_user: User): Promise<void> {}

export async function scheduleEveningNotification(_user: User): Promise<void> {}
