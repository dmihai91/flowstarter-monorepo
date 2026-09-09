import { describe, expect, it } from 'vitest';

import { corroborate, dedupeByOrigin } from '../src/corroborate';
import type { MetricSpec, TypedRecord } from '../src/records';

// Explicit spec so thresholds are deterministic regardless of the metric registry.
const SPEC: MetricSpec = { metric: 'm', minSources: 3, tolerance: 0.25, ttlSeconds: 60 };

function rec(value: number, o: Partial<TypedRecord> = {}): TypedRecord {
  return {
    metric: 'm',
    value,
    unit: 'usd',
    sourceDomain: `${value}.example.com`,
    sourceTier: 'unknown',
    stat: 'value',
    ...o,
  };
}

describe('corroborate', () => {
  it('corroborates when >=minSources independent sources agree within tolerance', () => {
    const f = corroborate(
      [
        rec(100, { sourceDomain: 'a.com' }),
        rec(110, { sourceDomain: 'b.com' }),
        rec(105, { sourceDomain: 'c.com' }),
      ],
      SPEC,
    );
    expect(f.status).toBe('corroborated');
    expect(f.value).toBe(105);
    expect(f.nSources).toBe(3);
    expect(f.confidence).toBe('high');
  });

  it('returns a range when enough sources diverge beyond tolerance', () => {
    const f = corroborate(
      [
        rec(100, { sourceDomain: 'a.com' }),
        rec(200, { sourceDomain: 'b.com' }),
        rec(150, { sourceDomain: 'c.com' }),
      ],
      SPEC,
    );
    expect(f.status).toBe('range_only');
    expect(f.minimum).toBe(100);
    expect(f.maximum).toBe(200);
    expect(f.value).toBe(150);
  });

  it('is low_confidence with exactly two independent sources', () => {
    const f = corroborate([rec(100, { sourceDomain: 'a.com' }), rec(110, { sourceDomain: 'b.com' })], SPEC);
    expect(f.status).toBe('low_confidence');
    expect(f.confidence).toBe('medium');
  });

  it('is insufficient with one usable source', () => {
    const f = corroborate([rec(100, { sourceDomain: 'a.com' })], SPEC);
    expect(f.status).toBe('insufficient');
  });

  it('is empty with no usable values and never invents a number', () => {
    expect(corroborate([], SPEC).status).toBe('empty');
    const nan = corroborate([rec(Number.NaN, { sourceDomain: 'a.com' })], SPEC);
    expect(nan.status).toBe('empty');
    expect(nan.value).toBeNull();
  });

  it('collapses copies of one origin so they count once', () => {
    const f = corroborate(
      [
        rec(100, { sourceDomain: 'a.com' }),
        rec(120, { sourceDomain: 'a.com' }),
        rec(110, { sourceDomain: 'a.com' }),
      ],
      SPEC,
    );
    expect(f.nSources).toBe(1);
    expect(f.status).toBe('insufficient');
  });

  it('keeps the higher-tier record when origins collide', () => {
    const deduped = dedupeByOrigin([
      rec(100, { sourceDomain: 'a.com', sourceTier: 'aggregator' }),
      rec(999, { sourceDomain: 'a.com', sourceTier: 'primary' }),
    ]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]!.value).toBe(999);
  });

  it('guards averages out of the median pool', () => {
    const f = corroborate(
      [
        rec(100, { sourceDomain: 'a.com', stat: 'average' }),
        rec(110, { sourceDomain: 'b.com', stat: 'average' }),
        rec(105, { sourceDomain: 'c.com', stat: 'average' }),
      ],
      SPEC,
    );
    // only averages -> not "strong" even at n>=minSources
    expect(f.status).toBe('low_confidence');
    expect(f.confidence).toBe('low');
  });

  it('uses concrete values and excludes a stray average from the pool', () => {
    const f = corroborate(
      [
        rec(100, { sourceDomain: 'a.com' }),
        rec(110, { sourceDomain: 'b.com' }),
        rec(105, { sourceDomain: 'c.com' }),
        rec(9999, { sourceDomain: 'd.com', stat: 'average' }),
      ],
      SPEC,
    );
    expect(f.status).toBe('corroborated');
    expect(f.nSources).toBe(3);
    expect(f.maximum).toBe(110);
  });
});
