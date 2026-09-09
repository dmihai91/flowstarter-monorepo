/**
 * The orchestrated entry: cache -> search -> extract -> corroborate -> cache.
 * Ported from ask-sage's `fact_engine/engine.py`. `corroborateMetric` is the
 * single call the `corroborate_metric` tool makes.
 *
 * Serves a fresh corroborated fact from the shared cache when present; otherwise
 * searches (across a few query angles, deduped by URL), extracts typed records
 * with the cheap tier, runs the deterministic corroboration core, and caches the
 * result with the metric's TTL. EMPTY results are NOT cached, so a thin moment
 * isn't pinned for the whole TTL.
 */

import { type FactCache, defaultCache, makeKey } from './cache';
import { corroborate } from './corroborate';
import { type ExtractDeps, extractRecords } from './extract';
import { type CorroboratedFact, metricSpec } from './records';
import type { SearchClient, SearchOptions, SearchResult } from './search';

export interface CorroborateMetricDeps {
  search: SearchClient;
  /** llm (+ optional model) for the extraction tier. */
  extract: Omit<ExtractDeps, 'metricInstruction'>;
  cache?: FactCache;
  /** Explicit search queries; falls back to angles built from the metric+params. */
  queries?: string[];
  metricInstruction?: string;
  searchOptions?: SearchOptions;
  asOf?: string;
  forceRefresh?: boolean;
}

export async function corroborateMetric(
  metric: string,
  params: Record<string, unknown> = {},
  deps: CorroborateMetricDeps,
): Promise<CorroboratedFact> {
  const spec = metricSpec(metric);
  const cache = deps.cache ?? defaultCache();
  const key = makeKey(metric, params);

  if (!deps.forceRefresh) {
    const cached = cache.get(key);
    if (cached !== null) return { ...cached, note: `${cached.note} (cached)`.trim() };
  }

  const queries = deps.queries && deps.queries.length > 0 ? deps.queries : defaultQueries(metric, params);
  const seen = new Set<string>();
  const sources: SearchResult[] = [];
  for (const q of queries) {
    const resp = await deps.search.search(q, deps.searchOptions);
    if (!resp.ok) continue;
    for (const r of resp.results) {
      if (!r.url || seen.has(r.url)) continue;
      seen.add(r.url);
      sources.push(r);
    }
  }

  const records = await extractRecords(metric, sources, {
    ...deps.extract,
    metricInstruction: deps.metricInstruction,
  });

  const fact = corroborate(records, spec, { params, asOf: deps.asOf ?? null });

  if (fact.status !== 'empty') cache.put(key, fact, spec.ttlSeconds);
  return fact;
}

function defaultQueries(metric: string, params: Record<string, unknown>): string[] {
  const base = metric.replace(/_/g, ' ').replace(/\b(usd|eur|gbp)\b/gi, '').trim();
  const ctx = [params.industry, params.region, params.keyword]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ');
  const q = ctx ? `${base} ${ctx}` : base;
  return [q, `${q} statistics`, `${q} market report`];
}
