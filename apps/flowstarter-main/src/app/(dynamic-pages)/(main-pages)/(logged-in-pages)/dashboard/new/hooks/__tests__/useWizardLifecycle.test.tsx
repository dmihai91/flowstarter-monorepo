import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWizardLifecycle } from '../useWizardLifecycle';

describe('useWizardLifecycle', () => {
  let mockOnNext: () => void;

  beforeEach(() => {
    mockOnNext = vi.fn() as () => void;
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should restore scrolling on mount', () => {
    vi.useFakeTimers();

    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: false,
      })
    );

    // Wait for requestAnimationFrame to complete
    vi.runAllTimers();

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');

    vi.useRealTimers();
  });

  it('should add wizard-next event listener', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: false,
      })
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      'wizard-next',
      expect.any(Function)
    );
  });

  it('should call onNext when wizard-next event is dispatched', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: false,
      })
    );

    window.dispatchEvent(new Event('wizard-next'));

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should add beforeunload event listener when hasUnsaved is true', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: true,
      })
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should prevent default on beforeunload when hasUnsaved is true', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: true,
      })
    );

    const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(beforeUnloadEvent, 'preventDefault');

    window.dispatchEvent(beforeUnloadEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not prevent default on beforeunload when hasUnsaved is false', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: false,
      })
    );

    const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(beforeUnloadEvent, 'preventDefault');

    window.dispatchEvent(beforeUnloadEvent);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: true,
      })
    );

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'wizard-next',
      expect.any(Function)
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should update event listener when hasUnsaved changes', () => {
    const { rerender } = renderHook(
      ({ hasUnsaved }) =>
        useWizardLifecycle({
          onNext: mockOnNext,
          hasUnsaved,
        }),
      { initialProps: { hasUnsaved: false } }
    );

    const beforeUnloadEvent1 = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy1 = vi.spyOn(beforeUnloadEvent1, 'preventDefault');

    window.dispatchEvent(beforeUnloadEvent1);
    expect(preventDefaultSpy1).not.toHaveBeenCalled();

    rerender({ hasUnsaved: true });

    const beforeUnloadEvent2 = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy2 = vi.spyOn(beforeUnloadEvent2, 'preventDefault');

    window.dispatchEvent(beforeUnloadEvent2);
    expect(preventDefaultSpy2).toHaveBeenCalled();
  });

  it('should handle multiple wizard-next events', () => {
    renderHook(() =>
      useWizardLifecycle({
        onNext: mockOnNext,
        hasUnsaved: false,
      })
    );

    window.dispatchEvent(new Event('wizard-next'));
    window.dispatchEvent(new Event('wizard-next'));
    window.dispatchEvent(new Event('wizard-next'));

    expect(mockOnNext).toHaveBeenCalledTimes(3);
  });

  it('should update onNext callback when it changes', () => {
    const mockOnNext2 = vi.fn();

    const { rerender } = renderHook(
      ({ onNext }) =>
        useWizardLifecycle({
          onNext,
          hasUnsaved: false,
        }),
      { initialProps: { onNext: mockOnNext } }
    );

    window.dispatchEvent(new Event('wizard-next'));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
    expect(mockOnNext2).not.toHaveBeenCalled();

    rerender({ onNext: mockOnNext2 });

    window.dispatchEvent(new Event('wizard-next'));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
    expect(mockOnNext2).toHaveBeenCalledTimes(1);
  });
});
