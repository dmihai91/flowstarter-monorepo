'use client';
import { PageContainer } from '@/components/PageContainer';
import { useTranslations } from '@/lib/i18n';
import { DashboardHero } from './components/DashboardHero';
import { DashboardInit } from './components/DashboardInit';
import { DashboardMessages } from './components/DashboardMessages';
import { DashboardProjectsClient } from './components/DashboardProjects.client';
import { DashboardStatsClientFetcher } from './components/DashboardStatsClientFetcher';
import { DashboardWrapper } from './components/DashboardWrapper';
import { PageSectionHeader } from './components/PageSectionHeader';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { t } = useTranslations();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect team members to team dashboard
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      if (role === 'team' || role === 'admin') {
        router.replace('/team/dashboard');
      }
    }
  }, [isLoaded, user, router]);

  return (
    <DashboardWrapper>
      <PageContainer gradientVariant="dashboard">
        {/* Messages */}
        <DashboardMessages />

        {/* Draft in progress + initial loading */}
        <DashboardInit>
          {/* Hero card with gradient containing everything */}
          <DashboardHero>
            {/* Analytics snapshot - reduced gap from stepper */}
            <div className="mb-8">
              <DashboardStatsClientFetcher />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="flex-grow border-t border-gray-200/60 dark:border-white/10"></div>
            </div>

            {/* Projects grid */}
            <div className="mb-8">
              <PageSectionHeader
                title={t('projects.title')}
                subtitle={t('projects.subtitle')}
              />
              <DashboardProjectsClient />
            </div>
          </DashboardHero>
        </DashboardInit>
      </PageContainer>
    </DashboardWrapper>
  );
}
