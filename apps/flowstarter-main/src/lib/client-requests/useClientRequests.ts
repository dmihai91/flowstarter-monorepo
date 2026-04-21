'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClientRequest,
  ClientRequestStats,
  RequestPriority,
} from './types';

export function useClientRequestStats() {
  return useQuery<ClientRequestStats>({
    queryKey: ['client-request-stats'],
    queryFn: async () => {
      const res = await fetch('/api/client-requests/stats', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useClientRequests(params: {
  status?: string;
  sort?: string;
  search?: string;
}) {
  const { status = 'pending', sort = 'newest', search = '' } = params;
  return useQuery<{ requests: ClientRequest[] }>({
    queryKey: ['client-requests', status, sort, search],
    queryFn: async () => {
      const url = new URL('/api/client-requests', window.location.origin);
      url.searchParams.set('status', status);
      url.searchParams.set('sort', sort);
      if (search) url.searchParams.set('search', search);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load requests');
      return res.json();
    },
    staleTime: 20_000, // 20s — re-fetch silently in background
    gcTime: 5 * 60_000, // Keep in cache for 5 min
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/client-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });
      if (!res.ok) throw new Error('Failed to accept request');
      return res.json() as Promise<{ request: ClientRequest }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] });
      qc.invalidateQueries({ queryKey: ['client-request-stats'] });
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/client-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
      });
      if (!res.ok) throw new Error('Failed to reject request');
      return res.json() as Promise<{ request: ClientRequest }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] });
      qc.invalidateQueries({ queryKey: ['client-request-stats'] });
    },
  });
}

export function useUpdateRequestPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      priority,
    }: {
      id: string;
      priority: RequestPriority;
    }) => {
      const res = await fetch(`/api/client-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) throw new Error('Failed to update priority');
      return res.json() as Promise<{ request: ClientRequest }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] });
      qc.invalidateQueries({ queryKey: ['client-request-stats'] });
    },
  });
}
