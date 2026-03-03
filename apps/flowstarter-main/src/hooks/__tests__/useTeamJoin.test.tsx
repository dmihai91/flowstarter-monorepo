import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamJoinValidation, useTeamJoin } from '../useTeamJoin';
import React from 'react';

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

describe('useTeamJoinValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate token successfully', async () => {
    const mockResponse = {
      valid: true,
      email: 'user@example.com',
      role: 'member',
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTeamJoinValidation('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.valid).toBe(true);
    expect(result.current.data?.email).toBe('user@example.com');
  });

  it('should not fetch when token is null', () => {
    const { result } = renderHook(() => useTeamJoinValidation(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle invalid token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token expired' }),
    });

    const { result } = renderHook(() => useTeamJoinValidation('expired-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Token expired');
  });
});

describe('useTeamJoin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should join team successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useTeamJoin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('valid-token');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
  });

  it('should handle join error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Already a member' }),
    });

    const { result } = renderHook(() => useTeamJoin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('token');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Already a member');
  });
});
