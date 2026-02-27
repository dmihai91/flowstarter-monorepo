'use client';

import { useQuery } from '@tanstack/react-query';

export interface LocalTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  industry: string;
  features: string[];
}

const localTemplatesKeys = {
  all: ['local-templates'] as const,
};

export function useLocalTemplates() {
  return useQuery({
    queryKey: localTemplatesKeys.all,
    queryFn: async (): Promise<LocalTemplate[]> => {
      const res = await fetch('/api/local-templates');
      if (!res.ok) throw new Error('Failed to load templates');
      const json = await res.json();
      return json.templates ?? [];
    },
  });
}
