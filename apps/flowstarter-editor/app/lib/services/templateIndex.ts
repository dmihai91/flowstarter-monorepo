/**
 * Template Index Generator
 *
 * Creates a compressed representation of template files that gives
 * the AI enough context to rewrite files without reading originals.
 * Reduces input tokens from ~1.4M (20 reads over 22 turns) to ~4K (one prompt).
 */

import type { GeneratedFile } from './claude-agent/types';

interface FileIndex {
  path: string;
  lines: number;
  /** Key structural patterns extracted from the file */
  structure: string;
}

/**
 * Build a compressed index from template files.
 * The index contains enough info for the AI to write complete replacements
 * without needing to read the originals.
 */
export function buildTemplateIndex(files: GeneratedFile[]): string {
  const indexed = files.map(f => indexFile(f));
  const sections = indexed.map(f =>
    `### ${f.path} (${f.lines} lines)\n${f.structure}`
  );
  return sections.join('\n\n');
}

function indexFile(file: GeneratedFile): FileIndex {
  const lines = file.content.split('\n');
  const structure: string[] = [];

  if (file.path.endsWith('.mjs') && file.path.includes('tailwind')) {
    // Extract color config
    const colorMatch = file.content.match(/colors:\s*\{([^}]+)\}/s);
    if (colorMatch) structure.push(`Colors: ${colorMatch[1].trim().slice(0, 200)}`);
    const fontMatch = file.content.match(/fontFamily:\s*\{([^}]+)\}/s);
    if (fontMatch) structure.push(`Fonts: ${fontMatch[1].trim().slice(0, 200)}`);
  } else if (file.path.endsWith('.astro')) {
    // Extract frontmatter imports/variables
    const fmMatch = file.content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const imports = fmMatch[1].split('\n')
        .filter(l => l.startsWith('import '))
        .map(l => l.trim())
        .join('\n');
      if (imports) structure.push(`Imports:\n${imports}`);

      // Extract layout/component usage
      const components = fmMatch[1].split('\n')
        .filter(l => l.includes('import') && l.includes('.astro'))
        .map(l => {
          const m = l.match(/import\s+(\w+)\s+from/);
          return m ? m[1] : null;
        })
        .filter(Boolean);
      if (components.length) structure.push(`Components used: ${components.join(', ')}`);
    }

    // Extract section structure (HTML comments, main sections)
    const sectionHeaders = lines
      .filter(l => l.match(/<!--\s*.+\s*-->/) || l.match(/<section[\s>]/) || l.match(/<main[\s>]/))
      .map(l => l.trim())
      .slice(0, 10);
    if (sectionHeaders.length) structure.push(`Sections: ${sectionHeaders.join(' | ')}`);

    // Extract component slots/props pattern
    const slots = file.content.match(/<slot\s*\/?>|<slot\s+name="[^"]+"/g);
    if (slots) structure.push(`Slots: ${[...new Set(slots)].join(', ')}`);
  } else if (file.path.endsWith('.css')) {
    // Extract CSS custom properties
    const vars = lines
      .filter(l => l.includes('--'))
      .map(l => l.trim())
      .slice(0, 15);
    if (vars.length) structure.push(`CSS vars:\n${vars.join('\n')}`);
  } else if (file.path === 'package.json') {
    // Just note the key deps
    try {
      const pkg = JSON.parse(file.content);
      const deps = Object.keys(pkg.dependencies || {}).join(', ');
      structure.push(`Dependencies: ${deps}`);
    } catch { /* ignore */ }
  }

  return {
    path: file.path,
    lines: lines.length,
    structure: structure.join('\n') || '(standard config file)',
  };
}
