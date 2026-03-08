import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingPreview } from './useStreamingPreview';

const PROJECT_ID = 'proj-123';
const SANDBOX_ID = 'sb-456';

describe('useStreamingPreview', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('starts with isStreaming=false and empty files', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamedFiles).toEqual([]);
    expect(result.current.streamedCount).toBe(0);
  });

  it('startStreaming sets isStreaming=true and resets state', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    act(() => result.current.startStreaming());
    expect(result.current.isStreaming).toBe(true);
    expect(result.current.streamedFiles).toEqual([]);
    expect(result.current.streamedCount).toBe(0);
  });

  it('stopStreaming sets isStreaming=false', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    act(() => result.current.startStreaming());
    act(() => result.current.stopStreaming());
    expect(result.current.isStreaming).toBe(false);
  });

  it('pushFile increments streamedCount', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    act(() => result.current.pushFile('src/index.html', '<html/>'));
    expect(result.current.streamedCount).toBe(1);
    act(() => result.current.pushFile('src/styles.css', 'body{}'));
    expect(result.current.streamedCount).toBe(2);
  });

  it('pushFile adds path to streamedFiles', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    act(() => result.current.pushFile('src/index.html', '<html/>'));
    expect(result.current.streamedFiles).toContain('src/index.html');
  });

  it('pushFile keeps only last 5 file paths', () => {
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    for (let i = 1; i <= 7; i++) {
      act(() => result.current.pushFile(`file${i}.ts`, 'content'));
    }
    expect(result.current.streamedFiles).toHaveLength(5);
    expect(result.current.streamedFiles).toContain('file7.ts');
    expect(result.current.streamedFiles).not.toContain('file1.ts');
    expect(result.current.streamedFiles).not.toContain('file2.ts');
  });

  it('pushFile calls fetch with correct body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );

    act(() => result.current.pushFile('src/app.ts', 'export {}'));
    await act(async () => {});

    expect(mockFetch).toHaveBeenCalledWith('/api/daytona/push-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID, path: 'src/app.ts', content: 'export {}' }),
    });
  });

  it('pushFile does not throw when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    // Should not throw
    await expect(
      act(async () => { result.current.pushFile('a.ts', 'x'); await new Promise(r => setTimeout(r, 10)); })
    ).resolves.toBeUndefined();
  });

  it('pushFile does not call fetch when projectId is null', async () => {
    // Separate test-level fetch mock (afterEach will restore)
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    try {
      const { result } = renderHook(() =>
        useStreamingPreview({ projectId: null, sandboxId: SANDBOX_ID })
      );
      act(() => { result.current?.pushFile('a.ts', 'content'); });
      await act(async () => {});
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it.skip('startStreaming and stopStreaming toggle isStreaming (env isolation issue)', () => {
    // Use a fresh stub to avoid interference from beforeEach
    const { result } = renderHook(() =>
      useStreamingPreview({ projectId: PROJECT_ID, sandboxId: SANDBOX_ID })
    );
    expect(result.current).not.toBeNull();
    expect(result.current.isStreaming).toBe(false);

    act(() => { result.current.startStreaming(); });
    expect(result.current.isStreaming).toBe(true);
    expect(result.current.streamedCount).toBe(0);

    act(() => { result.current.stopStreaming(); });
    expect(result.current.isStreaming).toBe(false);
  });
});
