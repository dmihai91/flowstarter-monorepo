'use client';

import { ProjectWithOwner } from '@/hooks/useTeamProjects';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useTranslations } from '@/lib/i18n';
import { GlassPanel } from '@flowstarter/flow-design-system';
import { Button } from '@/components/ui/button';

// Status groupings - single source of truth
const LIVE_STATUSES = ['completed', 'live'] as const;
const BUILDING_STATUSES = ['in_progress', 'building', 'generating'] as const;

const isLive = (s: string | null) => LIVE_STATUSES.includes(s as typeof LIVE_STATUSES[number]);
const isBuilding = (s: string | null) => BUILDING_STATUSES.includes(s as typeof BUILDING_STATUSES[number]);

// Badge class by status group
const STATUS_BADGE_CLASS = {
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  building: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60',
} as const;

interface TeamProjectsStatsProps {
  projects: ProjectWithOwner[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export { LIVE_STATUSES, BUILDING_STATUSES, isLive, isBuilding, STATUS_BADGE_CLASS };

export function TeamProjectsStats({ projects }: TeamProjectsStatsProps) {
  const { formatTimeAgo } = useFormatDate();
  const { t } = useTranslations();

  const totalProjects = projects.length;
  const draftCount = projects.filter((p) => !isLive(p.status) && !isBuilding(p.status)).length;
  const inProgressCount = projects.filter((p) => isBuilding(p.status)).length;
  const liveCount = projects.filter((p) => isLive(p.status)).length;

  // Revenue calculations
  const totalSetupFees = projects.reduce(
    (sum, p) => sum + (p.setup_fee || 0),
    0
  );
  const monthlyRevenue = projects
    .filter((p) => p.is_paid)
    .reduce((sum, p) => sum + (p.monthly_fee || 0), 0);
  const paidCount = projects.filter((p) => p.is_paid).length;
  const totalCredits = projects.reduce(
    (sum, p) => sum + (p.ai_credits_used || 0),
    0
  );
  const totalCostEur = projects.reduce(
    (sum, p) => sum + ((p.generation_cost_usd || 0) * 0.92),
    0
  );
  const sitesGenerated = projects.filter(
    (p) => (p.generation_cost_usd || 0) > 0
  ).length;

  // Most recent project
  const recentProject =
    projects.length > 0
      ? projects.reduce((latest, p) => {
          const latestDate = new Date(
            latest.updated_at || latest.created_at || 0
          );
          const pDate = new Date(p.updated_at || p.created_at || 0);
          return pDate > latestDate ? p : latest;
        })
      : null;

  const getStatusLabel = (status: string | null) => {
    if (isLive(status)) return t('status.live');
    if (isBuilding(status)) return t('status.building');
    return t('status.draft');
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (isLive(status)) return STATUS_BADGE_CLASS.live;
    if (isBuilding(status)) return STATUS_BADGE_CLASS.building;
    return STATUS_BADGE_CLASS.draft;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Projects Card */}
      <GlassPanel shadow="glass" padding="md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-white/50">
            {t('team.dashboard.totalProjects')}
          </span>
          <Button variant="ghost" size="xs">
            {t('team.dashboard.details')} →
          </Button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {totalProjects}
        </p>
        <div className="flex items-center gap-3 text-xs mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-white/60">
              {t('team.dashboard.countLive', { count: liveCount })}
            </span>
          </span>
          {inProgressCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-white/60">
                {t('team.dashboard.countBuilding', { count: inProgressCount })}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600 dark:text-white/60">
              {t('team.dashboard.countDraft', { count: draftCount })}
            </span>
          </span>
        </div>

        {/* Recent Project */}
        {recentProject && (
          <div className="pt-3 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-lg">
                {recentProject.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 text-[0.625rem] font-medium rounded ${getStatusBadgeClass(recentProject.status)}`}>
                    {getStatusLabel(recentProject.status)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {recentProject.name || t('app.untitled')}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  {t('team.dashboard.lastEdit', {
                    time: formatTimeAgo(recentProject.updated_at || recentProject.created_at),
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Revenue Card */}
      <GlassPanel shadow="glass" padding="md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-white/50">
            {t('team.dashboard.revenue')}
          </span>
          <Button variant="ghost" size="xs">
            {t('team.dashboard.details')} →
          </Button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {formatCurrency(totalSetupFees + monthlyRevenue)}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-white/60">
              {t('team.dashboard.setupFees', { amount: formatCurrency(totalSetupFees) })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-white/60">
              {t('team.dashboard.monthlyRevenue', { amount: formatCurrency(monthlyRevenue) })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <span className="text-gray-600 dark:text-white/60">
              {t('team.dashboard.countPaid', { count: paidCount })}
            </span>
          </span>
        </div>
      </GlassPanel>

      {/* AI Usage Card */}
      <GlassPanel shadow="glass" padding="md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-white/50">
            AI Usage
          </span>
          <Button variant="ghost" size="xs">
            {t('team.dashboard.details')} →
          </Button>
        </div>
        <div className="mb-3">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalCredits} credits
          </p>
          <p className="text-lg font-semibold text-gray-700 dark:text-white/80">
            EUR {totalCostEur.toFixed(0)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <span className="text-gray-600 dark:text-white/60">
              {sitesGenerated} sites generated
            </span>
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
