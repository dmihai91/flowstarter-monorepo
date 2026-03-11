/**
 * Centralized LLM cost tracker.
 * Persists every LLM call to Convex immediately (source of truth).
 * Convex aggregates per project. Dashboard reads from Supabase (synced).
 *
 * Usage:
 *   trackLLMUsage(supabaseProjectId, model, operation, { promptTokens, completionTokens })
 *   await syncCostsToSupabase(supabaseProjectId)
 */
import { calculateCost } from '~/lib/utils/model-pricing';

type Operation =
  | 'site_generation' | 'site_modification' | 'self_healing'
  | 'asset_generation' | 'chat' | 'router' | 'planning' | 'other';

interface UsageInput {
  promptTokens: number;
  completionTokens: number;
  durationMs?: number;
}

function getConvexSiteUrl(): string {
  return process.env.CONVEX_SITE_URL || (process.env.VITE_CONVEX_URL || '').replace('.convex.cloud', '.convex.site');
}

function getSecret(): string {
  return process.env.HANDOFF_SECRET || process.env.VITE_HANDOFF_SECRET || '';
}

/**
 * Track a single LLM call by persisting to Convex immediately.
 * Fire-and-forget — does not block the caller on failure.
 */
export function trackLLMUsage(
  supabaseProjectId: string | undefined,
  model: string,
  operation: Operation,
  usage: UsageInput,
): void {
  const costUSD = calculateCost(model, usage.promptTokens, usage.completionTokens);

  console.log(
    `[CostTracker] ${model} (${operation}): ${usage.promptTokens}+${usage.completionTokens} tok = $${costUSD.toFixed(4)}${supabaseProjectId ? ` [${supabaseProjectId.slice(0, 8)}]` : ''}`,
  );

  if (!supabaseProjectId) return;
  const convexSiteUrl = getConvexSiteUrl();
  const secret = getSecret();
  if (!convexSiteUrl || !secret) return;

  fetch(`${convexSiteUrl}/costs/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-handoff-secret': secret },
    body: JSON.stringify({
      supabaseProjectId, operation, model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      costUSD, durationMs: usage.durationMs,
    }),
  }).catch((err) => console.error('[CostTracker] Convex persist failed:', err.message));
}

/**
 * Pull cost totals from Convex and sync to Supabase.
 * Call after build completes or on demand.
 */
export async function syncCostsToSupabase(supabaseProjectId: string): Promise<void> {
  const convexSiteUrl = getConvexSiteUrl();
  const secret = getSecret();
  if (!convexSiteUrl || !secret) return;

  try {
    const res = await fetch(
      `${convexSiteUrl}/costs/totals?supabaseProjectId=${encodeURIComponent(supabaseProjectId)}`,
      { headers: { 'x-handoff-secret': secret } },
    );
    if (!res.ok) return;
    const { totalCostUSD, totalCredits } = (await res.json()) as { totalCostUSD: number; totalCredits: number };

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${supabaseProjectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ generation_cost_usd: totalCostUSD, ai_credits_used: totalCredits }),
    });
    console.log(`[CostTracker] Synced to Supabase: $${totalCostUSD.toFixed(4)} (${totalCredits} credits)`);
  } catch (err) {
    console.error('[CostTracker] Supabase sync failed:', err);
  }
}
