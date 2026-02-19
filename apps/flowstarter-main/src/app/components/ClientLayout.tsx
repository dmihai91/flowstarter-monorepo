'use client';
import { useTheme } from '@/contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// This layout component can be used with React state, context and more as it is a client component.
export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        richColors
        theme={resolvedTheme as 'light' | 'dark' | 'system'}
        position="top-center"
        offset="20px"
      />
    </QueryClientProvider>
  );
};
