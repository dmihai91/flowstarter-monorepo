'use client';

import type { Table } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ProjectWithOwner extends Table<'projects'> {
  owner_email?: string | null;
  owner_name?: string | null;
  // Pricing fields (added via migration)
  project_type?: string | null;
  setup_fee?: number | null;
  monthly_fee?: number | null;
  is_paid?: boolean | null;
}

export function useTeamProjects() {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: async (): Promise<Array<ProjectWithOwner>> => {
      const res = await fetch('/api/team/projects', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Not authorized as team member');
        throw new Error('Failed to load team projects');
      }
      const json = await res.json();
      return json.projects ?? [];
    },
  });
}

export function useTeamDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team/projects/${id}`, { 
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
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
      qc.setQueryData<ProjectWithOwner[]>(['team-projects'], (old) => 
        old?.filter((p) => p.id !== id) ?? []
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
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useTeamRenameProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/team/projects/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to rename' }));
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
      qc.setQueryData<ProjectWithOwner[]>(['team-projects'], (old) => 
        old?.map((p) => p.id === id ? { ...p, name } : p) ?? []
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
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
