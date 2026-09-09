/**
 * Runs INSIDE the Daytona sandbox. FAST single-shot content edit with a
 * gretly-light loop: Kimi K2.6 (implementer) applies one plain-English change
 * to the single site-labels.md, a snappy Haiku critic checks it applied
 * without breaking anything, and we retry once on failure. The live
 * `astro dev` HMR reflects the change in seconds. Structural prompts go to the
 * autonomous agent instead.
 *
 * The sandbox is the source of truth — we read + write the live file in place,
 * so this never drifts from structural edits (unlike a host-side copy).
 *
 * All models go through OpenRouter (fetch; no SDK in the sandbox).
 * Env: FS_SITE_LABELS, FS_INSTRUCTION_FILE, FS_OPENROUTER_KEY,
 *      FS_MODEL (impl, default kimi-k2.6), FS_CRITIC_MODEL (default haiku).
 * Stdout: one JSON line ({type:'done',costUsd,tokensIn,tokensOut} | {type:'error'}).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const labelsPath = process.env.FS_SITE_LABELS;
const key = process.env.FS_OPENROUTER_KEY;
const model = process.env.FS_MODEL || 'moonshotai/kimi-k2.6';
const criticModel = process.env.FS_CRITIC_MODEL || 'anthropic/claude-haiku-4.5';

let tokensIn = 0;
let tokensOut = 0;
let costUsd = 0;

async function chat(useModel, system, user, { temperature = 0.4, maxTokens = 8000 } = {}) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: useModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
      // "Fast mode": route to the highest-throughput provider (cut a Kimi
      // rewrite from a 120s timeout to ~30s).
      provider: { sort: 'throughput' },
      usage: { include: true },
    }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}`);
  const j = await res.json();
  const u = j.usage ?? {};
  tokensIn += u.prompt_tokens ?? 0;
  tokensOut += u.completion_tokens ?? 0;
  if (typeof u.cost === 'number') costUsd += u.cost;
  return (j.choices?.[0]?.message?.content ?? '').trim();
}

/**
 * Ordered top-level blocks of a YAML frontmatter body. A block starts at an
 * unindented `key:` line and runs until the next one; anything before the
 * first key (comments) is a keyless block that stays in place.
 */
export function splitTopLevelBlocks(yaml) {
  const blocks = [];
  let current = null;
  for (const line of yaml.split('\n')) {
    const m = /^([A-Za-z_][\w-]*):/.exec(line);
    if (m) {
      current = { key: m[1], lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      current = { key: null, lines: [line] };
      blocks.push(current);
    }
  }
  return blocks;
}

/**
 * The repair that makes partial replies fine: the model's blocks replace the
 * original's same-keyed blocks, everything it did not mention survives
 * untouched, and top-level keys it invented are dropped (typed accessors
 * would never read them, and a hallucinated section must not ship). This is
 * what turned a ~25% per-edit success rate into the normal case — kimi
 * habitually returns only the sections it changed, and both old guards
 * (`too short`, `lost N/M keys`) were punishing exactly that.
 */
export function mergeFrontmatter(origYaml, modelYaml) {
  const original = splitTopLevelBlocks(origYaml);
  const replacements = new Map();
  for (const block of splitTopLevelBlocks(modelYaml)) {
    if (block.key) replacements.set(block.key, block.lines.join('\n'));
  }
  let replaced = 0;
  const parts = original.map((block) => {
    if (block.key && replacements.has(block.key)) {
      replaced += 1;
      return replacements.get(block.key).replace(/\n+$/, '');
    }
    return block.lines.join('\n').replace(/\n+$/, '');
  });
  return { yaml: parts.join('\n'), replaced };
}

/** Strip fences / stray --- and re-wrap in the original frontmatter envelope. */
export function assemble(original, modelText) {
  const fm = original.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const origYaml = fm ? fm[1] : original;
  const body = fm ? fm[2] : '';
  let yaml = modelText.trim();
  const fence = yaml.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fence) yaml = fence[1].trim();
  yaml = yaml.replace(/^---\s*\n/, '').replace(/\n---\s*$/, '').trim();

  const topKeys = (s) => new Set((s.match(/^[A-Za-z_][\w-]*:/gm) ?? []).map((k) => k.trim()));
  const want = topKeys(origYaml);
  const got = topKeys(yaml);
  const missing = Array.from(want).filter((k) => !got.has(k));
  if (missing.length > 0) {
    const merged = mergeFrontmatter(origYaml, yaml);
    if (merged.replaced === 0) {
      return { ok: false, reason: 'no known sections in the reply' };
    }
    yaml = merged.yaml;
  }

  // Backstops only — after a merge both hold by construction.
  if (yaml.length < origYaml.length * 0.4) return { ok: false, reason: 'too short' };
  return { ok: true, content: fm ? `---\n${yaml}\n---\n${body}` : `${yaml}\n` };
}

