/**
 * React Query Provider
 * 
 * Provides QueryClient for data fetching with caching
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider wraps the app with React Query's QueryClientProvider
 * Creates a new QueryClient instance per component mount to avoid SSR issues
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient as state to ensure one instance per app lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time: 5 minutes
            staleTime: 5 * 60 * 1000,
            // Default cache time: 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests twice
            retry: 2,
            // Don't refetch on window focus by default (can enable per-query)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
