/**
 * Gretly-light orchestrator for the demo codegen pipeline.
 *
 *   planner (Sonnet) → implementer waves (Kimi) → critic (Sonnet) → revise (Kimi)
 *
 * We keep gretly's brain/worker split and bounded-replan loop but DROP the
 * dynamic task DAG — the output shape is fixed (one template, one YAML file),
 * so there's nothing to fan out. The brain (Sonnet) only plans and judges; the
 * implementer (Kimi K2.6) writes the first pass AND revises from the critic's
 * notes. Every node fails open: any LLM failure degrades toward the
 * un-personalized base template, and this function NEVER throws.
 *
 * Waves stream: each completed wave is emitted via `onWave` so the funnel can
 * hot-swap it into the live sandbox (fast first paint, then gradual update).
 */
import type { DiscoverySpec } from './spec';
import {
  generate as defaultGenerate,
  type GenerateFn,
  type GenerateOutput,
  type TokenUsage,
} from './llm';
import {
  buildPlanSystem,
  buildPlanPrompt,
  buildCritiqueSystem,
  buildCritiquePrompt,
  buildWaveSystem,
  buildWavePrompt,
  type BuildPlan,
  type Critique,
} from './prompt';
import {
  splitFrontmatter,
  reassembleFile,
  cleanModelYaml,
  spliceBlocks,
  extractBlocks,
  checkStructure,
  resolveWaveKeys,
  topLevelKeys,
  WAVES,
  type Wave,
} from './yaml-blocks';

export interface WaveOutcome {
  id: string;
  keys: string[];
  ok: boolean;
  reason?: string;
}

export interface OrchestrateResult {
  /** True when the content was meaningfully personalized (≠ the template). */
  ok: boolean;
  /** Final content file (envelope re-wrapped). On total failure, = before. */
  content: string;
  costUsd: number;
  /** Token + real-cost totals per model slug — for cost recording + kill-switch. */
  usageByModel: Record<string, ModelUsage>;
  plan: BuildPlan | null;
  critique: Critique | null;
  waves: WaveOutcome[];
  /** Number of implementer passes that ran (waves + any revision). */
  attempts: number;
  reason?: string;
}

/** Per-model token + real-USD-cost totals, for funnel cost recording. */
export interface ModelUsage extends TokenUsage {
  /** Actual cost OpenRouter reported for this model's calls, in USD. */
  costUsd: number;
}

/** Mutable usage accumulator shared across a run. */
function newUsageTracker() {
  const byModel: Record<string, ModelUsage> = {};
  let costUsd = 0;
  return {
    get costUsd() {
      return costUsd;
    },
    byModel,
    record(g: GenerateOutput) {
      costUsd += g.costUsd;
      const cur = byModel[g.model] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      cur.inputTokens += g.usage.inputTokens;
      cur.outputTokens += g.usage.outputTokens;
      cur.costUsd += g.costUsd;
      byModel[g.model] = cur;
      return g;
    },
  };
}

export interface OrchestrateOptions {
  /** Injectable LLM seam. Defaults to the OpenRouter `generate`. */
  generate?: GenerateFn;
  /** Skip planner + critic; single Kimi pass over the whole file. Budget/degrade. */
  lite?: boolean;
  /** Max revision passes after a failed critique. Default 1. */
  maxRevisions?: number;
  /** Per-call wall-clock for the implementer. Default 120s. */
  wallClockMs?: number;
  /**
   * Streamed each time a wave (or the revision) lands; gets the full file.
   * Awaited — return a promise (e.g. the sandbox push) to guarantee waves are
   * applied in order (wave 1 visible before wave 2).
   */
  onWave?: (ev: {
    content: string;
    keys: string[];
    phase: string;
    waveId: string;
  }) => void | Promise<void>;
  /** Progress phase labels (planner/critic), for UI. */
  onPhase?: (phase: string) => void;
  /** Override the wave plan (tests). */
  waves?: Wave[];
}

