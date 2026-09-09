import { describe, it, expect } from 'vitest';
import {
  splitFrontmatter,
  reassembleFile,
  cleanModelYaml,
  splitTopLevelBlocks,
  topLevelKeys,
  spliceBlocks,
  extractBlocks,
  checkStructure,
  resolveWaveKeys,
  WAVES,
  ABOVE_FOLD_KEYS,
} from '../src/yaml-blocks';
import { FIXTURE, FIXTURE_KEYS } from './helpers';

describe('splitFrontmatter', () => {
  it('splits envelope + body', () => {
    const fm = splitFrontmatter(FIXTURE);
    expect(fm.hasFm).toBe(true);
    expect(fm.yaml).toContain('siteMeta:');
    expect(fm.body).toContain('trailing markdown body');
  });

  it('tolerates a leading BOM', () => {
    const fm = splitFrontmatter('﻿' + FIXTURE);
    expect(fm.hasFm).toBe(true);
    expect(fm.yaml).toContain('siteMeta:');
  });

  it('treats a no-frontmatter file as raw yaml', () => {
    const fm = splitFrontmatter('hero:\n  title: "x"\n');
    expect(fm.hasFm).toBe(false);
    expect(fm.body).toBe('');
  });
});

describe('reassembleFile', () => {
  it('round-trips an unchanged file', () => {
    const fm = splitFrontmatter(FIXTURE);
    expect(reassembleFile(fm, fm.yaml).trim()).toBe(FIXTURE.trim());
  });
});

describe('cleanModelYaml', () => {
  it('strips ```yaml fences', () => {
    expect(cleanModelYaml('```yaml\nhero:\n  a: 1\n```')).toBe('hero:\n  a: 1');
  });
  it('strips a stray leading/trailing ---', () => {
    expect(cleanModelYaml('---\nhero:\n  a: 1\n---')).toBe('hero:\n  a: 1');
  });
});

describe('splitTopLevelBlocks / topLevelKeys', () => {
  it('returns ordered top-level keys', () => {
    expect(topLevelKeys(splitFrontmatter(FIXTURE).yaml)).toEqual(FIXTURE_KEYS);
  });
  it('keeps nested + block-scalar children inside their block', () => {
    const { blocks } = splitTopLevelBlocks(splitFrontmatter(FIXTURE).yaml);
    const hero = blocks.find((b) => b.key === 'hero')!;
    expect(hero.text).toContain('text: |');
    expect(hero.text).toContain('something to chew on');
    expect(hero.text).not.toContain('cta:');
  });
});

describe('extractBlocks', () => {
  it('returns only the requested blocks, in document order', () => {
    const yaml = splitFrontmatter(FIXTURE).yaml;
    const out = extractBlocks(yaml, ['hero', 'siteMeta']);
    expect(topLevelKeys(out)).toEqual(['siteMeta', 'hero']);
  });
});

describe('spliceBlocks', () => {
  it('replaces only named blocks and preserves order + others', () => {
    const yaml = splitFrontmatter(FIXTURE).yaml;
    const merged = spliceBlocks(yaml, 'hero:\n  title: "NEW"\n');
    expect(topLevelKeys(merged)).toEqual(FIXTURE_KEYS); // order intact
    expect(merged).toContain('title: "NEW"');
    expect(merged).toContain('A paragraph about the placeholder'); // about untouched
  });
  it('ignores keys that do not exist in the base (never adds structure)', () => {
    const yaml = splitFrontmatter(FIXTURE).yaml;
    const merged = spliceBlocks(yaml, 'bogus:\n  x: 1\n');
    expect(topLevelKeys(merged)).toEqual(FIXTURE_KEYS);
  });
});

describe('checkStructure', () => {
  const yaml = splitFrontmatter(FIXTURE).yaml;
  it('passes an equivalent rewrite', () => {
    expect(checkStructure(yaml, yaml).ok).toBe(true);
  });
  it('rejects truncated output', () => {
    const r = checkStructure(yaml, 'siteMeta:\n  title: "x"');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/too short/);
  });
  it('rejects wholesale key loss (>25%)', () => {
    // Keep length up with filler so it fails on KEYS, not length.
    const filler = 'siteMeta:\n  title: "' + 'x'.repeat(yaml.length) + '"';
    const r = checkStructure(yaml, filler);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/keys/);
  });
  it('scopes the check to an explicit key subset (waves)', () => {
    const blocks = extractBlocks(yaml, ABOVE_FOLD_KEYS);
    expect(checkStructure(blocks, blocks, { expectedKeys: ABOVE_FOLD_KEYS }).ok).toBe(true);
  });
});

describe('resolveWaveKeys', () => {
  it('wave 1 = above-the-fold; wave 2 = everything else; full coverage', () => {
    const resolved = resolveWaveKeys(splitFrontmatter(FIXTURE).yaml, WAVES);
    expect(resolved[0]!.keys).toEqual(ABOVE_FOLD_KEYS);
    // The "rest" wave gets every remaining key, none repeated.
    const all = resolved.flatMap((r) => r.keys);
    expect(new Set(all)).toEqual(new Set(FIXTURE_KEYS));
    expect(all.length).toBe(FIXTURE_KEYS.length);
  });
  it('only includes above-fold keys that actually exist', () => {
    const yaml = 'hero:\n  title: "x"\nfooter:\n  text: "y"\n';
    const resolved = resolveWaveKeys(yaml, WAVES);
    expect(resolved[0]!.keys).toEqual(['hero']); // siteMeta/header/cta absent
    expect(resolved[1]!.keys).toEqual(['footer']);
  });
});
