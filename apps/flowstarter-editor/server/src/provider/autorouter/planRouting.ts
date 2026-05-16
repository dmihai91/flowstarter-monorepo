/**
 * Bridge between subscription plans and the autorouter.
 *
 * A plan's `modelAccess` decides what the router is allowed to do:
 *   - "autorouter-locked"      → router runs but every tier resolves to
 *                                the small model registry; no manual
 *                                model picker (Starter).
 *   - "autorouter+picker"      → full model ladder + manual override
 *                                (Pro, Ecommerce).
 *   - "autorouter+picker+code" → as above + code experimentation (Max,
 *                                Admin).
 *
 * This module is pure: it returns a `RouterConfig` fragment + policy
 * flags. Wiring it into the dispatch path is a later phase.
 */

import {
  type PlanKey,
  entitlementForPlan,
} from "../../usage/planEntitlements.ts";
import type { RouterConfig, RouterProvider, RouterTier } from "./types.ts";

/**
 * Models a Starter plan is pinned to (the user's "less capable models
 * like sonnet 4.6 and gpt 5.4 mini"). Every router tier resolves here,
 * so even when heuristics escalate to "heavy" the slug stays small.
 */
export const LOCKED_SMALL_SLUGS: Readonly<Record<RouterProvider, string>> = {
  claudeAgent: "claude-sonnet-4-6",
  codex: "gpt-5.4-mini",
} as const;

const ROUTER_TIERS: ReadonlyArray<RouterTier> = ["mini", "standard", "heavy"];

function lockedSmallRegistry(): NonNullable<RouterConfig["registry"]> {
  const pin = (provider: RouterProvider): Record<RouterTier, string> => {
    const slug = LOCKED_SMALL_SLUGS[provider];
    return ROUTER_TIERS.reduce(
      (acc, tier) => {
        acc[tier] = slug;
        return acc;
      },
      {} as Record<RouterTier, string>,
    );
  };
  return {
    claudeAgent: pin("claudeAgent"),
    codex: pin("codex"),
  };
}

export type PlanRouterPolicy = {
  readonly plan: PlanKey;
  /** RouterConfig fragment to merge into the dispatch-time config. */
  readonly routerConfig: RouterConfig;
  /** Whether the user may override the routed model via the picker. */
  readonly allowManualOverride: boolean;
  /** Whether raw code experimentation is unlocked. */
  readonly allowCodeExperimentation: boolean;
  /** Whether the router is pinned to the small model registry. */
  readonly modelLocked: boolean;
};

/**
 * Resolve the routing policy for a plan. `availableProviders` (from the
 * live provider snapshot) is threaded through so a host with only one
 * provider configured still routes correctly.
 */
export function planRouterPolicy(
  plan: PlanKey,
  availableProviders?: ReadonlyArray<RouterProvider>,
): PlanRouterPolicy {
  const entitlement = entitlementForPlan(plan);
  const locked = entitlement.modelAccess === "autorouter-locked";

  const routerConfig: RouterConfig = {
    ...(locked ? { registry: lockedSmallRegistry() } : {}),
    ...(availableProviders ? { availableProviders } : {}),
  };

  return {
    plan,
    routerConfig,
    allowManualOverride: !locked,
    allowCodeExperimentation: entitlement.editScope === "code",
    modelLocked: locked,
  };
}
