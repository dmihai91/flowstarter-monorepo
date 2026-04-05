import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/constants', () => ({
  EXTERNAL_URLS: {
    calendly: { discovery: 'https://calendly.example.com/discovery' },
  },
}));

import { useMockEditor } from '../useMockEditor';

declare global {
  interface Window {
    __demoInterval?: ReturnType<typeof setInterval>;
  }
}

// Advance enough for the outer AI delay (800-1200ms) + typewriter per-char
// (~35-225ms × ~50 chars max = up to ~3750ms), but stay under the demo interval (5000ms).
const FLUSH_AI_RESPONSE = 4500;

describe('useMockEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (window.__demoInterval) {
      clearInterval(window.__demoInterval);
      delete window.__demoInterval;
    }
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMockEditor());
    expect(result.current.inputValue).toBe('');
    expect(result.current.isTyping).toBe(false);
    expect(result.current.mockSite).toEqual(
      expect.objectContaining({ hasContactForm: false, primaryColor: 'violet' })
    );
    expect(result.current.messagesEndRef).toBeDefined();
  });

  it('sets isLoaded to true on mount', () => {
    const { result } = renderHook(() => useMockEditor());
    expect(result.current.isLoaded).toBe(true);
  });

  it('populates initial demo messages on mount', () => {
    const { result } = renderHook(() => useMockEditor());
    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('ai');
  });

  it('handleSend adds user message for known command', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.setInputValue('Add a contact form');
    });
    act(() => {
      result.current.handleSend();
    });

    const userMessages = result.current.messages.filter(
      (m) => m.text === 'Add a contact form'
    );
    expect(userMessages.length).toBeGreaterThanOrEqual(1);
    expect(result.current.inputValue).toBe('');
    expect(result.current.isTyping).toBe(true);

    act(() => {
      vi.advanceTimersByTime(FLUSH_AI_RESPONSE);
    });

    expect(result.current.isTyping).toBe(false);
    const aiMessages = result.current.messages.filter((m) =>
      m.text.includes('Contact form added')
    );
    expect(aiMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('handleSend with direct message parameter works', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleSend('Add pricing tables');
    });
    expect(result.current.isTyping).toBe(true);

    act(() => {
      vi.advanceTimersByTime(FLUSH_AI_RESPONSE);
    });

    const aiMessages = result.current.messages.filter((m) =>
      m.text.includes('Pricing section')
    );
    expect(aiMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('handleSend does nothing for empty input', () => {
    const { result } = renderHook(() => useMockEditor());
    const initialCount = result.current.messages.length;
    act(() => {
      result.current.handleSend('');
    });
    expect(result.current.messages.length).toBe(initialCount);
  });

  it('handleSend does nothing while typing', () => {
    const { result } = renderHook(() => useMockEditor());
    act(() => {
      result.current.handleSend('Add a contact form');
    });
    expect(result.current.isTyping).toBe(true);
    const messageCount = result.current.messages.length;
    act(() => {
      result.current.handleSend('Another message');
    });
    expect(result.current.messages.length).toBe(messageCount);
  });

  it('updates mockSite state for known commands', () => {
    const { result } = renderHook(() => useMockEditor());
    act(() => {
      result.current.handleSend('Add testimonials');
    });
    // Advance outer AI delay + action delay (200ms) — don't flush typewriter loop
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.mockSite.hasTestimonials).toBe(true);
  });

  it('redirects to calendly for unknown commands', () => {
    const mockOpen = vi.fn();
    vi.stubGlobal('open', mockOpen);

    const { result } = renderHook(() => useMockEditor());
    act(() => {
      result.current.handleSend('Do something completely random');
    });

    // window.open fires after outer delay (800ms) + fixed 1500ms = 2300ms.
    // Does NOT depend on typewriter completing.
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(mockOpen).toHaveBeenCalledWith(
      'https://calendly.example.com/discovery',
      '_blank'
    );

    vi.unstubAllGlobals();
  });

  it('auto-cycles through demo sequence', () => {
    const { result } = renderHook(() => useMockEditor());
    const initialCount = result.current.messages.length;

    // Fire the first auto-advance (interval fires at ~5000ms per useMockEditor)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.messages.length).toBeGreaterThan(initialCount);

    // Advance for the AI response within the same cycle
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.messages.length).toBeGreaterThan(initialCount + 1);
  });
});
