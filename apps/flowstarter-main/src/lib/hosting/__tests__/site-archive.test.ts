/**
 * What a preview tarball is allowed to contain.
 *
 * Two things are load-bearing here and neither is obvious from the call site:
 *
 *  - EVERY HTML document gets the robots meta. Not the entry point, not the
 *    pages we happen to know about — every one, because a preview is a real
 *    public site carrying a real business's name and copy nobody approved, and
 *    one un-tagged page is enough to get the whole thing indexed and outrank
 *    the site they eventually pay us for.
 *  - the archive cannot carry a path that escapes the extraction directory.
 *    The agent extracts with system `tar` as root, and the file names in a
 *    funnel preview were chosen by a language model.
 *
 * Static imports: vi.mock is hoisted above them and the app's tsconfig does not
 * allow top-level await in tests.
 */
import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import {
  NOINDEX_META,
  SiteArchiveError,
  injectNoindex,
  isHtmlPath,
  packPreviewTarball,
  packSiteTarball,
  withNoindex,
} from '../site-archive';

/** Reads a ustar archive back into `{path: content}`. */
function unpack(gzipped: Uint8Array): Record<string, string> {
  const tar = gunzipSync(Buffer.from(gzipped));
  const out: Record<string, string> = {};
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    if (!name) break;
    const prefix = header
      .subarray(345, 500)
      .toString('utf8')
      .replace(/\0.*$/, '');
    const size = parseInt(
      header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim(),
      8
    );
    const body = tar
      .subarray(offset + 512, offset + 512 + size)
      .toString('utf8');
    out[prefix ? `${prefix}/${name}` : name] = body;
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

/** The checksum every tar reader validates before trusting a header. */
function checksumIsValid(gzipped: Uint8Array): boolean {
  const tar = gunzipSync(Buffer.from(gzipped));
  const header = Buffer.from(tar.subarray(0, 512));
  const stored = parseInt(
    header.subarray(148, 156).toString('utf8').replace(/\0.*$/, '').trim(),
    8
  );
  header.fill(0x20, 148, 156);
  let sum = 0;
  for (let i = 0; i < header.length; i++) sum += header[i];
  return sum === stored;
}

describe('isHtmlPath', () => {
  it('recognises the documents a crawler would index', () => {
    expect(isHtmlPath('index.html')).toBe(true);
    expect(isHtmlPath('about/index.htm')).toBe(true);
    expect(isHtmlPath('legal.xhtml')).toBe(true);
    expect(isHtmlPath('INDEX.HTML')).toBe(true);
  });

  it('leaves everything else alone', () => {
    expect(isHtmlPath('styles.css')).toBe(false);
    expect(isHtmlPath('src/pages/index.astro')).toBe(false);
    expect(isHtmlPath('html')).toBe(false);
    expect(isHtmlPath('notes.html.bak')).toBe(false);
  });
});

describe('injectNoindex', () => {
  it('puts the tag inside <head>', () => {
    const out = injectNoindex('<html><head><title>x</title></head></html>');
    expect(out).toContain(NOINDEX_META);
    expect(out.indexOf(NOINDEX_META)).toBeLessThan(out.indexOf('<title>'));
  });

  it('handles a head with attributes', () => {
    const out = injectNoindex('<head lang="en"><title>x</title></head>');
    expect(out).toContain(NOINDEX_META);
    expect(out.indexOf(NOINDEX_META)).toBeGreaterThan(out.indexOf('<head'));
  });

  it('prepends when the document has no head', () => {
    const out = injectNoindex('<p>fragment</p>');
    expect(out.startsWith(NOINDEX_META)).toBe(true);
  });

  it('does not add a second robots meta', () => {
    const already = '<head><meta name="robots" content="all"></head>';
    expect(injectNoindex(already)).toBe(already);
  });
});

describe('withNoindex', () => {
  it('tags EVERY html file, not just the entry point', () => {
    const tagged = withNoindex([
      { path: 'index.html', content: '<head></head>' },
      { path: 'about/index.html', content: '<head></head>' },
      { path: 'services/massage/index.html', content: '<head></head>' },
      { path: '404.html', content: '<head></head>' },
      { path: 'assets/app.css', content: 'body{}' },
    ]);
    const html = tagged.filter((file) => isHtmlPath(file.path));
    expect(html).toHaveLength(4);
    for (const file of html) {
      expect(file.content).toContain(NOINDEX_META);
    }
    // Non-HTML is byte-identical: injecting a meta tag into a stylesheet
    // would break it.
    expect(tagged.find((f) => f.path === 'assets/app.css')?.content).toBe(
      'body{}'
    );
  });
});

describe('packSiteTarball', () => {
  it('round-trips a manifest through gzip + ustar', () => {
    const packed = packSiteTarball([
      { path: 'index.html', content: '<h1>Hello</h1>' },
      { path: 'assets/app.css', content: 'body { margin: 0 }' },
    ]);
    expect(unpack(packed)).toEqual({
      'index.html': '<h1>Hello</h1>',
      'assets/app.css': 'body { margin: 0 }',
    });
  });

  it('writes a header checksum a real tar will accept', () => {
    const packed = packSiteTarball([{ path: 'a.txt', content: 'hi' }]);
    expect(checksumIsValid(packed)).toBe(true);
  });

  it('handles multi-byte content and non-block-aligned sizes', () => {
    const content = 'héllo wörld — ünicode'.repeat(37);
    const packed = packSiteTarball([{ path: 'x.txt', content }]);
    expect(unpack(packed)['x.txt']).toBe(content);
  });

  it('uses the ustar prefix field for long paths', () => {
    const path = `${'nested/'.repeat(14)}page.html`;
    expect(path.length).toBeGreaterThan(100);
    const packed = packSiteTarball([{ path, content: 'deep' }]);
    expect(unpack(packed)[path]).toBe('deep');
  });

  it('is deterministic for identical input', () => {
    const files = [{ path: 'index.html', content: 'same' }];
    expect(Buffer.from(packSiteTarball(files))).toEqual(
      Buffer.from(packSiteTarball(files))
    );
  });

  it.each([
    ['../escape.html'],
    ['nested/../../escape.html'],
    ['/etc/caddy/sites/evil.caddy'],
    ['./relative.html'],
    ['back\\slash.html'],
  ])('refuses the traversal path %s', (path) => {
    expect(() => packSiteTarball([{ path, content: 'x' }])).toThrow(
      SiteArchiveError
    );
  });

  it('allows a directory literally named "..something"', () => {
    // `..` is only dangerous as a whole segment; refusing every path that
    // merely contains the characters would reject legitimate file names.
    const packed = packSiteTarball([{ path: 'a/..b/c.html', content: 'ok' }]);
    expect(unpack(packed)['a/..b/c.html']).toBe('ok');
  });

  it('refuses an empty manifest', () => {
    expect(() => packSiteTarball([])).toThrow(SiteArchiveError);
  });

  it('refuses a manifest over the size limit', () => {
    expect(() =>
      packSiteTarball([{ path: 'big.txt', content: 'x'.repeat(2048) }], {
        maxBytes: 1024,
      })
    ).toThrow(SiteArchiveError);
  });
});

describe('packPreviewTarball', () => {
  it('noindexes every HTML document in the packed bytes', () => {
    const packed = packPreviewTarball([
      { path: 'index.html', content: '<head></head><h1>Calm Path</h1>' },
      { path: 'pricing/index.html', content: '<head></head>' },
      { path: 'assets/app.js', content: 'console.log(1)' },
    ]);
    const unpacked = unpack(packed);
    expect(unpacked['index.html']).toContain(NOINDEX_META);
    expect(unpacked['pricing/index.html']).toContain(NOINDEX_META);
    expect(unpacked['assets/app.js']).toBe('console.log(1)');
  });
});
