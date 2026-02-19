import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrolled } from '../useScrolled';

describe('useScrolled', () => {
  let scrollY = 0;
  const listeners: Map<string, EventListener> = new Map();

  beforeEach(() => {
    scrollY = 0;
    listeners.clear();

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollY,
      configurable: true,
    });

    // Mock addEventListener/removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (event, handler) => {
        listeners.set(event, handler as EventListener);
      }
    );
    vi.spyOn(window, 'removeEventListener').mockImplementation((event) => {
      listeners.delete(event);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const simulateScroll = (y: number) => {
    scrollY = y;
    const handler = listeners.get('scroll');
    if (handler) {
      act(() => {
        handler(new Event('scroll'));
      });
    }
  };

  describe('initial state', () => {
    it('should return false initially when page is not scrolled', () => {
      const { result } = renderHook(() => useScrolled());
      expect(result.current).toBe(false);
    });

    it('should register scroll event listener on mount', () => {
      renderHook(() => useScrolled());
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });
  });

  describe('scroll detection with default threshold', () => {
    it('should return false when scrollY is less than default threshold (10)', () => {
      const { result } = renderHook(() => useScrolled());

      simulateScroll(5);
      expect(result.current).toBe(false);

      simulateScroll(10);
      expect(result.current).toBe(false);
    });

    it('should return true when scrollY exceeds default threshold (10)', () => {
      const { result } = renderHook(() => useScrolled());

      simulateScroll(11);
      expect(result.current).toBe(true);

      simulateScroll(100);
      expect(result.current).toBe(true);
    });

    it('should return false when scrolling back up below threshold', () => {
      const { result } = renderHook(() => useScrolled());

      simulateScroll(50);
      expect(result.current).toBe(true);

      simulateScroll(5);
      expect(result.current).toBe(false);
    });
  });

  describe('custom threshold', () => {
    it('should use custom threshold when provided', () => {
      const { result } = renderHook(() => useScrolled(50));

      simulateScroll(30);
      expect(result.current).toBe(false);

      simulateScroll(51);
      expect(result.current).toBe(true);
    });

    it('should work with threshold of 0', () => {
      const { result } = renderHook(() => useScrolled(0));

      simulateScroll(0);
      expect(result.current).toBe(false);

      simulateScroll(1);
      expect(result.current).toBe(true);
    });

    it('should work with large threshold', () => {
      const { result } = renderHook(() => useScrolled(500));

      simulateScroll(100);
      expect(result.current).toBe(false);

      simulateScroll(501);
      expect(result.current).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove scroll event listener on unmount', () => {
      const { unmount } = renderHook(() => useScrolled());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });
  });

  describe('threshold changes', () => {
    it('should update listener when threshold changes', () => {
      const { rerender } = renderHook(
        ({ threshold }) => useScrolled(threshold),
        {
          initialProps: { threshold: 10 },
        }
      );

      expect(window.addEventListener).toHaveBeenCalledTimes(1);

      rerender({ threshold: 50 });

      // Should have removed old listener and added new one
      expect(window.removeEventListener).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle scroll position exactly at threshold', () => {
      const { result } = renderHook(() => useScrolled(100));

      simulateScroll(100);
      expect(result.current).toBe(false);
    });

    it('should handle rapid scroll changes', () => {
      const { result } = renderHook(() => useScrolled());

      simulateScroll(5);
      expect(result.current).toBe(false);

      simulateScroll(50);
      expect(result.current).toBe(true);

      simulateScroll(8);
      expect(result.current).toBe(false);

      simulateScroll(15);
      expect(result.current).toBe(true);
    });
  });
});
