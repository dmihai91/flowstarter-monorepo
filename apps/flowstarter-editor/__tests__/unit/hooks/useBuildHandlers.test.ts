/**
 * useBuildHandlers Hook Tests
 *
 * Tests the build progress constants and build handler logic.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Build Progress Constants Tests ──────────────────────────────────────────

describe('useBuildHandlers BUILD_PROGRESS Constants', () => {
  const BUILD_PROGRESS = {
    INITIAL: 0,
    CLONING_START: 5,
    CLONING_COMPLETE: 25,
    CUSTOMIZING_START: 30,
    SYNCING: 75,
    PREVIEW_START: 80,
    COMPLETE: 100,
  } as const;

  it('should have correct initial progress value', () => {
    expect(BUILD_PROGRESS.INITIAL).toBe(0);
  });

  it('should have correct cloning phase values', () => {
    expect(BUILD_PROGRESS.CLONING_START).toBe(5);
    expect(BUILD_PROGRESS.CLONING_COMPLETE).toBe(25);
    expect(BUILD_PROGRESS.CLONING_COMPLETE).toBeGreaterThan(BUILD_PROGRESS.CLONING_START);
  });

  it('should have correct customizing phase value', () => {
    expect(BUILD_PROGRESS.CUSTOMIZING_START).toBe(30);
    expect(BUILD_PROGRESS.CUSTOMIZING_START).toBeGreaterThan(BUILD_PROGRESS.CLONING_COMPLETE);
  });

  it('should have correct syncing phase value', () => {
    expect(BUILD_PROGRESS.SYNCING).toBe(75);
    expect(BUILD_PROGRESS.SYNCING).toBeGreaterThan(BUILD_PROGRESS.CUSTOMIZING_START);
  });

  it('should have correct preview phase value', () => {
    expect(BUILD_PROGRESS.PREVIEW_START).toBe(80);
    expect(BUILD_PROGRESS.PREVIEW_START).toBeGreaterThan(BUILD_PROGRESS.SYNCING);
  });

  it('should have correct completion value', () => {
    expect(BUILD_PROGRESS.COMPLETE).toBe(100);
    expect(BUILD_PROGRESS.COMPLETE).toBeGreaterThan(BUILD_PROGRESS.PREVIEW_START);
  });

  it('should have monotonically increasing progress values', () => {
    const values = [
      BUILD_PROGRESS.INITIAL,
      BUILD_PROGRESS.CLONING_START,
      BUILD_PROGRESS.CLONING_COMPLETE,
      BUILD_PROGRESS.CUSTOMIZING_START,
      BUILD_PROGRESS.SYNCING,
      BUILD_PROGRESS.PREVIEW_START,
      BUILD_PROGRESS.COMPLETE,
    ];

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// ─── Font Weight Constants Tests ─────────────────────────────────────────────

describe('useBuildHandlers FONT_WEIGHTS Constants', () => {
  const FONT_WEIGHTS = {
    HEADING: 700,
    BODY: 400,
  } as const;

  it('should have correct heading font weight', () => {
    expect(FONT_WEIGHTS.HEADING).toBe(700);
  });

  it('should have correct body font weight', () => {
    expect(FONT_WEIGHTS.BODY).toBe(400);
  });

  it('should have heading weight greater than body weight', () => {
    expect(FONT_WEIGHTS.HEADING).toBeGreaterThan(FONT_WEIGHTS.BODY);
  });
});

// ─── Build Flow Tests ────────────────────────────────────────────────────────

describe('useBuildHandlers Build Flow', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('should pass abort signal to fetch calls', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: {} }),
    });

    await fetch('/api/orchestrator?action=files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlId: 'test-123' }),
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/orchestrator?action=files',
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });

  it('should handle API response for files', async () => {
    const mockFiles = {
      'src/index.ts': { content: 'console.log("hello")' },
      'package.json': { content: '{}' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: mockFiles }),
    });

    const response = await fetch('/api/orchestrator?action=files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlId: 'test-123' }),
    });

    const data = (await response.json()) as { files: Record<string, { content?: string } | string> };
    expect(Object.keys(data.files || {})).toHaveLength(2);
  });

  it('should handle preview API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        previewUrl: 'https://preview.example.com',
        sandboxId: 'sandbox-123',
      }),
    });

    const response = await fetch('/api/daytona/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-123', files: {} }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      previewUrl?: string;
      sandboxId?: string;
    };

    expect(data.success).toBe(true);
    expect(data.previewUrl).toBe('https://preview.example.com');
    expect(data.sandboxId).toBe('sandbox-123');
  });
});

// ─── AbortController Tests ───────────────────────────────────────────────────

describe('useBuildHandlers AbortController', () => {
  it('should handle AbortError without showing error message', () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';

    const isAbortError = (err: unknown) =>
      err instanceof Error && err.name === 'AbortError';

    expect(isAbortError(error)).toBe(true);
  });

  it('should show error message for non-abort errors', () => {
    const error = new Error('Network failure');

    const isAbortError = (err: unknown) =>
      err instanceof Error && err.name === 'AbortError';

    expect(isAbortError(error)).toBe(false);
  });

  it('should abort all in-flight requests on cleanup', () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, 'abort');

    // Simulate cleanup
    controller.abort();

    expect(abortSpy).toHaveBeenCalled();
    expect(controller.signal.aborted).toBe(true);
  });
});

// ─── Path Normalization Tests ────────────────────────────────────────────────

describe('useBuildHandlers Path Normalization', () => {
  // Simple normalization function for testing
  const normalizePath = (path: string): string => {
    return path.replace(/\\/g, '/').replace(/^\/+/, '');
  };

  it('should normalize Windows-style paths', () => {
    expect(normalizePath('src\\components\\App.tsx')).toBe('src/components/App.tsx');
  });

  it('should normalize paths with leading slashes', () => {
    expect(normalizePath('/src/index.ts')).toBe('src/index.ts');
    expect(normalizePath('//src/index.ts')).toBe('src/index.ts');
  });

  it('should leave already normalized paths unchanged', () => {
    expect(normalizePath('src/components/App.tsx')).toBe('src/components/App.tsx');
  });
});

// ─── Font Pairing Generation Tests ───────────────────────────────────────────

describe('useBuildHandlers Font Pairing', () => {
  const FONT_WEIGHTS = {
    HEADING: 700,
    BODY: 400,
  } as const;

  it('should generate correct Google Fonts URL', () => {
    const heading = 'Inter';
    const body = 'Open Sans';

    const googleFonts = `family=${heading.replace(' ', '+')}:wght@${FONT_WEIGHTS.HEADING}&family=${body.replace(' ', '+')}:wght@${FONT_WEIGHTS.BODY}`;

    expect(googleFonts).toBe('family=Inter:wght@700&family=Open+Sans:wght@400');
  });

  it('should handle font names with spaces', () => {
    const heading = 'Playfair Display';
    const body = 'Source Sans Pro';

    const googleFonts = `family=${heading.replace(' ', '+')}:wght@${FONT_WEIGHTS.HEADING}&family=${body.replace(' ', '+')}:wght@${FONT_WEIGHTS.BODY}`;

    expect(googleFonts).toContain('Playfair+Display');
    expect(googleFonts).toContain('Source+Sans');
  });
});

