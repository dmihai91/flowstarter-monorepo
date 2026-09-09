'use client';

/**
 * Operator access to a project's change requests: the list with suggested
 * prices, writing a quote, declining, marking done.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeRequestView } from '@/lib/flowstarter/change-requests';

export type { ChangeRequestView };

export const changeRequestsQueryKey = (id: string | undefined) =>
  ['change-requests', id] as const;

async function readError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(body?.error || fallback);
}

export function useChangeRequests(id: string | undefined) {
  return useQuery({
    queryKey: changeRequestsQueryKey(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<{ requests: ChangeRequestView[] }> => {
      const res = await fetch(`/api/admin/projects/${id}/changes`, {
        cache: 'no-store',
      });
      if (!res.ok) await readError(res, 'Failed to load change requests');
      return res.json();
    },
    staleTime: 10_000,
    retry: 1,
  });
}

function useChangeAction<TBody>(
  id: string | undefined,
  path: 'quote' | 'status',
  fallback: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { changeId: string } & TBody
    ): Promise<{ request: ChangeRequestView }> => {
      if (!id) throw new Error('Missing project id');
      const { changeId, ...body } = input;
      const res = await fetch(
        `/api/admin/projects/${id}/changes/${changeId}/${path}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) await readError(res, fallback);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestsQueryKey(id) });
      qc.invalidateQueries({ queryKey: ['pipeline-detail', id] });
    },
  });
}

export function useQuoteChangeRequest(id: string | undefined) {
  return useChangeAction<{ amountMinor: number; note?: string }>(
    id,
    'quote',
    'Failed to send the quote'
  );
}

export function useSetChangeRequestStatus(id: string | undefined) {
  return useChangeAction<{ status: 'declined' | 'done'; reason?: string }>(
    id,
    'status',
    'Failed to update the request'
  );
}
