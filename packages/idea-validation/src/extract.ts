/**
 * Extraction: turn search-result content into typed numeric records, using the
 * cheap "extract" tier (DeepSeek V4 Flash by default). Ported in spirit from
 * ask-sage's `fact_engine/extract.py`.
 *
 * This is the only LLM in the corroboration path, and it's the cheap one on
 * purpose: a mis-read from one source is just one `TypedRecord`, and the
 * deterministic core (dedupe → median → spread → min-sources) refuses to let a
 * single value move a corroborated verdict. Fail-open: a bad/empty LLM response
 * yields no records (→ EMPTY fact), never a fabricated number.
 */

import { ROLE_MODELS, type LlmClient } from './llm';
import { type Stat, type TypedRecord } from './records';
import type { SearchResult } from './search';

export interface ExtractDeps {
  llm: LlmClient;
  /** Defaults to ROLE_MODELS.extract (DeepSeek V4 Flash). */
  model?: string;
  /** Plain-language description of exactly what number to pull (unit + scope). */
  metricInstruction?: string;
  wallClockMs?: number;
  /** Max chars of each source fed to the extractor. */
  maxCharsPerSource?: number;
}

const SYSTEM = `You extract numeric observations of ONE metric from web sources for a corroboration engine.
Return ONLY a JSON array, no prose, no code fences. Each element:
  {"value": <number>, "unit": "<string>", "stat": "value"|"median"|"average"|"range", "source_index": <int>}
Rules:
- Include a row ONLY when the source states a concrete number for the requested metric.
- NEVER invent, estimate, or convert a figure that is not explicitly stated.
- Omit sources that do not clearly state the metric.
- "stat" reflects what the source reported: a plain figure is "value"; an explicitly stated average/mean is "average"; an explicitly stated median is "median"; a midpoint of a stated range is "range".
- "value" must be a plain number (no commas, currency symbols, or units inside it); put the unit in "unit".`;

const VALID_STATS: readonly string[] = ['value', 'median', 'average', 'range'];

export async function extractRecords(
  metric: string,
  sources: readonly SearchResult[],
  deps: ExtractDeps,
): Promise<TypedRecord[]> {
  if (sources.length === 0) return [];
  const model = deps.model ?? ROLE_MODELS.extract;
  const cap = deps.maxCharsPerSource ?? 4000;
  const numbered = sources
    .map((s, i) => `[${i}] ${s.title} (${s.domain})\n${(s.rawContent ?? s.content).slice(0, cap)}`)
    .join('\n\n');
  const prompt = `Metric to extract: ${deps.metricInstruction ?? metric}\n\nSources:\n${numbered}\n\nReturn the JSON array of observations.`;

  const res = await deps.llm.chat({
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    maxTokens: 1500,
    wallClockMs: deps.wallClockMs,
  });
  if (!res.ok) return [];

  const out: TypedRecord[] = [];
  for (const row of parseRows(res.content)) {
    if (typeof row.value !== 'number' || !Number.isFinite(row.value)) continue;
    const src = sources[row.sourceIndex];
    if (src === undefined) continue;
    out.push({
      metric,
      value: row.value,
      unit: typeof row.unit === 'string' ? row.unit : '',
      stat: normalizeStat(row.stat),
      sourceUrl: src.url,
      sourceDomain: src.domain,
      sourceTier: 'unknown',
      originKey: src.domain,
    });
  }
  return out;
}

interface ParsedRow {
  value: unknown;
  unit: unknown;
  stat: unknown;
  sourceIndex: number;
}

function parseRows(text: string): ParsedRow[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return { value: o.value, unit: o.unit, stat: o.stat, sourceIndex: Number(o.source_index) };
    });
  } catch {
    return [];
  }
}

function normalizeStat(s: unknown): Stat {
  return typeof s === 'string' && VALID_STATS.includes(s) ? (s as Stat) : 'value';
}
