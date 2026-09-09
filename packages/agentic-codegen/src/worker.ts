import { writeFile } from 'node:fs/promises';
import type { DiscoverySpec } from './spec';
import {
  createWorkspace,
  selectBaseTemplate,
  BASE_TEMPLATES,
  TEMPLATE_CATALOG,
} from './workspace';
import { runBuild } from './build';
import { generate as defaultGenerate, type GenerateFn } from './llm';
import {
  orchestrateGeneration,
  orchestrateEdit,
  type OrchestrateOptions,
  type EditResult,
} from './orchestrator';
import { applyIntegrationsToWorkspace, type IntegrationsConfig } from './integrations';

export type { EditResult } from './orchestrator';

export interface CodegenEvent {
  phase: string;
  detail?: string;
}

export interface CodegenOptions {
  baseOverride?: string;
  /** Injectable LLM seam (tests). Defaults to OpenRouter. */
  generate?: GenerateFn;
  /** Lite mode: single Kimi pass, no planner/critic (budget degrade). */
  lite?: boolean;
  /** Wall-clock per implementer call. Default 120s. */
  wallClockMs?: number;
  /** astro build afterwards to prove the personalized site compiles. */
  verifyBuild?: boolean;
  keepWorkspace?: boolean;
  onEvent?: (e: CodegenEvent) => void;
  /**
   * Deterministic, no-LLM post-processing (docs/INTEGRATIONS-PLAN.md):
   * currently the Cal.com booking embed. Applied after content generation
   * and before the build-verification step, so a broken embed would still
   * be caught by `astro build`.
   */
  integrations?: IntegrationsConfig;
}

export interface CodegenResult {
  ok: boolean;
  workspaceRoot: string;
  buildDir: string;
  contentFile: string;
  distDir: string;
  indexHtml: string;
  base: string;
  costUsd: number;
  /** The number the funnel latency budget cares about: the LLM work. */
  generationMs: number;
  totalMs: number;
  contentChanged: boolean;
  /** Implementer passes that ran (waves + revision). */
  attempts: number;
  /** Relative paths touched by deterministic integration injection (e.g. Cal.com). */
  integrationsApplied: string[];
  failure?: { stage: 'generation' | 'invalid-output' | 'build'; log: string };
  cleanup: () => Promise<void>;
}

/**
 * LLM template router: pick the best-fit template from the catalog (one brain
 * call). Better than keyword regex for fuzzy cases. Fail-safe: returns null on
 * any error so the caller falls back to the regex selector.
 */
async function classifyTemplate(
  spec: DiscoverySpec,
  gen: GenerateFn
): Promise<string | null> {
  const system =
    'You choose the single best website template for a business. Reply with ONLY the template id — no other text.';
  const prompt = [
    'Templates:',
    ...TEMPLATE_CATALOG.map((t) => `- ${t.id}: ${t.bestFor}`),
    '',
    'Business:',
    `- Name: ${spec.businessName}`,
    `- Industry: ${spec.industry ?? ''}`,
    `- What they do: ${spec.description}`,
    `- Audience: ${spec.targetAudience ?? ''}`,
    `- Goal: ${spec.goal ?? ''}`,
    `- Tone: ${spec.brandTone ?? ''}`,
    '',
    'Reply with exactly one id from the list above.',
  ].join('\n');
  const g = await gen({
    role: 'brain',
    system,
    prompt,
    temperature: 0.2,
    maxOutputTokens: 40,
    wallClockMs: 20_000,
  });
  if (!g.ok || !g.text) return null;
  const out = g.text.toLowerCase();
  for (const { id } of TEMPLATE_CATALOG) if (out.includes(id)) return id;
  return null;
}

/**
 * Pick the best-fit template (LLM router, regex fallback). Exposed so the
 * funnel can choose + show the base template live BEFORE personalizing
 * (progressive "base first, hot-swap personalized" flow).
 */
export async function selectBaseTemplateSmart(
  spec: DiscoverySpec,
  baseOverride?: string,
  gen: GenerateFn = defaultGenerate
): Promise<ReturnType<typeof selectBaseTemplate>> {
  if (baseOverride && BASE_TEMPLATES[baseOverride]) {
    return BASE_TEMPLATES[baseOverride]!;
  }
  const chosen = await classifyTemplate(spec, gen).catch(() => null);
  return chosen && BASE_TEMPLATES[chosen]
    ? BASE_TEMPLATES[chosen]!
    : selectBaseTemplate(spec);
}

/**
 * Just the content generation: spec + the template's current site-labels.md →
 * the personalized, envelope-safe file content. No workspace/build — the
 * funnel pushes the result into the already-live sandbox via HMR. For
 * streaming wave-by-wave, call `orchestrateGeneration` directly with `onWave`.
 */
