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

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { t } = useTranslations();

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
