'use client';

import { useDraftStore } from '@/store/draft-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export interface DraftShape {
  id?: string | null;
  updated_at?: string | null;
  data?: string | null;
  template_id?: string | null;
  entry_mode?: 'ai' | 'manual' | null;
  current_step?: 'details' | 'template' | 'design' | 'review' | null;
}

export const draftKeys = {
  root: ['draft'] as const,
  byProject: (projectId: string | null | undefined) =>
    ['draft', projectId ?? 'new'] as const,
};

export function useDraft(projectId?: string | null) {
  const { draft, hasLoadedOnce, setDraft, markLoaded, reset } = useDraftStore();
  const lastProjectIdRef = useRef<string | null | undefined>(undefined);

  // Reset draft store if projectId changes (navigating to a different draft)
  useEffect(() => {
    if (
      lastProjectIdRef.current !== undefined &&
      lastProjectIdRef.current !== projectId
    ) {
      console.log('[useDraft] Project ID changed, resetting draft store', {
        from: lastProjectIdRef.current,
        to: projectId,
      });
      reset();
      // Also reset the initial ref so the query will run again
      initialRef.current = undefined;
      hasLoadedOnceRef.current = false;
    }
    lastProjectIdRef.current = projectId;
  }, [projectId, reset]);

  // Stabilize initial values - only read once on mount to prevent query restarts
  const initialRef = useRef<DraftShape | null | undefined>(undefined);
  const hasLoadedOnceRef = useRef<boolean>(false);

  if (initialRef.current === undefined) {
    initialRef.current = draft;
    hasLoadedOnceRef.current = hasLoadedOnce;
  }

  const initial = initialRef.current;
  const shouldFetch = !hasLoadedOnceRef.current && !initial && projectId;

  // Kick the loader only if we don't already have cached data
  useEffect(() => {
    if (!initial && typeof window !== 'undefined' && projectId) {
      window.dispatchEvent(
        new CustomEvent('draft-loading-start', {
          detail: { scope: 'draftFetch' },
        })
      );
    }
  }, [initial, projectId]);

  const query = useQuery<DraftShape | null>({
    queryKey: draftKeys.byProject(projectId),
    queryFn: async (): Promise<DraftShape | null> => {
      if (!projectId) return null;
      const url = `/api/projects/draft?projectId=${encodeURIComponent(
        projectId
      )}`;
      console.log('[useDraft] Fetching draft from:', url);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.error('[useDraft] Fetch failed with status:', res.status);
        return null;
      }
      const json = (await res.json()) as { draft?: DraftShape | null };
      console.log('[useDraft] API response:', json);
      console.log('[useDraft] Draft data field:', json.draft?.data);
      return json.draft ?? null;
    },

    // Use stabilized initial values to prevent query restarts
    initialData: initial || undefined,
    staleTime: 120_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: Boolean(shouldFetch), // Stabilized - won't change mid-render
  });

  // React Query v5: move side effects to effects
  useEffect(() => {
    // If we already have cached data, mark as loaded immediately (no fetch)
    if (!hasLoadedOnce && initial) {
      setDraft(initial);
      markLoaded();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('draft-loading-end'));
      }
    }
  }, [hasLoadedOnce, initial, setDraft, markLoaded]);

  useEffect(() => {
    if (query.isSuccess) {
      const value = query.data ?? null;
      setDraft(value);
      markLoaded();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('draft-loading-end', {
            detail: { scope: 'draftFetch' },
          })
        );
      }
    }
  }, [query.isSuccess, query.data, setDraft, markLoaded]);

  useEffect(() => {
    if (query.isError) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('draft-loading-end', {
            detail: { scope: 'draftFetch' },
          })
        );
      }
    }
  }, [query.isError]);

  return {
    ...query,
    data: draft ?? query.data ?? null,
  };
}

export function useUpsertDraft(projectId?: string | null) {
  const qc = useQueryClient();
  const { setDraft } = useDraftStore();

  return useMutation({
    mutationFn: async (
      projectConfig: unknown & {
        entry_mode?: 'ai' | 'manual';
        currentStep?: 'details' | 'template' | 'design' | 'review';
      }
    ) => {
      const res = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig, projectId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save draft');
      }
      const json = await res.json();
      return json.projectId; // Return the project ID
    },
    // Optimistically update cache instead of invalidating to avoid immediate refetch
    onSuccess: (returnedProjectId, variables) => {
      try {
        const cfg = variables as unknown as {
          template?: { id?: string | null } | null;
          entry_mode?: 'ai' | 'manual' | null;
          currentStep?: 'details' | 'template' | 'design' | 'review' | null;
        } & Record<string, unknown>;
        const optimistic = {
          id: returnedProjectId || projectId,
          data: JSON.stringify(cfg),
          template_id: cfg?.template?.id ?? null,
          updated_at: new Date().toISOString(),
          entry_mode: cfg?.entry_mode ?? null,
          current_step: cfg?.currentStep ?? null,
        } as DraftShape;
        // Update React Query cache for this specific project
        qc.setQueryData(
          draftKeys.byProject(returnedProjectId || projectId),
          optimistic
        );
        // Update Zustand store
        setDraft(optimistic);
      } catch {
        // If anything goes wrong, leave cache as-is to avoid triggering loops
      }
    },
  });
}

export function useDeleteDraft(projectId?: string | null) {
  const qc = useQueryClient();
  const { reset: resetDraftStore } = useDraftStore();

  return useMutation({
    mutationFn: async () => {
      const url = projectId
        ? `/api/projects/draft?projectId=${encodeURIComponent(projectId)}`
        : '/api/projects/draft';
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete draft');
      }
      return true;
    },
    // Clear all caches to prevent stale draft from loading
    onSuccess: () => {
      if (projectId) {
        qc.setQueryData(draftKeys.byProject(projectId), null);
      } else {
        // Clear all draft queries if no specific projectId
        qc.removeQueries({ queryKey: draftKeys.root });
      }
      // Reset the draft store to clear any cached state
      resetDraftStore();
      // Invalidate dashboard stats to reflect the deleted draft
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
