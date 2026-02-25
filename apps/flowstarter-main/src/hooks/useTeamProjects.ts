'use client';

import type { Table } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ProjectWithOwner extends Table<'projects'> {
  owner_email?: string | null;
  owner_name?: string | null;
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
      console.log('[TeamDelete] Starting delete for:', id);
      const res = await fetch(`/api/team/projects/${id}`, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });
      console.log('[TeamDelete] Response status:', res.status, res.statusText);
      
      const text = await res.text();
      console.log('[TeamDelete] Response body:', text.substring(0, 200));
      
      if (!res.ok) {
        let errorMessage = 'Failed to delete project';
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || errorMessage;
        } catch {
          errorMessage = text.substring(0, 100) || `HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
