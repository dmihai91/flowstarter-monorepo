'use client';

import { Suspense } from 'react';
import { TeamProjectsList } from '../../components/TeamProjectsList';
import { TeamProjectsListSkeleton } from '../../components/TeamProjectsListSkeleton';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { FolderOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TeamDashboardShell } from '../../components/TeamDashboardShell';

function ProjectsContent() {
  const { data: projects, isLoading } = useTeamProjects();

  if (isLoading) return <TeamProjectsListSkeleton />;

  return <TeamProjectsList projects={projects ?? []} />;
}

export default function AllProjectsPage() {
  const router = useRouter();
  return (
    <TeamDashboardShell
      title="All Projects"
      subtitle="Every project across all clients"
      icon={<FolderOpen className="w-5 h-5 text-[var(--purple)]" />}
      maxWidth="5xl"
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={() => router.push('/team/dashboard/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
        >
          <Plus className="w-4 h-4" /> New project
        </button>
      </div>
      <Suspense fallback={<TeamProjectsListSkeleton />}>
        <ProjectsContent />
      </Suspense>
    </TeamDashboardShell>
  );
}
