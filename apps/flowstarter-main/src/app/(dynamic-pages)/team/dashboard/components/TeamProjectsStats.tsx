'use client';

import { ChevronRight } from 'lucide-react';
import { ProjectWithOwner } from '@/hooks/useTeamProjects';

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

export function TeamProjectsStats({ projects }: TeamProjectsStatsProps) {
  const totalProjects = projects.length;
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const inProgressCount = projects.filter(p => p.status === 'in_progress' || p.status === 'building').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const liveCount = projects.filter(p => p.status === 'live' || p.status === 'completed').length;

  // Revenue calculations
  const totalSetupFees = projects.reduce((sum, p) => sum + (p.setup_fee || 0), 0);
  const monthlyRevenue = projects
    .filter(p => p.is_paid)
    .reduce((sum, p) => sum + (p.monthly_fee || 0), 0);
  const paidCount = projects.filter(p => p.is_paid).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Projects Card */}
      <div className="p-5 rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-white/50">Total Projects</span>
          <button className="flex items-center gap-1 text-xs text-[var(--purple)] hover:underline">
            Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalProjects}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-white/60">{completedCount} completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600 dark:text-white/60">{draftCount} draft</span>
          </span>
          {inProgressCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600 dark:text-white/60">{inProgressCount} in progress</span>
            </span>
          )}
        </div>
      </div>

      {/* Revenue Card */}
      <div className="p-5 rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-white/50">Revenue</span>
          <button className="flex items-center gap-1 text-xs text-[var(--purple)] hover:underline">
            Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{formatCurrency(totalSetupFees + monthlyRevenue)}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-white/60">{formatCurrency(totalSetupFees)} setup</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-white/60">{formatCurrency(monthlyRevenue)}/mo</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <span className="text-gray-600 dark:text-white/60">{paidCount} paid</span>
          </span>
        </div>
      </div>
    </div>
  );
}
