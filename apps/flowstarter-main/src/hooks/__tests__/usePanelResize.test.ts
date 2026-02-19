import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePanelResize } from '../usePanelResize';

describe('usePanelResize', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default width', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    expect(result.current.width).toBe(600);
    expect(result.current.isResizing).toBe(false);
  });

  it('should load saved width from localStorage', () => {
    vi.mocked(global.localStorage.getItem).mockReturnValue('800');

    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    expect(result.current.width).toBe(800);
  });

  it('should set isResizing to true on mouse down', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    const event = {
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleMouseDown(event);
    });

    expect(result.current.isResizing).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should constrain width to minWidth', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
        minWidth: 400,
        maxWidth: 1200,
      })
    );

    // Start resizing
    act(() => {
      result.current.handleMouseDown({
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Simulate mouse move with clientX below minWidth
    const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 300 });
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.width).toBe(400); // Should be constrained to minWidth
  });

  it('should constrain width to maxWidth', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
        minWidth: 400,
        maxWidth: 1200,
      })
    );

    // Start resizing
    act(() => {
      result.current.handleMouseDown({
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Simulate mouse move with clientX above maxWidth
    const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 1500 });
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.width).toBe(1200); // Should be constrained to maxWidth
  });

  it('should save width to localStorage on mouse up', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    // Start resizing
    act(() => {
      result.current.handleMouseDown({
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Simulate mouse move
    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 800 });
      document.dispatchEvent(mouseMoveEvent);
    });

    // Stop resizing
    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'test-panel',
      '800'
    );
    expect(result.current.isResizing).toBe(false);
  });

  it('should set body cursor during resize', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    // Start resizing
    act(() => {
      result.current.handleMouseDown({
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');

    // Stop resizing
    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);
    });

    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function)
    );
  });

  it('should not update width when not resizing', () => {
    const { result } = renderHook(() =>
      usePanelResize({
        storageKey: 'test-panel',
        defaultWidth: 600,
      })
    );

    const initialWidth = result.current.width;

    // Simulate mouse move without starting resize
    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 800 });
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.width).toBe(initialWidth); // Should not change
  });
});
