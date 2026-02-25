'use client';

import type { Table } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useTeamProjects() {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: async (): Promise<Array<Table<'projects'> & { user?: { id: string; email: string } }>> => {
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
