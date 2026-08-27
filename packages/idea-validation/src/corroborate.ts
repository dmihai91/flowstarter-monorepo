/**
 * The deterministic corroboration core — pure code, no LLM, no network.
 * Ported from ask-sage's `fact_engine/corroborate.py`.
 *
 * Given typed records for one metric it dedupes by origin, takes the median of
 * the independent values, carries the min-max spread, and decides a status +
 * confidence. It never picks a single diverging value and never invents one:
 * thin or divergent evidence yields a range, a low-confidence flag, or an empty
 * value. This is the mechanism that lets the verdict layer cap its tier by the
 * strength of the evidence instead of an LLM's say-so.
 */

import {
  CENTRAL_STATS,
  type Confidence,
  type CorroboratedFact,
  type FactStatus,
  type MetricSpec,
  type SourceTier,
  type Stat,
  type TypedRecord,
  metricSpec,
  recordOrigin,
} from './records';

const TIER_RANK: Record<SourceTier, number> = { primary: 2, unknown: 1, aggregator: 0 };

/**
 * Collapse records that share an origin so copies of one source count once.
 * When two records resolve to the same origin, keep the higher-tier one — a
 * primary beats an aggregator. Records with no origin can't be proven copies,
 * so each stands alone.
 */
export function dedupeByOrigin(records: readonly TypedRecord[]): TypedRecord[] {
  const best = new Map<string, TypedRecord>();
  const order: string[] = [];
  records.forEach((rec, idx) => {
    const key = recordOrigin(rec) || `__anon__${idx}`;
    const current = best.get(key);
    if (current === undefined) {
      best.set(key, rec);
      order.push(key);
    } else if (rank(rec) > rank(current)) {
      best.set(key, rec);
    }
  });
  return order.map((k) => best.get(k)).filter((r): r is TypedRecord => r !== undefined);
}

function rank(r: TypedRecord): number {
  return TIER_RANK[r.sourceTier ?? 'unknown'];
}

/** Simplified unit handling (full units module port pending): normalize and
 * compare equal, tolerating a missing unit on a record (can't prove a clash). */
export function normalizeUnit(unit: string | undefined): string {
  return (unit ?? '').trim().toLowerCase();
}

function unitsCompatible(unit: string | undefined, target: string): boolean {
  const u = normalizeUnit(unit);
  return u === '' || u === target;
}

export interface CorroborateOptions {
  params?: Record<string, unknown>;
  asOf?: string | null;
}

/** Reduce many records for one metric to a single corroborated verdict. */
export function corroborate(
  records: readonly TypedRecord[],
  spec?: MetricSpec,
  options: CorroborateOptions = {},
): CorroboratedFact {
  const recs = [...records];
  const first = recs[0];
  const metric = first ? first.metric : spec ? spec.metric : '';
  const resolvedSpec = spec ?? metricSpec(metric);
  const params = options.params ?? {};
  const asOf = options.asOf ?? null;

  const usable = recs.filter((r) => typeof r.value === 'number' && Number.isFinite(r.value));
  if (usable.length === 0) return empty(metric, params, asOf);

  // Compare only within one unit: pick the modal normalized unit, keep the
  // records compatible with it. Two values agree only if their units match.
  const unitCounts = new Map<string, number>();
  for (const r of usable) {
    const u = normalizeUnit(r.unit);
    if (u) unitCounts.set(u, (unitCounts.get(u) ?? 0) + 1);
  }
  let targetUnit = '';
  let bestCount = 0;
  for (const [u, c] of unitCounts) {
    if (c > bestCount) {
      bestCount = c;
      targetUnit = u;
    }
  }
  const inUnit = targetUnit ? usable.filter((r) => unitsCompatible(r.unit, targetUnit)) : usable;

  // Copies of one origin count once.
  const indep = dedupeByOrigin(inUnit);

  // average-vs-median guard: the median pool is concrete/central stats only; a
  // source's reported AVERAGE is a different statistic and stays out of it.
  const pool = indep.filter((r) => CENTRAL_STATS.has(r.stat ?? 'value'));
  const means = indep.filter((r) => (r.stat ?? 'value') === 'average');
  const onlyMeans = pool.length === 0 && means.length > 0;
  const central = pool.length > 0 ? pool : means;
  if (central.length === 0) return empty(metric, params, asOf);

  const values = central.map((r) => r.value).sort((a, b) => a - b);
  const med = median(values);
  const low = values[0] as number;
  const high = values[values.length - 1] as number;
  const spread = med ? (high - low) / med : 0;
  const unit = targetUnit || normalizeUnit((central[0] as TypedRecord).unit);
  const n = central.length;

  const strong = n >= resolvedSpec.minSources && !onlyMeans;
  let status: FactStatus;
  let confidence: Confidence;
  if (strong && spread <= resolvedSpec.tolerance) {
    status = 'corroborated';
    confidence = 'high';
  } else if (strong) {
    status = 'range_only';
    confidence = 'medium';
  } else if (n >= 2) {
    status = 'low_confidence';
    confidence = spread <= resolvedSpec.tolerance && !onlyMeans ? 'medium' : 'low';
  } else {
    status = 'insufficient';
    confidence = 'low';
  }

  return {
    metric,
    status,
    unit,
    value: med,
    minimum: low,
    maximum: high,
    nSources: n,
    confidence,
    spreadPct: round4(spread),
    asOf,
    params,
    records: central,
    note: note(status, onlyMeans),
  };
}

function median(sorted: readonly number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

function round4(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}

function empty(
  metric: string,
  params: Record<string, unknown>,
  asOf: string | null,
): CorroboratedFact {
  return {
    metric,
    status: 'empty',
    unit: '',
    value: null,
    minimum: null,
    maximum: null,
    nSources: 0,
    confidence: 'low',
    spreadPct: null,
    asOf,
    params,
    records: [],
    note: NOTES.empty,
  };
}

const NOTES: Record<FactStatus, string> = {
  corroborated: 'Median of independent sources; spread within tolerance.',
  range_only: 'Independent sources diverge beyond tolerance; treat as a range, not a point.',
  low_confidence: 'Only two independent sources; treat as provisional.',
  insufficient: 'Only one usable source; not corroborated.',
  empty: 'No usable independent sources; value left blank rather than guessed.',
};

function note(status: FactStatus, onlyMeans: boolean): string {
  let n = NOTES[status];
  if (onlyMeans && status !== 'empty') {
    n += ' Sources reported averages, not comparable point values.';
  }
  return n;
}
