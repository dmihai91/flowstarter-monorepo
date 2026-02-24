'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useTranslations } from '@/lib/i18n';
import { ExternalLink, Globe, Pencil, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { IntegrationsCard } from './IntegrationsCard';

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

  const hasLiveProject = liveProjects > 0;
  const hasAnyProject = totalProjects > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Your Website Card */}
      <GlassCard className="gap-4">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-gray-500 dark:text-white/50">
            Your Website
          </span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--purple)]/10 to-blue-500/10 border border-[var(--purple)]/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[var(--purple)]" />
          </div>
        </div>
        
        {hasLiveProject && lastProject ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {lastProject.name}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
              </span>
            </div>
            <div className="flex gap-2 mt-1">
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--purple)] text-sm font-medium text-white hover:bg-[var(--purple)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View
              </a>
            </div>
          </div>
        ) : hasAnyProject && lastProject ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {lastProject.name}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/50">
              We're building your website. You'll be notified when it's ready!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Not started yet
            </p>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Book a discovery call to get your website built
            </p>
          </div>
        )}
      </GlassCard>

      {/* Business Leads Card */}
      <GlassCard className="gap-4">
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
        {totalLeads > 0 ? (
          <p className="text-xs text-gray-500 dark:text-white/50">
            {conversionRate.toFixed(1)}% conversion rate
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-white/50 bg-gray-100/80 dark:bg-white/5 rounded-md px-2 py-1.5">
            {hasLiveProject ? "No leads yet — they'll appear here" : "Track leads once your site is live"}
          </p>
        )}
      </GlassCard>

      {/* Website Traffic Card */}
      <GlassCard className="gap-4">
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-[var(--purple)]/10 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
        {totalViews > 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 flex-wrap">
            <span>{uniqueVisitors.toLocaleString()} visitors</span>
            <span className="text-gray-300 dark:text-white/20">•</span>
            <span>{Math.round(avgSessionDuration / 60)}min avg</span>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-white/50 bg-gray-100/80 dark:bg-white/5 rounded-md px-2 py-1.5">
            {hasLiveProject ? 'No traffic yet — share your site!' : 'Monitor traffic once your site is live'}
          </p>
        )}
      </GlassCard>

      {/* Integrations Card */}
      <IntegrationsCard />
    </div>
  );
}

export default DashboardStatsClient;
