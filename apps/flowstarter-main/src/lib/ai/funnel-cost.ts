import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Cost guard + kill-switch for the public discovery funnel's LLM spend.
 *
 * Every funnel model call records its cost to `demo_generation_costs`.
 * Before an expensive call the route asks {@link funnelBudgetState}:
 *   - `ok`       — proceed normally
 *   - `degrade`  — over the soft threshold; caller should use a cheaper model
 *   - `blocked`  — over the monthly cap; caller fails open to the
 *                  deterministic template demo (the funnel never dead-ends)
 *
 * FAIL-SAFE: any failure here (no env, missing table, query error) returns
 * `ok`. We never block the funnel because our own accounting is unavailable.
 */

export type FunnelBudgetState = 'ok' | 'degrade' | 'blocked';

export interface FunnelUsage {
  inputTokens?: number;
  outputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export type GenerationKind = 'preview' | 'edit' | 'recommend' | 'codegen';

/** Monthly € cap. Safe-low default; raise via env once economics are known. */
function capEur(): number {
  const raw = Number(process.env.DISCOVERY_FUNNEL_BUDGET_EUR);
  return Number.isFinite(raw) && raw > 0 ? raw : 50;
}

const SOFT_FRACTION = 0.7;

/** €/1M tokens [in, out]. Conservative; unknown models use a safe-high default. */
const RATE_PER_MTOK: Array<[match: string, inEur: number, outEur: number]> = [
  ['claude-sonnet-4', 3, 15],
  ['claude-3.7-sonnet', 3, 15],
  ['claude-haiku', 0.8, 4],
  ['llama-3.1-70b', 0.3, 0.4],
  ['gpt-4o', 2.5, 10],
];
const DEFAULT_RATE: [number, number] = [5, 15];

function rateFor(model: string | undefined): [number, number] {
  if (model) {
    for (const [m, i, o] of RATE_PER_MTOK) {
      if (model.includes(m)) return [i, o];
    }
  }
  return DEFAULT_RATE;
}

export function normalizeUsage(u: FunnelUsage | undefined): {
  tokensIn: number;
  tokensOut: number;
} {
  return {
    tokensIn: u?.inputTokens ?? u?.promptTokens ?? 0,
    tokensOut: u?.outputTokens ?? u?.completionTokens ?? 0,
  };
}

export function estimateCostEur(
  model: string | undefined,
  usage: FunnelUsage | undefined
): number {
  const { tokensIn, tokensOut } = normalizeUsage(usage);
  const [inRate, outRate] = rateFor(model);
  return (tokensIn / 1_000_000) * inRate + (tokensOut / 1_000_000) * outRate;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Best-effort cost write. Never throws. */
export async function recordGenerationCost(input: {
  kind: GenerationKind;
  model?: string;
  usage?: FunnelUsage;
  demoId?: string | null;
  ip?: string | null;
  leadEmail?: string | null;
}): Promise<void> {
  try {
    const sb = serviceClient();
    if (!sb) return;
    const { tokensIn, tokensOut } = normalizeUsage(input.usage);
    await sb.from('demo_generation_costs').insert({
      demo_id: input.demoId ?? null,
      kind: input.kind,
      model: input.model ?? null,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_eur: estimateCostEur(input.model, input.usage),
      ip: input.ip ?? null,
      lead_email: input.leadEmail ?? null,
    });
  } catch {
    /* accounting is best-effort */
  }
}

/** Month-to-date funnel state. Fail-safe → 'ok'. */
export async function funnelBudgetState(): Promise<{
  state: FunnelBudgetState;
  spentEur: number;
  capEur: number;
}> {
  const cap = capEur();
  try {
    const sb = serviceClient();
    if (!sb) return { state: 'ok', spentEur: 0, capEur: cap };
    const since = new Date();
    since.setUTCDate(1);
    since.setUTCHours(0, 0, 0, 0);
    const { data, error } = await sb
      .from('demo_generation_costs')
      .select('cost_eur')
      .gte('created_at', since.toISOString());
    if (error || !data) return { state: 'ok', spentEur: 0, capEur: cap };
    const spent = data.reduce(
      (s, r) => s + Number((r as { cost_eur: number }).cost_eur || 0),
      0
    );
    const state: FunnelBudgetState =
      spent >= cap
        ? 'blocked'
        : spent >= cap * SOFT_FRACTION
        ? 'degrade'
        : 'ok';
    return { state, spentEur: spent, capEur: cap };
  } catch {
    return { state: 'ok', spentEur: 0, capEur: cap };
  }
}
