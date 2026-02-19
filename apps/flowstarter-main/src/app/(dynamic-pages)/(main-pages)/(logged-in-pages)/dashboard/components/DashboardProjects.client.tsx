'use client';

import { ProjectsList } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsList';
import { ProjectsListSkeleton } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsListSkeleton';
import { useProjects } from '@/hooks/useProjects';

export function DashboardProjectsClient() {
  const { data: projects, isLoading } = useProjects();

  console.log('[DashboardProjectsClient] Rendering', {
    isLoading,
    projectsCount: projects?.length ?? 0,
    projects,
  });

  // Show skeleton while loading
  if (isLoading) {
    return <ProjectsListSkeleton count={3} />;
  }

  // Show projects list once loaded
  return <ProjectsList projects={projects || []} showActions={false} />;
}
