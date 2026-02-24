'use client';

import { useTranslations } from '@/lib/i18n';
import { IntegrationsCard } from './IntegrationsCard';
import { StatCard } from './StatCard';

export interface TemplateStat {
  template: string;
  count: number;
}

export interface UserEngagementStats {
  totalUsers: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
}

export function DashboardStatsClient({
  liveProjects,
  totalProjects,
  totalLeads,
  uniqueVisitors,
  totalViews,
  avgSessionDuration,
  completedProjects,
  draftProjects,
  lastProject,
}: {
  liveProjects: number;
  totalProjects: number;
  totalLeads: number;
  uniqueVisitors: number;
  totalViews: number;
  avgSessionDuration: number;
  potentialRevenue: number;
  popularTemplates: TemplateStat[];
  userEngagement: UserEngagementStats;
  completedProjects: number;
  inProgressProjects: number;
  draftProjects: number;
  lastProject: {
    id: string;
    name: string;
    status: string;
    is_draft: boolean;
    updated_at: string;
    thumbnail_url?: string | null;
  } | null;
}) {
  const { t } = useTranslations();
  const conversionRate =
    uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0;

  // Check if all analytics are zero (user hasn't set up GA)
  const hasNoAnalytics =
    totalViews === 0 &&
    uniqueVisitors === 0 &&
    totalLeads === 0 &&
    avgSessionDuration === 0;
  const showAnalyticsSetup = hasNoAnalytics;

  const stats = [
    {
      title: t('dashboard.cards.totalProjects'),
      locked: false,
      value: `${totalProjects}`,
      description: (
        <div className="flex items-start gap-[24px] flex-wrap">
          <span className="flex items-center gap-[8px]">
            <span
              className="w-[12px] h-[12px] rounded-[32px]"
              style={{ backgroundColor: 'var(--purple)' }}
            />
            <span
              className="text-[12px] font-medium leading-normal"
              style={{ color: 'var(--copy-body)' }}
            >
              {completedProjects} {t('projects.status.completed').toLowerCase()}
            </span>
          </span>
          <span className="flex items-center gap-[8px]">
            <span
              className="w-[12px] h-[12px] rounded-[32px]"
              style={{ backgroundColor: 'var(--copy-labels)' }}
            />
            <span
              className="text-[12px] font-medium leading-normal"
              style={{ color: 'var(--copy-body)' }}
            >
              {draftProjects} {t('projects.status.draft').toLowerCase()}
            </span>
          </span>
          <span className="flex items-center gap-[8px]">
            <span
              className="w-[12px] h-[12px] rounded-[32px]"
              style={{ backgroundColor: 'var(--green)' }}
            />
            <span
              className="text-[12px] font-medium leading-normal"
              style={{ color: 'var(--copy-body)' }}
            >
              {liveProjects} {t('projects.status.live').toLowerCase()}
            </span>
          </span>
        </div>
      ),
      // icon removed for clean design
      tone: 'blue' as const,
      trend: undefined,
      zeroState:
        totalProjects === 0
          ? 'Your website will appear here after we build it'
          : undefined,
      detailsLink: undefined, // No details link for projects card
      lastProject: lastProject,
    },
    {
      title: t('dashboard.analytics.businessLeads'),
      locked: false,
      value: `${totalLeads.toLocaleString()} ${
        totalLeads === 1
          ? t('dashboard.analytics.prospectSingular')
          : t('dashboard.analytics.prospectPlural')
      }`,
      description: t('dashboard.analytics.conversionRate', {
        conversionRate: conversionRate.toFixed(1),
      }),
      // icon removed for clean design
      tone: 'green' as const,
      zeroState:
        totalLeads === 0 ? (
          'Track leads once your site is live'
        ) : undefined,
      detailsLink: '/dashboard/analytics/leads',
    },
    {
      title: t('dashboard.analytics.websiteTraffic'),
      locked: false,
      value: `${totalViews.toLocaleString()} ${t('dashboard.analytics.views')}`,
      description: (
        <div className="flex items-center gap-[8px] flex-wrap">
          <span className="text-[12px]" style={{ color: 'var(--copy-body)' }}>
            {uniqueVisitors.toLocaleString()}{' '}
            {t('dashboard.analytics.uniqueVisitors')}
          </span>
          <span style={{ color: 'var(--divider-border)' }}>•</span>
          <span className="text-[12px]" style={{ color: 'var(--copy-body)' }}>
            {Math.round(avgSessionDuration / 60)}min{' '}
            {t('dashboard.analytics.avgSession')}
          </span>
          <span style={{ color: 'var(--divider-border)' }}>•</span>
          <span className="flex items-center gap-[8px]">
            <span
              className="w-[12px] h-[12px] rounded-[32px]"
              style={{ backgroundColor: 'var(--green)' }}
            />
            <span className="text-[12px]" style={{ color: 'var(--copy-body)' }}>
              {liveProjects} {t('projects.status.live').toLowerCase()}
            </span>
          </span>
        </div>
      ),
      // icon removed for clean design
      tone: 'indigo' as const,
      trend: undefined,
      zeroState:
        totalViews === 0 ? (
          'Monitor traffic once your site is live'
        ) : undefined,
      detailsLink: '/dashboard/analytics/traffic',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          tone={stat.tone}
          locked={stat.locked}
          value={stat.value}
          description={stat.description}
          trend={stat.trend}
          cta={t('dashboard.analytics.locked')}
          zeroState={stat.zeroState}
          detailsLink={stat.detailsLink}
          lastProject={stat.lastProject}
        />
      ))}
      <IntegrationsCard />
    </div>
  );
}

export default DashboardStatsClient;
