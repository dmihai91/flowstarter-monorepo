/**
 * Plan entitlements — the single source of truth for what each subscription
 * plan grants. Session caps, per-session € cost ceilings, model access,
 * edit scope, and store-ops all derive from this table.
 *
 * Canonical pricing model: `docs/FLOWSTARTER_MASTER_DECISIONS.md` §5 +
 * `docs/AI_CREDITS_SYSTEM.md` §1.1. This file is reconciled with both;
 * if they disagree, this table wins for runtime enforcement and the docs
 * must be amended (Dorin sign-off per the master doc's authority rule).
 *
 * `PlanKey` is the only tier model in the codebase. The Supabase
 * `workspaces.tier_name` column may still hold the historical strings
 * (`essential`/`commerce`/`custom`); those are mapped to canonical plan
 * keys at the read boundary by {@link normalisePlanKey}. That is input
 * validation on an external column, not a type-level compatibility shim —
 * no data migration is required and none is implied here.
 */

export type PlanKey = "starter" | "pro" | "max" | "ecommerce" | "admin";

/** What the autorouter / picker allows for a plan. */
export type ModelAccess =
  /** Autorouter only, pinned to the small model registry. No manual picker. */
  | "autorouter-locked"
  /** Autorouter + manual model picker across the full model ladder. */
  | "autorouter+picker"
  /** Above + code experimentation unlocked. */
  | "autorouter+picker+code";

/** What the client is allowed to edit in their workspace. */
export type EditScope =
  /** Text / images / colors / fonts / section visibility + order + content. */
  | "constrained"
  /** Raw code experimentation (with break-risk warning). */
  | "code";

export type PlanEntitlement = {
  readonly plan: PlanKey;
  /** Monthly AI-edit-session allowance. `null` = unlimited (admin). */
  readonly sessionsPerMonth: number | null;
  /**
   * Hard ceiling on real provider $ cost (expressed in €) a single
   * session may consume before its active turn is interrupted and the
   * session soft-blocked. `null` = uncapped (admin).
   */
  readonly eurCostCapPerSession: number | null;
  /**
   * Cumulative monthly AI cost (€) at which the user gets an
   * "upgrade / buy extra sessions" nudge. Soft — no hard block.
   * `null` = no nudge (admin).
   */
  readonly monthlySoftThresholdEur: number | null;
  /**
   * Cumulative monthly AI cost (€) circuit-breaker. At this point the
   * plan goes margin-negative; the user is soft-blocked and routed to a
   * "move to a custom contract" conversation. `null` = no ceiling.
   */
  readonly monthlyHardCeilingEur: number | null;
  readonly modelAccess: ModelAccess;
  readonly editScope: EditScope;
  /** Ecommerce store editing (products + collections/categories). */
  readonly storeOps: boolean;
  /**
   * Monthly store-ops operation allowance (separate pool from AI edit
   * sessions). `null` = not applicable / unlimited (admin).
   */
  readonly storeOpsAllowance: number | null;
};

/**
 * The canonical table.
 *
 * NOTE — TUNABLE NUMBERS: only Starter's monthly soft threshold (~€25)
 * was given explicitly. Pro/Max/Ecommerce soft + all hard ceilings are
 * derived proportionally and flagged here; change in ONE place. The
 * Max hard ceiling (€190 on a €249 plan) is the margin circuit-breaker
 * agreed in planning.
 */
