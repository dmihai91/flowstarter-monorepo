import { cp, mkdtemp, rm, readFile, access, mkdir, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { DiscoverySpec } from './spec';

/**
 * Base templates the agent personalizes. dorin-portfolio is the chosen base:
 * a finished, self-contained, content-driven template whose entire site is
 * one YAML file (src/content/site-labels.md). Personalization = rewrite that
 * one file. node_modules is pre-installed into a reusable cache so a run
 * never pays the ~30s `npm install`.
 */
interface BaseTemplate {
  name: string;
  rootRel: string;
  /** The single file that drives all site content. */
  contentFileRel: string;
}

/**
 * Repo root, found by walking up from cwd to the pnpm workspace marker.
 * Bundler-safe (no `new URL(rel, import.meta.url)` — Next tries to resolve
 * that as an asset) and context-independent (works whether cwd is the Next
 * app, the repo root, or a package dir).
 */
function findRepoRoot(): string {
  let d = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(d, 'pnpm-workspace.yaml'))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return process.cwd();
}

const REPO_ROOT = findRepoRoot();
const CACHE_ROOT = join(tmpdir(), 'fs-codegen-cache');

const tpl = (name: string): BaseTemplate => ({
  name,
  rootRel: `apps/flowstarter-templates/${name}`,
  contentFileRel: 'src/content/site-labels.md',
});

export const BASE_TEMPLATES: Record<string, BaseTemplate> = {
  'wellness-therapy': tpl('wellness-therapy'),
  'professional-services': tpl('professional-services'),
  'local-trade': tpl('local-trade'),
  'creative-portfolio': tpl('creative-portfolio'),
  'dorin-portfolio': tpl('dorin-portfolio'),
};

/**
 * What each template is best for — fed to the LLM selector so it picks the
 * right structural/aesthetic fit (the regex below is only the fail-safe
 * fallback). dorin-portfolio is intentionally excluded (legacy; superseded
 * by creative-portfolio).
 */
export const TEMPLATE_CATALOG: Array<{ id: string; bestFor: string }> = [
  {
    id: 'wellness-therapy',
    bestFor:
      'therapists, counsellors, psychologists, coaches, nutritionists, wellbeing/holistic practitioners — calm, warm, human practices selling sessions or programmes',
  },
  {
    id: 'professional-services',
    bestFor:
      'consultancies, agencies, accountants, lawyers, advisors, B2B/SaaS or other expertise firms — confident, premium, outcome/credibility-led',
  },
  {
    id: 'local-trade',
    bestFor:
      'local trades & hands-on services: joinery, builders, electricians, salons, cleaners, instructors — warm, trustworthy, call/quote-driven',
  },
  {
    id: 'creative-portfolio',
    bestFor:
      'creators & personal brands: designers, photographers, makers, artists, and people selling their own products/digital goods (guides, courses, ebooks, fashion/style, shops) — bold, editorial, expressive',
  },
];

/** Most generic service-business shape — safe fallback for unknown industries. */
const DEFAULT_TEMPLATE = 'professional-services';

/** Industry → template, matched on the funnel's free-text industry/description. */
const INDUSTRY_RULES: Array<[base: string, patterns: RegExp]> = [
  [
    'wellness-therapy',
    /therap|counsell?|psycholog|mental health|wellbeing|wellness|coach|mindful|holistic|nutrition|yoga|massage/i,
  ],
  [
    'local-trade',
    /salon|barber|spa|plumb|electric|joinery|carpentr|landscap|garden|clean|builder|roofing|contractor|handyman|trades?|mechanic|locksmith|florist|caterer|bakery|cafe|restaurant/i,
  ],
  [
    'creative-portfolio',
    /portfolio|photograph|designer|illustrat|artist|maker|creative|filmmaker|videograph|architec(t|ture)|studio|freelance|fashion|style|stylist|wardrobe|outfit|boutique|shop|store|e-?commerce|guide|e-?book|course|digital product|creator|personal brand|blogger|influencer|sell(s|er|ing)?/i,
  ],
  [
    'professional-services',
    /consult|agenc|account|lawyer|legal|attorney|advisor|financ|recruit|market|b2b|saas|software|engineer|professional services/i,
  ],
];

export function selectBaseTemplate(spec: DiscoverySpec, override?: string): BaseTemplate {
  if (override && BASE_TEMPLATES[override]) return BASE_TEMPLATES[override]!;
  const hay = `${spec.industry ?? ''} ${spec.description ?? ''}`.toLowerCase();
  for (const [base, re] of INDUSTRY_RULES) {
    if (re.test(hay)) return BASE_TEMPLATES[base]!;
  }
  return BASE_TEMPLATES[DEFAULT_TEMPLATE]!;
}

const EXCLUDE = new Set(['dist', '.astro', '.git']);

function npm(args: string[], cwd: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const c = spawn('npm', args, { cwd, env: { ...process.env, CI: '1' } });
    const t = setTimeout(() => c.kill('SIGKILL'), timeoutMs);
    c.on('close', (code) => {
      clearTimeout(t);
      resolve(code === 0);
    });
    c.on('error', () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a warm cache copy (template + installed node_modules) exists for the
 * base. Built once, reused by every run. Returns the cache dir.
 */
export async function ensurePrewarmCache(base: BaseTemplate): Promise<string> {
  const cacheDir = join(CACHE_ROOT, base.name);
  if (await exists(join(cacheDir, 'node_modules'))) return cacheDir;
  await mkdir(CACHE_ROOT, { recursive: true });
  await rm(cacheDir, { recursive: true, force: true }).catch(() => {});
  await cp(join(REPO_ROOT, base.rootRel), cacheDir, {
    recursive: true,
    filter: (s) => !s.split('/').some((p) => EXCLUDE.has(p) || p === 'node_modules'),
  });
  const ok = await npm(
    ['install', '--no-audit', '--no-fund', '--loglevel=error'],
    cacheDir,
    180_000
  );
  if (!ok) throw new Error(`prewarm npm install failed for ${base.name}`);
  return cacheDir;
}

export interface Workspace {
  root: string;
  buildDir: string;
  /** Absolute path to the single content file the agent must rewrite. */
  contentFile: string;
  /** Content of that file at workspace creation (fed to the agent inline). */
  contentBefore: string;
  base: BaseTemplate;
  cleanup: () => Promise<void>;
}

/** Fast workspace: clone the warm cache (incl. node_modules) — no install. */
export async function createWorkspace(base: BaseTemplate): Promise<Workspace> {
  const cacheDir = await ensurePrewarmCache(base);
  const root = await mkdtemp(join(tmpdir(), 'fs-codegen-'));
  const buildDir = join(root, 'site');
  // Copy only source (fast); symlink the pre-installed node_modules from the
  // warm cache. Copying 130MB of node_modules is slow AND produced a broken
  // tree ("Cannot find module 'astro/config'"); a symlink resolves cleanly.
  await cp(cacheDir, buildDir, {
    recursive: true,
    filter: (s) => !s.split('/').some((p) => EXCLUDE.has(p) || p === 'node_modules'),
  });
  await symlink(join(cacheDir, 'node_modules'), join(buildDir, 'node_modules'), 'dir');
  const contentFile = join(buildDir, base.contentFileRel);
  const contentBefore = await readFile(contentFile, 'utf8');
  return {
    root,
    buildDir,
    contentFile,
    contentBefore,
    base,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true }).catch(() => {});
    },
  };
}

export async function fileExists(p: string): Promise<boolean> {
  return exists(p);
}
