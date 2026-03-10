import { describe, expect, it, vi } from 'vitest';
import { getPreviewUrl } from '../devServerService';
import { extractPreviewUrlValue, resolvePreviewUrlFromResult } from '../previewUrl';

describe('preview URL fix', () => {
  it('extracts preview URLs from Daytona preview link shapes', () => {
    expect(extractPreviewUrlValue('https://preview.example')).toBe('https://preview.example');
    expect(extractPreviewUrlValue({ url: 'https://preview.example/url' })).toBe('https://preview.example/url');
    expect(extractPreviewUrlValue({ previewUrl: 'https://preview.example/preview' })).toBe('https://preview.example/preview');
    expect(extractPreviewUrlValue({ href: 'https://preview.example/href' })).toBe('https://preview.example/href');
    expect(extractPreviewUrlValue({})).toBeNull();
  });

  it('keeps the preview URL when the result uses previewUrl instead of url', () => {
    expect(resolvePreviewUrlFromResult({ previewUrl: 'https://preview.example/live' })).toBe('https://preview.example/live');
    expect(resolvePreviewUrlFromResult({ url: 'https://preview.example/live' })).toBe('https://preview.example/live');
    expect(resolvePreviewUrlFromResult(null)).toBeNull();
  });

  it('falls back across ports until Daytona returns a usable preview URL', async () => {
    const getPreviewLink = vi
      .fn()
      .mockRejectedValueOnce(new Error('4321 unavailable'))
      .mockResolvedValueOnce({ previewUrl: 'https://preview.example:5173' });

    const sandbox = {
      id: 'sandbox-123',
      getPreviewLink,
    } as unknown as Parameters<typeof getPreviewUrl>[0];

    const result = await getPreviewUrl(sandbox, 4321);

    expect(getPreviewLink).toHaveBeenNthCalledWith(1, 4321);
    expect(getPreviewLink).toHaveBeenNthCalledWith(2, 5173);
    expect(result).toEqual({
      url: 'https://preview.example:5173',
      port: 5173,
    });
  });
});
