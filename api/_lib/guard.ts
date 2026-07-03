import type { VercelRequest } from '@vercel/node';

const ALLOWED_HOSTS = new Set([
  'pulsare-peach.vercel.app',
  'localhost:8081',
  'localhost:3000',
]);

/**
 * Browser requests from our own PWA carry an Origin header on POST.
 * This blocks casual cross-site abuse of the endpoints; it is not a
 * substitute for auth, which this app deliberately doesn't have.
 */
export function isAllowedOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // native app / server-to-server (no Origin header)
  try {
    return ALLOWED_HOSTS.has(new URL(origin).host);
  } catch {
    return false;
  }
}