export const PLAN_ENTITLEMENTS: Readonly<Record<PlanKey, PlanEntitlement>> = {
  starter: {
    plan: "starter",
    sessionsPerMonth: 30,
    eurCostCapPerSession: 1,
    monthlySoftThresholdEur: 25, // explicit (user)
    monthlyHardCeilingEur: 30, // TUNABLE
    modelAccess: "autorouter-locked",
    editScope: "constrained",
    storeOps: false,
    storeOpsAllowance: null,
  },
  pro: {
    plan: "pro",
    sessionsPerMonth: 60,
    eurCostCapPerSession: 2,
    monthlySoftThresholdEur: 50, // TUNABLE (≈ Starter × cap ratio)
    monthlyHardCeilingEur: 75, // TUNABLE
    modelAccess: "autorouter+picker",
    editScope: "constrained",
    storeOps: false,
    storeOpsAllowance: null,
  },
  max: {
    plan: "max",
    sessionsPerMonth: 120,
    eurCostCapPerSession: 3,
    monthlySoftThresholdEur: 75, // TUNABLE
    monthlyHardCeilingEur: 190, // agreed margin circuit-breaker (€249 plan)
    modelAccess: "autorouter+picker+code",
    editScope: "code",
    storeOps: false,
    storeOpsAllowance: null,
  },
  ecommerce: {
    plan: "ecommerce",
    sessionsPerMonth: 90, // Pro+ (more sessions than Pro, store-ops on top)
    eurCostCapPerSession: 2,
    monthlySoftThresholdEur: 43, // TUNABLE (€149→€129 scaled ≈ ×0.866)
    monthlyHardCeilingEur: 95, // TUNABLE (€129 plan)
    modelAccess: "autorouter+picker",
    editScope: "constrained",
    storeOps: true,
    storeOpsAllowance: 200, // TUNABLE — store-ops/mo (separate pool)
  },
  admin: {
    plan: "admin",
    sessionsPerMonth: null,
    eurCostCapPerSession: null,
    monthlySoftThresholdEur: null,
    monthlyHardCeilingEur: null,
    modelAccess: "autorouter+picker+code",
    editScope: "code",
    storeOps: true,
    storeOpsAllowance: null,
  },
} as const;

/** Higher rank wins when a user has multiple workspaces (back-compat path). */
export const PLAN_RANK: Readonly<Record<PlanKey, number>> = {
  starter: 0,
  pro: 1,
  ecommerce: 2,
  max: 3,
  admin: 4,
} as const;

const LEGACY_TIER_ALIASES: Readonly<Record<string, PlanKey>> = {
  // Historical Supabase `tier_name` values → canonical plan keys.
  essential: "starter",
  commerce: "ecommerce",
  custom: "admin",
} as const;

function isPlanKey(value: string): value is PlanKey {
  return (
    value === "starter" ||
    value === "pro" ||
    value === "max" ||
    value === "ecommerce" ||
    value === "admin"
  );
}

/**
 * Boundary normalizer: maps a raw `workspaces.tier_name` value (which may
 * be a canonical key or a legacy alias) to a {@link PlanKey}. Unknown /
 * null values default to the lowest plan (`starter`).
 */
export function normalisePlanKey(value: string | null | undefined): PlanKey {
  if (!value) return "starter";
  const trimmed = value.trim().toLowerCase();
  if (isPlanKey(trimmed)) return trimmed;
  return LEGACY_TIER_ALIASES[trimmed] ?? "starter";
}

/** Pick the highest-ranked plan across a set of raw tier strings. */
export function pickHighestPlan(values: ReadonlyArray<string | null>): PlanKey {
  let best: PlanKey = "starter";
  for (const value of values) {
    const plan = normalisePlanKey(value);
    if (PLAN_RANK[plan] > PLAN_RANK[best]) best = plan;
  }
  return best;
}

export function entitlementForPlan(plan: PlanKey): PlanEntitlement {
  return PLAN_ENTITLEMENTS[plan];
}

/** Plans whose model selection the user may override via the manual picker. */
export function allowsManualModelPicker(plan: PlanKey): boolean {
  return PLAN_ENTITLEMENTS[plan].modelAccess !== "autorouter-locked";
}

/** Plans that may unlock raw code experimentation. */
export function allowsCodeExperimentation(plan: PlanKey): boolean {
  return PLAN_ENTITLEMENTS[plan].editScope === "code";
}
