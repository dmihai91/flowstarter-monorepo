/**
 * Plan entitlements — the single source of truth for product capabilities each
 * subscription plan grants. Claude Code owns token and usage-limit management;
 * this table only controls editor feature access.
 *
 * Canonical pricing model: `docs/FLOWSTARTER_MASTER_DECISIONS.md` §5. If it
 * disagrees with this table, this table wins for runtime capability gates and
 * the docs must be amended.
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
  readonly modelAccess: ModelAccess;
  readonly editScope: EditScope;
  /** Ecommerce store editing (products + collections/categories). */
  readonly storeOps: boolean;
};

export const PLAN_ENTITLEMENTS: Readonly<Record<PlanKey, PlanEntitlement>> = {
  starter: {
    plan: "starter",
    modelAccess: "autorouter-locked",
    editScope: "constrained",
    storeOps: false,
  },
  pro: {
    plan: "pro",
    modelAccess: "autorouter+picker",
    editScope: "constrained",
    storeOps: false,
  },
  max: {
    plan: "max",
    modelAccess: "autorouter+picker+code",
    editScope: "code",
    storeOps: false,
  },
  ecommerce: {
    plan: "ecommerce",
    modelAccess: "autorouter+picker",
    editScope: "constrained",
    storeOps: true,
  },
  admin: {
    plan: "admin",
    modelAccess: "autorouter+picker+code",
    editScope: "code",
    storeOps: true,
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
