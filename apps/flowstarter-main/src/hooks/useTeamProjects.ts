'use client';

import type { Table } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useTeamProjects() {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: async (): Promise<Array<Table<'projects'>>> => {
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
      const res = await fetch(`/api/team/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete project');
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      // Also invalidate regular projects in case they're cached
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
