'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useScrollAnimation, getStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { useTranslations } from '@/lib/i18n';
import { BarChart3, Calendar, ExternalLink, Globe, Mail, Pencil, TrendingUp, Users } from 'lucide-react';
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

// Refined ghost chart - subtle upward trend
function GhostChart() {
  return (
    <svg className="w-full h-12 mt-3" viewBox="0 0 200 40" fill="none">
      {/* Subtle upward trending line */}
      <path 
        d="M0 35 Q30 32, 60 28 T120 22 T180 15 T200 10" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeDasharray="3 3"
        className="text-gray-200 dark:text-white/[0.08]"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Integration logo with label - bigger icons
function IntegrationLogo({ name, icon: Icon }: { name: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center gap-1.5 group-hover:opacity-60 transition-opacity">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center opacity-40">
        <Icon className="w-5 h-5 text-gray-500 dark:text-white/50" />
      </div>
      <span className="text-[10px] text-gray-400 dark:text-white/30 font-medium">{name}</span>
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
  const { ref, isVisible } = useScrollAnimation();
  const conversionRate =
    uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0;

  const hasLiveProject = liveProjects > 0;
  const hasAnyProject = totalProjects > 0;

  const cards = [
    // Your Website Card
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50">
              Your Website
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[var(--purple)]" />
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
                  <span className="text-xs text-[var(--green)] font-medium">Live</span>
                </span>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/dashboard/projects/${lastProject.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <a
                  href={`https://${lastProject.name.toLowerCase().replace(/\s+/g, '-')}.flowstarter.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--purple)] text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
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
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-auto">
                We're building your website. You'll be notified when it's ready!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Not started yet
              </p>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-auto">
                Book a discovery call to get your website built
              </p>
            </div>
          )}
        </>
      ),
    },
    // Website Traffic Card
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.analytics.websiteTraffic')}
            </span>
            {totalViews > 0 && (
              <Link
                href="/dashboard/analytics/traffic"
                className="text-xs font-medium text-[var(--purple)] hover:underline"
              >
                Details →
              </Link>
            )}
          </div>
          
          {totalViews > 0 ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[var(--blue)]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalViews.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {t('dashboard.analytics.views')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 flex-wrap mt-auto">
                <span>{uniqueVisitors.toLocaleString()} visitors</span>
                <span className="text-gray-300 dark:text-white/20">•</span>
                <span>{Math.round(avgSessionDuration / 60)}min avg</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gray-300 dark:text-white/20" />
                </div>
                <p className="text-sm text-gray-400 dark:text-white/40 flex-1">
                  Traffic data appears once your site is live
                </p>
              </div>
              <GhostChart />
            </div>
          )}
        </>
      ),
    },
    // Business Leads Card
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50">
              {t('dashboard.analytics.businessLeads')}
            </span>
            {totalLeads > 0 && (
              <Link
                href="/dashboard/analytics/leads"
                className="text-xs font-medium text-[var(--purple)] hover:underline"
              >
                Details →
              </Link>
            )}
          </div>
          
          {totalLeads > 0 ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--green)]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalLeads.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {totalLeads === 1 ? 'prospect' : 'prospects'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-auto">
                {conversionRate.toFixed(1)}% conversion rate
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                {/* Single muted icon instead of three circles */}
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--purple)]/30" />
                </div>
                <p className="text-sm text-gray-400 dark:text-white/40 flex-1">
                  Lead tracking activates when your site goes live
                </p>
              </div>
            </div>
          )}
        </>
      ),
    },
    // Integrations Card
    {
      content: (
        <>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50">
              Integrations
            </span>
            {hasLiveProject ? (
              <Link
                href="/dashboard/integrations"
                className="text-xs font-medium text-[var(--purple)] hover:underline"
              >
                Set up →
              </Link>
            ) : (
              <span className="text-xs text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                After launch
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-400 dark:text-white/40">
            {hasLiveProject 
              ? 'Connect analytics, email & more' 
              : 'Connect your tools once your site is live'
            }
          </p>
          
          <div className="flex items-center justify-around flex-1 pt-2 group">
            <IntegrationLogo name="Analytics" icon={BarChart3} />
            <IntegrationLogo name="Email" icon={Mail} />
            <IntegrationLogo name="Calendar" icon={Calendar} />
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