export async function generateSiteContent(
  spec: DiscoverySpec,
  contentBefore: string,
  opts: Pick<OrchestrateOptions, 'generate' | 'lite' | 'wallClockMs' | 'onWave' | 'onPhase'> = {}
): Promise<{ ok: boolean; content?: string; costUsd: number; reason?: string }> {
  const r = await orchestrateGeneration(spec, contentBefore, opts);
  return {
    ok: r.ok,
    content: r.ok ? r.content : undefined,
    costUsd: r.costUsd,
    reason: r.reason,
  };
}

/**
 * Apply ONE plain-English instruction to the site's single content file (the
 * 15-prompt edit loop), writing the result back to disk. Thin wrapper over
 * `orchestrateEdit` for the host-side path.
 */
export async function editContent(
  contentFile: string,
  instruction: string,
  opts: { generate?: GenerateFn; wallClockMs?: number } = {}
): Promise<EditResult> {
  const { readFile } = await import('node:fs/promises');
  let current: string;
  try {
    current = await readFile(contentFile, 'utf8');
  } catch {
    return { ok: false, costUsd: 0, usageByModel: {}, changed: false, reason: 'content file missing' };
  }
  const r = await orchestrateEdit(current, instruction, opts);
  if (r.ok && r.content) await writeFile(contentFile, r.content, 'utf8');
  return r;
}

/**
 * Discovery spec in → personalized industry-matched site built on disk: LLM
 * template routing, warm workspace (no install), the gretly-light orchestrator
 * rewriting the content file, optional build proof. Used by the speed harness
 * and the (future) on-disk concierge build.
 */
export async function runCodegen(
  spec: DiscoverySpec,
  options: CodegenOptions = {}
): Promise<CodegenResult> {
  const t0 = Date.now();
  const gen = options.generate ?? defaultGenerate;
  const verifyBuild = options.verifyBuild ?? true;

  let base;
  if (options.baseOverride && BASE_TEMPLATES[options.baseOverride]) {
    base = BASE_TEMPLATES[options.baseOverride]!;
  } else {
    options.onEvent?.({ phase: 'Choosing the best template for you' });
    base = await selectBaseTemplateSmart(spec, undefined, gen);
  }
  options.onEvent?.({ phase: 'Preparing', detail: `${base.name} (warm)` });
  const ws = await createWorkspace(base);

  const result: CodegenResult = {
    ok: false,
    workspaceRoot: ws.root,
    buildDir: ws.buildDir,
    contentFile: ws.contentFile,
    distDir: `${ws.buildDir}/dist`,
    indexHtml: `${ws.buildDir}/dist/index.html`,
    base: base.name,
    costUsd: 0,
    generationMs: 0,
    totalMs: 0,
    contentChanged: false,
    attempts: 0,
    integrationsApplied: [],
    cleanup: ws.cleanup,
  };

  const tGen = Date.now();
  const orch = await orchestrateGeneration(spec, ws.contentBefore, {
    generate: gen,
    lite: options.lite,
    wallClockMs: options.wallClockMs,
    onPhase: (phase) => options.onEvent?.({ phase }),
  });
  result.generationMs = Date.now() - tGen;
  result.costUsd = orch.costUsd;
  result.attempts = orch.attempts;
  result.contentChanged = orch.ok;

  if (!orch.ok) {
    result.failure = { stage: 'invalid-output', log: orch.reason ?? 'no personalization' };
    result.totalMs = Date.now() - t0;
    if (options.keepWorkspace === false) await ws.cleanup();
    return result;
  }

  await writeFile(ws.contentFile, orch.content, 'utf8');

  if (options.integrations) {
    options.onEvent?.({ phase: 'Connecting your booking calendar' });
    const applied = await applyIntegrationsToWorkspace(ws.buildDir, options.integrations).catch(
      () => ({ applied: false, changedPaths: [] as string[] })
    );
    result.integrationsApplied = applied.changedPaths;
  }

  if (!verifyBuild) {
    result.ok = true;
    result.totalMs = Date.now() - t0;
    options.onEvent?.({ phase: 'Done', detail: `${(result.generationMs / 1000).toFixed(1)}s` });
    return result;
  }

  options.onEvent?.({ phase: 'Verifying build' });
  const build = await runBuild(ws.buildDir, { installTimeoutMs: 60_000 });
  result.ok = build.ok;
  if (!build.ok) result.failure = { stage: 'build', log: build.log };
  result.totalMs = Date.now() - t0;
  if (options.keepWorkspace === false) await ws.cleanup();
  options.onEvent?.({
    phase: result.ok ? 'Done' : 'Build failed',
    detail: `gen ${(result.generationMs / 1000).toFixed(1)}s`,
  });
  return result;
}
