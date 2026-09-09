/**
 * Scenario: a Romanian fitness coach — a text-only intake in Romanian, no
 * social scrape. Exercises locale handling (ro-RO copy end to end) and the
 * sigma classifier on a coaching business rather than a portfolio.
 */
import { readFileSync } from 'node:fs';
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

const intake = {
  projectId,
  business: {
    name: 'Andrei Munteanu — Antrenor Personal',
    niche: 'Antrenor personal și coaching de fitness',
    location: 'Cluj-Napoca, România',
    description: [
      'Site pentru un antrenor personal independent din Cluj-Napoca.',
      'TOATĂ interfața și tot conținutul vizibil trebuie scrise în limba română,',
      'inclusiv meniul, butoanele, titlurile, formularul de contact și subsolul.',
      'Vorbește la persoana întâi singular (eu, meu) — niciodată "noi" sau "echipa".',
      'Servicii reale: antrenamente personale 1-la-1 în sală, planuri de antrenament',
      'individualizate, îndrumare pentru nutriție și antrenamente online prin video.',
      'Nu inventa clienți, testimoniale, rezultate, cifre, premii sau certificări.',
      'Dacă o secțiune nu are conținut real, descrie procesul de lucru.',
      'Ton: direct, cald, profesionist, fără promisiuni exagerate.',
    ].join(' '),
    targetAudience: 'Adulți ocupați din Cluj-Napoca care vor să înceapă sau să revină la antrenamente',
    primaryGoal: 'Programări pentru o ședință de consultanță',
  },
  socialMedia: [],
  locale: 'ro-RO',
  submittedAt: now,
  consent: { publicProfileAnalysis: false, acceptedAt: now },
};

// Text-only evidence: the brief plus the coach's own answers, all Romanian.
const docs = [
  { sourceId: 'intake', platform: 'intake', kind: 'intake_answer', text: intake.business.description },
  { sourceId: 'answer-servicii', platform: 'intake', kind: 'intake_answer',
    text: 'Lucrez 1-la-1 în sală, fac planuri individualizate și ofer îndrumare pentru nutriție. Am și antrenamente online pentru cei care nu ajung la sală.' },
  { sourceId: 'answer-abordare', platform: 'intake', kind: 'intake_answer',
    text: 'Încep cu o evaluare a mobilității și a istoricului de accidentări. Progresăm treptat, cu tehnică corectă înainte de greutăți mari.' },
  { sourceId: 'answer-public', platform: 'intake', kind: 'intake_answer',
    text: 'Majoritatea oamenilor cu care lucrez stau mult la birou și nu au mai făcut sport de ani de zile. Vor să se simtă mai bine, nu să concureze.' },
];
const corpus = { projectId, documents: docs, images: [], completedAt: now };

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
    // Flash idled out upstream on this template twice; SCENARIO_PREVIEW_MODEL
    // lets the run fall back to the proven tier without editing the file.
    preview: process.env.SCENARIO_PREVIEW_MODEL
      ? { modelId: process.env.SCENARIO_PREVIEW_MODEL, maxOutputTokens: 30_000, timeoutMs: 900_000 }
      : { modelId: 'z-ai/glm-5.3-flash', modelOverride: GLM_53_FLASH, maxOutputTokens: 30_000, timeoutMs: 600_000 },
    // Paid full-site build: the heavy tier.
    fullSite: { modelId: 'moonshotai/kimi-k3', thinkingLevel: 'high' },
  },
});
console.log(`[models] brand=glm-5.2, preview=${process.env.SCENARIO_PREVIEW_MODEL || 'z-ai/glm-5.3-flash'}, fullSite=kimi-k3, selection=sigma`);
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
    keepHomeSections: 3,
    keepSubpageSections: 1,
    label: 'Face parte din site-ul complet',
    unlockUrl: `${process.env.SCENARIO_APP_ORIGIN || 'http://localhost:3000'}/unlock/${projectId}`,
    unlockLabel: 'Deblochează site-ul complet',
  },
});
const result = await pipeline.run({ intake, corpus, cachedAssets: [],
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

await library.close();
