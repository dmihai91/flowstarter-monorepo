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

// Flush a short response before the autonomous demo advances at 3000ms.
const FLUSH_AI_RESPONSE = 2800;

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
      m.text.includes('Care team')
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

    const renderedResponse = [
      ...result.current.messages.map((message) => message.text),
      result.current.typingText,
    ].join(' ');
    expect(renderedResponse).toContain('Care team');
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

  it('routes structural requests to the care team without changing the preview structure', () => {
    const { result } = renderHook(() => useMockEditor());
    act(() => {
      result.current.handleSend('Add testimonials');
    });
    act(() => {
      vi.advanceTimersByTime(FLUSH_AI_RESPONSE);
    });
    expect(result.current.mockSite.hasTestimonials).toBe(false);
    const renderedResponse = [
      ...result.current.messages.map((message) => message.text),
      result.current.typingText,
    ].join(' ');
    expect(renderedResponse).toContain('Care team');
  });

  it('explains the value of a localized edit in a natural assistant voice', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleSend('Make this friendlier');
      vi.advanceTimersByTime(FLUSH_AI_RESPONSE);
    });

    const renderedResponse = [
      ...result.current.messages.map((message) => message.text),
      result.current.typingText,
    ].join(' ');
    expect(renderedResponse).toContain('feels like an invitation');
    expect(result.current.mockSite.headline).toBe(
      'Come in. Your new favourite coffee is waiting.'
    );
  });

  it.each([
    {
      target: 'headline' as const,
      direction: 'shorter' as const,
      field: 'headline' as const,
      expected: 'Better coffee. Better mornings.',
    },
    {
      target: 'introduction' as const,
      direction: 'more-confident' as const,
      field: 'introduction' as const,
      expected: 'Exceptional small-batch coffee, roasted fresh every week.',
    },
    {
      target: 'cta' as const,
      direction: 'warmer' as const,
      field: 'ctaLabel' as const,
      expected: 'Choose your favourite',
    },
  ])(
    'applies a guided $direction rewrite to the $target',
    ({ target, direction, field, expected }) => {
      const { result } = renderHook(() => useMockEditor());

      act(() => {
        result.current.handleGuidedRewrite(target, direction);
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.mockSite[field]).toBe(expected);
    }
  );

  it('applies a chosen amount, billing rhythm and delivery term', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleGuidedPrice('29', 'monthly', false);
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.mockSite.subscriptionPrice).toBe(
      '€29 per month · delivery calculated separately'
    );
  });

  it('applies the chosen voice to the chosen text block', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleGuidedTone('service', 'expert');
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.mockSite.serviceDescription).toBe(
      'Compare roast profile, origin and tasting notes before choosing.'
    );
  });

  it('translates the chosen text block into the chosen language', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleGuidedTranslation('cta', 'fr');
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.mockSite.ctaLabel).toBe('Choisir mon café');
    expect(result.current.mockSite.language).toBe('fr');
  });

  it.each([
    {
      prompt: 'Make this headline feel warmer',
      field: 'headline' as const,
      expected: 'Coffee that makes every morning feel like home.',
    },
    {
      prompt: 'Shorten this introduction',
      field: 'introduction' as const,
      expected: 'Fresh-roasted coffee, delivered.',
    },
    {
      prompt: 'Make this call to action more direct',
      field: 'ctaLabel' as const,
      expected: 'Find your roast',
    },
    {
      prompt: 'Translate this service description into Romanian',
      field: 'serviceDescription' as const,
      expected: 'Alege cafeaua potrivită pentru dimineața ta.',
    },
    {
      prompt: 'Clarify this price',
      field: 'subscriptionPrice' as const,
      expected: '€24 every 2 weeks · delivery included',
    },
    {
      prompt: 'Rewrite this CTA',
      field: 'ctaLabel' as const,
      expected: 'Find your roast',
    },
    {
      prompt: 'Match our tone',
      field: 'introduction' as const,
      expected: 'Fresh-roasted coffee for slower, better mornings.',
    },
  ])(
    'updates the live preview for "$prompt"',
    ({ prompt, field, expected }) => {
      const { result } = renderHook(() => useMockEditor());

      act(() => {
        result.current.handleSend(prompt);
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.mockSite[field]).toBe(expected);
      expect(result.current.mockSite.revision).toBeGreaterThan(0);
    }
  );

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
    expect(result.current.mockSite.introduction).toBe(
      'Fresh-roasted coffee, delivered.'
    );

    // Advance for the AI response within the same cycle
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(result.current.messages.length).toBeGreaterThan(initialCount + 1);
  });

  it('stops the autonomous demo after the user makes an edit', () => {
    const { result } = renderHook(() => useMockEditor());

    act(() => {
      result.current.handleSend('Make this friendlier');
      vi.advanceTimersByTime(1500);
    });

    const userMessageCount = result.current.messages.filter(
      (message) => message.role === 'user'
    ).length;

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(
      result.current.messages.filter((message) => message.role === 'user')
    ).toHaveLength(userMessageCount);
    expect(result.current.mockSite.headline).toBe(
      'Come in. Your new favourite coffee is waiting.'
    );
  });
});
