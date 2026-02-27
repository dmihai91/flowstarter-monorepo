'use client';

import { useQuery } from '@tanstack/react-query';

export interface ExampleSite {
  id: string;
  name: string;
  description: string;
  url: string;
  thumbnail_url: string;
  industry: string;
  template: string;
  features: string[];
  created_at: string;
}

const exampleSitesKeys = {
  all: ['example-sites'] as const,
  filtered: (industry?: string, template?: string) => 
    [...exampleSitesKeys.all, { industry, template }] as const,
};

export function useExampleSites(industry?: string, template?: string) {
  return useQuery({
    queryKey: exampleSitesKeys.filtered(industry, template),
    queryFn: async (): Promise<ExampleSite[]> => {
      const params = new URLSearchParams();
      if (industry) params.set('industry', industry);
      if (template) params.set('template', template);
      
      const res = await fetch(`/api/example-sites?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load example sites');
      const json = await res.json();
      return json.sites ?? [];
    },
  });
}
