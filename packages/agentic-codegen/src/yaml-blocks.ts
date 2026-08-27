/**
 * Pure helpers for working with a template's single `site-labels.md` content
 * file (markdown-frontmatter YAML). No I/O, no LLM — everything here is
 * deterministic and unit-tested in test/yaml-blocks.test.ts.
 *
 * The personalization pipeline never reformats the YAML; it changes only the
 * human-readable *values* and re-wraps the original envelope. Wave streaming
 * rewrites one subset of top-level keys at a time, so we split the YAML into
 * ordered top-level blocks (verbatim text) and splice rewritten ones back in.
 */

export interface Frontmatter {
  hasFm: boolean;
  /** The YAML body between the `---` fences (or the whole input if none). */
  yaml: string;
  /** Markdown body after the closing `---` (empty when there's no body). */
  body: string;
}

/** Split a markdown-frontmatter file into its `---` envelope + trailing body. */
export function splitFrontmatter(raw: string): Frontmatter {
  // Tolerate a leading BOM (﻿) before the opening fence.
  const m = raw.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { hasFm: false, yaml: raw, body: '' };
  return { hasFm: true, yaml: m[1] ?? '', body: m[2] ?? '' };
}

/** Re-wrap rewritten YAML in the original envelope (model tends to drop `---`). */
export function reassembleFile(original: Frontmatter, newYaml: string): string {
  return original.hasFm ? `---\n${newYaml}\n---\n${original.body}` : `${newYaml}\n`;
}

/**
 * Strip anything the model wraps around the file: code fences, a stray leading
 * or trailing `---`, surrounding whitespace.
 */
export function cleanModelYaml(text: string): string {
  let t = text.trim();
  const fence = t.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fence) t = fence[1]!.trim();
  t = t.replace(/^---\s*\n/, '').replace(/\n---\s*$/, '').trim();
  return t;
}

export interface YamlBlock {
  /** Top-level key name, e.g. "hero". */
  key: string;
  /** The verbatim block text: the key line plus its indented children. */
  text: string;
}

/** Matches a top-level YAML key at column 0 (e.g. `hero:` or `title: "x"`). */
const TOP_KEY_RE = /^([A-Za-z_][\w-]*):/;

/**
 * Split a YAML document into ordered top-level blocks. Each block is the
 * verbatim slice from one top-level key line up to (but not including) the
 * next — comments/blank lines between keys attach to the preceding block.
 * Any text before the first top-level key is returned as `preamble`.
 */
export function splitTopLevelBlocks(yaml: string): {
  preamble: string;
  blocks: YamlBlock[];
} {
  const lines = yaml.split('\n');
  const blocks: YamlBlock[] = [];
  let preambleLines: string[] = [];
  let current: { key: string; lines: string[] } | null = null;

  const flush = () => {
    if (current) blocks.push({ key: current.key, text: current.lines.join('\n') });
  };

  for (const line of lines) {
    const m = line.match(TOP_KEY_RE);
    if (m) {
      flush();
      current = { key: m[1]!, lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preambleLines.push(line);
    }
  }
  flush();
  return { preamble: preambleLines.join('\n'), blocks };
}

/** The ordered, unique top-level keys of a YAML document. */
export function topLevelKeys(yaml: string): string[] {
  return splitTopLevelBlocks(yaml).blocks.map((b) => b.key);
}

/**
 * Replace the named blocks in `base` with rewritten versions from `updated`,
 * preserving original order and any blocks not present in `updated`. Keys in
 * `updated` that don't exist in `base` are ignored (we never add structure).
 */
export function spliceBlocks(baseYaml: string, updatedYaml: string): string {
  const { preamble, blocks } = splitTopLevelBlocks(baseYaml);
  const updates = new Map(
    splitTopLevelBlocks(updatedYaml).blocks.map((b) => [b.key, b.text])
  );
  const merged = blocks.map((b) =>
    updates.has(b.key) ? { key: b.key, text: updates.get(b.key)! } : b
  );
  const parts = merged.map((b) => b.text);
  return preamble ? [preamble, ...parts].join('\n') : parts.join('\n');
}

/** Extract just the named top-level blocks (in document order) as a YAML string. */
export function extractBlocks(yaml: string, keys: string[]): string {
  const want = new Set(keys);
  return splitTopLevelBlocks(yaml)
    .blocks.filter((b) => want.has(b.key))
    .map((b) => b.text)
    .join('\n');
}

export interface StructureCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Reject model output that reformatted or dropped structure instead of just
 * personalizing values. `expectedKeys` is the set the output must still carry
 * (the whole file's keys, or a wave's subset). `minLengthRatio` guards against
 * truncated output.
 */
export function checkStructure(
  before: string,
  after: string,
  opts: { expectedKeys?: string[]; minLengthRatio?: number } = {}
): StructureCheck {
  const minRatio = opts.minLengthRatio ?? 0.4;
  if (after.trim().length < before.trim().length * minRatio) {
    return {
      ok: false,
      reason: `output too short (${after.trim().length} vs ${before.trim().length})`,
    };
  }
  const want = opts.expectedKeys ?? topLevelKeys(before);
  if (want.length > 0) {
    const got = new Set(topLevelKeys(after));
    const missing = want.filter((k) => !got.has(k));
    if (missing.length > want.length * 0.25) {
      return { ok: false, reason: `lost ${missing.length}/${want.length} top-level keys` };
    }
  }
  return { ok: true };
}

/**
 * Ordered personalization waves, keyed by top-level YAML key. Wave 1 is the
 * above-the-fold, highest-impact, smallest payload so the first personalized
 * paint is fast. Any key not named in an explicit wave falls into the final
 * "rest" wave, so new template keys are always covered.
 */
export interface Wave {
  id: string;
  /** Human phase label streamed to the funnel UI. */
  phase: string;
  /** Top-level keys this wave personalizes. Empty `keys` = "all remaining". */
  keys: string[];
}

export const ABOVE_FOLD_KEYS = ['siteMeta', 'header', 'hero', 'cta'];

export const WAVES: Wave[] = [
  { id: 'above-fold', phase: 'Writing your headline', keys: ABOVE_FOLD_KEYS },
  { id: 'rest', phase: 'Filling in the rest of your site', keys: [] },
];

/**
 * Resolve each wave's concrete key list against an actual document: explicit
 * waves keep their keys (intersected with what exists); the catch-all wave
 * (empty `keys`) gets every key not claimed by an earlier wave.
 */
export function resolveWaveKeys(yaml: string, waves: Wave[] = WAVES): Array<{
  wave: Wave;
  keys: string[];
}> {
  const all = topLevelKeys(yaml);
  const claimed = new Set<string>();
  const out: Array<{ wave: Wave; keys: string[] }> = [];
  for (const wave of waves) {
    let keys: string[];
    if (wave.keys.length > 0) {
      keys = wave.keys.filter((k) => all.includes(k) && !claimed.has(k));
    } else {
      keys = all.filter((k) => !claimed.has(k));
    }
    keys.forEach((k) => claimed.add(k));
    out.push({ wave, keys });
  }
  return out;
}
