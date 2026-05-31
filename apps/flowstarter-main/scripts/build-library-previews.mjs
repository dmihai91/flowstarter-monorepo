#!/usr/bin/env node
/**
 * Build every Astro library template into
 * `apps/flowstarter-main/public/preview/<slug>/` so the library showcase iframes
 * (DeferredPreviewFrame → `/preview/<slug>/`) ship with fresh static output on
 * each deploy. Called from `netlify.toml` before `next build`.
 *
 * Each template's `astro.config.mjs` is self-describing — it sets its own
 * `base: '/preview/<slug>/'` and `outDir` into this app's public/preview — so
 * we just run the template's build in its own directory; no slug mapping here.
 *
 * `--skip-install`: dependencies are already installed by the root
 * `pnpm install` step in the Netlify build command, so we don't re-install.
 *
 * (Restores the build step the netlify.toml command referenced; it was dropped
 * during the library-subdomain merge, which broke every production build.)
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(here, '..', '..', 'flowstarter-library', 'templates');

if (!existsSync(templatesDir)) {
  console.error(`[previews] templates dir not found: ${templatesDir}`);
  process.exit(1);
}

const templates = readdirSync(templatesDir)
  .filter((name) => name !== 'shared')
  .map((name) => join(templatesDir, name))
  .filter(
    (dir) =>
      statSync(dir).isDirectory() && existsSync(join(dir, 'astro.config.mjs')),
  );

if (templates.length === 0) {
  console.error('[previews] no buildable templates found');
  process.exit(1);
}

console.log(`[previews] building ${templates.length} template preview(s)…`);
for (const dir of templates) {
  const name = dir.split('/').pop();
  console.log(`[previews] → ${name}`);
  // Honour each template's own build script (astro build) in its own cwd.
  execSync('pnpm run build', { cwd: dir, stdio: 'inherit' });
}
console.log('[previews] done.');
