import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFAQAccordion } from '../useFAQAccordion';

describe('useFAQAccordion', () => {
  it('defaults to openIndex 0 when no argument is provided', () => {
    const { result } = renderHook(() => useFAQAccordion());
    expect(result.current.openIndex).toBe(0);
  });

  it('accepts a custom initial index', () => {
    const { result } = renderHook(() => useFAQAccordion(2));
    expect(result.current.openIndex).toBe(2);
  });

  it('accepts null as initial index (all closed)', () => {
    const { result } = renderHook(() => useFAQAccordion(null));
    expect(result.current.openIndex).toBeNull();
  });

  it('opens a new index when toggled', () => {
    const { result } = renderHook(() => useFAQAccordion(null));
    act(() => {
      result.current.toggle(3);
    });
    expect(result.current.openIndex).toBe(3);
  });

  it('closes the currently open index when toggled again', () => {
    const { result } = renderHook(() => useFAQAccordion(1));
    expect(result.current.openIndex).toBe(1);
    act(() => {
      result.current.toggle(1);
    });
    expect(result.current.openIndex).toBeNull();
  });

  it('switches to a different index when a new one is toggled', () => {
    const { result } = renderHook(() => useFAQAccordion(0));
    act(() => {
      result.current.toggle(2);
    });
    expect(result.current.openIndex).toBe(2);
  });

  it('toggle function is stable across renders', () => {
    const { result, rerender } = renderHook(() => useFAQAccordion(0));
    const firstToggle = result.current.toggle;
    rerender();
    expect(result.current.toggle).toBe(firstToggle);
  });
});
