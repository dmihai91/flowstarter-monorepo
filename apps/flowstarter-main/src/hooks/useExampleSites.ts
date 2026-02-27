'use client';

import { useQuery } from '@tanstack/react-query';
import type { ExampleSite } from '@/data/example-sites';

export interface ExampleSitesFilters {
  category?: string;
  industry?: string;
  search?: string;
  featured?: boolean;
}

export interface ExampleSitesResponse {
  sites: ExampleSite[];
  categories: Array<{ value: string; label: string }>;
  industries: string[];
}

const exampleSitesKeys = {
  all: ['example-sites'] as const,
  filtered: (filters: ExampleSitesFilters) =>
    [...exampleSitesKeys.all, filters] as const,
};

export function useExampleSites(filters: ExampleSitesFilters = {}) {
  return useQuery({
    queryKey: exampleSitesKeys.filtered(filters),
    queryFn: async (): Promise<ExampleSitesResponse> => {
      const params = new URLSearchParams();
      
      if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category);
      }
      if (filters.industry && filters.industry !== 'All Industries') {
        params.set('industry', filters.industry);
      }
      if (filters.search?.trim()) {
        params.set('search', filters.search.trim());
      }
      if (filters.featured) {
        params.set('featured', 'true');
      }

      const res = await fetch(`/api/example-sites?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load example sites');
      
      const data = await res.json();
      return {
        sites: data.sites ?? [],
        categories: data.categories ?? [],
        industries: data.industries ?? [],
      };
    },
  });
}
