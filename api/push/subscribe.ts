import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { getRedis, subKey, SUB_INDEX_KEY } from '../_lib/redis';
import { isAllowedOrigin } from '../_lib/guard';

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface StoredSubscription {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  times: { morning: string; movement: string; windDown: string };
  timezone: string;
  wakeTime: string;
  eveningHabitLabel: string;
  lastPresentDay: string | null;
  updatedAt: string;
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const redis = getRedis();
  if (!redis) {
    return res.status(503).json({ error: 'push not configured' });
  }

  if (req.method === 'DELETE') {
    const endpoint = (req.body as { endpoint?: string })?.endpoint;
    if (typeof endpoint !== 'string' || !endpoint) {
      return res.status(400).json({ error: 'invalid input' });
    }
    const hash = createHash('sha256').update(endpoint).digest('hex');
    await redis.del(subKey(hash));
    await redis.srem(SUB_INDEX_KEY, hash);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const body = req.body as Partial<StoredSubscription>;
  const sub = body?.subscription;
  const times = body?.times;
  if (
    typeof sub?.endpoint !== 'string' ||
    !sub.endpoint.startsWith('https://') ||
    typeof sub.keys?.p256dh !== 'string' ||
    typeof sub.keys?.auth !== 'string' ||
    !times ||
    !TIME_RE.test(times.morning ?? '') ||
    !TIME_RE.test(times.movement ?? '') ||
    !TIME_RE.test(times.windDown ?? '') ||
    typeof body.timezone !== 'string' ||
    !isValidTimezone(body.timezone)
  ) {
    return res.status(400).json({ error: 'invalid input' });
  }

  const stored: StoredSubscription = {
    subscription: {
      endpoint: sub.endpoint.slice(0, 1000),
      keys: { p256dh: sub.keys.p256dh.slice(0, 300), auth: sub.keys.auth.slice(0, 100) },
    },
    times: { morning: times.morning, movement: times.movement, windDown: times.windDown },
    timezone: body.timezone,
    wakeTime: TIME_RE.test(body.wakeTime ?? '') ? (body.wakeTime as string) : times.morning,
    eveningHabitLabel: String(body.eveningHabitLabel ?? 'wind down').slice(0, 60).toLowerCase(),
    lastPresentDay: DATE_RE.test(body.lastPresentDay ?? '') ? (body.lastPresentDay as string) : null,
    updatedAt: new Date().toISOString(),
  };

  const hash = createHash('sha256').update(stored.subscription.endpoint).digest('hex');
  await redis.set(subKey(hash), JSON.stringify(stored));
  await redis.sadd(SUB_INDEX_KEY, hash);
  return res.status(200).json({ ok: true });
}
