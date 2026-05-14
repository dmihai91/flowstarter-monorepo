'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from '@/lib/i18n';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTeamDashboardStats } from '@/hooks/useTeamDashboardStats';
import { useTeamClients } from './components/dashboard.constants';
import { KanbanBoard } from './components/KanbanBoard';
import { DashboardActivityTabs } from './components/DashboardActivityTabs';
import { AdminDashboardPageSkeleton } from './components/AdminSkeletons';
import { Masthead } from './components/Masthead';
import { StatsStrip } from './components/StatsStrip';
import { Panel } from './components/Panel';
import { ProjectsTable } from './components/ProjectsTable';
import { ClientsTable } from './components/ClientsTable';

export const dynamic = 'force-dynamic';

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();
  const { data: clients, isLoading: clientsLoading } = useTeamClients();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useTeamDashboardStats();

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/login');
    }
  }, [userLoaded, user, router]);

  if (!userLoaded || !user) {
    return (
      <DashboardChrome>
        <AdminDashboardPageSkeleton />
      </DashboardChrome>
    );
  }

  const firstName = user.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greeting.morning')
      : hour < 18
      ? t('dashboard.greeting.afternoon')
      : hour < 21
      ? t('dashboard.greeting.evening')
      : t('dashboard.greeting.night');

  const recentProjects = (projects ?? []).slice(0, 8);

  return (
    <DashboardChrome>
      <Masthead
        greeting={greeting}
        firstName={firstName}
        projectCount={stats?.totalProjects ?? 0}
        loading={statsLoading || projectsLoading}
      />

      <StatsStrip
        stats={stats}
        loading={statsLoading}
        error={statsError}
        clientCount={clients?.length ?? null}
        clientsLoading={clientsLoading}
      />

      <Panel
        eyebrow={t('admin.dashboard.pipeline.eyebrow')}
        title={t('admin.dashboard.pipeline.title')}
        meta={
          stats?.totalProjects
            ? stats.totalProjects === 1
              ? t('admin.dashboard.pipeline.metaWithCount', {
                  count: stats.totalProjects,
                })
              : t('admin.dashboard.pipeline.metaWithCountPlural', {
                  count: stats.totalProjects,
                })
            : t('admin.dashboard.pipeline.metaEmpty')
        }
        className="mt-7"
      >
        <KanbanBoard />
      </Panel>

      <DashboardActivityTabs
        className="mt-7"
        projectsMeta={
          projects?.length
            ? t('admin.dashboard.recent.metaTotal', { count: projects.length })
            : undefined
        }
        accountsMeta={
          clients?.length
            ? t('admin.dashboard.accounts.meta', { count: clients.length })
            : undefined
        }
        projectsContent={
          <ProjectsTable
            rows={recentProjects}
            loading={projectsLoading}
            onOpen={(id) => router.push(`/admin/dashboard/projects/${id}`)}
          />
        }
        accountsContent={
          <ClientsTable rows={clients ?? []} loading={clientsLoading} />
        }
      />
    </DashboardChrome>
  );
}

// ─── Chrome ─────────────────────────────────────────────────────────────────

function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="ls-scope ls-admin-dashboard px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </div>
  );
}
