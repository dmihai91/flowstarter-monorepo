/**
 * Quality-review batch: generates a site per brief and leaves each one built
 * and served, so the output can be judged across industries and languages in
 * one pass rather than one favourable case at a time.
 *
 * Runs sequentially — the preview agent is the expensive step and a parallel
 * run makes provider throttling look like a pipeline defect.
 *
 *   npx tsx e2e/support/run-batch.mjs [key ...]
 */
import { readFileSync } from 'node:fs';
import { mkdir, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { BRIEFS } from './briefs.mjs';

process.env.NODE_ENV ??= 'development';
const { PiSdkFlowstarterAgents, FlowstarterMcpTemplateLibrary, PreviewGenerationPipeline } =
  await import('../../packages/agentic-codegen/src/index.ts');
const { TemplateClassifier, MiniLmOnnxEmbedder } =
  await import('../../packages/agentic-codegen/src/flowstarter/template-classifier.ts');

const env = Object.fromEntries(readFileSync('apps/flowstarter-main/.env.local','utf8')
  .split('\n').filter(l=>/^[A-Z]/.test(l)).map(l=>[l.split('=')[0], l.split('=').slice(1).join('=').trim()]));

const only = process.argv.slice(2);
const briefs = only.length ? BRIEFS.filter(b => only.includes(b.key)) : BRIEFS;
if (briefs.length === 0) {
  console.error(`No briefs matched. Available: ${BRIEFS.map(b=>b.key).join(', ')}`);
  process.exit(1);
}

const PREVIEW_MODEL = process.env.SCENARIO_PREVIEW_MODEL || 'z-ai/glm-5.2';
const agents = new PiSdkFlowstarterAgents({
  provider: 'openrouter', modelId: 'z-ai/glm-5.2',
  apiKey: env.OPENROUTER_API_KEY, thinkingLevel: 'medium', timeoutMs: 420_000, maxOutputTokens: 24_000,
  roles: { preview: { modelId: PREVIEW_MODEL, maxOutputTokens: 30_000, timeoutMs: 900_000 } },
});
const library = new FlowstarterMcpTemplateLibrary({
  endpoint: 'http://127.0.0.1:3001/mcp',
  internalToken: 'e2e-local-mcp-internal-token-0123456789abcdef0123',
});
const classifier = new TemplateClassifier(
  new MiniLmOnnxEmbedder(process.env.SIGMA_MODEL_DIR || '/Users/darius91/Projects/sigma_model/out_v5'),
);

// The same real-build validator the single scenarios use: a site that only
// fails in the browser must not count as a passing sample.
const validator = { validate: async (root, phase) => {
  if (phase !== 'preview') throw new Error('unexpected phase');
  const pkgName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name ?? '';
  const slug = pkgName.replace('@flowstarter/template-', '');
  const deps = resolve('apps/flowstarter-templates', slug, 'node_modules');
  try { await symlink(deps, join(root, 'node_modules'), 'dir'); } catch { /* linked */ }
  const build = spawnSync(resolve(deps, '.bin', 'astro'), ['build'], {
    cwd: root, encoding: 'utf8', timeout: 240_000,
  });
  await rm(join(root, 'node_modules'), { recursive: true, force: true });
  if (build.status !== 0) {
    throw new Error(`astro build failed:\n${`${build.stdout ?? ''}\n${build.stderr ?? ''}`.trim().slice(-2000)}`);
  }
}};

/** Serves each finished site on its own port so several can be compared live. */
let nextPort = Number(process.env.BATCH_BASE_PORT || 8910);
const servers = [];
function publisherFor(key) {
  return { publish: async (input) => {
    const deps = resolve('apps/flowstarter-templates', input.template.slug, 'node_modules');
    const localRoot = join(tmpdir(), 'flowstarter-batch', key);
    await mkdir(join(tmpdir(), 'flowstarter-batch'), { recursive: true });
    await rm(localRoot, { recursive: true, force: true });
    await cp(input.workspaceRoot, localRoot, { recursive: true });
    await symlink(deps, join(localRoot, 'node_modules'), 'dir');
    const port = nextPort++;
    const child = spawn(resolve(deps, '.bin', 'astro'),
      ['dev', '--port', String(port), '--host', '127.0.0.1'],
      { cwd: localRoot, stdio: 'ignore', detached: true });
    child.unref();
    servers.push({ key, port, pid: child.pid });
    await new Promise(r => setTimeout(r, 9000));
    return { previewUrl: `http://127.0.0.1:${port}`, artifactUrl: `local://${localRoot}`, files: [] };
  }};
}

function evidenceFor(brief, projectId, now) {
  const intake = {
    projectId,
    business: {
      name: brief.name,
      niche: brief.niche,
      location: brief.location,
      description: brief.description,
      targetAudience: brief.audience,
      primaryGoal: brief.goal,
    },
    socialMedia: [],
    locale: brief.locale,
    submittedAt: now,
    consent: { publicProfileAnalysis: false, acceptedAt: now },
  };
  const documents = [
    { sourceId: 'intake', platform: 'intake', kind: 'intake_answer', text: brief.description },
    ...brief.answers.map((text, i) => ({
      sourceId: `answer-${i + 1}`, platform: 'intake', kind: 'intake_answer', text,
    })),
  ];
  return { intake, corpus: { projectId, documents, images: [], completedAt: now } };
}

const results = [];
for (const brief of briefs) {
  const projectId = randomUUID();
  const now = new Date().toISOString();
  const { intake, corpus } = evidenceFor(brief, projectId, now);
  const pipeline = new PreviewGenerationPipeline(
    agents, library, validator, publisherFor(brief.key), classifier,
    {
      fullTemplateContext: true,
      qualitySweep: true,
      teaser: {
        keepHomeSections: 5,
        keepSubpageSections: 2,
        unlockUrl: `${process.env.SCENARIO_APP_ORIGIN || 'http://localhost:3000'}/unlock/${projectId}`,
      },
    },
  );
  const started = Date.now();
  process.stdout.write(`\n=== ${brief.key} — ${brief.name} (${brief.locale}) ===\n`);
  try {
    const result = await pipeline.run({
      intake, corpus, cachedAssets: [],
      onPhase: (p) => console.log(`  [${brief.key}] ${p}`),
    });
    results.push({
      key: brief.key, ok: true, template: result.template.slug,
      url: result.previewUrl, headline: result.brandConfig.voice.sampleHeadline,
      minutes: ((Date.now() - started) / 60000).toFixed(1),
    });
  } catch (error) {
    results.push({
      key: brief.key, ok: false,
      error: error instanceof Error ? error.message.slice(0, 300) : String(error),
      minutes: ((Date.now() - started) / 60000).toFixed(1),
    });
  }
}

console.log('\n=== BATCH SUMMARY ===');
for (const r of results) {
  console.log(r.ok
    ? `PASS ${r.key.padEnd(16)} ${String(r.template).padEnd(22)} ${r.url}  (${r.minutes}m)\n     ${r.headline}`
    : `FAIL ${r.key.padEnd(16)} ${r.error}  (${r.minutes}m)`);
}
console.log(`\n${results.filter(r=>r.ok).length}/${results.length} generated. Servers stay up for review; stop them with:`);
console.log(`  kill ${servers.map(s=>s.pid).join(' ')}`);
await library.close();
