/**
 * Records one full preview generation and renders it as a readable HTML
 * report: every phase with its duration, every agent pass and what triggered
 * it, the decisions the trusted guards forced, and the artwork the agent
 * chose. Written for reviewing the pipeline's behaviour, not for demos —
 * repair passes and their feedback are shown, not hidden.
 *
 *   npx tsx e2e/support/record-run.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { mkdir, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

process.env.NODE_ENV ??= 'development';
const { PiSdkFlowstarterAgents, FlowstarterMcpTemplateLibrary, PreviewGenerationPipeline } =
  await import('../../packages/agentic-codegen/src/index.ts');
const { TemplateClassifier, MiniLmOnnxEmbedder } =
  await import('../../packages/agentic-codegen/src/flowstarter/template-classifier.ts');

const env = Object.fromEntries(readFileSync('apps/flowstarter-main/.env.local','utf8')
  .split('\n').filter(l=>/^[A-Z]/.test(l)).map(l=>[l.split('=')[0], l.split('=').slice(1).join('=').trim()]));

const projectId = randomUUID();
const now = new Date().toISOString();
const t0 = Date.now();
const events = [];
const passes = [];
const rel = () => ((Date.now() - t0) / 1000).toFixed(1);

const { BRIEFS } = await import('./briefs.mjs');
const briefKey = process.argv[2] || 'portfolio-en';
const brief = BRIEFS.find((b) => b.key === briefKey);
if (!brief) {
  console.error(`Unknown brief ${briefKey}. Available: ${BRIEFS.map(b=>b.key).join(', ')}`);
  process.exit(1);
}

// Intake-only evidence keeps a recorded run reproducible: it does not depend
// on scraped media sitting in a temp directory that a reboot clears.
const intake = {
  projectId,
  business: {
    name: brief.name, niche: brief.niche, location: brief.location,
    description: brief.description, targetAudience: brief.audience,
    primaryGoal: brief.goal,
  },
  socialMedia: [
    ...(brief.instagramUrl ? [{ platform: 'instagram',
      handle: brief.instagramUrl.split('/').filter(Boolean).pop(),
      profileUrl: brief.instagramUrl,
      scraper: { provider: 'not-requested', status: 'pending' } }] : []),
    ...(brief.linkedinUrl ? [{ platform: 'linkedin',
      handle: brief.linkedinUrl.split('/').filter(Boolean).pop(),
      profileUrl: brief.linkedinUrl,
      scraper: { provider: 'not-requested', status: 'pending' } }] : []),
  ],
  locale: brief.locale,
  submittedAt: now,
  consent: { publicProfileAnalysis: Boolean(brief.instagramUrl), acceptedAt: now },
};
const corpus = {
  projectId,
  documents: [
    { sourceId: 'intake', platform: 'intake', kind: 'intake_answer', text: brief.description },
    ...brief.answers.map((text, i) => ({
      sourceId: `answer-${i + 1}`, platform: 'intake', kind: 'intake_answer', text,
    })),
  ],
  images: [],
  completedAt: now,
};

// The Pi model catalogue does not know this one yet, so a run that selects it
// has to supply the descriptor alongside the id.
const GLM_53_FLASH = {
  id: 'z-ai/glm-5.3-flash', name: 'Z.ai: GLM 5.3 Flash', api: 'openai-completions',
  baseUrl: 'https://openrouter.ai/api/v1', provider: 'openrouter', reasoning: true,
  input: ['text', 'image'],
  cost: { input: 0.07, output: 0.25, cacheRead: 0.014, cacheWrite: 0 },
  contextWindow: 1_310_720, maxTokens: 131_072,
  compat: { supportsDeveloperRole: false, thinkingFormat: 'openrouter' },
  thinkingLevelMap: { xhigh: 'xhigh' },
};
const previewModel = process.env.SCENARIO_PREVIEW_MODEL || 'z-ai/glm-5.2';

const agents = new PiSdkFlowstarterAgents({
  provider: 'openrouter', modelId: 'z-ai/glm-5.2', apiKey: env.OPENROUTER_API_KEY,
  thinkingLevel: 'medium', timeoutMs: 420_000, maxOutputTokens: 24_000,
  roles: { preview: {
    modelId: previewModel,
    ...(previewModel === GLM_53_FLASH.id ? { modelOverride: GLM_53_FLASH } : {}),
    maxOutputTokens: 30_000, timeoutMs: 900_000,
  } },
});

// Wrap the coding agent so each pass records what triggered it. The feedback
// string is exactly what a trusted guard sent back, so the report shows the
// pipeline correcting itself rather than a tidy summary of a happy path.
const rawBuildPreview = agents.buildPreview.bind(agents);
agents.buildPreview = async (input) => {
  const started = Date.now();
  const result = await rawBuildPreview(input);
  passes.push({
    at: rel(),
    seconds: ((Date.now() - started) / 1000).toFixed(1),
    trigger: input.feedback ? String(input.feedback) : null,
    summary: String(result.summary ?? '').slice(0, 600),
    changed: result.changedPaths,
  });
  return result;
};

const library = new FlowstarterMcpTemplateLibrary({
  endpoint: 'http://127.0.0.1:3001/mcp',
  internalToken: 'e2e-local-mcp-internal-token-0123456789abcdef0123',
});
const classifier = new TemplateClassifier(
  new MiniLmOnnxEmbedder(process.env.SIGMA_MODEL_DIR || '/Users/darius91/Projects/sigma_model/out_v5'),
);

let workspaceRoot = '';
const validator = { validate: async (root) => {
  workspaceRoot = root;
  const pkgName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name ?? '';
  const deps = resolve('apps/flowstarter-templates', pkgName.replace('@flowstarter/template-', ''), 'node_modules');
  try { await symlink(deps, join(root, 'node_modules'), 'dir'); } catch { /* linked */ }
  const build = spawnSync(resolve(deps, '.bin', 'astro'), ['build'], { cwd: root, encoding: 'utf8', timeout: 240_000 });
  await rm(join(root, 'node_modules'), { recursive: true, force: true });
  if (build.status !== 0) throw new Error(`astro build failed:\n${`${build.stdout ?? ''}\n${build.stderr ?? ''}`.trim().slice(-1500)}`);
}};

