import { describe, expect, it } from 'vitest';
import { fixContentImports } from '../postProcessAstro';
import type { GeneratedFile } from '../claude-agent/types';

function astroFile(content: string, path = 'src/pages/index.astro'): GeneratedFile {
  return { path, content };
}

describe('fixContentImports', () => {
  it('removes plain frontmatter imports and inlines destructured values', () => {
    const files = fixContentImports([
      astroFile(`---
import { frontmatter } from '../../content/services.md';
const { title, description } = frontmatter;
---

<h1>{title}</h1>
<p>{description}</p>`),
    ]);

    expect(files[0].content).not.toContain("content/services.md");
    expect(files[0].content).toContain('const title = "Services";');
    expect(files[0].content).toContain('const description = "Services Description";');
  });

  it('handles aliased imports and replaces remaining property access', () => {
    const files = fixContentImports([
      astroFile(`---
import { frontmatter as hero } from '../../content/hero.md';
---

<section aria-label={hero.title}>
  <a href={hero.ctaHref}>{hero.ctaText}</a>
</section>`),
    ]);

    expect(files[0].content).not.toContain('frontmatter as hero');
    expect(files[0].content).toContain('aria-label={"Hero"}');
    expect(files[0].content).toContain('href={"#"}');
    expect(files[0].content).toContain('{"Learn more"}');
  });

  it('supports destructuring aliases and collection defaults', () => {
    const files = fixContentImports([
      astroFile(`---
import { frontmatter as services } from '../../content/services.md';
const { title: sectionTitle, services: serviceItems } = services;
---

<h2>{sectionTitle}</h2>
<ul>{serviceItems.length}</ul>`),
    ]);

    expect(files[0].content).toContain('const sectionTitle = "Services";');
    expect(files[0].content).toContain('const serviceItems = [];');
    expect(files[0].content).not.toContain('= services;');
  });

  it('leaves non-astro files untouched', () => {
    const input: GeneratedFile[] = [
      {
        path: 'src/lib/example.ts',
        content: "import { frontmatter } from '../../content/hero.md';",
      },
    ];

    expect(fixContentImports(input)).toEqual(input);
  });

  it('leaves astro files without content imports untouched', () => {
    const input = [
      astroFile(`---
const title = 'Static';
---

<h1>{title}</h1>`),
    ];

    expect(fixContentImports(input)).toEqual(input);
  });

  it('is idempotent across repeated runs', () => {
    const input = [
      astroFile(`---
import { frontmatter } from '../../content/hero.md';
const { title } = frontmatter;
---

<h1>{frontmatter.title}</h1>`),
    ];

    const once = fixContentImports(input);
    const twice = fixContentImports(once);

    expect(twice).toEqual(once);
  });
});
