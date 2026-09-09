/**
 * Scenario: a client like Darius — brand identity from the public Instagram
 * profile darius.flowstarter (owner's consent given in chat).
 *
 * Drives the real pipeline directly: ScrapeCorpus (bio + captions + images)
 * -> analyzeBrand (vision) -> selectTemplate (local MCP) -> scaffold ->
 * buildPreview -> validate -> publish via the template's own dev server.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { mkdir, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

process.env.NODE_ENV ??= 'development';
const { PiSdkFlowstarterAgents, FlowstarterMcpTemplateLibrary, PreviewGenerationPipeline } =
  await import('../../packages/agentic-codegen/src/index.ts');

const env = Object.fromEntries(readFileSync('apps/flowstarter-main/.env.local','utf8')
  .split('\n').filter(l=>/^[A-Z]/.test(l)).map(l=>[l.split('=')[0], l.split('=').slice(1).join('=').trim()]));

const projectId = randomUUID();
const now = new Date().toISOString();

const docs = JSON.parse(readFileSync('/tmp/ig-docs.json','utf8'));
const images = readdirSync('/tmp/ig-media').map((f,i)=>({
  sourceId: f.replace('.jpg',''),
  objectKey: `local/ig/${f}`,
  mediaType: 'image/jpeg',
  base64: readFileSync(`/tmp/ig-media/${f}`).toString('base64'),
  sourceUrl: 'https://www.instagram.com/darius.flowstarter/',
}));

const intake = {
  projectId,
  business: {
    name: 'Darius Popescu — Web Developer',
    niche: 'Freelance web & app development — personal portfolio',
    location: 'Bucharest, Romania',
    description: 'Personal portfolio for a solo web developer. Strict content rules: first-person singular voice everywhere (I, my — never we, our, studio). Only real work may appear: (1) Flowstarter — an AI-powered website concierge platform I am building, where agents generate personalized sites from a client brief and Instagram identity; (2) an experiment building a working app from scratch purely with AI tools, documented on my Instagram; (3) my AI-assisted development workflow itself. Do not invent clients, testimonials, case studies, metrics or awards. If a section has no real content, repurpose it to describe my process or remove its filler. Warm, direct, technically credible.',
    targetAudience: 'Founders and small businesses who need an app or website',
    primaryGoal: 'portfolio',
  },
  socialMedia: [{ platform: 'instagram', handle: 'darius.flowstarter',
    profileUrl: 'https://www.instagram.com/darius.flowstarter/',
    scraper: { provider: 'session-fetch', status: 'complete' } }],
  locale: 'en-RO',
  submittedAt: now,
  consent: { publicProfileAnalysis: true, acceptedAt: now },
};
const NO_IMAGES = process.env.SCENARIO_NO_IMAGES === '1';
// The brief itself is evidence the brand agent may cite ('intake' source id).
docs.push({
  sourceId: 'intake',
  platform: 'intake',
  kind: 'intake_answer',
  text: intake.business.description,
});
const corpus = { projectId, documents: docs, images: NO_IMAGES ? [] : images, completedAt: now };

const GLM_53_FLASH = {
  id: 'z-ai/glm-5.3-flash',
  name: 'Z.ai: GLM 5.3 Flash',
  api: 'openai-completions',
  baseUrl: 'https://openrouter.ai/api/v1',
  provider: 'openrouter',
  reasoning: true,
  input: ['text', 'image'],
  cost: { input: 0.07, output: 0.25, cacheRead: 0.014, cacheWrite: 0 },
  contextWindow: 1_310_720,
  maxTokens: 131_072,
  compat: { supportsDeveloperRole: false, thinkingFormat: 'openrouter' },
  thinkingLevelMap: { xhigh: 'xhigh' },
};
// Tiered models: flash carries the preview coding agent (bulk of tokens),
// glm-5.2 keeps brand analysis; kimi-k3 is wired for full-site builds.
// Template selection goes to the sigma classifier first (LLM fallback).
const agents = new PiSdkFlowstarterAgents({
  provider: 'openrouter', modelId: 'z-ai/glm-5.2',
  apiKey: env.OPENROUTER_API_KEY, thinkingLevel: 'medium', timeoutMs: 420_000, maxOutputTokens: 24_000,
  roles: {
    // Free preview: flash with the whole template in context, multi-pass.
    preview: { modelId: 'z-ai/glm-5.3-flash', modelOverride: GLM_53_FLASH, maxOutputTokens: 30_000, timeoutMs: 600_000 },
    // Paid full-site build: the heavy tier.
    fullSite: { modelId: 'moonshotai/kimi-k3', thinkingLevel: 'high' },
  },
});
console.log('[models] brand=glm-5.2, preview=glm-5.3-flash, fullSite=kimi-k3, selection=sigma');
const library = new FlowstarterMcpTemplateLibrary({
  endpoint: 'http://127.0.0.1:3001/mcp',
  internalToken: 'e2e-local-mcp-internal-token-0123456789abcdef0123',
});

// A real build, like the production validator: without it a content file the
// agent left syntactically broken (an unescaped quote inside a YAML string is
// the classic one for non-English copy) sails through and publishes a site
// that only fails in the browser. Failing here hands the error to the
// pipeline's repair pass.
const validator = { validate: async (root, phase) => {
  if (phase !== 'preview') throw new Error('unexpected phase');
  // The workspace is a scaffold copy, so its package name identifies the
  // template whose installed dependencies it can borrow.
  const pkgName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name ?? '';
  const slug = pkgName.replace('@flowstarter/template-', '');
  const deps = resolve('apps/flowstarter-templates', slug, 'node_modules');
  try { await symlink(deps, join(root, 'node_modules'), 'dir'); } catch { /* already linked */ }
  const build = spawnSync(resolve(deps, '.bin', 'astro'), ['build'], {
    cwd: root, encoding: 'utf8', timeout: 240_000,
  });
  // Leave the workspace as the pipeline handed it over: the publisher links
  // its own dependencies, and a stray link here breaks that copy.
  await rm(join(root, 'node_modules'), { recursive: true, force: true });
  if (build.status !== 0) {
    const detail = `${build.stdout ?? ''}\n${build.stderr ?? ''}`.trim().slice(-2_000);
    throw new Error(`astro build failed:\n${detail}`);
  }
}};

