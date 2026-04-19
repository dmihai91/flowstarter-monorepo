'use client';

import { TeamProjectsList } from './components/TeamProjectsList';
import { QuickScaffold } from './components/QuickScaffold';
import { TeamProjectsListSkeleton } from './components/TeamProjectsListSkeleton';
import { TeamProjectsStats } from './components/TeamProjectsStats';
import { TeamProjectsStatsSkeleton } from './components/TeamProjectsStatsSkeleton';
import { ClientRequestsList } from './components/client-requests/ClientRequestsList';
import { DashboardLoader } from './components/DashboardSkeleton';
import { TeamDashboardShell } from './components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Use inline style for glass panel so --fs-* tokens apply in both light and dark
const glassPanelStyle = {
  background: 'var(--fs-glass-bg)',
  borderColor: 'var(--fs-glass-edge)',
  boxShadow: 'var(--fs-card-shadow)',
  borderRadius: 'var(--fs-radius-2xl)',
};
const glassPanelClass = 'border backdrop-blur-2xl backdrop-saturate-150';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      if (!user) router.push('/login');
      else setIsLoading(false);
    }
  }, [user, userLoaded, router]);

  if (isLoading || !userLoaded) return <DashboardLoader />;

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greeting.morning')
      : hour < 18
      ? t('dashboard.greeting.afternoon')
      : hour < 21
      ? t('dashboard.greeting.evening')
      : t('dashboard.greeting.night');

  const createNewInEditor = () => router.push('/team/dashboard/new');

  return (
    <TeamDashboardShell
      title="Dashboard"
      subtitle={`${greeting}, ${firstName}`}
      actions={
        <>
          <Button variant="accent" size="default" onClick={createNewInEditor}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </>
      }
    >
      {/* Quick Scaffold */}
      <div className="mb-6">
        <QuickScaffold />
      </div>

      {/* Stats */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsStatsSkeleton />
        ) : (
          <TeamProjectsStats projects={projects || []} />
        )}
      </div>

      {/* Client Requests */}
      <ClientRequestsList />

      {/* Projects list */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsListSkeleton count={3} />
        ) : projects && projects.length > 0 ? (
          <TeamProjectsList projects={projects} />
        ) : (
          <div className={`${glassPanelClass} p-12 text-center`} style={glassPanelStyle}>
            <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/55 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
              <FolderOpen className="w-8 h-8 text-gray-400 dark:text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--fs-ink)] mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-[var(--fs-ink-faint)] mb-6 max-w-sm mx-auto">
              Click "New Project" to set up your first client project.
            </p>
            <Button variant="accent" onClick={createNewInEditor}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </TeamDashboardShell>
  );
}
