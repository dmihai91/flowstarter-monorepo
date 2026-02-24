'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useScrollAnimation, getStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { useTranslations } from '@/lib/i18n';
import { BarChart3, ExternalLink, Globe, Mail, Pencil, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
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

// Ghost chart SVG for empty traffic state
function GhostChart() {
  return (
    <svg className="w-full h-16 mt-2" viewBox="0 0 200 60" fill="none">
      <path 
        d="M0 45 Q25 40, 50 35 T100 30 T150 25 T200 20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeDasharray="4 4"
        className="text-gray-200 dark:text-white/10"
      />
      <path 
        d="M0 55 Q25 50, 50 48 T100 45 T150 42 T200 40" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeDasharray="4 4"
        className="text-gray-200 dark:text-white/10"
      />
    </svg>
  );
}

// Integration logo placeholder
function IntegrationLogo({ name, icon: Icon }: { name: string; icon: typeof BarChart3 }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-300 dark:text-white/20" />
      </div>
      <span className="text-[10px] text-gray-400 dark:text-white/30">{name}</span>
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
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {lastProject.name}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                  <span className="text-xs text-[var(--green)] font-medium">Live</span>
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--purple)] text-sm font-medium text-white hover:opacity-90 transition-opacity"
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
            <>
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
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 flex-wrap">
                <span>{uniqueVisitors.toLocaleString()} visitors</span>
                <span className="text-gray-300 dark:text-white/20">•</span>
                <span>{Math.round(avgSessionDuration / 60)}min avg</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gray-300 dark:text-white/20" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 dark:text-white/40">
                    Traffic data appears once your site is live
                  </p>
                </div>
              </div>
              <GhostChart />
            </>
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
            <>
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
              <p className="text-xs text-gray-500 dark:text-white/50">
                {conversionRate.toFixed(1)}% conversion rate
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-300 dark:text-white/20" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 dark:text-white/40">
                    Lead tracking activates when your site goes live
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 border-2 border-white dark:border-gray-900"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 dark:text-white/30">Future leads</span>
              </div>
            </>
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
            <Link
              href="/dashboard/integrations"
              className="text-xs font-medium text-[var(--purple)] hover:underline"
            >
              Set up →
            </Link>
          </div>
          
          <p className="text-sm text-gray-400 dark:text-white/40 mb-3">
            Connect your tools after launch
          </p>
          
          <div className="flex items-center justify-around">
            <IntegrationLogo name="Analytics" icon={BarChart3} />
            <IntegrationLogo name="Mailchimp" icon={Mail} />
            <IntegrationLogo name="Calendar" icon={() => (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )} />
          </div>
        </>
      ),
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const animation = getStaggeredAnimation(index, isVisible);
        return (
          <GlassCard 
            key={index} 
            className="gap-4"
            style={animation.style}
          >
            <div className={animation.className}>
              {card.content}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export default DashboardStatsClient;
