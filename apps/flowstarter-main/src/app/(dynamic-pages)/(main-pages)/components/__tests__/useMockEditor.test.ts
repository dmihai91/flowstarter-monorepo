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

describe('useMockEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
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
      expect.objectContaining({
        hasContactForm: false,
        primaryColor: 'violet',
      })
    );
    expect(result.current.messagesEndRef).toBeDefined();
  });

  it('sets isLoaded to true on mount', () => {
    const { result } = renderHook(() => useMockEditor());
    expect(result.current.isLoaded).toBe(true);
  });

  it('populates initial demo messages on mount', () => {
    const { result } = renderHook(() => useMockEditor());

    // Initial messages include the first demo prompt and response
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

    // User message should be added
    const userMessages = result.current.messages.filter((m) => m.text === 'Add a contact form');
    expect(userMessages.length).toBeGreaterThanOrEqual(1);

    // Input should be cleared
    expect(result.current.inputValue).toBe('');

    // Should be in typing state
    expect(result.current.isTyping).toBe(true);

    // After delay, AI response appears
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isTyping).toBe(false);
    const aiMessages = result.current.messages.filter((m) => m.text.includes('Contact form added'));
    expect(aiMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('handleSend with direct message parameter works', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleSend('Add pricing tables');
    });

    expect(result.current.isTyping).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const aiMessages = result.current.messages.filter((m) => m.text.includes('Pricing section'));
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

    // Trigger a send to start typing
    act(() => {
      result.current.handleSend('Add a contact form');
    });
    expect(result.current.isTyping).toBe(true);

    const messageCount = result.current.messages.length;

    // Try to send again while typing
    act(() => {
      result.current.handleSend('Another message');
    });

    // No new message should be added
    expect(result.current.messages.length).toBe(messageCount);
  });

  it('updates mockSite state for known commands', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleSend('Add testimonials');
    });

    // Wait for AI response + action delay
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

    // Wait for typing delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Check redirect message was added
    const redirectMessages = result.current.messages.filter((m) =>
      m.text.includes('discovery call')
    );
    expect(redirectMessages.length).toBeGreaterThanOrEqual(1);

    // Wait for window.open delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockOpen).toHaveBeenCalledWith('https://calendly.example.com/discovery', '_blank');

    vi.unstubAllGlobals();
  });

  it('auto-cycles through demo sequence', () => {
    const { result } = renderHook(() => useMockEditor());

    // Initial: 2 messages (first demo prompt + response)
    const initialCount = result.current.messages.length;

    // After 3 seconds, first auto-advance triggers
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should have added a user message
    expect(result.current.messages.length).toBeGreaterThan(initialCount);

    // After typing delay, AI responds
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.messages.length).toBeGreaterThan(initialCount + 1);
  });
});
