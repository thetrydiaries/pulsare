import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { getRedis, subKey, SUB_INDEX_KEY } from '../_lib/redis';
import type { StoredSubscription } from './subscribe';

// Called every 5 minutes by a QStash schedule. Sends whichever anchors fall
// inside the current 5-minute window in each subscriber's own timezone.

const WINDOW_MIN = 5;

function localParts(tz: string, d = new Date()): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute),
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function inWindow(target: number, now: number): boolean {
  // Handles the midnight wrap: a 23:58 target is still due at 00:01.
  const diff = (now - target + 24 * 60) % (24 * 60);
  return diff >= 0 && diff < WINDOW_MIN;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function formatTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${String(m).padStart(2, '0')}${ampm}`;
}

function morningBody(sub: StoredSubscription, localDate: string): string {
  if (sub.lastPresentDay) {
    const away = daysBetween(sub.lastPresentDay, localDate);
    if (away === 2) return 'yesterday was yesterday. today just needs one thing.';
    if (away >= 3) return "still here. so are we. one tap when you're ready.";
  }
  return `${formatTimeDisplay(sub.wakeTime)}. same as yesterday. same as tomorrow.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.PUSH_TICK_SECRET;
  const auth = req.headers.authorization;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const redis = getRedis();
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!redis || !vapidPublic || !vapidPrivate) {
    return res.status(503).json({ error: 'push not configured' });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:phammynhi@gmail.com',
    vapidPublic,
    vapidPrivate,
  );

  const hashes = await redis.smembers(SUB_INDEX_KEY);
  let sent = 0;
  let removed = 0;

  for (const hash of hashes) {
    const raw = await redis.get(subKey(hash));
    if (!raw) {
      await redis.srem(SUB_INDEX_KEY, hash);
      continue;
    }
    const sub = (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredSubscription;

    let local: { date: string; minutes: number };
    try {
      local = localParts(sub.timezone);
    } catch {
      continue;
    }

    const due: { type: string; title: string; body: string }[] = [];
    if (inWindow(toMinutes(sub.times.morning), local.minutes)) {
      due.push({ type: 'morning', title: 'Pulsare', body: morningBody(sub, local.date) });
    }
    if (inWindow(toMinutes(sub.times.movement), local.minutes)) {
      due.push({ type: 'movement', title: 'Pulsare', body: 'have you moved yet?' });
    }
    if (inWindow(toMinutes(sub.times.windDown), local.minutes)) {
      due.push({ type: 'windDown', title: 'Pulsare', body: `${sub.eveningHabitLabel} time` });
    }

    for (const n of due) {
      const dedupeKey = `push:sent:${hash}:${n.type}:${local.date}`;
      const first = await redis.set(dedupeKey, '1', { nx: true, ex: 60 * 60 * 20 });
      if (first === null) continue; // already sent today

      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({ title: n.title, body: n.body }),
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired or revoked — clean it up.
          await redis.del(subKey(hash));
          await redis.srem(SUB_INDEX_KEY, hash);
          removed++;
        }
      }
    }
  }

  return res.status(200).json({ ok: true, subscribers: hashes.length, sent, removed });
}
