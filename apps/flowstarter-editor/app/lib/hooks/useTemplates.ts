import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Template } from '~/components/onboarding';
import type { TemplatePalette, TemplateFont } from '~/components/editor/template-preview/types';

// Template theme from MCP server
interface MCPTemplateTheme {
  default: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

// Template from MCP server (flowstarter-library format)
// Supports both MCP tool format and direct HTTP API format
interface MCPTemplate {
  slug: string;
  // MCP format uses displayName, HTTP format uses name
  displayName?: string;
  name?: string;
  description: string;
  category: string;
  useCase?: string[];
  fileCount?: number;
  totalLOC?: number;
  // MCP format uses thumbnailUrl, HTTP format uses thumbnail
  thumbnailUrl?: string;
  thumbnail?: string;
  previewUrl?: string;
  theme?: MCPTemplateTheme;
  palettes?: TemplatePalette[];
  fonts?: TemplateFont[];
  color?: string;
}

interface UseTemplatesResult {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseTemplatesOptions {
  /** If true, fetch templates on mount. If false, wait until refetch() is called. Default: false */
  autoFetch?: boolean;
}

// Query key for templates
export const TEMPLATES_QUERY_KEY = ['templates'] as const;

// Stale time: 5 minutes (matches server cache)
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Fetch templates from the API
 */
async function fetchTemplates(): Promise<Template[]> {
  const response = await fetch('/api/templates', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: any = await response.json();

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid response format');
  }

  if (!('success' in data) || (!data.success && !data.data)) {
    throw new Error((data && data.error) || 'Failed to fetch templates');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch templates from server');
  }

  // Parse MCP response format - the data comes as content[].text JSON string
  let mcpTemplates: MCPTemplate[] = [];

  if (data.data?.templates) {
    // Direct format
    mcpTemplates = data.data.templates;
  } else if (data.data?.content?.[0]?.text) {
    // MCP tool response format - parse the JSON string
    try {
      const parsed = JSON.parse(data.data.content[0].text);
      mcpTemplates = parsed.templates || [];
    } catch {
      console.error('Failed to parse MCP response:', data.data.content[0].text);
    }
  }

  const transformedTemplates = mcpTemplates.map((t) => transformMCPTemplate(t));

  if (transformedTemplates.length === 0) {
    throw new Error('No templates available from server');
  }

  return transformedTemplates;
}

/**
 * Transform MCP template format to our Template interface
 * Handles both MCP tool format and direct HTTP API format
 */
function transformMCPTemplate(mcpTemplate: MCPTemplate): Template {
  return {
    id: mcpTemplate.slug,
    // Support both MCP (displayName) and HTTP (name) formats
    name: mcpTemplate.displayName || mcpTemplate.name || mcpTemplate.slug,
    description: mcpTemplate.description,
    // Support both MCP (thumbnailUrl) and HTTP (thumbnail) formats
    thumbnail: mcpTemplate.thumbnailUrl || mcpTemplate.thumbnail || '',
    category: mcpTemplate.category as Template['category'],
    theme: mcpTemplate.theme,
    palettes: mcpTemplate.palettes,
    fonts: mcpTemplate.fonts,
  };
}

/**
 * Hook to fetch templates from the Flowstarter MCP server
 * Uses React Query for automatic caching and deduplication
 *
 * By default, templates are NOT fetched on mount to improve startup performance.
 * Call refetch() when templates are needed, or set autoFetch: true.
 */
export function useTemplates(options: UseTemplatesOptions = {}): UseTemplatesResult {
  const { autoFetch = false } = options;
  const queryClient = useQueryClient();

  const {
    data: templates = [],
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    enabled: autoFetch, // Only fetch automatically if autoFetch is true
    staleTime: STALE_TIME_MS, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  // Manual refetch that works even when query is disabled
  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  // Transform error to string
  const errorMessage = error
    ? error instanceof Error
      ? error.message.toLowerCase().includes('fetch failed') ||
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('econnrefused')
        ? 'Please check your internet connection and try again'
        : 'Something went wrong. Please try again in a moment.'
      : 'Something went wrong'
    : null;

  return {
    templates,
    isLoading,
    error: errorMessage,
    refetch,
  };
}

/**
 * Hook to prefetch templates (useful for warming the cache)
 */
export function usePrefetchTemplates() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: TEMPLATES_QUERY_KEY,
      queryFn: fetchTemplates,
      staleTime: STALE_TIME_MS,
    });
  }, [queryClient]);
}

/**
 * Hook to invalidate template cache
 */
export function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
  }, [queryClient]);
}

/**
 * API response type
 */
interface ApiResponse {
  success: boolean;
  error?: string;
  data?: {
    templates?: MCPTemplate[];
    content?: Array<{ type: string; text: string }>;
    [key: string]: unknown;
  };
}

/**
 * Hook to search templates
 */
export function useTemplateSearch() {
  const queryClient = useQueryClient();

  const search = useCallback(
    async (query: string): Promise<Template[]> => {
      if (!query.trim()) {
        return [];
      }

      try {
        const response = await fetch(`/api/templates?search=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = (await response.json()) as ApiResponse;

        if (data.success) {
          let mcpTemplates: MCPTemplate[] = [];

          if (data.data?.templates) {
            mcpTemplates = data.data.templates;
          } else if (data.data?.content?.[0]?.text) {
            try {
              const parsed = JSON.parse(data.data.content[0].text);
              mcpTemplates = parsed.templates || [];
            } catch {
              console.error('Failed to parse MCP search response');
            }
          }

          return mcpTemplates.map((t) => transformMCPTemplate(t));
        }
      } catch (err) {
        console.error('Template search failed:', err);
      }

      return [];
    },
    [queryClient],
  );

  return { search };
}

/**
 * Hook to get template details
 */
export function useTemplateDetails(slug: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['template-details', slug],
    queryFn: async () => {
      if (!slug) return null;

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'details',
          slug,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (data.success) {
        // Parse MCP response format if needed
        let detailsData: unknown = data.data;

        if (data.data?.content?.[0]?.text) {
          try {
            detailsData = JSON.parse(data.data.content[0].text);
          } catch {
            console.error('Failed to parse MCP details response');
          }
        }

        return detailsData;
      }

      throw new Error(data.error || 'Failed to fetch template details');
    },
    enabled: !!slug,
    staleTime: STALE_TIME_MS,
  });

  return {
    details: data,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch details') : null,
  };
}

