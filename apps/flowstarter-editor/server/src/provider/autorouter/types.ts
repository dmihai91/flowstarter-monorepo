import type { ProviderKind } from "@flowstarter/editor-contracts";

export type RouterProvider = ProviderKind;

/**
 * Capability tier independent of provider. The registry maps each
 * (provider, tier) pair to a concrete model slug — swap slugs without
 * touching routing logic.
 *
 * - `mini`     – fastest/cheapest tier (haiku-class, gpt-mini)
 * - `standard` – balanced default (sonnet-class, gpt-full)
 * - `heavy`    – deepest reasoning (opus-class, gpt-codex full)
 */
export type RouterTier = "mini" | "standard" | "heavy";

export type RouterContextHints = {
  /** Approximate number of files the task is expected to touch. */
  fileCount?: number;
  /** Approximate tokens of repo/code context attached to the task. */
  repoTokens?: number;
  /** Image or file attachments present on the turn. */
  hasAttachments?: boolean;
  /** True if this is a follow-up in an existing thread. */
  isFollowUp?: boolean;
  /**
   * Number of consecutive failed turns on the previous selection.
   * Drives the auto-recovery rule from the spec (>=2 → escalate + switch provider).
   */
  previousFailures?: number;
  /** Provider that produced the previous failure, if any. */
  lastFailedProvider?: RouterProvider;
};

export type RouterManualOverride = {
  provider: RouterProvider;
  model: string;
};

export type RouterInput = {
  prompt: string;
  contextHints?: RouterContextHints;
  /**
   * When set, the router skips heuristics+classifier and returns this
   * pair as the decision (`source: "manual"`). This is the path the
   * existing manual picker takes — the same `routeTask` entry point
   * handles both auto and manual selection.
   */
  manualOverride?: RouterManualOverride;
};

export type ExtractedSignals = {
  /** Length of the user prompt in characters. */
  promptChars: number;
  /** Token-ish word count for the prompt. */
  promptWords: number;
  /** Heuristic count of file-path-like tokens in the prompt. */
  pathMentions: number;
  /** Matches against MULTI_FILE_KEYWORDS. */
  multiFileHits: number;
  /** Matches against CLAUDE_TASK_KEYWORDS (design / review / brainstorm). */
  claudeTaskHits: number;
  /** Matches against COMPLEXITY_KEYWORDS (architecture / perf / race / etc.). */
  complexityHits: number;
  /** Matches against SIMPLE_TASK_KEYWORDS (typo / rename / format / etc.). */
  simpleTaskHits: number;
  /** Heuristic ambiguity score 0..1 (vague, open-ended, "what do you think?"). */
  ambiguity: number;
};

export type RouterDecisionSource = "manual" | "heuristic" | "classifier" | "recovery";

/**
 * Decision shape matches the JSON example in the spec verbatim
 * (snake_case fields, `confidence` in [0, 1]).
 */
export type RouterDecision = {
  selected_provider: RouterProvider;
  selected_model: string;
  reasoning: string;
  confidence: number;
  fallback_provider: RouterProvider;
  tier: RouterTier;
  source: RouterDecisionSource;
  signals?: ExtractedSignals;
};

export type ClassifierFn = (
  prompt: string,
  signals: ExtractedSignals,
) => Promise<RouterDecision>;

export type RouterConfig = {
  /**
   * Map (provider, tier) → concrete model slug. Defaults come from
   * `DEFAULT_MODEL_REGISTRY` but callers can override per-env.
   */
  registry?: Partial<Record<RouterProvider, Partial<Record<RouterTier, string>>>>;
  /**
   * Optional LLM classifier called only when heuristic confidence
   * falls below `classifierThreshold`. Keeping this injected (rather
   * than baked in) keeps the router pure and testable.
   */
  classify?: ClassifierFn;
  /** Confidence below this value triggers the classifier. Default 0.55. */
  classifierThreshold?: number;
  /**
   * When false (default), unavailable providers fall back to the other.
   * Set true to hard-fail instead — useful in environments where one
   * provider is not configured.
   */
  strictProviderAvailability?: boolean;
  /** Providers the host has configured. Defaults to both enabled. */
  availableProviders?: ReadonlyArray<RouterProvider>;
};
