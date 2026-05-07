/**
 * Tier-gating context for the multitenant editor.
 *
 * Source of truth comes from `GET /api/clerk/me` (see `lib/clerkSession.ts`)
 * which derives the tier per the master-decisions doc:
 *   - admins (Clerk role 'team' | 'admin') → 'custom' (full UI)
 *   - clients → workspaces.tier_name
 *
 * Components that render advanced features (file tree, terminal, raw code
 * editor) read `tier` via `useTier()` and hide themselves below 'custom'.
 *
 * Phase D (auth slice) will add per-workspace tier resolution; for now the
 * tier is the highest the user has access to across all their workspaces.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { ClerkIdentity, EditorTier } from "../lib/clerkSession";

export interface TierContextValue {
  readonly tier: EditorTier;
  readonly role: "admin" | "client";
  readonly userId: string;
  readonly allowedWorkspaceIds: ReadonlyArray<string>;
}

const TierContext = createContext<TierContextValue | null>(null);

export interface TierProviderProps {
  readonly identity: ClerkIdentity;
  readonly children: ReactNode;
}

export function TierProvider({ identity, children }: TierProviderProps) {
  const value: TierContextValue = {
    tier: identity.tier,
    role: identity.role,
    userId: identity.userId,
    allowedWorkspaceIds: identity.allowedWorkspaceIds,
  };
  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

/**
 * Read the current tier context. Throws if called outside `<TierProvider>` —
 * keeps panel components honest about their auth dependency.
 */
export function useTier(): TierContextValue {
  const value = useContext(TierContext);
  if (!value) {
    throw new Error(
      "useTier must be used inside <TierProvider>. The editor root layout wraps it after the Clerk session resolves.",
    );
  }
  return value;
}

/**
 * Tier-rank helper for components that want to render based on a minimum
 * tier (e.g. terminal needs >= 'pro'; raw code editor needs 'custom').
 */
export function tierAtLeast(tier: EditorTier, minimum: EditorTier): boolean {
  const rank: Record<EditorTier, number> = {
    essential: 0,
    pro: 1,
    commerce: 2,
    custom: 3,
  };
  return rank[tier] >= rank[minimum];
}

/** Convenience: admins always see everything. */
export function tierGrantsFullAccess(value: TierContextValue): boolean {
  return value.role === "admin" || value.tier === "custom";
}
