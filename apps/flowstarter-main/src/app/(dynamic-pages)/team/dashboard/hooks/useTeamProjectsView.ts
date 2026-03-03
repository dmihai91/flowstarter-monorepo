import { useLocalStorage } from '@/hooks/useLocalStorage';

export function useTeamProjectsView() {
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'team-projects-view',
    'grid'
  );

  return { viewMode, setViewMode };
}
