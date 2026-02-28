/**
 * Hook for generating contextual suggestion chips.
 */

import { useMemo } from 'react';
import type { ChatMessage } from './useSandboxChat';

const DEFAULT_SUGGESTIONS = [
  'Add pricing',
  'Contact form',
  'Change colors',
];

const FOLLOW_UP_SUGGESTIONS: Record<string, string[]> = {
  pricing: ['Add FAQ section', 'Change layout', 'Update fonts'],
  testimonials: ['Add more reviews', 'Change layout', 'Add ratings'],
  contact: ['Add map', 'Add social links', 'Change form style'],
  hero: ['Update images', 'Add animation', 'Change fonts'],
  colors: ['Add dark mode', 'Update fonts', 'Change layout'],
  gallery: ['Add lightbox', 'Change layout', 'Add captions'],
  footer: ['Add social links', 'Add newsletter', 'Change layout'],
};

interface UseSuggestionChipsOptions {
  messages: ChatMessage[];
  isGenerating: boolean;
}

export function useSuggestionChips({ messages, isGenerating }: UseSuggestionChipsOptions) {
  const suggestions = useMemo(() => {
    if (isGenerating) return [];

    if (messages.length === 0) return DEFAULT_SUGGESTIONS;

    // Look at the last user message to suggest follow-ups
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (!lastUserMsg) return DEFAULT_SUGGESTIONS;

    const content = lastUserMsg.content.toLowerCase();

    for (const [keyword, followUps] of Object.entries(FOLLOW_UP_SUGGESTIONS)) {
      if (content.includes(keyword)) {
        return followUps;
      }
    }

    // Default follow-ups after any change
    return ['Add testimonials', 'Update hero', 'Add gallery'];
  }, [messages, isGenerating]);

  return suggestions;
}
