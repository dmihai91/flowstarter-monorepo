import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  collectSiteFiles,
  resolveSiteOutputDir,
  SiteOutputError,
} from '../src/site-output';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'fs-site-output-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function write(rel: string, content: string | Buffer): Promise<void> {
  const target = join(root, rel);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
}

describe('resolveSiteOutputDir', () => {
  it('prefers the build output when the validation commands produced one', async () => {
    await write('dist/index.html', '<h1>built</h1>');
    expect(await resolveSiteOutputDir(root, 'dist')).toBe(join(root, 'dist'));
  });

  it('falls back to the site root for a manifest that was already plain HTML', async () => {
    await write('index.html', '<h1>as authored</h1>');
    expect(await resolveSiteOutputDir(root, 'dist')).toBe(root);
  });
});

describe('collectSiteFiles', () => {
  it('reads text as UTF-8 and everything else as base64', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await write('index.html', '<h1>hello</h1>');
    await write('assets/logo.png', png);

    const files = await collectSiteFiles(root);

    expect(files.map((f) => f.path)).toEqual(['assets/logo.png', 'index.html']);
    expect(files[0]).toEqual({
      path: 'assets/logo.png',
      content: png.toString('base64'),
      encoding: 'base64',
    });
    expect(files[1]).toEqual({ path: 'index.html', content: '<h1>hello</h1>' });
  });

  it('leaves the package manager and git debris out of the artifact', async () => {
    await write('index.html', '<h1>hello</h1>');
    await write('node_modules/left-pad/index.js', 'module.exports = 1;');
    await write('.git/HEAD', 'ref: refs/heads/main');
    await write('.astro/types.d.ts', 'declare module "*"');

    expect((await collectSiteFiles(root)).map((f) => f.path)).toEqual([
      'index.html',
    ]);
  });

  it('skips symlinks rather than following them out of the tree', async () => {
    await write('index.html', '<h1>hello</h1>');
    await symlink('/etc/hosts', join(root, 'hosts.txt'));

    expect((await collectSiteFiles(root)).map((f) => f.path)).toEqual([
      'index.html',
    ]);
  });

  it('sorts, so the same tree always packs to the same bytes', async () => {
    await write('z.html', 'z');
    await write('a/b.html', 'b');
    await write('a.html', 'a');

    expect((await collectSiteFiles(root)).map((f) => f.path)).toEqual([
      'a.html',
      'a/b.html',
      'z.html',
    ]);
  });

  it('refuses an empty output rather than deploying nothing over a live site', async () => {
    await expect(collectSiteFiles(root)).rejects.toBeInstanceOf(SiteOutputError);
  });

  it('refuses an output larger than the caller allowed', async () => {
    await write('big.html', 'x'.repeat(4096));
    await expect(
      collectSiteFiles(root, { maxBytes: 1024 }),
    ).rejects.toBeInstanceOf(SiteOutputError);
  });
});
