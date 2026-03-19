'use client';

import { useState, useCallback } from 'react';

interface MutationState<T> {
  data: T | null;
  error: string | null;
  isPending: boolean;
}

interface UseApiMutationOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

/**
 * Generic hook for API POST/PATCH/DELETE mutations.
 * Single responsibility: manages async request state.
 * Keeps fetch() out of components.
 */
export function useApiMutation<TPayload = unknown, TResponse = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  options?: UseApiMutationOptions
) {
  const [state, setState] = useState<MutationState<TResponse>>({
    data: null,
    error: null,
    isPending: false,
  });

  const mutate = useCallback(async (payload?: TPayload): Promise<TResponse | null> => {
    setState({ data: null, error: null, isPending: true });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error || `Request failed (${response.status})`;
        setState({ data: null, error: errMsg, isPending: false });
        options?.onError?.(errMsg);
        return null;
      }

      setState({ data, error: null, isPending: false });
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      setState({ data: null, error: errMsg, isPending: false });
      options?.onError?.(errMsg);
      return null;
    }
  }, [url, method, options]);

  return { ...state, mutate };
}