const SYSTEM =
  'You apply ONE change to a website YAML content file (markdown frontmatter); ' +
  'every component reads it via typed accessors. Output ONLY updated YAML ' +
  'content — no code fences, no --- lines, no commentary. You may output just ' +
  'the top-level sections you changed, each complete from its unindented ' +
  '`key:` line down; unchanged sections may be omitted and will be kept as ' +
  'they are. Apply only the requested change; within a section you output, ' +
  'preserve every other value, all keys, nesting, array item shapes/counts, ' +
  'href routes and image src paths. Keep YAML valid (indentation; quote ' +
  'strings with colons; preserve block scalars |). Human, specific copy; ' +
  'never fabricate real contact details, prices or quotes.';

// Importable for tests: the run only starts when executed as a script.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
try {
  if (!labelsPath || !key) {
    out({ type: 'error', message: 'missing FS_SITE_LABELS or FS_OPENROUTER_KEY' });
    process.exit(2);
  }
  const original = readFileSync(labelsPath, 'utf8');
  const instruction = readFileSync(process.env.FS_INSTRUCTION_FILE, 'utf8').trim();

  let notes = '';
  let accepted = null;
  for (let attempt = 0; attempt <= 1; attempt++) {
    const task =
      `Change requested by the site owner:\n"${instruction}"\n` +
      (notes ? `\nA previous attempt fell short: ${notes}\n` : '') +
      `\nCurrent file:\n${original}\n\nOutput the updated YAML now — the changed top-level sections in full, or the whole file. Nothing else.`;

    let asm;
    try {
      asm = assemble(original, await chat(model, SYSTEM, task, { temperature: 0.4 }));
    } catch (e) {
      notes = String(e?.message || e);
      continue;
    }
    if (!asm.ok) {
      notes = asm.reason;
      continue;
    }

    // Snappy critic — applied + nothing else broken?
    let verdict = { applied: true, intact: true };
    try {
      const raw = await chat(
        criticModel,
        'You check whether ONE requested change was applied to a website content file without breaking anything else. Reply ONLY JSON: {"applied":<bool>,"intact":<bool>}.',
        `Requested change: "${instruction}"\n\nResulting file:\n${asm.content}\n\nWas the change applied, and is everything else intact?`,
        { temperature: 0, maxTokens: 200 }
      );
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) verdict = JSON.parse(m[0]);
    } catch {
      /* fail-open: if the critic is unavailable, accept the valid result */
    }

    if (verdict.applied !== false && verdict.intact !== false) {
      accepted = asm.content;
      break;
    }
    notes = 'the change was not clearly applied or something else regressed';
    if (attempt === 1) accepted = asm.content; // out of retries → accept valid result
  }

  if (!accepted) {
    out({ type: 'error', message: notes || 'edit failed' });
    process.exit(1);
  }
  writeFileSync(labelsPath, accepted, 'utf8');
  out({ type: 'done', costUsd, tokensIn, tokensOut });
  process.exit(0);
} catch (e) {
  out({ type: 'error', message: String(e?.message || e).slice(0, 300) });
  process.exit(1);
}
}
