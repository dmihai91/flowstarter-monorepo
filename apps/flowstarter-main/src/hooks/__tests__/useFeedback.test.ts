import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedback } from '../useFeedback';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useFeedback', () => {
  it('starts with empty form', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.formData).toEqual({ category: '', message: '', email: '' });
  });

  it('updates fields', () => {
    const { result } = renderHook(() => useFeedback());
    act(() => { result.current.updateField('category', 'bug'); });
    expect(result.current.formData.category).toBe('bug');
  });

  it('validates empty category', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.validate()).toBe('Category is required');
  });

  it('validates empty message', () => {
    const { result } = renderHook(() => useFeedback());
    act(() => { result.current.updateField('category', 'bug'); });
    expect(result.current.validate()).toBe('Message is required');
  });

  it('validates short message', () => {
    const { result } = renderHook(() => useFeedback());
    act(() => {
      result.current.updateField('category', 'bug');
      result.current.updateField('message', 'short');
    });
    expect(result.current.validate()).toBe('Message too short');
  });

  it('returns null when valid', () => {
    const { result } = renderHook(() => useFeedback());
    act(() => {
      result.current.updateField('category', 'bug');
      result.current.updateField('message', 'This is a valid feedback message');
    });
    expect(result.current.validate()).toBeNull();
  });

  it('resets form', () => {
    const { result } = renderHook(() => useFeedback());
    act(() => {
      result.current.updateField('category', 'bug');
      result.current.updateField('message', 'test message here');
      result.current.resetForm();
    });
    expect(result.current.formData).toEqual({ category: '', message: '', email: '' });
  });
});
