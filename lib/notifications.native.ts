import * as Notifications from 'expo-notifications';
import type { User } from '@/types';
import { getHabits } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false, // never badge the icon
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'native';

// Web-parity exports: native notifications are local, so there is no push
// state to report or sync.
export function getPushStatus(): PushStatus {
  return 'native';
}

export async function syncPush(_user: User): Promise<void> {}

export async function disablePush(): Promise<void> {}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [hour, minute] = hhmm.split(':').map(Number);
  return { hour, minute };
}

async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule a daily repeating notification
async function scheduleDailyNotification(
  identifier: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleAllNotifications(user: User): Promise<void> {
  await cancelAll();

  const { morning, movement, windDown } = user.notificationTimes;

  // Morning anchor
  const { hour: mh, minute: mm } = parseTime(morning);
  await scheduleDailyNotification(
    'morning-anchor',
    'Pulsare',
    `${morning}. same as yesterday. same as tomorrow.`,
    mh,
    mm,
  );

  // Movement reminder
  const { hour: movH, minute: movM } = parseTime(movement);
  await scheduleDailyNotification(
    'movement',
    'Pulsare',
    'have you moved yet? even ten minutes counts.',
    movH,
    movM,
  );

  // Wind-down
  const { hour: wdH, minute: wdM } = parseTime(windDown);
  await scheduleDailyNotification(
    'wind-down',
    'Pulsare',
    `wind down starts now. not later. now.`,
    wdH,
    wdM,
  );

  // Re-apply any existing custom habit notification
  const habits = getHabits();
  const customWithNotif = Object.values(habits).find(
    (h) => h.isCustom && h.active && h.customNotificationTime,
  );
  if (customWithNotif?.customNotificationTime) {
    const { hour: ch, minute: cm } = parseTime(customWithNotif.customNotificationTime);
    const displayLabel = customWithNotif.userLabel ?? customWithNotif.label;
    await scheduleDailyNotification('custom-habit', 'Pulsare', `${displayLabel}. just this.`, ch, cm);
  }
}

export async function scheduleCustomHabitNotification(label: string, hhmm: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('custom-habit').catch(() => {});
  const { hour, minute } = parseTime(hhmm);
  await scheduleDailyNotification('custom-habit', 'Pulsare', `${label}. just this.`, hour, minute);
}

export async function cancelCustomHabitNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('custom-habit').catch(() => {});
}

export async function scheduleNeverMissTwiceNudge(user: User): Promise<void> {
  // Override morning notification copy for tomorrow only
  // Since expo-notifications doesn't support one-shot override easily,
  // we fire a separate one-time notification alongside the daily one.
  const { hour, minute } = parseTime(user.notificationTimes.morning);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: 'never-miss-twice',
    content: {
      title: 'Pulsare',
      body: 'yesterday was yesterday. today just needs one thing.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
    },
  });
}

export async function scheduleFallOffNotification(user: User): Promise<void> {
  const { hour, minute } = parseTime(user.notificationTimes.morning);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: 'fall-off',
    content: {
      title: 'Pulsare',
      body: 'still here. so are we. one tap when you\'re ready.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
    },
  });
}

export async function scheduleEveningNotification(user: User): Promise<void> {
  const { hour, minute } = parseTime(user.notificationTimes.windDown);
  await scheduleDailyNotification(
    'evening-anchor',
    'Pulsare',
    `${user.eveningHabitLabel}. just this. then the day is done.`,
    hour,
    minute,
  );
}
