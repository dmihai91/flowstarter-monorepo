export { routeTask, routeTaskSync } from "./route.ts";
export { routeByHeuristics } from "./heuristics.ts";
export { extractSignals } from "./signals.ts";
export { DEFAULT_MODEL_REGISTRY, resolveModelSlug } from "./registry.ts";
export { AUTOROUTER_SYSTEM_PROMPT } from "./systemPrompt.ts";
export {
  AUTOROUTE_MODEL_SLUG,
  isAutoRouteSelection,
  makeAutoRouteModelSelection,
  resolveModelSelectionForTurn,
  resolveModelSelectionForTurnSync,
} from "./resolveModelSelection.ts";
export { LOCKED_SMALL_SLUGS, planRouterPolicy } from "./planRouting.ts";
export type { PlanRouterPolicy } from "./planRouting.ts";
export type {
  AutoRoutingDispatchInput,
  AutoRoutingDispatchResult,
} from "./resolveModelSelection.ts";
export type {
  ClassifierFn,
  ExtractedSignals,
  RouterConfig,
  RouterContextHints,
  RouterDecision,
  RouterDecisionSource,
  RouterInput,
  RouterManualOverride,
  RouterProvider,
  RouterTier,
} from "./types.ts";
