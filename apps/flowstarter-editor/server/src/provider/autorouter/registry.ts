import type { RouterProvider, RouterTier } from "./types.ts";

/**
 * Canonical (provider, tier) → model slug map. Slugs match the editor's
 * existing catalogs in `Layers/ClaudeProvider.ts` and `model.ts` so the
 * router's output drops directly into a `ModelSelection`.
 *
 * The user's spec calls the cheap tier "mini" and the heavy tier
 * "full/opus"; we keep `mini | standard | heavy` as provider-agnostic
 * labels and resolve each to the right slug per provider.
 */
export const DEFAULT_MODEL_REGISTRY: Record<RouterProvider, Record<RouterTier, string>> = {
  claudeAgent: {
    mini: "claude-haiku-4-5",
    standard: "claude-sonnet-4-6",
    heavy: "claude-opus-4-6",
  },
  codex: {
    mini: "gpt-5.4-mini",
    standard: "gpt-5.4",
    heavy: "gpt-5.3-codex",
  },
};

export function resolveModelSlug(
  provider: RouterProvider,
  tier: RouterTier,
  overrides?: Partial<Record<RouterProvider, Partial<Record<RouterTier, string>>>>,
): string {
  const overrideSlug = overrides?.[provider]?.[tier];
  if (typeof overrideSlug === "string" && overrideSlug.trim().length > 0) {
    return overrideSlug;
  }
  return DEFAULT_MODEL_REGISTRY[provider][tier];
}
