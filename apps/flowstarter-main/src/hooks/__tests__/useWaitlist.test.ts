import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWaitlist } from '../useWaitlist';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => { mockFetch.mockReset(); });

describe('useWaitlist', () => {
  it('starts with empty email', () => {
    const { result } = renderHook(() => useWaitlist());
    expect(result.current.email).toBe('');
    expect(result.current.isPending).toBe(false);
  });

  it('updates email', () => {
    const { result } = renderHook(() => useWaitlist());
    act(() => { result.current.setEmail('test@example.com'); });
    expect(result.current.email).toBe('test@example.com');
  });

  it('does not submit empty email', async () => {
    const { result } = renderHook(() => useWaitlist());
    await act(async () => { await result.current.submit(); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits email', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const { result } = renderHook(() => useWaitlist());
    act(() => { result.current.setEmail('test@example.com'); });
    await act(async () => { await result.current.submit(); });
    expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    }));
  });

  it('calls onSuccess and resets email', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useWaitlist(onSuccess));
    act(() => { result.current.setEmail('test@example.com'); });
    await act(async () => { await result.current.submit(); });
    expect(onSuccess).toHaveBeenCalled();
  });
});
