'use client';

import { useMutation } from '@tanstack/react-query';

export interface DomainAvailabilityResult {
  domain: string;
  isAvailable: boolean;
  error?: string;
  registrarInfo?: {
    name: string;
    website: string;
    note: string;
  };
}

export interface DomainSuggestion {
  domain: string;
  isAvailable: boolean;
  note: string;
  tld: string;
}

export function useCheckDomainAvailabilityMutation() {
  return useMutation({
    mutationFn: async (domain: string): Promise<DomainAvailabilityResult> => {
      const response = await fetch('/api/domains/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      if (!response.ok) {
        throw new Error('Failed to check domain availability');
      }
      return (await response.json()) as DomainAvailabilityResult;
    },
  });
}

export function useDomainSuggestionsMutation() {
  return useMutation({
    mutationFn: async (baseName: string): Promise<DomainSuggestion[]> => {
      const response = await fetch('/api/domains/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateSuggestions: true, baseName }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate domain suggestions');
      }
      const result = await response.json();
      const suggestions = (result.suggestions || []) as DomainSuggestion[];
      // Ensure a .com variant is always included at the top
      const normalized = baseName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-');
      const comDomain = normalized ? `${normalized}.com` : '';
      const hasCom = comDomain
        ? suggestions.some((s) => String(s.domain).toLowerCase() === comDomain)
        : false;
      const comSuggestion: DomainSuggestion | null = comDomain
        ? {
            domain: comDomain,
            isAvailable: false, // actual availability can be checked on click
            note: 'Most common and trusted',
            tld: 'com',
          }
        : null;
      const merged =
        hasCom || !comSuggestion
          ? suggestions
          : [comSuggestion, ...suggestions];
      return merged;
    },
  });
}
