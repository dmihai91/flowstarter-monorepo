import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiMutation } from '../useApiMutation';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useApiMutation', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useApiMutation('/api/test'));
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets isPending during request', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useApiMutation('/api/test'));

    act(() => { result.current.mutate({ foo: 'bar' }); });
    expect(result.current.isPending).toBe(true);
  });

  it('returns data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const { result } = renderHook(() => useApiMutation('/api/test'));
    await act(async () => { await result.current.mutate({ foo: 'bar' }); });

    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' }),
    });

    const { result } = renderHook(() => useApiMutation('/api/test'));
    await act(async () => { await result.current.mutate({ foo: 'bar' }); });

    expect(result.current.error).toBe('Bad request');
    expect(result.current.data).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failed'));

    const { result } = renderHook(() => useApiMutation('/api/test'));
    await act(async () => { await result.current.mutate(); });

    expect(result.current.error).toBe('Network failed');
  });

  it('calls onSuccess callback', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useApiMutation('/api/test', 'POST', { onSuccess })
    );
    await act(async () => { await result.current.mutate({ foo: 'bar' }); });

    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
  });

  it('calls onError callback', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) });
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useApiMutation('/api/test', 'POST', { onError })
    );
    await act(async () => { await result.current.mutate(); });

    expect(onError).toHaveBeenCalledWith('Server error');
  });

  it('sends correct method and headers', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useApiMutation('/api/test', 'PATCH'));
    await act(async () => { await result.current.mutate({ name: 'test' }); });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });
  });
});
