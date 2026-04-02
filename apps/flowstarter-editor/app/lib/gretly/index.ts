/**
 * Gretly - Master Orchestrator for Site Generation
 *
 * Gretly uses a three-tier agent architecture via FlowOps:
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  GRETLY / OPUS 4.5 (Master Orchestrator)                       │
 * │  - Planning: Analyzes business data + template                  │
 * │  - Review: Judges generated output quality                      │
 * │  - Exception handling: Escalates when fixes fail                │
 * │  Cost: High, but rare calls                                     │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                        FlowOps protocol
 *                              │
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  KIMI K2 (Code Generator/Executor)                              │
 * │  - Template-based generation                                    │
 * │  - Fast iterations                                              │
 * │  - Bulk code output                                             │
 * │  Cost: Low, fast, many calls                                    │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                        FlowOps protocol
 *                              │
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SONNET 4 (Fixer/Support)                                       │
 * │  - Sonnet 4 primary for fresh perspective                       │
 * │  - K2 optional fast path for simple fixes                       │
 * │  Cost: Medium, as needed                                        │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * Pipeline Flow:
 * ```
 * ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
 * │  PLAN   │────▶│ GENERATE │────▶│  BUILD  │────▶│  FIX    │
 * │(Gretly) │     │ (Kimi K2)│     │(Daytona)│     │(Sonnet4)│
 * └─────────┘     └──────────┘     └─────────┘     └────┬────┘
 *                                                       │
 *                 ┌─────────────────────────────────────┘
 *                 │
 *                 ▼
 * ┌─────────┐     ┌──────────┐     ┌─────────────┐
 * │ REVIEW  │────▶│ APPROVED │────▶│   PUBLISH   │
 * │(Gretly) │     └──────────┘     └─────────────┘
 * └────┬────┘
 *      │
 *      ▼ REJECTED
 * ┌─────────┐     ┌──────────────────┐
 * │ REFINE  │────▶│ max retries?     │
 * │ (loop)  │     └────────┬─────────┘
 * └─────────┘              │
 *                          ▼ YES
 *                 ┌─────────────────┐
 *                 │    ESCALATE     │
 *                 │   (to user)     │
 *                 └─────────────────┘
 * ```
 *
 * Usage:
 * ```typescript
 * import { createGretly, type GretlyConfig } from '~/lib/gretly';
 *
 * const gretly = createGretly({
 *   approvalThreshold: 7,
 *   maxRefineIterations: 2,
 *   maxFixAttempts: 3,
 *   onProgress: (phase, message, progress) => {
 *     console.log(`[${phase}] ${message} (${progress}%)`);
 *   },
 * });
 *
 * const result = await gretly.run(
 *   {
 *     projectId: 'my-project',
 *     businessInfo: { name: 'Acme Corp', services: ['Web Design'] },
 *     template: { slug: 'startup', name: 'Startup Template' },
 *     design: { primaryColor: '#3B82F6' },
 *   },
 *   buildFn,   // (projectId, files) => Promise<BuildResult>
 *   publishFn  // (projectId, files) => Promise<void>
 * );
 *
 * // Check for escalation (user intervention needed)
 * if (result.escalation) {
 *   console.log('User intervention needed:', result.escalation.explanation);
 *   console.log('Suggested actions:', result.escalation.suggestedActions);
 * }
 * ```
 */

// Main orchestrator (Three-tier: Gretly master + Kimi K2 generator + Sonnet 4 fixer)
export {
  Gretly,
  createGretly,
  type GretlyPhase,
  type GretlyConfig,
  type GretlyInput,
  type GretlyResult,
  type GretlyDataFetcher,
  type BusinessInfo,
  type TemplateInfo,
  type DesignInfo,
} from './gretlyEngine';

// Low-level build orchestrator (for standalone use)
export {
  Gretly as GretlyBuilder,
  createGretly as createGretlyBuilder,
  type GretlyConfig as GretlyBuilderConfig,
  type GretlyResult as GretlyBuilderResult,
  type BuildResult,
} from './builder';

// Legacy Pipeline exports (deprecated - use Gretly instead)
export {
  Pipeline,
  createPipeline,
  type PipelinePhase,
  type PipelineConfig,
  type PipelineResult,
  type PlanResult,
  type GenerateResult,
} from './pipeline';

// Agent types for advanced use cases
export type {
  PlannerResponseDTO,
  PlanResultDTO,
  ReviewResultDTO,
  EscalateResultDTO,
} from '~/lib/flowstarter/agents/planner-agent';

export type { GenerateResultDTO } from '~/lib/flowstarter/agents/code-generator-agent';

export type { FixerResponseDTO } from '~/lib/flowstarter/agents/fixer-agent';
