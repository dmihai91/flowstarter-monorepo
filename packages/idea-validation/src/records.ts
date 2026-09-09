/**
 * Typed records and the corroborated-fact result shape — ported verbatim in
 * spirit from ask-sage's `fact_engine/records.py`.
 *
 * A {@link TypedRecord} is one observation of one metric from one source.
 * A {@link CorroboratedFact} is the engine's verdict over many records: a median,
 * a min-max spread, an independent-source count, a confidence label, and a
 * status the verdict schema reacts to. `value` is `null` when sources are too
 * thin to commit to a number — the engine must NEVER fabricate one. That null is
 * the anti-hallucination guarantee the whole "is this a good idea" verdict rests
 * on, so it is preserved exactly.
 */

/** How much to trust the corroborated value. */
export type FactStatus =
  | 'corroborated' // >= minSources independent, spread within tolerance
  | 'range_only' // >= minSources independent, but they diverge: report a range
  | 'low_confidence' // exactly 2 independent sources
  | 'insufficient' // exactly 1 usable source
  | 'empty'; // nothing usable — leave the value blank

/** Where a number ultimately comes from. Primary sources outrank aggregators. */
export type SourceTier = 'primary' | 'aggregator' | 'unknown';

/**
 * What statistic a record reports. Guards average-vs-median conflation: an
 * AVERAGE reported by a source is not interchangeable with a concrete VALUE or
 * MEDIAN, so it never enters the median pool.
 */
export type Stat = 'value' | 'median' | 'average' | 'range';

export type Confidence = 'high' | 'medium' | 'low';

/** Central, comparable points for a median-of-sources. AVERAGE is excluded. */
export const CENTRAL_STATS: ReadonlySet<Stat> = new Set<Stat>(['value', 'median']);

/** One (metric, value, unit, date, source) observation. */
export interface TypedRecord {
  metric: string;
  value: number;
  unit: string;
  date?: string | null;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceTier?: SourceTier;
  stat?: Stat;
  /**
   * The true origin of this number. Two records with the same originKey are
   * copies of one source and count once. Defaults to the registered domain.
   */
  originKey?: string;
}

/** Lowercased origin used to collapse copies of one source. */
export function recordOrigin(r: TypedRecord): string {
  return (r.originKey || r.sourceDomain || r.sourceUrl || '').toLowerCase();
}

/** The engine's verdict for one metric+params key. */
export interface CorroboratedFact {
  metric: string;
  status: FactStatus;
  unit: string;
  /** Median of independent values; `null` when EMPTY — never a guessed number. */
  value: number | null;
  minimum: number | null;
  maximum: number | null;
  /** Independent sources after dedupe-by-origin. */
  nSources: number;
  confidence: Confidence;
  /** (max - min) / median, when computable. */
  spreadPct: number | null;
  asOf: string | null;
  params: Record<string, unknown>;
  /** The deduped records actually used in the median. */
  records: TypedRecord[];
  note: string;
}

/** Per-metric corroboration thresholds. */
export interface MetricSpec {
  metric: string;
  /** Independent sources needed before a value can be `corroborated`. */
  minSources: number;
  /** Max (max-min)/median to count as corroborated rather than a range. */
  tolerance: number;
  ttlSeconds: number;
}

const WEEK = 60 * 60 * 24 * 7;
const MONTH = 60 * 60 * 24 * 30;

const DEFAULT_SPEC: Omit<MetricSpec, 'metric'> = {
  minSources: 3,
  tolerance: 0.25,
  ttlSeconds: WEEK,
};

/**
 * Business-idea metric specs (tunable). Market figures legitimately diverge
 * across sources, so their tolerance is looser than a price would be. Unknown
 * metrics fall back to {@link DEFAULT_SPEC}.
 */
const SPECS: Record<string, Omit<MetricSpec, 'metric'>> = {
  market_size_usd: { minSources: 3, tolerance: 0.5, ttlSeconds: MONTH },
  market_growth_pct: { minSources: 3, tolerance: 0.4, ttlSeconds: MONTH },
  competitor_funding_usd: { minSources: 2, tolerance: 0.5, ttlSeconds: MONTH },
  competitor_pricing_usd: { minSources: 2, tolerance: 0.35, ttlSeconds: WEEK },
};

export function metricSpec(metric: string): MetricSpec {
  const base = SPECS[metric.trim().toLowerCase()] ?? DEFAULT_SPEC;
  return { metric, ...base };
}

export function hasValue(fact: CorroboratedFact): boolean {
  return fact.value !== null && fact.status !== 'empty';
}

/** A compact human range like "1,000-1,400 USD" or "" when empty. */
export function rangeText(fact: CorroboratedFact): string {
  if (fact.minimum === null || fact.maximum === null) return '';
  const lo = fmt(fact.minimum);
  const hi = fmt(fact.maximum);
  const body = lo === hi ? lo : `${lo}-${hi}`;
  return `${body} ${fact.unit}`.trim();
}

/**
 * The compact, model-facing shape. The verdict synthesizer must write figures
 * from this, not invent them.
 */
export function factToModelDict(fact: CorroboratedFact): Record<string, unknown> {
  return {
    metric: fact.metric,
    status: fact.status,
    value: fact.value,
    unit: fact.unit,
    range: [fact.minimum, fact.maximum],
    median: fact.value,
    n_sources: fact.nSources,
    confidence: fact.confidence,
    spread_pct: fact.spreadPct,
    as_of: fact.asOf,
    sources: fact.records.map((r) => ({
      domain: r.sourceDomain ?? '',
      tier: r.sourceTier ?? 'unknown',
      value: r.value,
      url: r.sourceUrl ?? '',
    })),
    note: fact.note,
  };
}

function fmt(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