const publisher = { publish: async (input) => {
  workspaceRoot = input.workspaceRoot;
  const deps = resolve('apps/flowstarter-templates', input.template.slug, 'node_modules');
  const localRoot = join(tmpdir(), 'flowstarter-local-previews', input.projectId);
  await mkdir(join(tmpdir(),'flowstarter-local-previews'), { recursive: true });
  await rm(localRoot, { recursive: true, force: true });
  await cp(input.workspaceRoot, localRoot, { recursive: true });
  await symlink(deps, join(localRoot, 'node_modules'), 'dir');
  const port = 45000 + Math.floor(Math.random()*2000);
  const child = spawn(resolve(deps,'.bin','astro'), ['dev','--port',String(port),'--host','127.0.0.1'],
    { cwd: localRoot, stdio: 'ignore', detached: true });
  child.unref();
  await new Promise(r=>setTimeout(r, 9000));
  return { previewUrl: `http://127.0.0.1:${port}`, artifactUrl: `local://${localRoot}`, files: [],
    teardown: async () => { try { process.kill(-child.pid); } catch {} } };
}};

const pipeline = new PreviewGenerationPipeline(agents, library, validator, publisher, classifier, {
  fullTemplateContext: true,
  qualitySweep: true,
  teaser: { keepHomeSections: 5, keepSubpageSections: 2, label: 'Part of your full site',
    unlockUrl: `${process.env.SCENARIO_APP_ORIGIN || 'http://localhost:3000'}/unlock/${projectId}`,
    unlockLabel: 'Unlock the full site' },
});

console.log('recording run', projectId);
const result = await pipeline.run({
  intake, corpus, cachedAssets: [],
  onPhase: (phase) => { events.push({ at: rel(), phase }); console.log(`[${rel()}s] ${phase}`); },
});

// Decisions are read back from the published copy: the pipeline deletes the
// working directory once the preview is live, and templates differ in which
// content file they keep their copy in.
const publishedRoot = String(result.artifactUrl).replace(/^local:\/\//, '');
const contentPath = ['src/content/site-labels.md', 'src/content/content.md']
  .map((rel) => join(publishedRoot, rel))
  .find((candidate) => existsSync(candidate));
const content = contentPath ? readFileSync(contentPath, 'utf8') : '';
const pick = (re) => (content.match(re) ?? [])[1] ?? '';
const decisions = {
  heroImage: pick(/^\s{0,4}image:\s*"([^"]*)"/m),
  heroPosition: pick(/imagePosition:\s*"([^"]*)"/),
  artMark: pick(/artMark:\s*"([^"]*)"/),
  cards: [...content.matchAll(/imageSrc:\s*"([^"]+)"/g)].map(m => m[1]),
  socials: [...content.matchAll(/href:\s*"(https?:\/\/(?:www\.)?(?:instagram|linkedin)\.com[^"]*)"/g)].map(m => m[1]),
};

writeFileSync('/tmp/run-record.json', JSON.stringify({
  projectId, startedAt: new Date(t0).toISOString(),
  totalSeconds: ((Date.now() - t0) / 1000).toFixed(0),
  template: result.template, brand: result.brandConfig, previewUrl: result.previewUrl,
  events, passes, decisions, publishedRoot,
}, null, 2));
console.log('\nrecorded ->', '/tmp/run-record.json');
console.log('preview:', result.previewUrl);
await library.close();
