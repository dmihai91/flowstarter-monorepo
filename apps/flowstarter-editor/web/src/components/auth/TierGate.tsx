/**
 * Conditional render based on the resolved Clerk identity.
 *
 * Two convenience wrappers cover most call sites:
 *   - <PowerUserOnly>  ← admins (us) + custom-tier clients
 *   - <NonPowerOnly>   ← everyone else (Essential, Pro, Commerce)
 *
 * Power-user features (file tree, terminal, raw code editor, branch
 * controls, advanced settings) live behind the first wrapper; copy
 * scoped to non-technical clients lives behind the second.
 *
 * `<TierGate>` exposes the underlying gate for less-common cases,
 * including arbitrary minimum tiers via `tierAtLeast()`.
 */

import type { ReactNode } from "react";

import { tierAtLeast, tierGrantsFullAccess, useTier } from "../../hooks/useTier";
import type { PlanKey } from "../../lib/clerkSession";

export interface TierGateProps {
  readonly children: ReactNode;
  /** Render the children only when this predicate returns true. */
  readonly when: (ctx: ReturnType<typeof useTier>) => boolean;
  /** Optional fallback rendered when `when` is false. Defaults to null. */
  readonly fallback?: ReactNode;
}

export function TierGate({ children, when, fallback = null }: TierGateProps) {
  const tier = useTier();
  return when(tier) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render children only for admins or custom-tier clients — i.e. the
 * humans who have the chops + agreement to operate the full T3 surface.
 */
export function PowerUserOnly({
  children,
  fallback = null,
}: {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}) {
  return (
    <TierGate when={(t) => tierGrantsFullAccess(t)} fallback={fallback}>
      {children}
    </TierGate>
  );
}

/**
 * Render children for non-power users (Essential / Pro / Commerce
 * clients). Useful for swapping in a friendlier copy block where the
 * advanced UI would otherwise sit.
 */
export function NonPowerOnly({
  children,
  fallback = null,
}: {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}) {
  return (
    <TierGate when={(t) => !tierGrantsFullAccess(t)} fallback={fallback}>
      {children}
    </TierGate>
  );
}

/**
 * Render children only when the user's tier is at least `minimum`. Admins
 * always pass, regardless of tier.
 */
export function MinTier({
  children,
  minimum,
  fallback = null,
}: {
  readonly children: ReactNode;
  readonly minimum: PlanKey;
  readonly fallback?: ReactNode;
}) {
  return (
    <TierGate
      when={(t) => t.role === "admin" || tierAtLeast(t.tier, minimum)}
      fallback={fallback}
    >
      {children}
    </TierGate>
  );
}
