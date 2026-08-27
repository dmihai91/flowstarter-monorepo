/**
 * Preview teaser: trusted post-processing that blurs the lower sections of a
 * generated preview and overlays an unlock chip, so the free preview tastes
 * like the site without giving the whole build away.
 *
 * Runs as operator code after the coding agent has finished — the agent never
 * sees or controls it. Injection is idempotent and confined to layout files.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface PreviewTeaserOptions {
  /** Crisp sections at the top of the home page. */
  keepHomeSections?: number;
  /** Crisp sections at the top of every other page. */
  keepSubpageSections?: number;
  /** Chip text shown over blurred sections. */
  label?: string;
}

const MARKER = 'flowstarter-preview-teaser';

export async function injectPreviewTeaser(
  workspaceRoot: string,
  options: PreviewTeaserOptions = {},
): Promise<{ layoutsPatched: number }> {
  const keepHome = options.keepHomeSections ?? 3;
  const keepSub = options.keepSubpageSections ?? 1;
  const label = (options.label ?? 'Part of your full site — unlocked after the preview call')
    .slice(0, 120);

  const publicDir = resolve(workspaceRoot, 'public');
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, `${MARKER}.css`), TEASER_CSS, 'utf8');
  await writeFile(
    join(publicDir, `${MARKER}.js`),
    TEASER_JS.replace('__KEEP_HOME__', String(keepHome))
      .replace('__KEEP_SUB__', String(keepSub))
      .replace('__LABEL__', JSON.stringify(label)),
    'utf8',
  );

  const snippet =
    `\n<!-- ${MARKER} -->` +
    `<link rel="stylesheet" href="/${MARKER}.css" />` +
    `<script defer src="/${MARKER}.js"></script>\n`;

  let layoutsPatched = 0;
  const layoutDir = resolve(workspaceRoot, 'src', 'layouts');
  let entries: string[] = [];
  try {
    entries = (await readdir(layoutDir)).filter((name) => name.endsWith('.astro'));
  } catch {
    return { layoutsPatched };
  }
  for (const name of entries) {
    const path = join(layoutDir, name);
    const source = await readFile(path, 'utf8');
    if (source.includes(MARKER)) { layoutsPatched++; continue; }
    if (!source.includes('</head>')) continue;
    await writeFile(path, source.replace('</head>', `${snippet}</head>`), 'utf8');
    layoutsPatched++;
  }
  return { layoutsPatched };
}

const TEASER_CSS = `
.fs-teaser-locked { position: relative; }
.fs-teaser-locked > .fs-teaser-veil {
  position: absolute; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(9px) saturate(0.85);
  -webkit-backdrop-filter: blur(9px) saturate(0.85);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(20,20,26,0.18));
}
.fs-teaser-locked > .fs-teaser-veil .fs-teaser-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 999px;
  background: rgba(17,17,22,0.88); color: #f5f2ea;
  font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.02em; box-shadow: 0 10px 30px -12px rgba(0,0,0,0.5);
  pointer-events: none; text-align: center; max-width: 82%;
}
.fs-teaser-locked > .fs-teaser-veil .fs-teaser-chip::before { content: '🔒'; }
`;

const TEASER_JS = `
(function () {
  function lock(section, label) {
    if (section.querySelector(':scope > .fs-teaser-veil')) return;
    section.classList.add('fs-teaser-locked');
    var veil = document.createElement('div');
    veil.className = 'fs-teaser-veil';
    var chip = document.createElement('span');
    chip.className = 'fs-teaser-chip';
    chip.textContent = label;
    veil.appendChild(chip);
    section.appendChild(veil);
  }
  function run() {
    var keep = location.pathname === '/' ? __KEEP_HOME__ : __KEEP_SUB__;
    var label = __LABEL__;
    var scope = document.querySelector('main') || document.body;
    var sections = Array.prototype.slice.call(scope.querySelectorAll('section'));
    if (sections.length === 0) return;
    // Only top-level sections; nested ones inherit their parent's veil.
    sections = sections.filter(function (s) {
      return !sections.some(function (o) { return o !== s && o.contains(s); });
    });
    sections.slice(keep).forEach(function (s) { lock(s, label); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
})();
`;
