import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContactForm } from '../useContactForm';
import React from 'react';

global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit contact form successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useContactForm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I have a question.',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, I have a question.',
      }),
    });
  });

  it('should handle submission error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email' }),
    });

    const { result } = renderHook(() => useContactForm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'John',
      email: 'invalid',
      message: 'Test',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Invalid email');
  });

  it('should include optional company field', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useContactForm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Jane Doe',
      email: 'jane@company.com',
      company: 'Acme Inc',
      message: 'Partnership inquiry',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      body: expect.stringContaining('Acme Inc'),
    }));
  });
});
