import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useIntegrationsData,
  useConnectIntegration,
  useDisconnectIntegration,
} from '../useIntegrationsQuery';
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

describe('useIntegrationsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch integrations successfully', async () => {
    const mockIntegrations = {
      mailchimp: { apiKey: 'xxx', audienceId: 'yyy' },
      calendly: { apiKey: 'zzz', eventUrl: 'https://calendly.com/test' },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ integrations: mockIntegrations }),
    });

    const { result } = renderHook(() => useIntegrationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockIntegrations);
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useIntegrationsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useConnectIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect mailchimp integration with verification', async () => {
    // Mock verification call
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      })
      // Mock save call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const { result } = renderHook(() => useConnectIntegration(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      integrationId: 'mailchimp',
      config: { apiKey: 'test-api-key', audienceId: 'test-audience' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/integrations/mailchimp/verify',
      expect.any(Object)
    );
  });

  it('should handle mailchimp verification failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid API key' }),
    });

    const { result } = renderHook(() => useConnectIntegration(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      integrationId: 'mailchimp',
      config: { apiKey: 'invalid', audienceId: 'test' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Invalid API key');
  });

  it('should connect non-verified integration directly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useConnectIntegration(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      integrationId: 'other-integration',
      config: { setting: 'value' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('useDisconnectIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disconnect integration successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useDisconnectIntegration(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('mailchimp');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/integrations?integrationId=mailchimp',
      { method: 'DELETE' }
    );
  });

  it('should handle disconnect error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Integration not found' }),
    });

    const { result } = renderHook(() => useDisconnectIntegration(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('nonexistent');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Integration not found');
  });
});
