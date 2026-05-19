import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { DiscoverySpec } from './spec';
import { buildSystemPrompt, buildTaskPrompt } from './prompt';
import {
  createWorkspace,
  selectBaseTemplate,
  BASE_TEMPLATES,
  TEMPLATE_CATALOG,
} from './workspace';
import { runBuild } from './build';

export interface CodegenEvent {
  phase: string;
  detail?: string;
}

export interface CodegenOptions {
  baseOverride?: string;
  /** Default 'claude-haiku-4-5' — single-shot content rewrite needs speed. */
  model?: string;
  /** Native CLI hard cost ceiling. Default 1 USD. */
  maxBudgetUsd?: number;
  /** Wall-clock kill for the single generation call. Default 150s. */
  wallClockMs?: number;
  /** astro build afterwards to prove the personalized site compiles. */
  verifyBuild?: boolean;
  keepWorkspace?: boolean;
  onEvent?: (e: CodegenEvent) => void;
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
  /** The number the funnel latency budget cares about: the LLM call. */
  generationMs: number;
  totalMs: number;
  contentChanged: boolean;
  failure?: { stage: 'generation' | 'invalid-output' | 'build'; log: string };
  cleanup: () => Promise<void>;
}

interface GenOut {
  resultText: string;
  costUsd: number;
  ok: boolean;
  err?: string;
}

/**
 * Single-shot, tool-less generation. No --add-dir (so the CLI never scans the
 * 130MB workspace — that was the 175s killer), neutral cwd, JSON output. The
 * model returns the rewritten file body as text; the worker writes it.
 */
function runGeneration(
  systemPrompt: string,
  taskPrompt: string,
  model: string,
  maxBudgetUsd: number,
  wallClockMs: number
): Promise<GenOut> {
  return new Promise((resolve) => {
    const child = spawn(
      'claude',
      [
        '-p',
        taskPrompt,
        '--append-system-prompt',
        systemPrompt,
        '--output-format',
        'json',
        '--model',
        model,
        '--max-budget-usd',
        String(maxBudgetUsd),
      ],
      { cwd: tmpdir(), env: { ...process.env } }
    );
    let out = '';
    let err = '';
    child.stdout.on('data', (b: Buffer) => (out += b.toString()));
    child.stderr.on('data', (b: Buffer) => (err += b.toString()));
    const timer = setTimeout(() => child.kill('SIGKILL'), wallClockMs);
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const j = JSON.parse(out) as {
          result?: string;
          total_cost_usd?: number;
          is_error?: boolean;
          subtype?: string;
        };
        resolve({
          resultText: j.result ?? '',
          costUsd: j.total_cost_usd ?? 0,
          ok: !j.is_error && j.subtype === 'success' && !!j.result,
          err: j.is_error ? j.subtype : undefined,
        });
      } catch {
        resolve({ resultText: '', costUsd: 0, ok: false, err: err.slice(-300) || 'no JSON' });
      }
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ resultText: '', costUsd: 0, ok: false, err: String(e) });
    });
  });
}

/** Split a markdown-frontmatter file into its `---` envelope + body. */
function splitFrontmatter(raw: string): { hasFm: boolean; yaml: string; body: string } {
  const m = raw.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { hasFm: false, yaml: raw, body: '' };
  return { hasFm: true, yaml: m[1] ?? '', body: m[2] ?? '' };
}

/** Strip code fences / stray `---` lines / prose the model may have added. */
function cleanYaml(text: string): string {
  let t = text.trim();
  const fence = t.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fence) t = fence[1]!.trim();
  t = t.replace(/^---\s*\n/, '').replace(/\n---\s*$/, '').trim();
  return t;
}

/**
 * Rebuild the content file from the model's YAML, re-wrapping it in the
 * ORIGINAL frontmatter envelope (the model tends to drop the `---`), and
 * sanity-check structure so we never write garbage that silently breaks
 * every component.
 */
function assembleAndValidate(
  originalRaw: string,
  modelText: string
): { ok: boolean; content?: string; reason?: string } {
  const orig = splitFrontmatter(originalRaw);
  const yaml = cleanYaml(modelText);
  if (yaml.length < orig.yaml.length * 0.4) {
    return { ok: false, reason: `output too short (${yaml.length} vs ${orig.yaml.length})` };
  }
  const topKeys = (s: string) =>
    new Set((s.match(/^[a-zA-Z_][\w]*:/gm) ?? []).map((k) => k.trim()));
  const want = topKeys(orig.yaml);
  const got = topKeys(yaml);
  const missing = Array.from(want).filter((k) => !got.has(k));
  // site-data.ts accessors are fallback-safe, but a wholesale key loss means
  // the model reformatted instead of personalizing — reject it.
  if (want.size > 0 && missing.length > want.size * 0.25) {
    return { ok: false, reason: `lost ${missing.length}/${want.size} top-level keys` };
  }
  const content = orig.hasFm ? `---\n${yaml}\n---\n${orig.body}` : `${yaml}\n`;
  return { ok: true, content };
}

/**
 * LLM template router: pick the best-fit template from the catalog for this
 * spec (a fast Haiku call). Far better than keyword regex for fuzzy cases
 * (e.g. a fashion-guide creator → creative-portfolio, not the regex's
 * professional-services default). Fail-safe: returns null on any
 * error/timeout so the caller falls back to the regex selector.
 */
