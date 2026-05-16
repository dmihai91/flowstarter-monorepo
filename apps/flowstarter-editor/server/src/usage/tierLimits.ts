/**
 * Tier limits — monthly editor session caps.
 *
 * These DERIVE from the canonical {@link PLAN_ENTITLEMENTS} table
 * (`planEntitlements.ts`). Per-plan session allowances:
 *   - Starter   → 30 sessions / month
 *   - Pro       → 60 sessions / month
 *   - Max       → 120 sessions / month
 *   - Ecommerce → 90 sessions / month (Pro+)
 *   - Admin     → unlimited (null sentinel)
 *
 * "Session" = one agent run from prompt → final assistant message. The
 * editor server bumps `workspaces.subscription_sessions_used_this_month`
 * at the start of each run; rollover from the previous month is tracked
 * separately in `subscription_rollover_remaining`.
 *
 * UI components surface usage as `used / (limit + rollover)` and gate
 * features when `used >= total`. Admins are exempt — their plan is
 * 'admin' (unlimited).
 */

import {
  type PlanKey,
  PLAN_ENTITLEMENTS,
  entitlementForPlan,
} from "./planEntitlements.ts";

export const SESSION_LIMITS_PER_TIER: Readonly<
  Record<PlanKey, number | null>
> = {
  starter: PLAN_ENTITLEMENTS.starter.sessionsPerMonth,
  pro: PLAN_ENTITLEMENTS.pro.sessionsPerMonth,
  max: PLAN_ENTITLEMENTS.max.sessionsPerMonth,
  ecommerce: PLAN_ENTITLEMENTS.ecommerce.sessionsPerMonth,
  admin: PLAN_ENTITLEMENTS.admin.sessionsPerMonth,
} as const;

/** Returns null for unlimited (admin). */
export function sessionLimitFor(plan: PlanKey): number | null {
  return entitlementForPlan(plan).sessionsPerMonth;
}

/**
 * Compute remaining sessions for a workspace given its tier + this-month
 * usage + rollover. `null` total means unlimited.
 */
export function computeUsage(input: {
  readonly tier: PlanKey;
  readonly used: number;
  readonly rollover: number;
}): {
  readonly tier: PlanKey;
  readonly used: number;
  readonly limit: number | null;
  readonly rollover: number;
  readonly total: number | null;
  readonly remaining: number | null;
  readonly percentUsed: number | null;
  readonly exhausted: boolean;
} {
  const limit = sessionLimitFor(input.tier);
  const total = limit === null ? null : limit + input.rollover;
  const remaining = total === null ? null : Math.max(0, total - input.used);
  const percentUsed =
    total === null || total <= 0
      ? null
      : Math.min(100, Math.round((input.used / total) * 100));
  const exhausted = remaining !== null && remaining <= 0;
  return {
    tier: input.tier,
    used: input.used,
    limit,
    rollover: input.rollover,
    total,
    remaining,
    percentUsed,
    exhausted,
  };
}
