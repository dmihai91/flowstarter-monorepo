import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHeaderState } from '../useHeaderState';

describe('useHeaderState', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset scrollY to 0 before each test
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('has correct initial state before mount effects run', () => {
    // Before effects, isLoaded is false, scrolled is false, mobileMenuOpen is false
    const { result } = renderHook(() => useHeaderState());
    // After mount, useEffect fires synchronously in test environment
    expect(result.current.scrolled).toBe(false);
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('sets isLoaded to true after mount', () => {
    const { result } = renderHook(() => useHeaderState());
    expect(result.current.isLoaded).toBe(true);
  });

  it('sets scrolled to true when window.scrollY > 20', () => {
    const { result } = renderHook(() => useHeaderState());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.scrolled).toBe(true);
  });

  it('keeps scrolled false when window.scrollY <= 20', () => {
    const { result } = renderHook(() => useHeaderState());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 10, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.scrolled).toBe(false);
  });

  it('scrolled transitions back to false when scrolling up', () => {
    const { result } = renderHook(() => useHeaderState());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(true);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 5, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(false);
  });

  it('allows toggling mobileMenuOpen', () => {
    const { result } = renderHook(() => useHeaderState());
    expect(result.current.mobileMenuOpen).toBe(false);

    act(() => {
      result.current.setMobileMenuOpen(true);
    });
    expect(result.current.mobileMenuOpen).toBe(true);

    act(() => {
      result.current.setMobileMenuOpen(false);
    });
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('removes scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useHeaderState());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
