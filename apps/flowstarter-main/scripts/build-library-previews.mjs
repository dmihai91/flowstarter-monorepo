#!/usr/bin/env node
/**
 * Build all Astro template previews into apps/flowstarter-main/public/preview/.
 *
 * Each template under apps/flowstarter-library/templates/<slug>/ has its own
 * astro.config.mjs with `outDir: '../../../flowstarter-main/public/preview/<slug>'`,
 * so we just need to install template deps once and run `astro build` per slug.
 *
 * This script is invoked by the Netlify build command BEFORE `next build`,
 * so the freshly-built static iframes ship with the deploy. Local devs can
 * run `pnpm gen:previews:dorin` to refresh previews on demand.
 *
 * Usage:
 *   node scripts/build-library-previews.mjs
 *   node scripts/build-library-previews.mjs --skip-install
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const TEMPLATES_DIR = resolve(REPO_ROOT, 'apps/flowstarter-library/templates');

// Order matters only for log readability — keep the live shipping templates first.
const TEMPLATE_SLUGS = [
  'coach-pro',
  'therapist-care',
  'fitness-coach',
  'freelancer-portfolio',
  'creative-portfolio',
];

const skipInstall = process.argv.includes('--skip-install');

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}  (cwd=${cwd.replace(REPO_ROOT, '.')})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function buildTemplate(slug) {
  const templateDir = resolve(TEMPLATES_DIR, slug);
  if (!existsSync(templateDir)) {
    console.warn(`[skip] ${slug} — directory missing at ${templateDir}`);
    return;
  }
  console.log(`\n━━━ ${slug} ━━━`);
  if (!skipInstall) {
    run('pnpm install --prefer-offline --ignore-scripts', templateDir);
  }
  run('pnpm exec astro build', templateDir);
}

const start = Date.now();
console.log(`Building ${TEMPLATE_SLUGS.length} library template previews…`);

for (const slug of TEMPLATE_SLUGS) {
  try {
    buildTemplate(slug);
  } catch (err) {
    console.error(`\n[fail] ${slug} build failed`);
    console.error(err);
    process.exitCode = 1;
  }
}

const seconds = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\nDone in ${seconds}s.`);
