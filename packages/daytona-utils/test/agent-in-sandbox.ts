/**
 * Keystone de-risk for "autonomous claude agent inside Daytona":
 * provision sandbox → install the claude CLI in it → run a real autonomous
 * tool-using task (write a file) authenticated via ANTHROPIC_API_KEY →
 * verify the file → ALWAYS delete the sandbox.
 *
 *   (cd packages/daytona-utils && npx tsx test/agent-in-sandbox.ts)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getClient } from '../src/index.js';

const REPO = join(process.cwd(), '../..');

function loadKeys(): void {
  const p = join(REPO, '.env.shared');
  if (!existsSync(p)) return;
  const txt = readFileSync(p, 'utf8');
  for (const k of ['DAYTONA_API_KEY', 'ANTHROPIC_API_KEY']) {
    if (process.env[k]) continue;
    const m = txt.match(new RegExp(`^${k}=(.+)$`, 'm'));
    if (m?.[1]) process.env[k] = m[1].trim();
  }
}

async function main() {
  loadKeys();
  // ANTHROPIC_API_KEY isn't in .env.shared; pull from main app envs.
  if (!process.env.ANTHROPIC_API_KEY) {
    for (const f of ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local', 'apps/flowstarter-editor/server/.env']) {
      const p = join(REPO, f);
      if (existsSync(p)) {
        const m = readFileSync(p, 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m);
        if (m?.[1]) { process.env.ANTHROPIC_API_KEY = m[1].trim(); break; }
      }
    }
  }
  if (!process.env.DAYTONA_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error('✗ need DAYTONA_API_KEY + ANTHROPIC_API_KEY');
    process.exit(2);
  }

  const client = getClient({ DAYTONA_API_KEY: process.env.DAYTONA_API_KEY });
  const t0 = Date.now();
  const log = (m: string) => console.log(`[${String(Math.round((Date.now() - t0) / 1000)).padStart(3)}s] ${m}`);

  log('provisioning sandbox (node image)…');
  const sandbox = await client.create(
    {
      language: 'javascript',
      envVars: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
      autoStopInterval: 15,
      labels: { source: 'flowstarter', purpose: 'agent-derisk' },
    },
    { timeout: 150 }
  );
  log(`sandbox ${sandbox.id}`);

  try {
    const wd = (await sandbox.getWorkDir().catch(() => '')) || '/home/daytona';
    log(`workdir ${wd}`);

    log('node/npm versions…');
    const ver = await sandbox.process.executeCommand('node -v; npm -v', wd, undefined, 30);
    log(ver.result?.trim().replace(/\n/g, ' / ') ?? '(none)');

    log('installing @anthropic-ai/claude-code (global)…');
    const inst = await sandbox.process.executeCommand(
      'npm i -g @anthropic-ai/claude-code 2>&1 | tail -2 && which claude && claude --version',
      wd,
      undefined,
      240
    );
    log(`claude install: ${inst.result?.trim().split('\n').slice(-2).join(' | ') ?? 'n/a'} (exit ${inst.exitCode})`);

    log('running AUTONOMOUS agent task in-sandbox (write a file with tools)…');
    const run = await sandbox.process.executeCommand(
      `claude -p "Create a file named PROOF.txt in the current directory containing exactly: AGENT_OK. Then stop." ` +
        `--permission-mode bypassPermissions --dangerously-skip-permissions --model claude-haiku-4-5 --output-format json`,
      wd,
      { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
      180
    );
    log(`agent exit ${run.exitCode}; output tail: ${(run.result ?? '').trim().slice(-160)}`);

    const proof = await sandbox.process.executeCommand('cat PROOF.txt 2>/dev/null || echo MISSING', wd, undefined, 15);
    const ok = (proof.result ?? '').includes('AGENT_OK');
    console.log(`\n${ok ? '✓ AUTONOMOUS AGENT RAN IN SANDBOX' : '✗ FAILED'} — PROOF.txt: ${proof.result?.trim()}`);
    process.exitCode = ok ? 0 : 1;
  } finally {
    process.stdout.write('tearing down… ');
    await client.delete(sandbox).catch(() => {});
    console.log('deleted.');
  }
}

main().catch((e) => {
  console.error('derisk error:', e);
  process.exit(1);
});
