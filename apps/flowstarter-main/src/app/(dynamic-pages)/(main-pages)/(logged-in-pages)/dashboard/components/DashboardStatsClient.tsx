'use client';

import { GlassCard } from '@/components/ui/glass-card';
import {
  useScrollAnimation,
  getStaggeredAnimation,
} from '@/hooks/useScrollAnimation';
import { useTranslations } from '@/lib/i18n';
import {
  BarChart3,
  Calendar,
  ExternalLink,
  Globe,
  Mail,
  Pencil,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

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

// Refined ghost chart - subtle upward trend, thinner
function GhostChart() {
  return (
    <svg className="w-full h-10 mt-2" viewBox="0 0 200 35" fill="none">
      <path
        d="M0 30 Q40 28, 80 24 T160 16 T200 8"
        stroke="var(--purple)"
        strokeWidth="1"
        strokeDasharray="4 4"
        strokeOpacity="0.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Integration logo with label - brand purple at 35% opacity
function IntegrationLogo({
  name,
  icon: Icon,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 transition-opacity duration-300">
      <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[var(--purple)] opacity-35 group-hover:opacity-50 transition-opacity" />
      </div>
      <span className="text-[10px] sm:text-xs sm:text-sm sm:text-base text-gray-400 dark:text-white/30 font-medium">
        {name}
      </span>
    </div>
  );
}

export function DashboardStatsClient({
  liveProjects,
  totalProjects,
  totalLeads,
  uniqueVisitors,
  totalViews,
  avgSessionDuration,
  lastProject,
  aiCredits,
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
  aiCredits?: {
    remaining: number;
    total: number;
    hasSubscription: boolean;
  };
}) {
  const { t } = useTranslations();
  const { ref, isVisible } = useScrollAnimation();
  const conversionRate =
    uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0;

  const hasLiveProject = liveProjects > 0;
  const hasAnyProject = totalProjects > 0;

  const cards = [
    // Your Website Card - Active icon at 80% opacity
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.stats.yourWebsite')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[var(--purple)] opacity-80" />
            </div>
          </div>

          {hasLiveProject && lastProject ? (
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {lastProject.name}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                  <span className="text-xs sm:text-sm text-[var(--green)] font-medium">
                    {t('dashboard.stats.live')}
                  </span>
                </span>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/dashboard/projects/${lastProject.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t('dashboard.stats.edit')}
                </Link>
                <a
                  href={`https://${lastProject.name
                    .toLowerCase()
                    .replace(/\s+/g, '-')}.flowstarter.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--purple)] text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('dashboard.stats.view')}
                </a>
              </div>
            </div>
          ) : hasAnyProject && lastProject ? (
            <div className="flex flex-col gap-2 flex-1">
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {lastProject.name}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {t('dashboard.stats.inProgress')}
                  </span>
                </span>
              </div>
              {/* Minimal progress bar */}
              <div className="mt-1">
                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-[var(--purple)] rounded-full transition-all duration-1000"
                    style={{ width: '35%' }}
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mt-auto">
                {t('dashboard.stats.buildingMessage')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.stats.notStarted')}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mt-auto">
                {t('dashboard.stats.bookDiscovery')}
              </p>
            </div>
          )}
        </>
      ),
    },
    // Website Traffic Card - Disabled icon at 25% opacity
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.analytics.websiteTraffic')}
            </span>
            {totalViews > 0 && (
              <Link
                href="/dashboard/analytics/traffic"
                className="text-xs sm:text-sm font-medium text-[var(--purple)] hover:underline"
              >
                {t('dashboard.details')} →
              </Link>
            )}
          </div>

          {totalViews > 0 ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[var(--purple)] opacity-80" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalViews.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50">
                    {t('dashboard.analytics.views')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-white/50 flex-wrap mt-auto">
                <span>{t('dashboard.analytics.visitors', { count: uniqueVisitors.toLocaleString() })}</span>
                <span className="text-gray-300 dark:text-white/20">•</span>
                <span>{t('dashboard.analytics.avgSession', { minutes: Math.round(avgSessionDuration / 60) })}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[var(--purple)] opacity-25" />
                </div>
                <p className="text-sm sm:text-base text-gray-400 dark:text-white/40 flex-1">
                  {t('dashboard.stats.trafficAppears')}
                </p>
              </div>
              <GhostChart />
            </div>
          )}
        </>
      ),
    },
    // Business Leads Card - Disabled icon at 25% opacity
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.analytics.businessLeads')}
            </span>
            {totalLeads > 0 && (
              <Link
                href="/dashboard/analytics/leads"
                className="text-xs sm:text-sm font-medium text-[var(--purple)] hover:underline"
              >
                {t('dashboard.details')} →
              </Link>
            )}
          </div>

          {totalLeads > 0 ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--purple)] opacity-80" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalLeads.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50">
                    {totalLeads === 1 ? t('dashboard.analytics.prospectSingular') : t('dashboard.analytics.prospectPlural')}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mt-auto">
                {t('dashboard.analytics.conversionRateValue', { rate: conversionRate.toFixed(1) })}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--purple)] opacity-25" />
                </div>
                <p className="text-sm sm:text-base text-gray-400 dark:text-white/40 flex-1">
                  {t('dashboard.stats.leadsActivate')}
                </p>
              </div>
            </div>
          )}
        </>
      ),
    },
    // AI Assistant Card - capability focused
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.stats.aiCapabilities')}
            </span>
            {aiCredits?.hasSubscription && (
              <span className="text-[10px] sm:text-xs sm:text-sm text-[var(--green)] bg-[var(--green)]/10 px-2 py-0.5 rounded-full font-medium">
                {t('dashboard.stats.aiCapabilitiesActive')}
              </span>
            )}
          </div>

          {aiCredits?.hasSubscription ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--purple)] opacity-80" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {aiCredits.remaining.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50">
                    {t('dashboard.stats.aiCreditsAvailable', { count: aiCredits.total.toLocaleString() })}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--purple)] to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((aiCredits.remaining / aiCredits.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs sm:text-sm sm:text-base text-gray-400 dark:text-white/30 mt-1">
                  {t('dashboard.stats.aiCreditsReset')}
                </p>
              </div>
              {/* Capabilities */}
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                {[
                  t('dashboard.stats.aiCapability.copy'),
                  t('dashboard.stats.aiCapability.sections'),
                  t('dashboard.stats.aiCapability.seo'),
                  t('dashboard.stats.aiCapability.images'),
                ].map((cap) => (
                  <span key={cap} className="text-[11px] sm:text-xs sm:text-sm text-gray-500 dark:text-white/40 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[var(--purple)]/40" />
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--purple)] opacity-25" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-300 dark:text-white/20">
                    1,000
                  </p>
                  <p className="text-xs sm:text-sm sm:text-base text-gray-400 dark:text-white/30">
                    credits included in your plan
                  </p>
                </div>
              </div>
              {/* Locked progress bar */}
              <div className="mb-2">
                <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gray-200 dark:bg-white/10 rounded-full" />
                </div>
              </div>
              <p className="text-xs sm:text-sm sm:text-base text-gray-400 dark:text-white/30 mt-auto">
                {t('dashboard.stats.aiUnlockedAfterSetup')}
              </p>
            </div>
          )}
        </>
      ),
    },
    // Integrations Card - Icons at 35% opacity
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.stats.integrations')}
            </span>
            {hasLiveProject ? (
              <Link
                href="/dashboard/integrations"
                className="text-xs sm:text-sm font-medium text-[var(--purple)] hover:underline"
              >
                {t('dashboard.stats.integrationsSetup')} →
              </Link>
            ) : (
              <span className="text-[10px] sm:text-xs sm:text-sm sm:text-base text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full font-medium">
                {t('dashboard.stats.integrationsAfterLaunch')}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-gray-400 dark:text-white/40">
            {hasLiveProject
              ? t('dashboard.stats.integrationsConnect')
              : t('dashboard.stats.integrationsConnectLater')}
          </p>

          <div className="flex items-center justify-around flex-1 pt-2 group">
            <IntegrationLogo name={t('dashboard.stats.analytics')} icon={BarChart3} />
            <IntegrationLogo name={t('dashboard.stats.email')} icon={Mail} />
            <IntegrationLogo name={t('dashboard.stats.calendar')} icon={Calendar} />
          </div>
        </>
      ),
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card, index) => {
        const animation = getStaggeredAnimation(index, isVisible);
        return (
          <GlassCard
            key={index}
            className="gap-3 min-h-[160px]"
            style={animation.style}
          >
            <div className={`${animation.className} h-full flex flex-col`}>
              {card.content}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export default DashboardStatsClient;
