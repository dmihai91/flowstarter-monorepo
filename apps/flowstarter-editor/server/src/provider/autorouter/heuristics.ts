import { resolveModelSlug } from "./registry.ts";
import type {
  ExtractedSignals,
  RouterConfig,
  RouterContextHints,
  RouterDecision,
  RouterProvider,
  RouterTier,
} from "./types.ts";

type Vote = {
  provider: RouterProvider;
  tier: RouterTier;
  weight: number;
  reason: string;
};

const DEFAULT_AVAILABLE: ReadonlyArray<RouterProvider> = ["claudeAgent", "codex"];

function pickFallback(
  primary: RouterProvider,
  available: ReadonlyArray<RouterProvider>,
): RouterProvider {
  const other = available.find((p) => p !== primary);
  return other ?? primary;
}

function escalate(tier: RouterTier): RouterTier {
  if (tier === "mini") return "standard";
  if (tier === "standard") return "heavy";
  return "heavy";
}

function enforceAvailability(
  provider: RouterProvider,
  available: ReadonlyArray<RouterProvider>,
  strict: boolean,
): { provider: RouterProvider; rerouted: boolean } {
  if (available.includes(provider)) return { provider, rerouted: false };
  if (strict) return { provider, rerouted: false };
  const alt = available[0] ?? provider;
  return { provider: alt, rerouted: alt !== provider };
}

/**
 * Pure deterministic routing. Mirrors the spec's "Route to OpenAI/Codex when..."
 * and "Route to Claude when..." lists by collecting weighted votes from the
 * extracted signals, then picking the highest-confidence tier.
 *
 * Confidence reflects how unambiguous the signal mix was. The caller (route.ts)
 * decides whether to consult the LLM classifier based on this score.
 */
