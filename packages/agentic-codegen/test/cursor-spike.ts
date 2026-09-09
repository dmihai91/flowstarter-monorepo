/**
 * Spike: drive Cursor Composer 2.5 headless via @cursor/sdk (LOCAL agent) to
 * personalize one site-labels.md, and measure it. Proves feasibility + real
 * latency/output BEFORE we rewrite the orchestrator around the agent SDK.
 *
 *   CURSOR_API_KEY=… npx tsx packages/agentic-codegen/test/cursor-spike.ts
 *
 * What it checks: status, wall-clock, that ONLY the content file changed, and
 * that the YAML structure (top-level keys) is preserved.
 */
import { mkdtemp, mkdir, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { Agent, JsonlLocalAgentStore } from '@cursor/sdk';
import { topLevelKeys } from '../src/yaml-blocks';

const REPO = join(import.meta.dirname, '../../..');
function loadKey() {
  if (process.env.CURSOR_API_KEY) return;
  for (const f of ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local', '.env.shared']) {
    const p = join(REPO, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/^CURSOR_API_KEY=(.+)$/m);
    if (m?.[1]) { process.env.CURSOR_API_KEY = m[1].trim().replace(/^["']|["']$/g, ''); return; }
  }
}

const SPEC = {
  businessName: 'Still Point',
  industry: 'Therapy & counselling',
  description:
    'A solo psychotherapy practice in Manchester specialising in grief, pregnancy loss and the perinatal period. Quiet, slow, relational work.',
  audience: 'Adults navigating loss or the transition into parenthood.',
  tone: 'tender, steady, plainspoken, unhurried — never clinical',
};

async function main() {
  loadKey();
  if (!process.env.CURSOR_API_KEY) {
    console.error('✗ no CURSOR_API_KEY (env or .env files)');
    process.exit(2);
  }

  const REL = 'src/content/site-labels.md';
  const src = join(REPO, 'apps/flowstarter-templates/wellness-therapy', REL);
  const cwd = await mkdtemp(join(tmpdir(), 'cursor-spike-'));
  await mkdir(join(cwd, 'src/content'), { recursive: true });
  await cp(src, join(cwd, REL));
  const before = await readFile(join(cwd, REL), 'utf8');

  const instruction = [
    `Rewrite ONLY the file ${REL} so the site reads as this business. Do not create, edit, delete, or run anything else. Do not run shell commands, builds, or servers.`,
    ``,
    `Business: ${SPEC.businessName} — ${SPEC.industry}`,
    `What they do: ${SPEC.description}`,
    `Audience: ${SPEC.audience}`,
    `Tone: ${SPEC.tone}`,
    ``,
    `Rules: change only human-readable text values. Preserve every YAML key, nesting, array item count, href routes and image src paths. Keep YAML valid. Never fabricate real contact details, prices, or quotes. When done, stop.`,
  ].join('\n');

  console.log(`▶ Composer 2.5 (local agent) personalizing ${REL}`);
  console.log(`  cwd: ${cwd}\n`);
  const t0 = Date.now();

  // JSONL store avoids the native sqlite3 default (pnpm skipped its build,
  // and we want a serverless-friendly, dependency-light backend anyway).
  const agent = await Agent.create({
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: 'composer-2.5' },
    local: { cwd, store: new JsonlLocalAgentStore(join(cwd, '.agent-store')) },
  });

  const run = await agent.send(instruction);
  const res = await run.wait();
  const ms = Date.now() - t0;
  agent.close();

  const after = await readFile(join(cwd, REL), 'utf8');
  const changed = after.trim() !== before.trim();
  const keysBefore = topLevelKeys(before.split('---')[1] ?? before);
  const keysAfter = topLevelKeys(after.split('---')[1] ?? after);
  const keysPreserved = JSON.stringify(keysBefore) === JSON.stringify(keysAfter);

  console.log('\n──────── result ────────');
  console.log(`status:          ${res.status}`);
  console.log(`wall-clock:      ${(ms / 1000).toFixed(1)}s  (run.durationMs=${res.durationMs ?? '?'})`);
  console.log(`content changed: ${changed}`);
  console.log(`keys preserved:  ${keysPreserved} (${keysBefore.length} top-level)`);
  console.log(`result summary:  ${(res.result ?? '').slice(0, 200)}`);
  console.log(`\nedited file: ${join(cwd, REL)}`);
  process.exit(res.status === 'finished' && changed && keysPreserved ? 0 : 1);
}

main().catch((e) => {
  console.error('spike error:', e);
  process.exit(1);
});
