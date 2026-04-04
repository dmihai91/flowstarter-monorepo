'use client';

import { TeamProjectsList } from './components/TeamProjectsList';
import { QuickScaffold } from './components/QuickScaffold';
import { TeamProjectsListSkeleton } from './components/TeamProjectsListSkeleton';
import { TeamProjectsStats } from './components/TeamProjectsStats';
import { TeamProjectsStatsSkeleton } from './components/TeamProjectsStatsSkeleton';
import { DashboardLoader } from './components/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useIsTeamMember } from '@/hooks/useIsTeamMember';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, UserPlus, FolderOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();

  const [isLoading, setIsLoading] = useState(true);
  const glassPanelClass =
    'rounded-[28px] border border-gray-200/80 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]';

  const { isAdmin } = useIsTeamMember();

  // Redirect if not loaded
  useEffect(() => {
    if (userLoaded) {
      if (!user) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  if (isLoading || !userLoaded) {
    return <DashboardLoader />;
  }

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

  // Count projects by status
  const _activeProjects =
    projects?.filter(
      (p) =>
        p.status === 'in_progress' ||
        p.status === 'building' ||
        p.status === 'draft'
    ).length || 0;

  const createNewInEditor = () => router.push('/team/dashboard/new');

  return (
    <div className="p-4 sm:p-5 max-w-7xl mx-auto min-h-full pb-0 w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-1 sm:mt-2 mb-8">
        <div>
          <p className="text-gray-500 dark:text-white/50 mb-1 text-base sm:text-lg">
            {greeting},{' '}
            <span className="text-gray-700 dark:text-white/70 font-medium">
              {firstName}
            </span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-4">
          <Button
            variant="accent"
            size="default"
            className="w-full sm:w-auto"
            onClick={createNewInEditor}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          {isAdmin && (
            <Link href="/team/dashboard/invite" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="default"
                className="w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Invite Member</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Scaffold Tool */}
      <div className="mb-6">
        <QuickScaffold />
      </div>

      {/* Stats Row */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsStatsSkeleton />
        ) : (
          <TeamProjectsStats projects={projects || []} />
        )}
      </div>

      {/* All Projects */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsListSkeleton count={3} />
        ) : projects && projects.length > 0 ? (
          <TeamProjectsList projects={projects} />
        ) : (
          <div className={`${glassPanelClass} p-12 text-center`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/55 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
              <FolderOpen className="w-8 h-8 text-gray-400 dark:text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-white/50 mb-6 max-w-sm mx-auto">
              Click "New Project" to set up your first client project.
            </p>
            <Button variant="accent" onClick={createNewInEditor}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
