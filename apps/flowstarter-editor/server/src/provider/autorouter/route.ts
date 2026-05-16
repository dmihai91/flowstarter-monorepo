import { routeByHeuristics } from "./heuristics.ts";
import { resolveModelSlug } from "./registry.ts";
import { extractSignals } from "./signals.ts";
import type { RouterConfig, RouterDecision, RouterInput, RouterProvider } from "./types.ts";

const DEFAULT_CLASSIFIER_THRESHOLD = 0.55;
const DEFAULT_AVAILABLE: ReadonlyArray<RouterProvider> = ["claudeAgent", "codex"];

/**
 * Main entry point. Same function serves both routing modes:
 *
 * - `manualOverride` set → pass-through (manual picker path).
 * - otherwise → heuristics first; if confidence is below threshold and a
 *   `classify` function was injected, consult the LLM classifier.
 *
 * The router never calls an LLM itself — callers inject `classify` so
 * this module stays pure, testable, and dependency-free.
 */
export async function routeTask(
  input: RouterInput,
  config: RouterConfig = {},
): Promise<RouterDecision> {
  const available = config.availableProviders ?? DEFAULT_AVAILABLE;

  // Manual picker path: same entry point, explicit override wins.
  if (input.manualOverride) {
    const { provider, model } = input.manualOverride;
    const fallback = available.find((p) => p !== provider) ?? provider;
    return {
      selected_provider: provider,
      selected_model: model,
      reasoning: "manual override from picker",
      confidence: 1,
      fallback_provider: fallback,
      tier: "standard",
      source: "manual",
    };
  }

  const signals = extractSignals(input.prompt, input.contextHints);
  const heuristicDecision = routeByHeuristics(signals, input.contextHints, config);

  const threshold = config.classifierThreshold ?? DEFAULT_CLASSIFIER_THRESHOLD;
  if (heuristicDecision.confidence >= threshold || !config.classify) {
    return heuristicDecision;
  }

  // Confidence below threshold and a classifier is wired — escalate.
  try {
    const classified = await config.classify(input.prompt, signals);
    return ensureRegistrySlug({ ...classified, signals }, config);
  } catch (error) {
    return {
      ...heuristicDecision,
      reasoning: `${heuristicDecision.reasoning}; classifier failed (${describeError(error)}) — using heuristic`,
    };
  }
}

/**
 * Synchronous variant for hot paths (e.g. UI preview of the routed model
 * before the user submits). Skips the classifier and returns the
 * heuristic decision directly.
 */
export function routeTaskSync(input: RouterInput, config: RouterConfig = {}): RouterDecision {
  if (input.manualOverride) {
    const { provider, model } = input.manualOverride;
    const available = config.availableProviders ?? DEFAULT_AVAILABLE;
    return {
      selected_provider: provider,
      selected_model: model,
      reasoning: "manual override from picker",
      confidence: 1,
      fallback_provider: available.find((p) => p !== provider) ?? provider,
      tier: "standard",
      source: "manual",
    };
  }
  const signals = extractSignals(input.prompt, input.contextHints);
  return routeByHeuristics(signals, input.contextHints, config);
}

function ensureRegistrySlug(decision: RouterDecision, config: RouterConfig): RouterDecision {
  // If the classifier returned a slug we don't recognize, fall through to
  // the registry's slug for its declared tier so dispatch always lands on
  // a model the editor knows how to invoke.
  const canonical = resolveModelSlug(decision.selected_provider, decision.tier, config.registry);
  if (decision.selected_model.trim().length === 0) {
    return { ...decision, selected_model: canonical, source: "classifier" };
  }
  return { ...decision, source: "classifier" };
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