/** Strip fences/prose and parse the first JSON object found. Null on failure. */
export function parseJsonLoose<T>(text: string): T | null {
  if (!text) return null;
  let t = text.trim();
  // No `\s*` before the capture: it overlaps `[\s\S]*?` and made the match
  // quadratic in the length of the model's reply. The capture is trimmed
  // below, which is what that `\s*` was buying.
  const fence = t.match(/```(?:json)?([\s\S]*?)```/i);
  if (fence) t = fence[1]!.trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/* ─────────────────────────── Generation ──────────────────────────────── */

/**
 * Personalize a template's content file. `contentBefore` is the template's
 * site-labels.md; returns the personalized file + the trace. Fail-open: a
 * weak/failed wave leaves those blocks as the template; a fully failed run
 * returns `ok:false` with `content === contentBefore`.
 */
export async function orchestrateGeneration(
  spec: DiscoverySpec,
  contentBefore: string,
  opts: OrchestrateOptions = {}
): Promise<OrchestrateResult> {
  const gen = opts.generate ?? defaultGenerate;
  const wallClockMs = opts.wallClockMs ?? 120_000;
  const maxRevisions = opts.maxRevisions ?? 1;
  const fm = splitFrontmatter(contentBefore);
  let workingYaml = fm.yaml;
  const track = newUsageTracker();
  let attempts = 0;
  const waves: WaveOutcome[] = [];

  const result = (): OrchestrateResult => {
    const content = reassembleFile(fm, workingYaml);
    const changed = content.trim() !== contentBefore.trim();
    return {
      ok: changed,
      content,
      costUsd: track.costUsd,
      usageByModel: track.byModel,
      plan,
      critique,
      waves,
      attempts,
      reason: changed ? undefined : 'no personalization applied',
    };
  };

  let plan: BuildPlan | null = null;
  let critique: Critique | null = null;

  try {
    // ── Planner (brain) — skipped in lite mode ──────────────────────────
    if (!opts.lite) {
      opts.onPhase?.('Planning your site');
      const p = track.record(
        await gen({
          role: 'brain',
          system: buildPlanSystem(),
          prompt: buildPlanPrompt(spec),
          temperature: 0.3,
          maxOutputTokens: 1200,
          wallClockMs,
        })
      );
      if (p.ok) plan = parseJsonLoose<BuildPlan>(p.text);
    }

    // ── Implementer waves (Kimi) ────────────────────────────────────────
    const planWaves = opts.lite
      ? [{ wave: { id: 'all', phase: 'Personalizing your site', keys: [] }, keys: topLevelKeys(workingYaml) }]
      : resolveWaveKeys(workingYaml, opts.waves ?? WAVES);

    for (const { wave, keys } of planWaves) {
      if (keys.length === 0) {
        waves.push({ id: wave.id, keys, ok: false, reason: 'no keys' });
        continue;
      }
      const blocksYaml = extractBlocks(workingYaml, keys);
      attempts++;
      const g = track.record(
        await gen({
          role: 'implementer',
          system: buildWaveSystem(),
          prompt: buildWavePrompt(spec, plan, blocksYaml),
          temperature: 0.5,
          wallClockMs,
        })
      );
      const outcome = applyWave(blocksYaml, g.ok ? g.text : '', keys);
      if (outcome.ok) {
        workingYaml = spliceBlocks(workingYaml, outcome.yaml);
        waves.push({ id: wave.id, keys, ok: true });
        await opts.onWave?.({
          content: reassembleFile(fm, workingYaml),
          keys,
          phase: wave.phase,
          waveId: wave.id,
        });
      } else {
        waves.push({ id: wave.id, keys, ok: false, reason: outcome.reason });
      }
    }

    const changedSoFar = reassembleFile(fm, workingYaml).trim() !== contentBefore.trim();

    // ── Critic (brain) + bounded revision (Kimi) ────────────────────────
    if (!opts.lite && changedSoFar) {
      for (let rev = 0; rev < maxRevisions; rev++) {
        opts.onPhase?.('Reviewing the result');
        const c = track.record(
          await gen({
            role: 'brain',
            system: buildCritiqueSystem(),
            prompt: buildCritiquePrompt(spec, reassembleFile(fm, workingYaml)),
            temperature: 0.2,
            maxOutputTokens: 800,
            wallClockMs,
          })
        );
        critique = c.ok ? parseJsonLoose<Critique>(c.text) : null;
        if (!critique || critique.passed) break;

        const weak = (critique.weakSections ?? []).filter((k) =>
          topLevelKeys(workingYaml).includes(k)
        );
        if (weak.length === 0) break;

        opts.onPhase?.('Polishing');
        const blocksYaml = extractBlocks(workingYaml, weak);
        attempts++;
        const r = track.record(
          await gen({
            role: 'implementer',
            system: buildWaveSystem(),
            prompt: buildWavePrompt(spec, plan, blocksYaml, critique.notes),
            temperature: 0.5,
            wallClockMs,
          })
        );
        const revised = applyWave(blocksYaml, r.ok ? r.text : '', weak);
        if (revised.ok) {
          workingYaml = spliceBlocks(workingYaml, revised.yaml);
          await opts.onWave?.({
            content: reassembleFile(fm, workingYaml),
            keys: weak,
            phase: 'Polishing',
            waveId: 'revision',
          });
        }
      }
    }
  } catch {
    // Backstop: never throw. Return whatever we personalized so far.
  }

  return result();
}

/** Validate + clean one wave's model output against the blocks it was given. */
function applyWave(
  blocksBefore: string,
  modelText: string,
  expectedKeys: string[]
): { ok: true; yaml: string } | { ok: false; reason: string } {
  if (!modelText) return { ok: false, reason: 'empty' };
  const cleaned = cleanModelYaml(modelText);
  const check = checkStructure(blocksBefore, cleaned, { expectedKeys });
  if (!check.ok) return { ok: false, reason: check.reason ?? 'structure' };
  return { ok: true, yaml: cleaned };
}

/* ─────────────────────────────── Edit ────────────────────────────────── */

export interface EditResult {
  ok: boolean;
  content?: string;
  costUsd: number;
  usageByModel: Record<string, ModelUsage>;
  changed: boolean;
  reason?: string;
}

/**
 * Apply ONE plain-English instruction to the content file (the 15-prompt edit
 * loop). Kimi implements; a SNAPPY critic (fast role, not Sonnet) checks the
 * change applied without wrecking the rest; one bounded retry. Fail-open:
 * returns `ok:false` rather than throwing or writing garbage.
 */
export async function orchestrateEdit(
  currentContent: string,
  instruction: string,
  opts: { generate?: GenerateFn; wallClockMs?: number; maxRetries?: number } = {}
): Promise<EditResult> {
  const gen = opts.generate ?? defaultGenerate;
  const wallClockMs = opts.wallClockMs ?? 90_000;
  const maxRetries = opts.maxRetries ?? 1;
  const fm = splitFrontmatter(currentContent);
  const track = newUsageTracker();

  const system = [
    `You apply ONE change to a website's YAML content file (markdown frontmatter). Every component reads it through typed accessors.`,
    `# Output contract
- Your ENTIRE response is the complete updated file content: no code fences, no \`---\` lines, no commentary.
- Apply only the requested change. Preserve every other value, all keys, nesting, array item shapes/counts, \`href\` routes and image \`src\` paths.
- Keep YAML valid; human, specific copy; never fabricate real contact details, prices, or quotes.`,
  ].join('\n\n');

  let notes = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const task =
      `Change requested by the site owner:\n"${instruction}"\n` +
      (notes ? `\nA previous attempt fell short: ${notes}\n` : '') +
      `\nCurrent file:\n${currentContent}\n\nOutput the complete updated file now — only the file.`;

    const g = track.record(
      await gen({ role: 'implementer', system, prompt: task, temperature: 0.4, wallClockMs })
    );
    if (!g.ok) {
      notes = 'the model returned nothing';
      continue;
    }
    const cleaned = cleanModelYaml(g.text);
    const check = checkStructure(fm.yaml, cleaned, { expectedKeys: topLevelKeys(fm.yaml) });
    if (!check.ok) {
      notes = check.reason ?? 'structure was broken';
      continue;
    }
    const content = reassembleFile(fm, cleaned);
    const changed = content.trim() !== currentContent.trim();

    // Snappy critic (fast role) — did it actually apply + keep the rest intact?
    const c = track.record(
      await gen({
        role: 'fast',
        system: `You check whether ONE requested change was applied to a website content file without breaking anything else. Reply ONLY JSON: {"applied":<bool>,"intact":<bool>}.`,
        prompt: `Requested change: "${instruction}"\n\nResulting file:\n${content}\n\nWas the change applied, and is everything else intact?`,
        temperature: 0,
        maxOutputTokens: 200,
        wallClockMs: Math.min(wallClockMs, 30_000),
      })
    );
    const verdict = c.ok
      ? parseJsonLoose<{ applied?: boolean; intact?: boolean }>(c.text)
      : null;

    // Accept if the critic is happy, OR if the critic is unavailable but the
    // file is structurally valid and changed (fail-open — never block on the
    // critic).
    const criticOk = verdict ? verdict.applied !== false && verdict.intact !== false : true;
    if (criticOk) return { ok: true, content, costUsd: track.costUsd, usageByModel: track.byModel, changed };

    notes = 'the change was not clearly applied or something else regressed';
    if (attempt === maxRetries) {
      // Out of retries: still return the structurally-valid result (better
      // than failing the visitor's prompt outright).
      return { ok: true, content, costUsd: track.costUsd, usageByModel: track.byModel, changed };
    }
  }
  return {
    ok: false,
    costUsd: track.costUsd,
    usageByModel: track.byModel,
    changed: false,
    reason: notes || 'edit failed',
  };
}
