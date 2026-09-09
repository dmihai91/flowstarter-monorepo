import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Rights are confirmed over a chosen set of files, so holding an asset row is
 * not permission to publish it. The gate deliberately counts unconfirmed
 * uploads (they are exactly what we still need to ask about), which means the
 * generator cannot reuse that reader.
 *
 * `cachedAssets` is hardcoded empty today, so nothing leaks yet. This guard is
 * here for the commit that populates it: assembling generator assets from a
 * raw `assets` query would silently put a photo we have no rights to onto a
 * client's live site, and no test would otherwise notice.
 */
const SRC = join(__dirname, '..', '..', '..');

const GENERATOR_CALLERS = ['app/api/discovery/preview/live/route.ts'] as const;

describe('generator asset loading', () => {
  it.each(GENERATOR_CALLERS)(
    '%s does not read the assets table directly',
    (relative) => {
      const source = readFileSync(join(SRC, relative), 'utf8');

      const readsAssetsTable = /\.from\(\s*['"]assets['"]\s*\)/.test(source);
      const usesTheLoader = source.includes('loadUsableAssets');

      // Reading the table is only allowed via the loader, which filters on
      // rights_confirmed_at.
      expect(readsAssetsTable && !usesTheLoader).toBe(false);
    }
  );

  it('the loader is the only place that filters rights for generation', () => {
    const loader = readFileSync(
      join(SRC, 'lib/flowstarter/generation-assets.ts'),
      'utf8'
    );
    expect(loader).toMatch(/rights_confirmed_at/);
  });
});
