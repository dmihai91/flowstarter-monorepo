import type {
  ClaudeModelOptions,
  CodexModelOptions,
  ModelSelection,
  ProviderKind,
  ServerProvider,
} from "@flowstarter/editor-contracts";

import { routeTask, routeTaskSync } from "./route.ts";
import type {
  RouterConfig,
  RouterContextHints,
  RouterDecision,
  RouterProvider,
} from "./types.ts";

/**
 * Sentinel used by the composer / project defaults to signal "let the
 * autorouter pick" without changing the orchestration schema (which
 * still uses concrete provider+model). When the dispatch path sees this
 * value it calls {@link resolveModelSelectionForTurn} to substitute a
 * concrete pair before handing off to the provider adapter.
 */
export const AUTOROUTE_MODEL_SLUG = "auto-route";

export type AutoRoutingDispatchInput = {
  /** What the composer is about to dispatch. */
  modelSelection: ModelSelection;
  /** User prompt for the upcoming turn — fed to the router. */
  prompt: string;
  /** Provider snapshot from the server — drives availability filtering. */
  providers: ReadonlyArray<ServerProvider>;
  /** Optional context cues; safe to omit. */
  contextHints?: RouterContextHints;
  /** Router knobs (registry overrides, classifier, threshold). */
  routerConfig?: RouterConfig;
};

export type AutoRoutingDispatchResult = {
  /** Concrete ModelSelection to dispatch. */
  modelSelection: ModelSelection;
  /** The router's full decision (or `null` when no routing was needed). */
  decision: RouterDecision | null;
};

/**
 * The one-line integration point for dispatch sites.
 *
 *   const { modelSelection } = await resolveModelSelectionForTurn({ ... });
 *
 * Behavior:
 * - If `modelSelection.model !== AUTOROUTE_MODEL_SLUG` → pass-through (manual
 *   path; what the existing manual picker does).
 * - If `modelSelection.model === AUTOROUTE_MODEL_SLUG` → run the autorouter
 *   against the prompt + available providers and substitute the result.
 */
export async function resolveModelSelectionForTurn(
  input: AutoRoutingDispatchInput,
): Promise<AutoRoutingDispatchResult> {
  if (!isAutoRouteSelection(input.modelSelection)) {
    return { modelSelection: input.modelSelection, decision: null };
  }
  const decision = await routeTask(
    {
      prompt: input.prompt,
      ...(input.contextHints !== undefined ? { contextHints: input.contextHints } : {}),
    },
    buildConfig(input),
  );
  return { modelSelection: decisionToModelSelection(decision), decision };
}

/**
 * Synchronous variant for UI previews — runs heuristics only, no
 * classifier call. Useful for showing the user which model would be
 * picked before they hit submit.
 */
export function resolveModelSelectionForTurnSync(
  input: AutoRoutingDispatchInput,
): AutoRoutingDispatchResult {
  if (!isAutoRouteSelection(input.modelSelection)) {
    return { modelSelection: input.modelSelection, decision: null };
  }
  const decision = routeTaskSync(
    {
      prompt: input.prompt,
      ...(input.contextHints !== undefined ? { contextHints: input.contextHints } : {}),
    },
    buildConfig(input),
  );
  return { modelSelection: decisionToModelSelection(decision), decision };
}

export function isAutoRouteSelection(selection: ModelSelection): boolean {
  return selection.model.trim() === AUTOROUTE_MODEL_SLUG;
}

function buildConfig(input: AutoRoutingDispatchInput): RouterConfig {
  const available = input.providers
    .filter((provider) => provider.enabled)
    .map((provider) => provider.provider satisfies RouterProvider);

  return {
    ...input.routerConfig,
    availableProviders: available.length > 0 ? available : ["claudeAgent"],
  };
}

function decisionToModelSelection(decision: RouterDecision): ModelSelection {
  // Preserve the existing ClaudeModelSelection / CodexModelSelection union —
  // the dispatch path keys off `provider` and the contracts require the
  // discriminant to be a literal. Splitting like this keeps the schema happy.
  if (decision.selected_provider === "codex") {
    const options: CodexModelOptions = {};
    return {
      provider: "codex",
      model: decision.selected_model,
      options,
    } satisfies ModelSelection;
  }
  const options: ClaudeModelOptions = {};
  return {
    provider: "claudeAgent",
    model: decision.selected_model,
    options,
  } satisfies ModelSelection;
}

/**
 * Helper for callers that want to construct the auto-route sentinel
 * without depending on the literal slug.
 */
export function makeAutoRouteModelSelection(
  preferredProvider: ProviderKind = "claudeAgent",
): ModelSelection {
  if (preferredProvider === "codex") {
    return { provider: "codex", model: AUTOROUTE_MODEL_SLUG, options: {} };
  }
  return { provider: "claudeAgent", model: AUTOROUTE_MODEL_SLUG, options: {} };
}
