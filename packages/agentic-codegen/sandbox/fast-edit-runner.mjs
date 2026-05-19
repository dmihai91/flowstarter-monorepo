/**
 * Runs INSIDE the Daytona sandbox. FAST single-shot content edit: reads the
 * one site-labels.md, asks claude (one tool-less completion) to apply a
 * plain-English change preserving the YAML contract, writes it back. No
 * agent loop, no tools, no astro build — the live `astro dev` HMR reflects
 * the change in seconds. Used for content/copy/palette prompts; structural
 * prompts go to the autonomous agent instead.
 *
 * Env: FS_SITE_LABELS, FS_INSTRUCTION_FILE, FS_CLAUDE_BIN, FS_MODEL,
 *      ANTHROPIC_API_KEY.  Stdout: one JSON line ({type:'done'|'error'}).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const labelsPath = process.env.FS_SITE_LABELS;
const claudeBin = process.env.FS_CLAUDE_BIN || 'claude';
const model = process.env.FS_MODEL || 'claude-haiku-4-5';

try {
  if (!labelsPath || !process.env.ANTHROPIC_API_KEY) {
    out({ type: 'error', message: 'missing FS_SITE_LABELS or ANTHROPIC_API_KEY' });
    process.exit(2);
  }
  const original = readFileSync(labelsPath, 'utf8');
  const instruction = readFileSync(process.env.FS_INSTRUCTION_FILE, 'utf8').trim();

  // Preserve the markdown frontmatter envelope (the model tends to drop ---).
  const fm = original.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const origYaml = fm ? fm[1] : original;
  const body = fm ? fm[2] : '';

  const system =
    'You apply ONE change to a website YAML content file (markdown ' +
    'frontmatter); every component reads it via typed accessors. Output ' +
    'ONLY the complete updated file content — no code fences, no --- lines, ' +
    'no commentary. Apply only the requested change; preserve every other ' +
    'value, all keys, nesting, array item shapes/counts, href routes and ' +
    'image src paths. Keep YAML valid (indentation; quote strings with ' +
    'colons; preserve block scalars |). Human, specific copy; never ' +
    'fabricate real contact details, prices or quotes.';
  const task =
    `Change requested by the site owner:\n"${instruction}"\n\n` +
    `Current file:\n${original}\n\n` +
    `Output the complete updated file now — only the file.`;

  const raw = execFileSync(
    claudeBin,
    [
      '-p',
      task,
      '--append-system-prompt',
      system,
      '--output-format',
      'json',
      '--model',
      model,
    ],
    { input: '', encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: process.env }
  );

  let resultText = '';
  let costUsd = 0;
  try {
    const j = JSON.parse(raw);
    resultText = j.result ?? '';
    costUsd = j.total_cost_usd ?? 0;
    if (j.is_error || j.subtype !== 'success' || !resultText) {
      out({ type: 'error', message: 'model returned no result' });
      process.exit(1);
    }
  } catch {
    out({ type: 'error', message: 'unparseable model output' });
    process.exit(1);
  }

  // Sanitize: strip code fences / stray --- lines.
  let yaml = resultText.trim();
  const fence = yaml.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fence) yaml = fence[1].trim();
  yaml = yaml.replace(/^---\s*\n/, '').replace(/\n---\s*$/, '').trim();

  // Structural sanity: don't write garbage that silently breaks every component.
  if (yaml.length < origYaml.length * 0.4) {
    out({ type: 'error', message: 'output too short — rejected' });
    process.exit(1);
  }
  const topKeys = (s) => new Set((s.match(/^[a-zA-Z_][\w]*:/gm) ?? []).map((k) => k.trim()));
  const want = topKeys(origYaml);
  const got = topKeys(yaml);
  const missing = Array.from(want).filter((k) => !got.has(k));
  if (want.size > 0 && missing.length > want.size * 0.25) {
    out({ type: 'error', message: `lost ${missing.length}/${want.size} keys — rejected` });
    process.exit(1);
  }

  const final = fm ? `---\n${yaml}\n---\n${body}` : `${yaml}\n`;
  writeFileSync(labelsPath, final, 'utf8');
  out({ type: 'done', costUsd });
  process.exit(0);
} catch (e) {
  out({ type: 'error', message: String(e?.message || e).slice(0, 300) });
  process.exit(1);
}
