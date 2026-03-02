import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollAnimation } from '../useScrollAnimation';

describe('useScrollAnimation', () => {
  it('returns ref and isVisible=false initially', () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('accepts custom threshold and rootMargin without error', () => {
    const { result } = renderHook(() => useScrollAnimation(0.5, '200px'));
    expect(result.current.isVisible).toBe(false);
  });

  it('does not throw when ref has no element', () => {
    expect(() => {
      renderHook(() => useScrollAnimation());
    }).not.toThrow();
  });
});
