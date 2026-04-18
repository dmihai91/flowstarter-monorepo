import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlidingWindowRateLimiter } from '../rate-limit';

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  afterEach(() => {
    limiter?.destroy();
  });

  describe('basic limiting', () => {
    beforeEach(() => {
      limiter = new SlidingWindowRateLimiter({
        limit: 3,
        windowMs: 10_000,
        cleanupIntervalMs: 60_000, // long interval so it doesn't fire during tests
      });
    });

    it('allows requests under the limit', () => {
      const r1 = limiter.check('ip-1');
      expect(r1.limited).toBe(false);
      expect(r1.remaining).toBe(2);

      const r2 = limiter.check('ip-1');
      expect(r2.limited).toBe(false);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check('ip-1');
      expect(r3.limited).toBe(false);
      expect(r3.remaining).toBe(0);
    });

    it('blocks when the limit is exceeded', () => {
      limiter.check('ip-1');
      limiter.check('ip-1');
      limiter.check('ip-1');

      const r4 = limiter.check('ip-1');
      expect(r4.limited).toBe(true);
      expect(r4.remaining).toBe(0);
    });

    it('returns a resetAt timestamp in the future', () => {
      const now = Date.now();
      const result = limiter.check('ip-1');
      expect(result.resetAt).toBeGreaterThanOrEqual(now);
    });
  });

  describe('sliding window expiry', () => {
    it('frees capacity after timestamps expire', () => {
      vi.useFakeTimers();
      try {
        limiter = new SlidingWindowRateLimiter({
          limit: 2,
          windowMs: 5_000,
          cleanupIntervalMs: 60_000,
        });

        limiter.check('key');
        limiter.check('key');
        expect(limiter.check('key').limited).toBe(true);

        // Advance past the window
        vi.advanceTimersByTime(5_001);

        const result = limiter.check('key');
        expect(result.limited).toBe(false);
        expect(result.remaining).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('cleanup', () => {
    it('removes stale entries with no timestamps in window', () => {
      vi.useFakeTimers();
      try {
        limiter = new SlidingWindowRateLimiter({
          limit: 5,
          windowMs: 1_000,
          cleanupIntervalMs: 60_000,
        });

        limiter.check('a');
        limiter.check('b');
        expect(limiter.size).toBe(2);

        // Advance past window so all timestamps are stale
        vi.advanceTimersByTime(1_001);
        limiter.cleanup();

        expect(limiter.size).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('retains entries that still have valid timestamps', () => {
      vi.useFakeTimers();
      try {
        limiter = new SlidingWindowRateLimiter({
          limit: 5,
          windowMs: 5_000,
          cleanupIntervalMs: 60_000,
        });

        limiter.check('old');
        vi.advanceTimersByTime(3_000);
        limiter.check('fresh');
        vi.advanceTimersByTime(2_001);

        limiter.cleanup();

        // 'old' timestamps are > 5s ago, 'fresh' timestamps are ~2s ago
        expect(limiter.size).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('destroy', () => {
    it('clears entries and stops the timer', () => {
      limiter = new SlidingWindowRateLimiter({
        limit: 5,
        windowMs: 1_000,
        cleanupIntervalMs: 60_000,
      });

      limiter.check('x');
      expect(limiter.size).toBe(1);

      limiter.destroy();
      expect(limiter.size).toBe(0);
    });

    it('can be called multiple times safely', () => {
      limiter = new SlidingWindowRateLimiter({
        limit: 5,
        windowMs: 1_000,
        cleanupIntervalMs: 60_000,
      });

      limiter.destroy();
      limiter.destroy(); // no error
      expect(limiter.size).toBe(0);
    });
  });

  describe('size', () => {
    it('tracks the number of distinct keys', () => {
      limiter = new SlidingWindowRateLimiter({
        limit: 10,
        windowMs: 60_000,
        cleanupIntervalMs: 120_000,
      });

      limiter.check('a');
      limiter.check('b');
      limiter.check('c');
      limiter.check('a'); // duplicate key
      expect(limiter.size).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles rapid sequential requests on the same key', () => {
      limiter = new SlidingWindowRateLimiter({
        limit: 5,
        windowMs: 60_000,
        cleanupIntervalMs: 120_000,
      });

      const results = Array.from({ length: 10 }, () => limiter.check('burst'));
      const allowed = results.filter((r) => !r.limited);
      const blocked = results.filter((r) => r.limited);

      expect(allowed).toHaveLength(5);
      expect(blocked).toHaveLength(5);
    });

    it('tracks multiple keys independently', () => {
      limiter = new SlidingWindowRateLimiter({
        limit: 1,
        windowMs: 60_000,
        cleanupIntervalMs: 120_000,
      });

      expect(limiter.check('key-a').limited).toBe(false);
      expect(limiter.check('key-b').limited).toBe(false);

      // Both keys are now at limit
      expect(limiter.check('key-a').limited).toBe(true);
      expect(limiter.check('key-b').limited).toBe(true);
    });
  });
});
