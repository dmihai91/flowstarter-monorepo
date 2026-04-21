'use client';

import { TeamProjectsList } from './components/TeamProjectsList';
import { QuickScaffold } from './components/QuickScaffold';
import { TeamProjectsListSkeleton } from './components/TeamProjectsListSkeleton';
import { TeamProjectsStats } from './components/TeamProjectsStats';
import { ClientRequestsList } from './components/client-requests/ClientRequestsList';
import { DashboardLoader } from './components/DashboardSkeleton';
import { TeamDashboardShell } from './components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

      {/* Stats (loads via `/api/team/dashboard/stats` in parallel with projects) */}
      <div className="mb-8">
        <TeamProjectsStats />
      </div>

      {/* Client Requests */}
      <ClientRequestsList />

      {/* Projects list */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsListSkeleton count={3} />
        ) : (
          <TeamProjectsList projects={projects || []} />
        )}
      </div>
    </TeamDashboardShell>
  );
}
