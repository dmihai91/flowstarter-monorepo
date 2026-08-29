/**
 * The structural half of "every LLM call goes through one wrapper".
 *
 * Budgets and the usage ledger only hold if there is no second door. This test
 * walks the whole of `src/` and fails if any file other than the wrapper
 * itself imports the AI SDK's call functions, or builds its own OpenRouter
 * provider. It is deliberately a grep and not a lint rule: it costs nothing,
 * runs in CI with the rest of the suite, and names the offending file.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * Locate `src/` from the working directory. Vitest is run both as
 * `vitest --root src` and from the app root, so the marker file is what
 * identifies the tree rather than a fixed relative path.
 */
function findSrcRoot(): string {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, 'src'),
    cwd,
    resolve(cwd, 'apps/flowstarter-main/src'),
    resolve(cwd, '..'),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'lib', 'ai', 'llm.ts'))) return candidate;
  }
  throw new Error(`Could not locate src/ from ${cwd}`);
}

const SRC_ROOT = findSrcRoot();

/** The wrapper is the one place allowed to call the SDK. */
const SDK_CALL_ALLOWLIST = ['lib/ai/llm.ts'];

/** The provider factory lives in exactly one module. */
const PROVIDER_ALLOWLIST = ['lib/ai/client.ts', 'lib/ai/llm.ts'];

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '__tests__',
  '__mocks__',
  'test',
]);

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/** `import { … } from 'ai'` / `from "ai"`, including `import type`. */
const AI_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]ai['"]/g;

/** The three entry points that spend tokens. */
const SDK_CALLS = ['generateText', 'generateObject', 'streamText'];

/** A second provider instance would bypass the wrapper's model routing. */
const PROVIDER_PATTERNS = [
  /createOpenRouter\s*\(/,
  /openrouter\s*\.\s*chat\s*\(/,
];

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry)) continue;
      sourceFiles(full, found);
      continue;
    }
    if (!SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) continue;
    if (entry.includes('.test.') || entry.includes('.spec.')) continue;
    found.push(full);
  }
  return found;
}

const FILES = sourceFiles(SRC_ROOT).map((file) => ({
  path: relative(SRC_ROOT, file).split('\\').join('/'),
  source: readFileSync(file, 'utf8'),
}));

describe('no unbudgeted LLM call path exists', () => {
  it('finds source files to scan', () => {
    // Guards the guard: a broken walk would make every check vacuously pass.
    expect(FILES.length).toBeGreaterThan(100);
    expect(FILES.map((f) => f.path)).toContain('lib/ai/llm.ts');
  });

  it('only the wrapper imports generateText/generateObject/streamText', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      if (SDK_CALL_ALLOWLIST.includes(file.path)) continue;
      for (const match of Array.from(file.source.matchAll(AI_IMPORT))) {
        const imported = match[1] ?? '';
        const banned = SDK_CALLS.filter((name) =>
          new RegExp(`\\b${name}\\b`).test(imported)
        );
        if (banned.length > 0) {
          offenders.push(
            `${file.path}: imports ${banned.join(', ')} from 'ai'`
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('only lib/ai/client.ts constructs the OpenRouter provider', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      if (PROVIDER_ALLOWLIST.includes(file.path)) continue;
      for (const pattern of PROVIDER_PATTERNS) {
        if (pattern.test(file.source)) {
          offenders.push(`${file.path}: matches ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every AI SDK call site in the wrapper is budgeted', () => {
    const wrapper = FILES.find((f) => f.path === 'lib/ai/llm.ts');
    expect(wrapper).toBeDefined();
    // `prepare()` resolves the budget; nothing may call the SDK without it.
    const sdkCallCount = SDK_CALLS.reduce(
      (total, name) =>
        total +
        (wrapper!.source.match(new RegExp(`\\b${name}\\(`, 'g')) ?? []).length,
      0
    );
    const prepareCount = (wrapper!.source.match(/await prepare\(/g) ?? [])
      .length;
    expect(sdkCallCount).toBeGreaterThan(0);
    expect(prepareCount).toBe(sdkCallCount);
  });
});
