import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExampleSites } from '../useExampleSites';
import React from 'react';

global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useExampleSites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch example sites successfully', async () => {
    const mockResponse = {
      sites: [
        { id: '1', name: 'Example Site', description: 'Test site' },
        { id: '2', name: 'Another Site', description: 'Another test' },
      ],
      categories: [{ value: 'portfolio', label: 'Portfolio' }],
      industries: ['Technology', 'Healthcare'],
    };

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useExampleSites(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sites).toHaveLength(2);
    expect(result.current.data?.categories).toHaveLength(1);
    expect(result.current.data?.industries).toHaveLength(2);
  });

  it('should apply category filter', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [], categories: [], industries: [] }),
    });

    renderHook(() => useExampleSites({ category: 'portfolio' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=portfolio')
      );
    });
  });

  it('should apply industry filter', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [], categories: [], industries: [] }),
    });

    renderHook(() => useExampleSites({ industry: 'Technology' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('industry=Technology')
      );
    });
  });

  it('should apply search filter', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [], categories: [], industries: [] }),
    });

    renderHook(() => useExampleSites({ search: 'portfolio' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=portfolio')
      );
    });
  });

  it('should apply featured filter', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [], categories: [], industries: [] }),
    });

    renderHook(() => useExampleSites({ featured: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('featured=true')
      );
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useExampleSites(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Failed to load example sites');
  });

  it('should not include "all" category in request', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [], categories: [], industries: [] }),
    });

    renderHook(() => useExampleSites({ category: 'all' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('category=')
      );
    });
  });
});
