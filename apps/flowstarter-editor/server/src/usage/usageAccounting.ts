/**
 * Usage accounting for editor enforcement (master doc §5).
 *
 * The editor enforces two AI-cost guards from {@link PLAN_ENTITLEMENTS}:
 *   - a monthly AI budget (`monthlyHardCeilingEur`) + session-count allowance
 *     (`sessionsPerMonth`) — checked BEFORE a turn runs (pre-turn gate), and
 *   - a per-edit depth cap (`eurCostCapPerSession`) — best-effort mid-turn
 *     interrupt (handled by the adapter, not here).
 *
 * This module owns the persisted side of that:
 *   - resolve the workspace's monthly counters,
 *   - lazily reset them when the usage period rolls into a new UTC month
 *     (no cron — reset happens on first use of the new month),
 *   - increment the session counter when a turn is admitted,
 *   - accumulate provider $ cost when a turn completes.
 *
 * Counters live on `workspaces` (migration 20260531000000):
 *   subscription_sessions_used_this_month, subscription_rollover_remaining,
 *   subscription_ai_cost_usd_this_month, subscription_usage_period_start.
 *
 * Cost is stored in the provider's native USD (`result.total_cost_usd`) and
 * converted to EUR here against the plan's € ceiling, so no FX rate is baked
 * into stored data. The rate is `FLOWSTARTER_USD_EUR` (default 0.92).
 *
 * Style mirrors usageHttp.ts: plain async + supabase-js, called from Effect
 * code via Effect.promise/tryPromise.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  type PlanKey,
  type PlanEntitlement,
  entitlementForPlan,
  normalisePlanKey,
} from "./planEntitlements.ts";

/** USD→EUR conversion for comparing stored USD cost against € ceilings. */
export const USD_EUR_RATE = (() => {
  const raw = Number.parseFloat(process.env.FLOWSTARTER_USD_EUR ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : 0.92;
})();

export function usdToEur(usd: number, rate: number = USD_EUR_RATE): number {
  return usd * rate;
}

/**
 * The persisted monthly counters for one workspace, plus its plan.
 * `aiCostUsdThisMonth` is provider-native USD; convert with {@link usdToEur}.
 */
export interface WorkspaceUsageRow {
  readonly workspaceId: string;
  readonly tier: PlanKey;
  readonly sessionsUsedThisMonth: number;
  readonly rolloverRemaining: number;
  readonly aiCostUsdThisMonth: number;
  /** ISO date (YYYY-MM-DD) marking the start of the current usage period. */
  readonly usagePeriodStart: string;
}

/**
 * Whether `periodStart` falls in an earlier UTC month than `now` — i.e. the
 * monthly counters should be reset before they're read/incremented.
 * Pure + exported for tests.
 */
export function isNewUtcMonth(periodStart: string, now: Date): boolean {
  // periodStart is a YYYY-MM-DD date (UTC month start). Compare year+month.
  const parsed = new Date(`${periodStart.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    // Unparseable marker → treat as stale so we reset to a known-good state.
    return true;
  }
  const periodKey = parsed.getUTCFullYear() * 12 + parsed.getUTCMonth();
  const nowKey = now.getUTCFullYear() * 12 + now.getUTCMonth();
  return nowKey > periodKey;
}

/** First day of `now`'s UTC month as a YYYY-MM-DD string. */
export function utcMonthStart(now: Date): string {
  const y = now.getUTCFullYear();
  const m = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}-01`;
}

export type GateReason = "sessions" | "budget";

export interface GateDecision {
  readonly tier: PlanKey;
  /** True when a new turn must be refused. */
  readonly blocked: boolean;
  /** Why it's blocked (only set when `blocked`). */
  readonly reason: GateReason | null;
  /** True at/over the soft threshold (nudge, non-blocking). */
  readonly softReached: boolean;
  readonly isMax: boolean;
  readonly sessionsUsed: number;
  readonly sessionLimit: number | null;
  readonly aiCostEur: number;
  readonly monthlyBudgetEur: number | null;
  /** Per-edit depth cap (€) for the mid-turn interrupt. `null` = uncapped. */
  readonly perEditCapEur: number | null;
}

/**
 * Evaluate the pre-turn gate from a usage row. Pure + exported for tests.
 * `null` session limit / budget (admin) never blocks.
 */
export function evaluateGate(
  row: Pick<
    WorkspaceUsageRow,
    "tier" | "sessionsUsedThisMonth" | "rolloverRemaining" | "aiCostUsdThisMonth"
  >,
  usdEur: number = USD_EUR_RATE,
): GateDecision {
  const entitlement: PlanEntitlement = entitlementForPlan(row.tier);
  const sessionLimit =
    entitlement.sessionsPerMonth === null
      ? null
      : entitlement.sessionsPerMonth + row.rolloverRemaining;
  const sessionsExhausted =
    sessionLimit !== null && row.sessionsUsedThisMonth >= sessionLimit;

  const aiCostEur = usdToEur(row.aiCostUsdThisMonth, usdEur);
  const monthlyBudgetEur = entitlement.monthlyHardCeilingEur;
  const overBudget = monthlyBudgetEur !== null && aiCostEur >= monthlyBudgetEur;
  const softReached =
    entitlement.monthlySoftThresholdEur !== null &&
    aiCostEur >= entitlement.monthlySoftThresholdEur;

  // Budget takes priority in the reason (it's the margin guard); either blocks.
  const reason: GateReason | null = overBudget
    ? "budget"
    : sessionsExhausted
      ? "sessions"
      : null;

  return {
    tier: row.tier,
    blocked: overBudget || sessionsExhausted,
    reason,
    softReached,
    isMax: row.tier === "max",
    sessionsUsed: row.sessionsUsedThisMonth,
    sessionLimit,
    aiCostEur,
    monthlyBudgetEur,
    perEditCapEur: entitlement.eurCostCapPerSession,
  };
}

// ─── Persistence (thin supabase-js I/O) ──────────────────────────────────────

let cachedSupabase: SupabaseClient | null = null;

/** Service-role client (bypasses RLS). Throws if env is missing. */
export function getUsageSupabase(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase URL + service role key required for usage accounting",
    );
  }
  cachedSupabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedSupabase;
}

