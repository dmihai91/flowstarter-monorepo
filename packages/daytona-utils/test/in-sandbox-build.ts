/**
 * Full in-sandbox autonomous build + live preview + screenshots.
 * Provision → upload industry template + Agent SDK runner → install →
 * autonomous claude Agent-SDK build INSIDE the sandbox → astro dev → public
 * URL → screenshot it → teardown (always).
 *
 *   (cd packages/daytona-utils && npx tsx test/in-sandbox-build.ts)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildSiteInSandbox } from '../src/index.js';
import {
  selectBaseTemplate,
  sampleSpec,
  AGENT_BUILD_SYSTEM,
  buildAgentTask,
} from '../../agentic-codegen/src/index.js';

const REPO = join(process.cwd(), '../..');

function loadKeys(): void {
  const files = [
    '.env.shared',
    'apps/flowstarter-main/.env',
    'apps/flowstarter-main/.env.local',
    'apps/flowstarter-editor/server/.env',
  ];
  for (const k of ['DAYTONA_API_KEY', 'ANTHROPIC_API_KEY']) {
    if (process.env[k]) continue;
    for (const f of files) {
      const p = join(REPO, f);
      if (!existsSync(p)) continue;
      const m = readFileSync(p, 'utf8').match(new RegExp(`^${k}=(.+)$`, 'm'));
      if (m?.[1]) {
        process.env[k] = m[1].trim();
        break;
      }
    }
  }
}

async function shoot(url: string, prefix: string): Promise<string[]> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const shots: string[] = [];
  for (const [name, vp] of [
    ['desktop', { width: 1280, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const out = `${prefix}-${name}.png`;
    await page.screenshot({ path: out, fullPage: name === 'desktop' });
    shots.push(out);
    await ctx.close();
  }
  await browser.close();
  return shots;
}

async function main() {
  loadKeys();
  if (!process.env.DAYTONA_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error('✗ need DAYTONA_API_KEY + ANTHROPIC_API_KEY');
    process.exit(2);
  }
  const base = selectBaseTemplate(sampleSpec);
  const templateDir = join(REPO, base.rootRel);
  const runnerPath = join(REPO, 'packages/agentic-codegen/sandbox/agent-runner.mjs');

  console.log(`▶ in-sandbox autonomous build`);
  console.log(`  business: ${sampleSpec.businessName} (${sampleSpec.industry})`);
  console.log(`  template: ${base.name}\n`);
  const t0 = Date.now();
  let last = '';

  const res = await buildSiteInSandbox(templateDir, {
    projectId: `insb-${Date.now()}`,
    systemPrompt: AGENT_BUILD_SYSTEM,
    taskPrompt: buildAgentTask(sampleSpec),
    runnerPath,
    model: 'claude-sonnet-4-6',
    env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    agentTimeoutMs: 14 * 60_000,
    onProgress: (e) => {
      const tag = `[${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s]`;
      const line = `${e.phase}${e.detail ? ` — ${e.detail}` : ''}`;
      if (line !== last) {
        console.log(`${tag} ${line}`);
        last = line;
      }
    },
  });

  try {
    if (!res.success || !res.previewUrl) {
      console.log(`\n✗ FAILED: ${res.error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`\n✓ live in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    console.log(`  sandbox: ${res.sandboxId}`);
    console.log(`  URL:     ${res.previewUrl}`);
    console.log(`  cost:    $${(res.costUsd ?? 0).toFixed(4)}`);
    const shots = await shoot(res.previewUrl, '/tmp/insb-shot');
    console.log(`  shots:   ${shots.join(', ')}`);
    process.exitCode = 0;
  } finally {
    process.stdout.write('tearing down sandbox… ');
    await res.teardown();
    console.log('deleted.');
  }
}

main().catch((e) => {
  console.error('test error:', e);
  process.exit(1);
});
