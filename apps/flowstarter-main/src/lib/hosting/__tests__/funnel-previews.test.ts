import { describe, expect, it } from 'vitest';

describe('manifestSafeForJson', () => {
  it('re-encodes a file whose content carries NUL as base64 and leaves the rest alone', async () => {
    const { manifestSafeForJson } = await import('../funnel-previews');
    const nul = 'ab\u0000cd';
    const { value, reencoded } = manifestSafeForJson({
      files: [
        { path: 'public/images/x.jpg', content: nul, type: 'file' },
        { path: 'src/content/site.md', content: 'hello', type: 'file' },
      ],
      note: 'plain',
    });
    expect(reencoded).toEqual(['public/images/x.jpg']);
    const files = (value as { files: Array<{ path: string; content: string; encoding?: string }> }).files;
    expect(files[0].encoding).toBe('base64');
    expect(Buffer.from(files[0].content, 'base64').toString('utf8')).toBe(nul);
    expect(files[1]).toEqual({ path: 'src/content/site.md', content: 'hello', type: 'file' });
    expect(JSON.stringify(value).includes('\\u0000')).toBe(false);
  });
});