export function routeByHeuristics(
  signals: ExtractedSignals,
  hints: RouterContextHints | undefined,
  config: RouterConfig,
): RouterDecision {
  const available = config.availableProviders ?? DEFAULT_AVAILABLE;
  const strict = config.strictProviderAvailability ?? false;
  const previousFailures = hints?.previousFailures ?? 0;
  const lastFailedProvider = hints?.lastFailedProvider;

  // --- Auto-recovery short-circuit (spec: "fails twice → switch provider"). ---
  if (previousFailures >= 2 && lastFailedProvider) {
    const switched = pickFallback(lastFailedProvider, available);
    const tier: RouterTier = "heavy";
    const resolved = enforceAvailability(switched, available, strict);
    return {
      selected_provider: resolved.provider,
      selected_model: resolveModelSlug(resolved.provider, tier, config.registry),
      reasoning: `auto-recovery: ${lastFailedProvider} failed ${previousFailures}x — switching to ${resolved.provider} at heavy tier`,
      confidence: 0.95,
      fallback_provider: pickFallback(resolved.provider, available),
      tier,
      source: "recovery",
      signals,
    };
  }

  const votes: Vote[] = [];

  // --- "Route to OpenAI / Codex when..." block from the spec. ---
  if (signals.multiFileHits > 0) {
    votes.push({
      provider: "codex",
      tier: "standard",
      weight: 2 + signals.multiFileHits,
      reason: `multi-file / repo-wide signals (${signals.multiFileHits})`,
    });
  }
  if (signals.pathMentions >= 3) {
    votes.push({
      provider: "codex",
      tier: "standard",
      weight: 1.5,
      reason: `${signals.pathMentions} file paths referenced — high-context implementation`,
    });
  }
  if ((hints?.fileCount ?? 0) >= 3) {
    votes.push({
      provider: "codex",
      tier: "standard",
      weight: 2,
      reason: `caller estimates ${hints?.fileCount} files touched`,
    });
  }
  if ((hints?.repoTokens ?? 0) > 40_000) {
    votes.push({
      provider: "codex",
      tier: "heavy",
      weight: 1.5,
      reason: `large repo context (${hints?.repoTokens} tokens)`,
    });
  }

  // --- "Route to Claude when..." block from the spec. ---
  if (signals.claudeTaskHits > 0) {
    votes.push({
      provider: "claudeAgent",
      tier: "standard",
      weight: 2 + signals.claudeTaskHits,
      reason: `design/review/brainstorm signals (${signals.claudeTaskHits})`,
    });
  }
  if (signals.ambiguity >= 0.4) {
    votes.push({
      provider: "claudeAgent",
      tier: "standard",
      weight: 1.5 + signals.ambiguity,
      reason: `ambiguous / poorly specified (ambiguity=${signals.ambiguity.toFixed(2)})`,
    });
  }

  // --- Complexity → escalate tier on the winning provider. ---
  const complexityEscalation = signals.complexityHits > 0;

  // --- Cost optimization: simple isolated tasks → mini tier. ---
  const simpleTask =
    signals.simpleTaskHits > 0 &&
    signals.complexityHits === 0 &&
    signals.multiFileHits === 0 &&
    (hints?.fileCount ?? 0) <= 1;
  if (simpleTask) {
    votes.push({
      provider: "claudeAgent",
      tier: "mini",
      weight: 3,
      reason: `simple isolated task (${signals.simpleTaskHits} simple-task signals)`,
    });
  }

  // --- Aggregate votes by provider; pick highest weight. ---
  const totals = new Map<RouterProvider, { weight: number; tier: RouterTier; reasons: string[] }>();
  for (const vote of votes) {
    const entry = totals.get(vote.provider) ?? { weight: 0, tier: vote.tier, reasons: [] };
    entry.weight += vote.weight;
    // Heaviest tier wins within a provider.
    entry.tier = mergeTier(entry.tier, vote.tier);
    entry.reasons.push(vote.reason);
    totals.set(vote.provider, entry);
  }

  let primary: RouterProvider;
  let tier: RouterTier;
  let reasons: string[];
  let totalWeight: number;

  if (totals.size === 0) {
    // No signals fired — apply the spec's "Cost optimization" default:
    // prefer cheaper/faster (sonnet) over heavy. Claude is the conversational
    // default for the editor; codex picks up on explicit implementation cues.
    primary = "claudeAgent";
    tier = "standard";
    reasons = ["no strong signals — default to balanced Claude sonnet tier"];
    totalWeight = 0;
  } else {
    const sorted = [...totals.entries()].sort((a, b) => b[1].weight - a[1].weight);
    const winner = sorted[0];
    if (!winner) {
      // Unreachable: totals.size > 0 implies at least one entry.
      primary = "claudeAgent";
      tier = "standard";
      reasons = ["no strong signals"];
      totalWeight = 0;
    } else {
      primary = winner[0];
      tier = winner[1].tier;
      reasons = winner[1].reasons;
      totalWeight = winner[1].weight;
    }
  }

  if (complexityEscalation) {
    tier = escalate(tier);
    reasons.push(`escalated tier due to ${signals.complexityHits} complexity signals`);
  }

  // Spec: "Escalate to stronger models only when... context grows".
  if ((hints?.repoTokens ?? 0) > 120_000 && tier !== "heavy") {
    tier = "heavy";
    reasons.push("escalated to heavy tier — very large context");
  }

  const enforced = enforceAvailability(primary, available, strict);
  if (enforced.rerouted) {
    reasons.push(`${primary} unavailable in this host — rerouted to ${enforced.provider}`);
  }

  // Confidence: heuristic margin between winner and runner-up, capped to 0.92
  // (1.0 is reserved for manual override).
  const confidence = computeConfidence(totals, totalWeight, signals);

  return {
    selected_provider: enforced.provider,
    selected_model: resolveModelSlug(enforced.provider, tier, config.registry),
    reasoning: reasons.join("; "),
    confidence,
    fallback_provider: pickFallback(enforced.provider, available),
    tier,
    source: "heuristic",
    signals,
  };
}

function mergeTier(a: RouterTier, b: RouterTier): RouterTier {
  const order: RouterTier[] = ["mini", "standard", "heavy"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function computeConfidence(
  totals: Map<RouterProvider, { weight: number; tier: RouterTier; reasons: string[] }>,
  winnerWeight: number,
  signals: ExtractedSignals,
): number {
  if (totals.size === 0) {
    // No signals at all — default route is plausible but uninformed.
    return 0.4;
  }
  const weights = [...totals.values()].map((entry) => entry.weight).sort((x, y) => y - x);
  const top = weights[0] ?? 0;
  const runnerUp = weights[1] ?? 0;
  const margin = top === 0 ? 0 : (top - runnerUp) / top;
  // Stronger signal density boosts confidence.
  const density = Math.min(
    1,
    (signals.multiFileHits + signals.claudeTaskHits + signals.complexityHits + signals.simpleTaskHits) / 4,
  );
  const score = 0.45 + 0.35 * margin + 0.15 * density + Math.min(0.1, winnerWeight / 20);
  return Math.min(0.92, Math.max(0.4, Number(score.toFixed(2))));
}
