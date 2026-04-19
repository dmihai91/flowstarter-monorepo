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
      <span className="text-[0.625rem] sm:text-xs sm:text-sm sm:text-base text-[var(--fs-ink-faint)] font-medium">
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
            <span className="text-sm sm:text-base font-medium text-[var(--fs-ink-faint)]">
              {t('dashboard.stats.yourWebsite')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[var(--purple)] opacity-80" />
            </div>
          </div>

          {hasLiveProject && lastProject ? (
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <p className="text-xl font-semibold text-[var(--fs-ink)] truncate">
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--fs-accent-bg)] text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
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
                <p className="text-xl font-semibold text-[var(--fs-ink)] truncate">
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
                <div className="h-1.5 bg-[var(--fs-accent-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-[var(--purple)] rounded-full transition-all duration-1000"
                    style={{ width: '35%' }}
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--fs-ink-faint)] mt-auto">
                {t('dashboard.stats.buildingMessage')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-lg font-semibold text-[var(--fs-ink)]">
                {t('dashboard.stats.notStarted')}
              </p>
              <p className="text-xs sm:text-sm text-[var(--fs-ink-faint)] mt-auto">
                {t('dashboard.stats.bookDiscovery')}
              </p>
            </div>
          )}
        </>
      ),
    },
    // Analytics: split when live, merged when pre-launch (CD-5)
    ...(hasLiveProject
      ? [
          // Traffic Card (live)
          {
            content: (
              <>
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-sm font-medium text-[var(--fs-ink-faint)]">
                    {t('dashboard.analytics.websiteTraffic')}
                  </span>
                  <Link
                    href="/dashboard/analytics/traffic"
                    className="text-xs font-medium text-[var(--purple)] hover:underline"
                  >
                    {t('dashboard.details')} →
                  </Link>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-[var(--purple)] opacity-80" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                        {totalViews.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--fs-ink-faint)]">
                        {t('dashboard.analytics.views')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--fs-ink-faint)] flex-wrap mt-auto">
                    <span>
                      {t('dashboard.analytics.visitors', {
                        count: uniqueVisitors.toLocaleString(),
                      })}
                    </span>
                    <span className="text-[var(--fs-ink-disabled)]">•</span>
                    <span>
                      {t('dashboard.analytics.avgSession', {
                        minutes: Math.round(avgSessionDuration / 60),
                      })}
                    </span>
                  </div>
                </div>
              </>
            ),
          },
          // Leads Card (live)
          {
            content: (
              <>
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-sm font-medium text-[var(--fs-ink-faint)]">
                    {t('dashboard.analytics.businessLeads')}
                  </span>
                  {totalLeads > 0 && (
                    <Link
                      href="/dashboard/leads"
                      className="text-xs font-medium text-[var(--purple)] hover:underline"
                    >
                      {t('dashboard.details')} →
                    </Link>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--purple)] opacity-80" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                        {totalLeads.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--fs-ink-faint)]">
                        {totalLeads === 1
                          ? t('dashboard.analytics.prospectSingular')
                          : t('dashboard.analytics.prospectPlural')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--fs-ink-faint)] mt-auto">
                    {t('dashboard.analytics.conversionRateValue', {
                      rate: conversionRate.toFixed(1),
                    })}
                  </p>
                </div>
              </>
            ),
          },
        ]
      : [
          // Merged post-launch analytics card (pre-launch, CD-5)
          {
            content: (
              <>
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-sm font-medium text-[var(--fs-ink-faint)]">
                    Post-launch Analytics
                  </span>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--fs-ink-disabled)] bg-gray-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full border border-gray-200/50 dark:border-white/[0.06]">
                    After launch
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[var(--purple)] opacity-25" />
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[var(--purple)] opacity-25" />
                    </div>
                    <p className="text-sm text-[var(--fs-ink-faint)]">
                      Traffic + leads tracking
                    </p>
                  </div>
                  <GhostChart />
                  <p className="text-xs text-[var(--fs-ink-faint)] mt-auto">
                    Visitor counts, lead forms, and conversion data activate
                    once your site is live.
                  </p>
                </div>
              </>
            ),
          },
        ]),
    // AI Assistant Card - capability focused
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-sm sm:text-base font-medium text-[var(--fs-ink-faint)]">
              {t('dashboard.stats.aiCapabilities')}
            </span>
            {aiCredits?.hasSubscription && (
              <span className="text-[0.625rem] sm:text-xs sm:text-sm text-[var(--green)] bg-[var(--green)]/10 px-2 py-0.5 rounded-full font-medium">
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
                  <p className="text-2xl font-semibold text-[var(--fs-ink)]">
                    {aiCredits.remaining.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--fs-ink-faint)]">
                    {t('dashboard.stats.aiCreditsAvailable', {
                      count: aiCredits.total.toLocaleString(),
                    })}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-[var(--fs-accent-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--purple)] to-cyan-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (aiCredits.remaining / aiCredits.total) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[0.625rem] sm:text-xs sm:text-sm sm:text-base text-[var(--fs-ink-faint)] mt-1">
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
                  <span
                    key={cap}
                    className="text-[0.6875rem] sm:text-xs sm:text-sm text-gray-500 dark:text-white/40 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--purple)]/40" />
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[var(--purple)] opacity-30" />
                <span className="text-lg font-semibold text-[var(--fs-ink-disabled)]">
                  1,000
                </span>
                <span className="text-sm text-[var(--fs-ink-faint)]">
                  AI credits included
                </span>
              </div>
              {/* Locked progress bar — full width placeholder */}
              <div className="mb-2">
                <div className="h-1.5 bg-[var(--fs-bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-[var(--fs-rule)] rounded-full" />
                </div>
              </div>
              <p className="text-xs text-[var(--fs-ink-faint)] mt-auto">
                Activates when your site goes live
              </p>
              <button
                disabled
                title="Available once your site is live"
                className="mt-3 w-full py-2 rounded-lg text-xs font-medium text-[var(--fs-ink-disabled)] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] cursor-not-allowed"
              >
                Locked until launch
              </button>
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
            <span className="text-sm sm:text-base font-medium text-[var(--fs-ink-faint)]">
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
              <span className="text-[0.625rem] sm:text-xs sm:text-sm sm:text-base text-[var(--fs-ink-faint)] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full font-medium">
                {t('dashboard.stats.integrationsAfterLaunch')}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-[var(--fs-ink-faint)]">
            {hasLiveProject
              ? t('dashboard.stats.integrationsConnect')
              : t('dashboard.stats.integrationsConnectLater')}
          </p>

          <div className="flex items-center justify-around flex-1 pt-2 group">
            <IntegrationLogo
              name={t('dashboard.stats.analytics')}
              icon={BarChart3}
            />
            <IntegrationLogo name={t('dashboard.stats.email')} icon={Mail} />
            <IntegrationLogo
              name={t('dashboard.stats.calendar')}
              icon={Calendar}
            />
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
            style={animation}
          >
            <div className={`h-full flex flex-col`}>{card.content}</div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export default DashboardStatsClient;
