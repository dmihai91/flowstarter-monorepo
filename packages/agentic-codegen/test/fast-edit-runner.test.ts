/**
 * The fast-edit runner's assembly step. What is protected: a model that
 * returns only the sections it changed (kimi's habit — observed per-edit
 * success was ~25% while the guards demanded the whole file) produces a full,
 * valid file by mechanical merge, and a reply with nothing usable in it is
 * still refused.
 */
import { describe, expect, it } from 'vitest';
import {
  assemble,
  mergeFrontmatter,
  splitTopLevelBlocks,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - plain .mjs module without type declarations
} from '../sandbox/fast-edit-runner.mjs';

const ORIGINAL = `---
siteMeta:
  title: "Marsh & Fern"
  description: "Counselling in Bristol."

hero:
  label: "Counselling"
  title: "A steady space"
  text: |
    For adults who are tired.
  image: "/images/hero.jpg"

services:
  heading: "How I help"
  items:
    - title: "One to one"
      text: "Weekly sessions."

contact:
  email: "hello@marshandfern.example"
---
Body text stays.
`;

describe('splitTopLevelBlocks', () => {
  it('splits on unindented keys and keeps indented lines with their block', () => {
    const blocks = splitTopLevelBlocks(
      'a:\n  one: 1\n  two: 2\nb: plain\nc:\n  - item'
    ) as Array<{ key: string | null; lines: string[] }>;
    expect(blocks.map((b) => b.key)).toEqual(['a', 'b', 'c']);
    expect(blocks[0]?.lines).toHaveLength(3);
  });

  it('keeps leading keyless lines (comments) as their own block', () => {
    const blocks = splitTopLevelBlocks('# comment\na: 1') as Array<{
      key: string | null;
    }>;
    expect(blocks.map((b) => b.key)).toEqual([null, 'a']);
  });
});

describe('assemble with a partial reply', () => {
  it('merges the changed section over the original and keeps the rest', () => {
    const reply =
      'hero:\n  label: "Counselling"\n  title: "A warmer, steadier space"\n  text: |\n    The first intro call is free.\n  image: "/images/hero.jpg"';
    const result = assemble(ORIGINAL, reply) as {
      ok: boolean;
      content: string;
    };
    expect(result.ok).toBe(true);
    expect(result.content).toContain('A warmer, steadier space');
    expect(result.content).toContain('The first intro call is free.');
    // Everything the model did not mention survives untouched.
    expect(result.content).toContain('siteMeta:');
    expect(result.content).toContain('"Counselling in Bristol."');
    expect(result.content).toContain('heading: "How I help"');
    expect(result.content).toContain('hello@marshandfern.example');
    expect(result.content).toContain('Body text stays.');
    // And the envelope is intact.
    expect(result.content.startsWith('---\n')).toBe(true);
  });

  it('merges through code fences and stray --- markers', () => {
    const reply =
      '```yaml\n---\ncontact:\n  email: "new@marshandfern.example"\n---\n```';
    const result = assemble(ORIGINAL, reply) as {
      ok: boolean;
      content: string;
    };
    expect(result.ok).toBe(true);
    expect(result.content).toContain('new@marshandfern.example');
    expect(result.content).toContain('A steady space');
  });

  it('drops a top-level section the model invented', () => {
    const reply =
      'hero:\n  label: "Counselling"\n  title: "New title"\n  text: |\n    x\n  image: "/images/hero.jpg"\ntestimonials:\n  - quote: "Invented"';
    const result = assemble(ORIGINAL, reply) as {
      ok: boolean;
      content: string;
    };
    expect(result.ok).toBe(true);
    expect(result.content).toContain('New title');
    expect(result.content).not.toContain('Invented');
  });

  it('refuses a reply with no recognisable section at all', () => {
    const result = assemble(
      ORIGINAL,
      'Sure! I have made the headline warmer as requested.'
    ) as { ok: boolean; reason?: string };
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no known sections/);
  });
});

describe('assemble with a full reply', () => {
  it('passes a complete file through unchanged in shape', () => {
    const fullYaml = ORIGINAL.replace(/^---\n/, '')
      .replace(/\n---\nBody text stays.\n$/, '')
      .replace('A steady space', 'A different space');
    const result = assemble(ORIGINAL, fullYaml) as {
      ok: boolean;
      content: string;
    };
    expect(result.ok).toBe(true);
    expect(result.content).toContain('A different space');
    expect(result.content).toContain('Body text stays.');
  });
});

describe('mergeFrontmatter', () => {
  it('reports how many sections it replaced', () => {
    const merged = mergeFrontmatter('a: 1\nb: 2', 'b: 3') as {
      yaml: string;
      replaced: number;
    };
    expect(merged.replaced).toBe(1);
    expect(merged.yaml).toBe('a: 1\nb: 3');
  });
});
