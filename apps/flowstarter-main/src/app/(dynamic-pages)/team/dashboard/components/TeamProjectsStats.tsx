'use client';
import React from 'react';

import { useTeamDashboardStats } from '@/hooks/useTeamDashboardStats';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useTranslations } from '@/lib/i18n';
import {
  BUILDING_STATUSES,
  LIVE_STATUSES,
  STATUS_BADGE_CLASS,
  isBuilding,
  isLive,
} from '@/lib/team-dashboard/team-project-status';
import { GlassPanel } from '@flowstarter/flow-design-system';
import { TeamProjectsStatsSkeleton } from './TeamProjectsStatsSkeleton';

export {
  LIVE_STATUSES,
  BUILDING_STATUSES,
  isLive,
  isBuilding,
  STATUS_BADGE_CLASS,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadgeClassFor(status: string | null) {
  if (isLive(status)) return STATUS_BADGE_CLASS.live;
  if (isBuilding(status)) return STATUS_BADGE_CLASS.building;
  return STATUS_BADGE_CLASS.intake;
}

export function TeamProjectsStats() {
  const { formatTimeAgo } = useFormatDate();
  const { t } = useTranslations();
  const { data: stats, isLoading, isError } = useTeamDashboardStats();

  if (isLoading) {
    return <TeamProjectsStatsSkeleton />;
  }

  if (isError || !stats) {
    return (
      <div className="rounded-[var(--fs-radius-2xl)] border border-[var(--fs-rule)] p-4 text-sm text-[var(--fs-ink-dim)]">
        {t('team.dashboard.statsLoadError')}
      </div>
    );
  }

  const {
    totalProjects,
    draftCount,
    inProgressCount,
    liveCount,
    totalSetupFees,
    monthlyRevenue,
    paidCount,
    outstandingCount,
    recentProject,
  } = stats;

  const getStatusLabel = (status: string | null) => {
    if (isLive(status)) return t('status.live');
    if (isBuilding(status)) return t('status.building');
    return t('status.draft');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full min-w-0">
      {/* Total Projects Card */}
      <GlassPanel
        shadow="glass"
        padding="md"
        className="rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150"
        style={
          {
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--fs-ink-faint)]">
            {t('team.dashboard.totalProjects')}
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--fs-ink)] mb-3">
          {totalProjects}
        </p>
        <div className="flex items-center gap-3 text-xs mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--fs-ink-dim)]">
              {t('team.dashboard.countLive', { count: liveCount })}
            </span>
          </span>
          {inProgressCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[var(--fs-ink-dim)]">
                {t('team.dashboard.countBuilding', { count: inProgressCount })}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[var(--fs-ink-dim)]">
              {t('team.dashboard.countDraft', { count: draftCount })}
            </span>
          </span>
        </div>

        {/* Recent Project */}
        {recentProject && (
          <div className="pt-3 border-t border-[var(--fs-rule)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-lg">
                {recentProject.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`px-1.5 py-0.5 text-[0.625rem] font-medium rounded ${statusBadgeClassFor(
                      recentProject.status
                    )}`}
                  >
                    {getStatusLabel(recentProject.status)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--fs-ink)] truncate">
                  {recentProject.name || t('app.untitled')}
                </p>
                <p className="text-xs text-[var(--fs-ink-faint)]">
                  {t('team.dashboard.lastEdit', {
                    time: formatTimeAgo(
                      recentProject.updated_at || recentProject.created_at
                    ),
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Revenue Card */}
      <GlassPanel
        shadow="glass"
        padding="md"
        className="rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150"
        style={
          {
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--fs-ink-faint)]">
            {t('team.dashboard.revenue')}
          </span>
          <a
            href="https://dashboard.stripe.com/test/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--purple)] hover:underline font-medium"
          >
            {t('team.dashboard.details')} →
          </a>
        </div>
        <p className="text-3xl font-bold text-[var(--fs-ink)] mb-3">
          {formatCurrency(totalSetupFees + monthlyRevenue)}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[var(--fs-ink-dim)]">
              {t('team.dashboard.setupFees', {
                amount: formatCurrency(totalSetupFees),
              })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--fs-ink-dim)]">
              {t('team.dashboard.monthlyRevenue', {
                amount: formatCurrency(monthlyRevenue),
              })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <span className="text-[var(--fs-ink-dim)]">
              {t('team.dashboard.countPaid', { count: paidCount })}
            </span>
          </span>
        </div>
      </GlassPanel>

      {/* Outstanding payments */}
      <GlassPanel
        shadow="glass"
        padding="md"
        className="rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150"
        style={
          {
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--fs-ink-faint)]">
            Outstanding payments
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--fs-ink)]">
          {outstandingCount}
        </p>
        <p className="text-xs text-[var(--fs-ink-faint)] mt-1">
          Workspaces with deposit/final/subscription past due
        </p>
      </GlassPanel>
    </div>
  );
}
