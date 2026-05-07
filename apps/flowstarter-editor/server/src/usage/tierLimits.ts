/**
 * Tier limits — single source of truth for monthly editor session caps.
 *
 * Per `docs/FLOWSTARTER_MASTER_DECISIONS.md` §5 (Editor sessions):
 *   - Essential → 15 sessions / month
 *   - Pro       → 50 sessions / month
 *   - Commerce  → 75 sessions / month
 *   - Custom    → unlimited (admin-managed; null sentinel)
 *
 * "Session" = one agent run from prompt → final assistant message. The
 * editor server bumps `workspaces.subscription_sessions_used_this_month`
 * at the start of each run; rollover from the previous month is tracked
 * separately in `subscription_rollover_remaining`.
 *
 * UI components surface usage as `used / (limit + rollover)` and gate
 * features when `used >= total`. Admins are exempt — their tier always
 * resolves to 'custom'.
 */

import type { EditorTier } from "../auth/clerkGate";

export const SESSION_LIMITS_PER_TIER: Readonly<
  Record<EditorTier, number | null>
> = {
  essential: 15,
  pro: 50,
  commerce: 75,
  custom: null,
} as const;

/** Returns null for unlimited (custom). */
export function sessionLimitFor(tier: EditorTier): number | null {
  return SESSION_LIMITS_PER_TIER[tier];
}

/**
 * Compute remaining sessions for a workspace given its tier + this-month
 * usage + rollover. `null` total means unlimited.
 */
export function computeUsage(input: {
  readonly tier: EditorTier;
  readonly used: number;
  readonly rollover: number;
}): {
  readonly tier: EditorTier;
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
