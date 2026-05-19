/**
 * Speed harness for the /goal: spec → personalized dorin-portfolio site in
 * ~1–2 min. Reports agent-only generation time (the funnel-latency number)
 * separately from total (incl. build proof).
 *
 *   npx tsx packages/agentic-codegen/test/run.ts [model] [wallClockMs]
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { runCodegen } from '../src/worker.js';
import { sampleSpec } from '../src/spec.js';

const REPO = join(import.meta.dirname, '../../..');
const TARGET_MS = 120_000; // 2 min — the abandonment line

function loadKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return;
  for (const f of ['.env.shared', 'apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local', 'apps/flowstarter-editor/server/.env']) {
    const p = join(REPO, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (m?.[1]) { process.env.ANTHROPIC_API_KEY = m[1].trim(); return; }
  }
}

async function main() {
  loadKey();
  if (!process.env.ANTHROPIC_API_KEY) { console.error('✗ no ANTHROPIC_API_KEY'); process.exit(2); }

  const [model, wall] = process.argv.slice(2);
  console.log(`▶ personalize dorin-portfolio → "${sampleSpec.businessName}" (${sampleSpec.industry})`);
  console.log(`  model=${model ?? 'claude-haiku-4-5'} target≤${TARGET_MS / 1000}s\n`);
  const t0 = Date.now();
  let last = '';

  const r = await runCodegen(sampleSpec, {
    model,
    wallClockMs: wall ? Number(wall) : undefined,
    onEvent: (e) => {
      const s = `[${String(Math.round((Date.now() - t0) / 1000)).padStart(3)}s]`;
      if (e.phase !== last) { console.log(`${s} ${e.phase}${e.detail ? ` — ${e.detail}` : ''}`); last = e.phase; }
    },
  });

  console.log('\n──────── result ────────');
  console.log(`ok:              ${r.ok}`);
  console.log(`generation time: ${(r.generationMs / 1000).toFixed(1)}s   ${r.generationMs <= TARGET_MS ? '✅ under 2 min' : '❌ too slow'}`);
  console.log(`total (w/ build):${(r.totalMs / 1000).toFixed(1)}s`);
  console.log(`content changed: ${r.contentChanged}`);
  console.log(`cost:            $${r.costUsd.toFixed(4)}   turns: ${r.turns}`);
  console.log(`workspace:       ${r.workspaceRoot}`);

  if (r.ok && existsSync(r.indexHtml)) {
    const title = readFileSync(r.indexHtml, 'utf8').match(/<title>([^<]*)<\/title>/i)?.[1] ?? '(none)';
    console.log(`\n✓ SITE OK — ${r.indexHtml} (${statSync(r.indexHtml).size} bytes)`);
    console.log(`  <title>: ${title}`);
    console.log(`  screenshot: node packages/agentic-codegen/test/shoot.mjs ${r.distDir} /tmp/cg-shot`);
    process.exit(r.generationMs <= TARGET_MS ? 0 : 3);
  }
  console.log(`\n✗ FAILED — stage=${r.failure?.stage}`);
  if (r.failure?.log) console.log(r.failure.log.slice(-2000));
  process.exit(1);
}

main().catch((e) => { console.error('harness error:', e); process.exit(1); });