const USAGE_COLUMNS =
  "id, tier_name, subscription_sessions_used_this_month, subscription_rollover_remaining, subscription_ai_cost_usd_this_month, subscription_usage_period_start";

function rowFromRecord(record: {
  id: string;
  tier_name: string | null;
  subscription_sessions_used_this_month: number | null;
  subscription_rollover_remaining: number | null;
  subscription_ai_cost_usd_this_month: number | string | null;
  subscription_usage_period_start: string | null;
}): WorkspaceUsageRow {
  return {
    workspaceId: record.id,
    tier: normalisePlanKey(record.tier_name),
    sessionsUsedThisMonth:
      typeof record.subscription_sessions_used_this_month === "number"
        ? record.subscription_sessions_used_this_month
        : 0,
    rolloverRemaining:
      typeof record.subscription_rollover_remaining === "number"
        ? record.subscription_rollover_remaining
        : 0,
    // NUMERIC comes back as string from PostgREST; coerce defensively.
    aiCostUsdThisMonth:
      typeof record.subscription_ai_cost_usd_this_month === "number"
        ? record.subscription_ai_cost_usd_this_month
        : Number.parseFloat(
            (record.subscription_ai_cost_usd_this_month as string | null) ?? "0",
          ) || 0,
    usagePeriodStart:
      record.subscription_usage_period_start ?? utcMonthStart(new Date()),
  };
}

/**
 * Load the workspace usage row by slug, resetting the monthly counters first
 * if the usage period has rolled into a new UTC month. Returns null if the
 * workspace can't be found.
 */
export async function loadUsageRowBySlug(
  slug: string,
  now: Date = new Date(),
): Promise<WorkspaceUsageRow | null> {
  const supabase = getUsageSupabase();
  const { data, error } = await supabase
    .from("workspaces")
    .select(USAGE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(`Usage row fetch failed for "${slug}": ${error.message}`);
  }
  if (!data) return null;

  const row = rowFromRecord(data);
  if (isNewUtcMonth(row.usagePeriodStart, now)) {
    return await resetPeriod(row.workspaceId, now);
  }
  return row;
}

/** Reset the monthly counters and advance the period marker to this month. */
export async function resetPeriod(
  workspaceId: string,
  now: Date = new Date(),
): Promise<WorkspaceUsageRow> {
  const supabase = getUsageSupabase();
  const periodStart = utcMonthStart(now);
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      subscription_sessions_used_this_month: 0,
      subscription_ai_cost_usd_this_month: 0,
      subscription_usage_period_start: periodStart,
    })
    .eq("id", workspaceId)
    .select(USAGE_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `Usage period reset failed for ${workspaceId}: ${error?.message ?? "no row returned"}`,
    );
  }
  return rowFromRecord(data);
}

/**
 * Increment the session counter by one (admitting a turn). Atomic via a SQL
 * expression so concurrent turns don't clobber each other.
 */
export async function incrementSessionUsed(workspaceId: string): Promise<void> {
  const supabase = getUsageSupabase();
  const { error } = await supabase.rpc("increment_workspace_sessions_used", {
    p_workspace_id: workspaceId,
  });
  if (error) {
    throw new Error(
      `Session-count increment failed for ${workspaceId}: ${error.message}`,
    );
  }
}

/** Add provider USD cost to the monthly accumulator (turn completion). */
export async function addAiCostUsd(
  workspaceId: string,
  usd: number,
): Promise<void> {
  if (!(usd > 0)) return;
  const supabase = getUsageSupabase();
  const { error } = await supabase.rpc("add_workspace_ai_cost_usd", {
    p_workspace_id: workspaceId,
    p_usd: usd,
  });
  if (error) {
    throw new Error(
      `AI-cost accumulation failed for ${workspaceId}: ${error.message}`,
    );
  }
}

/**
 * Best-effort cost accumulation by workspace slug, for the turn-completion
 * hot path. NEVER throws — accounting must not break editing. Returns true
 * if the cost was recorded, false if it was skipped/failed (logged by caller).
 */
export async function addAiCostUsdBySlug(
  slug: string,
  usd: number,
): Promise<boolean> {
  if (!(usd > 0)) return false;
  try {
    const supabase = getUsageSupabase();
    const { data, error } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data?.id) return false;
    await addAiCostUsd(data.id, usd);
    return true;
  } catch {
    return false;
  }
}

/**
 * The pre-turn gate decision for a workspace slug, with the monthly counters
 * lazily reset on period rollover. NEVER throws — on any failure it returns a
 * fail-open `null` so the caller admits the turn (enforcement must not break
 * editing when Supabase is unreachable).
 */
export async function gateForSlug(
  slug: string,
  now: Date = new Date(),
): Promise<GateDecision | null> {
  try {
    const row = await loadUsageRowBySlug(slug, now);
    if (!row) return null;
    return evaluateGate(row);
  } catch {
    return null;
  }
}
