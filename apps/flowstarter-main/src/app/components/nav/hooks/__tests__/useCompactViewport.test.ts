import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompactViewport } from '../useCompactViewport';

describe('useCompactViewport', () => {
  let innerWidth = 1024;
  let innerHeight = 768;
  const listeners: Map<string, EventListener> = new Map();

  beforeEach(() => {
    innerWidth = 1024;
    innerHeight = 768;
    listeners.clear();

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      get: () => innerWidth,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      get: () => innerHeight,
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

  const setViewportSize = (width: number, height: number) => {
    innerWidth = width;
    innerHeight = height;
  };

  const triggerResize = () => {
    const handler = listeners.get('resize');
    if (handler) {
      act(() => {
        handler(new Event('resize'));
      });
    }
  };

  const triggerOrientationChange = () => {
    const handler = listeners.get('orientationchange');
    if (handler) {
      act(() => {
        handler(new Event('orientationchange'));
      });
    }
  };

  describe('initial state', () => {
    it('should return false for normal desktop viewport', () => {
      setViewportSize(1024, 768);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });

    it('should register resize and orientationchange event listeners on mount', () => {
      renderHook(() => useCompactViewport());
      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function)
      );
    });
  });

  describe('compact detection based on height', () => {
    it('should return true when height is 420 or less (regardless of width)', () => {
      setViewportSize(1920, 420);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should return true when height is less than 420', () => {
      setViewportSize(1920, 400);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should return false when height is just above 420', () => {
      setViewportSize(1920, 421);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });
  });

  describe('compact detection based on width and height combo', () => {
    it('should return true when width <= 600 AND height <= 480', () => {
      setViewportSize(600, 480);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should return true when both dimensions are below thresholds', () => {
      setViewportSize(500, 400);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should return false when width <= 600 but height > 480', () => {
      setViewportSize(600, 500);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });

    it('should return false when height <= 480 but width > 600', () => {
      setViewportSize(700, 480);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });
  });

  describe('resize event handling', () => {
    it('should update to compact when viewport becomes small', () => {
      setViewportSize(1024, 768);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);

      setViewportSize(500, 400);
      triggerResize();
      expect(result.current).toBe(true);
    });

    it('should update to non-compact when viewport becomes large', () => {
      setViewportSize(500, 400);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);

      setViewportSize(1024, 768);
      triggerResize();
      expect(result.current).toBe(false);
    });
  });

  describe('orientationchange event handling', () => {
    it('should update on orientation change to landscape (compact)', () => {
      setViewportSize(800, 600);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);

      // Simulate landscape orientation on mobile
      setViewportSize(600, 400);
      triggerOrientationChange();
      expect(result.current).toBe(true);
    });

    it('should update on orientation change to portrait (non-compact)', () => {
      setViewportSize(400, 300);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);

      // Simulate portrait orientation
      setViewportSize(400, 700);
      triggerOrientationChange();
      expect(result.current).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useCompactViewport());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function)
      );
    });
  });

  describe('real-world viewport scenarios', () => {
    it('should be compact for iPhone SE landscape (667x375)', () => {
      setViewportSize(667, 375);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should be compact for mobile landscape with very short height', () => {
      setViewportSize(800, 360);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should not be compact for iPad portrait (768x1024)', () => {
      setViewportSize(768, 1024);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });

    it('should not be compact for standard laptop (1366x768)', () => {
      setViewportSize(1366, 768);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });

    it('should be compact for split-screen on small monitors', () => {
      setViewportSize(580, 450);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle exact boundary values correctly', () => {
      // Exactly at height threshold
      setViewportSize(800, 420);
      let { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);

      // Just above height threshold
      setViewportSize(800, 421);
      ({ result } = renderHook(() => useCompactViewport()));
      expect(result.current).toBe(false);

      // Exactly at width/height combo threshold
      setViewportSize(600, 480);
      ({ result } = renderHook(() => useCompactViewport()));
      expect(result.current).toBe(true);
    });

    it('should handle very small viewports', () => {
      setViewportSize(320, 240);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(true);
    });

    it('should handle very large viewports', () => {
      setViewportSize(3840, 2160);
      const { result } = renderHook(() => useCompactViewport());
      expect(result.current).toBe(false);
    });
  });
});
