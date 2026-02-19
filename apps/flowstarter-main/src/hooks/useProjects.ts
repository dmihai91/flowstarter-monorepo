'use client';

import type { Table } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const projectsKeys = {
  all: ['projects'] as const,
  detail: (id: string) => [...projectsKeys.all, id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectsKeys.all,
    queryFn: async (): Promise<Array<Table<'projects'>>> => {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load projects');
      const json = (await res.json()) as { projects: Array<Table<'projects'>> };
      return json.projects ?? [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData): Promise<{ projectId?: string }> => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create project');
      }
      return (await res.json()) as { projectId?: string };
    },
    onSuccess: async () => {
      // Wait for the query to refetch so the dashboard is ready immediately
      await qc.refetchQueries({ queryKey: projectsKeys.all });
      // Invalidate dashboard stats to reflect the new project
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }): Promise<{ project?: { id: string } }> => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update project');
      }
      return (await res.json()) as { project?: { id: string } };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      // Invalidate dashboard stats to reflect the updated project
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete project');
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      // Invalidate dashboard stats to reflect the deleted project
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useProject(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: id ? projectsKeys.detail(id) : ['project', 'nil'],
    queryFn: async (): Promise<Table<'projects'>> => {
      const res = await fetch(`/api/projects/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load project');
      const json = (await res.json()) as { project: Table<'projects'> };
      return json.project;
    },
  });
}
