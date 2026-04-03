/**
 * In-memory per-user/per-IP rate limiter for AI generation endpoints.
 * Use userId+route as key when available, fall back to IP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  limited: boolean;
  retryAfter: number;
}

/**
 * Check whether a key has exceeded its rate limit.
 * Returns { limited: true, retryAfter } if over-limit,
 * or { limited: false, retryAfter: 0 } if within limit.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

/**
 * Build a rate-limit key from request headers.
 * Prefers userId from X-User-Id header; falls back to IP.
 */
export function getRateLimitKey(request: Request, route: string): string {
  const userId = request.headers.get('x-user-id');

  if (userId) {
    return `user:${userId}:${route}`;
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

  return `ip:${ip}:${route}`;
}
