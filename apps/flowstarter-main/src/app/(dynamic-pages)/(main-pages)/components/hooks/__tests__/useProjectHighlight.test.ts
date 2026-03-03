import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectHighlight } from '../useProjectHighlight';

describe('useProjectHighlight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null highlight when sessionStorage has no item', () => {
    const { result } = renderHook(() => useProjectHighlight());
    expect(result.current.highlightProjectId).toBeNull();
  });

  it('returns a ref object', () => {
    const { result } = renderHook(() => useProjectHighlight());
    expect(result.current.highlightedRef).toBeDefined();
    expect(result.current.highlightedRef.current).toBeNull();
  });

  it('reads project id from sessionStorage', () => {
    sessionStorage.setItem('fs_new_project_id', 'proj-123');
    const { result } = renderHook(() => useProjectHighlight());
    expect(result.current.highlightProjectId).toBe('proj-123');
  });

  it('clears highlight after 3 seconds', () => {
    sessionStorage.setItem('fs_new_project_id', 'proj-456');
    const { result } = renderHook(() => useProjectHighlight());
    expect(result.current.highlightProjectId).toBe('proj-456');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.highlightProjectId).toBeNull();
    expect(sessionStorage.getItem('fs_new_project_id')).toBeNull();
  });

  it('does not clear highlight before 3 seconds', () => {
    sessionStorage.setItem('fs_new_project_id', 'proj-789');
    const { result } = renderHook(() => useProjectHighlight());

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(result.current.highlightProjectId).toBe('proj-789');
    expect(sessionStorage.getItem('fs_new_project_id')).toBe('proj-789');
  });

  it('cleans up timers on unmount', () => {
    sessionStorage.setItem('fs_new_project_id', 'proj-cleanup');
    const { unmount } = renderHook(() => useProjectHighlight());

    unmount();

    // Advancing timers after unmount should not cause errors
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // sessionStorage should still have the item since cleanup prevented the clear
    expect(sessionStorage.getItem('fs_new_project_id')).toBe('proj-cleanup');
  });
});
