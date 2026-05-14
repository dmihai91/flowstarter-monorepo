import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from '../useCopyToClipboard';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initialises with copied = null', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBeNull();
  });

  it('sets copied to the label after copyToClipboard is called', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copyToClipboard('hello', 'MyLabel');
    });

    expect(result.current.copied).toBe('MyLabel');
  });

  it('calls navigator.clipboard.writeText with the supplied text', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copyToClipboard('copy-me', 'Label');
    });

    expect(mockWriteText).toHaveBeenCalledWith('copy-me');
  });

  it('resets copied to null after the default 2 s delay', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copyToClipboard('text', 'Lbl');
    });
    expect(result.current.copied).toBe('Lbl');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBeNull();
  });

  it('respects a custom resetDelay', () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    act(() => {
      result.current.copyToClipboard('text', 'Lbl');
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.copied).toBe('Lbl');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBeNull();
  });

  it('shows a toast with the label on copy', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copyToClipboard('value', 'NS1');
    });

    expect(toast.success).toHaveBeenCalledWith('NS1 copied!');
  });
});
