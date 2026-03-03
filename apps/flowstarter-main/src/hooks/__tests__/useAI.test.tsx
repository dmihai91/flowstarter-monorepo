import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAIClassify, useAIModerate } from '../useAI';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAIClassify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify project successfully', async () => {
    const mockResponse = {
      industry: 'technology',
      template: 'saas',
      confidence: 0.95,
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAIClassify(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ description: 'A SaaS product for developers' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle classification error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Classification failed' }),
    });

    const { result } = renderHook(() => useAIClassify(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ description: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Classification failed');
  });
});

describe('useAIModerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should moderate content successfully', async () => {
    const mockResponse = {
      allowed: true,
      flagged_categories: [],
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAIModerate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ content: 'Professional business description' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.allowed).toBe(true);
  });

  it('should flag inappropriate content', async () => {
    const mockResponse = {
      allowed: false,
      reason: 'Content violates guidelines',
      flagged_categories: ['inappropriate'],
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAIModerate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ content: 'Test content' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.allowed).toBe(false);
  });
});
