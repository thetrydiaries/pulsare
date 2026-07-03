import { Redis } from '@upstash/redis';

// Marketplace installs may provision either naming scheme.
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export const SUB_INDEX_KEY = 'push:index';

export function subKey(hash: string): string {
  return `push:sub:${hash}`;
}