async function classifyTemplate(spec: DiscoverySpec): Promise<string | null> {
  try {
    const system =
      'You choose the single best website template for a business. Reply with ONLY the template id — no other text.';
    const task = [
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
    const g = await runGeneration(system, task, 'claude-haiku-4-5', 0.2, 20_000);
    if (!g.ok || !g.resultText) return null;
    const out = g.resultText.toLowerCase();
    for (const { id } of TEMPLATE_CATALOG) if (out.includes(id)) return id;
    return null;
  } catch {
    return null;
  }
}

/**
 * Discovery spec in → personalized industry-matched site out, fast: LLM
 * template routing, warm workspace (no install), one tool-less LLM call
 * rewriting the single content file, envelope-safe write, optional build.
 */
export async function runCodegen(
  spec: DiscoverySpec,
  options: CodegenOptions = {}
): Promise<CodegenResult> {
  const t0 = Date.now();
  const model = options.model ?? 'claude-haiku-4-5';
  const maxBudgetUsd = options.maxBudgetUsd ?? 1;
  const wallClockMs = options.wallClockMs ?? 150_000;
  const verifyBuild = options.verifyBuild ?? true;

  let base;
  if (options.baseOverride && BASE_TEMPLATES[options.baseOverride]) {
    base = BASE_TEMPLATES[options.baseOverride]!;
  } else {
    options.onEvent?.({ phase: 'Choosing the best template for you' });
    const chosen = await classifyTemplate(spec);
    base =
      chosen && BASE_TEMPLATES[chosen]
        ? BASE_TEMPLATES[chosen]!
        : selectBaseTemplate(spec);
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
    cleanup: ws.cleanup,
  };

  options.onEvent?.({ phase: 'Personalizing your site' });
  const tGen = Date.now();
  const gen = await runGeneration(
    buildSystemPrompt(),
    buildTaskPrompt(spec, ws.contentFile, ws.contentBefore),
    model,
    maxBudgetUsd,
    wallClockMs
  );
  result.generationMs = Date.now() - tGen;
  result.costUsd = gen.costUsd;

  if (!gen.ok || !gen.resultText) {
    result.failure = { stage: 'generation', log: gen.err ?? 'no result' };
    result.totalMs = Date.now() - t0;
    if (options.keepWorkspace === false) await ws.cleanup();
    return result;
  }

  const asm = assembleAndValidate(ws.contentBefore, gen.resultText);
  if (!asm.ok || !asm.content) {
    result.failure = { stage: 'invalid-output', log: asm.reason ?? 'unknown' };
    result.totalMs = Date.now() - t0;
    if (options.keepWorkspace === false) await ws.cleanup();
    return result;
  }
  await writeFile(ws.contentFile, asm.content, 'utf8');
  result.contentChanged = asm.content.trim() !== ws.contentBefore.trim();

  if (!verifyBuild) {
    result.ok = result.contentChanged;
    result.totalMs = Date.now() - t0;
    options.onEvent?.({ phase: 'Done', detail: `${(result.generationMs / 1000).toFixed(1)}s` });
    return result;
  }

  options.onEvent?.({ phase: 'Verifying build' });
  const build = await runBuild(ws.buildDir, { installTimeoutMs: 60_000 });
  result.ok = build.ok && result.contentChanged;
  if (!build.ok) result.failure = { stage: 'build', log: build.log };
  result.totalMs = Date.now() - t0;
  if (options.keepWorkspace === false) await ws.cleanup();
  options.onEvent?.({
    phase: result.ok ? 'Done' : 'Build failed',
    detail: `gen ${(result.generationMs / 1000).toFixed(1)}s`,
  });
  return result;
}

export interface EditResult {
  ok: boolean;
  costUsd: number;
  changed: boolean;
  /** The new file content (also written to disk) — caller pushes it to the sandbox. */
  content?: string;
  failure?: string;
}

/**
 * Apply ONE plain-English instruction to the site's single content file
 * (the 15-prompt edit loop). Same fast single-shot path as generation:
 * tool-less, structure-preserving, envelope-safe. The caller pushes the new
 * content into the running sandbox for HMR.
 */
export async function editContent(
  contentFile: string,
  instruction: string,
  opts: { model?: string; maxBudgetUsd?: number; wallClockMs?: number } = {}
): Promise<EditResult> {
  const model = opts.model ?? 'claude-haiku-4-5';
  const maxBudgetUsd = opts.maxBudgetUsd ?? 0.5;
  const wallClockMs = opts.wallClockMs ?? 120_000;

  let current: string;
  try {
    current = await readFile(contentFile, 'utf8');
  } catch {
    return { ok: false, costUsd: 0, changed: false, failure: 'content file missing' };
  }

  const system = [
    `You apply ONE change to a website's YAML content file (markdown frontmatter). Every component reads from it through typed accessors.`,
    `# Output contract
- Your ENTIRE response is the complete updated file content: no code fences, no \`---\` lines, no commentary.
- Apply only the requested change. Preserve every other value, all keys, nesting, array item shapes/counts, \`href\` routes and image \`src\` paths.
- Keep YAML valid (indentation; quote strings with colons; preserve block scalars \`|\`). Human, specific copy; never fabricate real contact details, prices, or quotes.`,
  ].join('\n\n');
  const task = `Change requested by the site owner:\n"${instruction}"\n\nCurrent file:\n${current}\n\nOutput the complete updated file now — only the file.`;

  const gen = await runGeneration(system, task, model, maxBudgetUsd, wallClockMs);
  if (!gen.ok || !gen.resultText) {
    return { ok: false, costUsd: gen.costUsd, changed: false, failure: gen.err ?? 'no result' };
  }
  const asm = assembleAndValidate(current, gen.resultText);
  if (!asm.ok || !asm.content) {
    return { ok: false, costUsd: gen.costUsd, changed: false, failure: asm.reason };
  }
  await writeFile(contentFile, asm.content, 'utf8');
  return {
    ok: true,
    costUsd: gen.costUsd,
    changed: asm.content.trim() !== current.trim(),
    content: asm.content,
  };
}