const publisher = { publish: async (input) => {
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
  return { previewUrl: `http://127.0.0.1:${port}`, artifactUrl: `local://${localRoot}`,
    files: [], teardown: async () => { try { process.kill(-child.pid); } catch {} } };
}};

const { TemplateClassifier, MiniLmOnnxEmbedder } = await import('../../packages/agentic-codegen/src/flowstarter/template-classifier.ts');
const classifier = new TemplateClassifier(
  new MiniLmOnnxEmbedder(process.env.SIGMA_MODEL_DIR || '/Users/darius91/Projects/sigma_model/out_v5'),
);
const pipeline = new PreviewGenerationPipeline(agents, library, validator, publisher, classifier, {
  fullTemplateContext: true,
  qualitySweep: true,
  teaser: {
    // Five of nine home sections were veiled, which read as a duller site
    // than the template demo: the gate should sell the work, not hide it.
    keepHomeSections: 5,
    keepSubpageSections: 2,
    label: 'Part of your full site',
    unlockUrl: `${process.env.SCENARIO_APP_ORIGIN || 'http://localhost:3000'}/unlock/${projectId}`,
    unlockLabel: 'Unlock the full site',
  },
});
// The client's own Instagram media, written into public/flowstarter-assets/
// so the agent can use his real photos for portrait and project slots.
// heroEligible models the intake question a concierge would ask ("which
// photo represents you professionally?"). post2 is the only well-composed
// portrait; the profile picture is 320px and is disqualified on size anyway.
const HERO_ELIGIBLE = new Set(['post2']);
const cachedAssetFiles = readdirSync('/tmp/ig-media').map((f) => ({
  sourceId: f.replace('.jpg', ''),
  fileName: f,
  contentBase64: readFileSync(`/tmp/ig-media/${f}`).toString('base64'),
  heroEligible: HERO_ELIGIBLE.has(f.replace('.jpg', '')),
}));

const result = await pipeline.run({ intake, corpus, cachedAssets: [], cachedAssetFiles,
  onPhase: (p) => console.log(`[phase] ${p}`) });

console.log('\n=== RESULT ===');
console.log('template:', result.template.slug, '| confidence:', result.template.confidence);
console.log('reason:', String(result.template.reason).slice(0,140));
console.log('previewUrl:', result.previewUrl);
console.log('artifact:', result.artifactUrl);
console.log('brand primary:', result.brandConfig.colors.primary, '| heading font:', result.brandConfig.typography.headingFont);
console.log('voice adjectives:', result.brandConfig.voice.adjectives.join(', '));
console.log('headline:', result.brandConfig.voice.sampleHeadline);
console.log('evidence text:', result.brandConfig.evidence.textSourceIds.join(','));
console.log('evidence images:', result.brandConfig.evidence.imageSourceIds.join(','));
await library.close();
