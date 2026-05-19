/**
 * Live Daytona preview smoke: push a real template into a sandbox, get a
 * public URL, verify it serves, then ALWAYS tear the sandbox down.
 *
 *   (cd packages/daytona-utils && npx tsx test/preview-smoke.ts [siteDir])
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { previewInSandbox } from '../src/index.js';

// Run from packages/daytona-utils (npx tsx test/preview-smoke.ts).
const REPO = join(process.cwd(), '../..');
const siteDir =
  process.argv[2] ?? join(REPO, 'apps/flowstarter-templates/wellness-therapy');

function loadKey(): void {
  if (process.env.DAYTONA_API_KEY) return;
  const p = join(REPO, '.env.shared');
  if (existsSync(p)) {
    const m = readFileSync(p, 'utf8').match(/^DAYTONA_API_KEY=(.+)$/m);
    if (m?.[1]) process.env.DAYTONA_API_KEY = m[1].trim();
  }
}

async function main() {
  loadKey();
  if (!process.env.DAYTONA_API_KEY) {
    console.error('✗ no DAYTONA_API_KEY');
    process.exit(2);
  }
  console.log(`▶ live preview smoke — site: ${siteDir}`);
  const t0 = Date.now();
  let last = -1;

  const res = await previewInSandbox(siteDir, {
    projectId: `preview-smoke-${Date.now()}`,
    onProgress: (step, msg) => {
      if (step !== last) {
        console.log(`[${String(Math.round((Date.now() - t0) / 1000)).padStart(3)}s] step ${step}/8 — ${msg}`);
        last = step;
      }
    },
  });

  try {
    if (!res.success) {
      console.log(`\n✗ FAILED at step ${res.failedAtStep}: ${res.error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`\n✓ preview up in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  sandbox:  ${res.sandboxId}`);
    console.log(`  URL:      ${res.previewUrl}`);

    // Verify it actually serves HTML.
    const ctrl = AbortSignal.timeout(20000);
    const r = await fetch(res.previewUrl!, { signal: ctrl }).catch((e) => {
      console.log(`  fetch err: ${String(e).slice(0, 120)}`);
      return null;
    });
    if (r) {
      const body = await r.text();
      const hasHtml = /<html|<!doctype html/i.test(body);
      console.log(`  HTTP ${r.status}, ${body.length}b, looks like HTML: ${hasHtml}`);
      const title = body.match(/<title>([^<]*)<\/title>/i)?.[1];
      if (title) console.log(`  <title>: ${title}`);
      process.exitCode = r.status === 200 && hasHtml ? 0 : 1;
    } else {
      process.exitCode = 1;
    }
  } finally {
    process.stdout.write('tearing down sandbox… ');
    await res.teardown();
    console.log('done (deleted).');
  }
}

main().catch((e) => {
  console.error('smoke error:', e);
  process.exit(1);
});
