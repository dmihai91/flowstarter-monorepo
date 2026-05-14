'use client';

import { teamDashboardStatsQueryKey } from '@/hooks/useTeamDashboardStats';
import type { Table } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * What the team admin pages call a "project" is a workspace row enriched
 * with a UI-derived status. URL paths still say `/projects/...` for the
 * humans who read them.
 */
export interface ProjectWithOwner extends Table<'workspaces'> {
  /** Derived from concierge_stage by GET /api/admin/projects. */
  status?: string;
  thumbnailUrl?: string | null;
}

export function useTeamProjects() {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: async (): Promise<Array<ProjectWithOwner>> => {
      const res = await fetch('/api/admin/projects', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 403)
          throw new Error('Not authorized as team member');
        throw new Error('Failed to load team projects');
      }
      const json = await res.json();
      return json.projects ?? [];
    },
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

export function useTeamDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to delete' }));
        throw new Error(err.error || 'Failed to delete project');
      }
      return id;
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['team-projects'] });

      // Snapshot previous value
      const previous = qc.getQueryData<ProjectWithOwner[]>(['team-projects']);

      // Optimistically remove the project
      qc.setQueryData<ProjectWithOwner[]>(
        ['team-projects'],
        (old) => old?.filter((p) => p.id !== id) ?? []
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(['team-projects'], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: teamDashboardStatsQueryKey });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Optimistic stage update used by the Kanban board.
 *
 * On drag-end we patch the workspace's `concierge_stage`, immediately moving
 * the card in the local cache so there's no flicker. Failures roll back.
 */
export function useUpdateProjectStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concierge_stage: stage }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to update stage' }));
        throw new Error(err.error || 'Failed to update stage');
      }
      return res.json();
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['team-projects'] });
      const previous = qc.getQueryData<ProjectWithOwner[]>(['team-projects']);
      qc.setQueryData<ProjectWithOwner[]>(
        ['team-projects'],
        (old) =>
          old?.map((p) =>
            p.id === id
              ? {
                  ...p,
                  concierge_stage: stage as ProjectWithOwner['concierge_stage'],
                }
              : p
          ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['team-projects'], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: teamDashboardStatsQueryKey });
    },
  });
}

export function useTeamRenameProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to rename' }));
        throw new Error(err.error || 'Failed to rename project');
      }
      return res.json();
    },
    onMutate: async ({ id, name }: { id: string; name: string }) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['team-projects'] });

      // Snapshot previous value
      const previous = qc.getQueryData<ProjectWithOwner[]>(['team-projects']);

      // Optimistically update the project name
      qc.setQueryData<ProjectWithOwner[]>(
        ['team-projects'],
        (old) => old?.map((p) => (p.id === id ? { ...p, name } : p)) ?? []
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(['team-projects'], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: teamDashboardStatsQueryKey });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export interface ProjectPricingData {
  setup_fee?: number;
  monthly_fee?: number;
  tier_name?: 'essential' | 'pro' | 'commerce' | 'custom' | null;
  is_founding?: boolean;
  billing_interval?: 'monthly' | 'annual';
}

export function useTeamProject(id: string | undefined) {
  return useQuery({
    queryKey: ['team-project', id],
    enabled: !!id,
    queryFn: async (): Promise<ProjectWithOwner> => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Project not found');
        throw new Error('Failed to load project');
      }
      const json = await res.json();
      return json.project;
    },
    staleTime: 10_000,
  });
}

export function useTeamUpdateProject(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!id) throw new Error('Missing project id');
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(err.error || 'Update failed');
      }
      return (await res.json()).project as ProjectWithOwner;
    },
    onSuccess: (project) => {
      qc.setQueryData(['team-project', id], project);
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: ['team-clients'] });
      qc.invalidateQueries({ queryKey: teamDashboardStatsQueryKey });
    },
  });
}

export function useTeamUpdateProjectPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & ProjectPricingData) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: 'Failed to update pricing' }));
        throw new Error(err.error || 'Failed to update pricing');
      }
      return res.json();
    },
    onMutate: async ({ id, ...data }: { id: string } & ProjectPricingData) => {
      await qc.cancelQueries({ queryKey: ['team-projects'] });
      const previous = qc.getQueryData<ProjectWithOwner[]>(['team-projects']);

      qc.setQueryData<ProjectWithOwner[]>(
        ['team-projects'],
        (old) => old?.map((p) => (p.id === id ? { ...p, ...data } : p)) ?? []
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['team-projects'], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: teamDashboardStatsQueryKey });
    },
  });
}
