/**
 * Corroborated-fact cache. Ported from ask-sage's `fact_engine/cache.py`
 * (the in-process backend; the Convex-backed shared cache that builds the
 * proprietary dataset is a later increment, behind the same interface).
 *
 * Keys are `metric + normalized params` so a market-size fact is shared across
 * users — the basis of the dataset moat. EMPTY results are never cached, so a
 * thin moment isn't pinned for the whole TTL (the engine enforces that, not the
 * cache).
 */

import type { CorroboratedFact } from './records';

/** Stable cache key from a metric and its params (order-independent). */
export function makeKey(metric: string, params?: Record<string, unknown>): string {
  const norm: Record<string, unknown> = {};
  const entries = Object.entries(params ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [k, v] of entries) {
    if (v === null || v === undefined || v === '') continue;
    norm[k] = typeof v === 'string' ? v.trim().toLowerCase() : v;
  }
  // Keys inserted in sorted order, so JSON.stringify is deterministic.
  const suffix = Object.keys(norm).length > 0 ? JSON.stringify(norm) : '';
  return `${metric.trim().toLowerCase()}|${suffix}`;
}

export interface FactCache {
  get(key: string): CorroboratedFact | null;
  put(key: string, fact: CorroboratedFact, ttlSeconds: number): void;
}

/** Process-lifetime cache. Stores (expiresAt, fact). Clock is injectable for tests. */
export class MemoryFactCache implements FactCache {
  private store = new Map<string, { expiresAt: number; fact: CorroboratedFact }>();

  /** Clock returns seconds since epoch. */
  constructor(private clock: () => number = () => Date.now() / 1000) {}

  get(key: string): CorroboratedFact | null {
    const item = this.store.get(key);
    if (item === undefined) return null;
    if (item.expiresAt <= this.clock()) {
      this.store.delete(key);
      return null;
    }
    return item.fact;
  }

  put(key: string, fact: CorroboratedFact, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;
    this.store.set(key, { expiresAt: this.clock() + ttlSeconds, fact });
  }
}

let _default: FactCache | null = null;

/** Process-wide shared cache so a corroborated metric (e.g. a TAM) is reused
 * across ideas/users — the basis of the dataset moat. */
export function defaultCache(): FactCache {
  if (_default === null) _default = new MemoryFactCache();
  return _default;
}
