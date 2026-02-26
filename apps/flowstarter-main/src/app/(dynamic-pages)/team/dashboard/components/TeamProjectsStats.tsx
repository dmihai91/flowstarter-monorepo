'use client';

import { ProjectWithOwner } from '@/hooks/useTeamProjects';
import { useFormatDate } from '@/hooks/useFormatDate';

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
  const { formatTimeAgo } = useFormatDate();
  
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

  // Most recent project
  const recentProject = projects.length > 0 
    ? projects.reduce((latest, p) => {
        const latestDate = new Date(latest.updated_at || latest.created_at || 0);
        const pDate = new Date(p.updated_at || p.created_at || 0);
        return pDate > latestDate ? p : latest;
      })
    : null;

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Draft';
    if (status === 'completed') return 'Live';
    if (status === 'in_progress' || status === 'building') return 'Building';
    return 'Draft';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Projects Card */}
      <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-white/50">Total Projects</span>
          <button className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-md hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
            Details →
          </button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{totalProjects}</p>
        <div className="flex items-center gap-3 text-xs mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-white/60">{completedCount} completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600 dark:text-white/60">{draftCount} draft</span>
          </span>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-white/60">{liveCount} live</span>
            </span>
          )}
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
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    recentProject.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'
                  }`}>
                    {getStatusLabel(recentProject.status)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {recentProject.name || 'Untitled'}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  Last edit: {formatTimeAgo(recentProject.updated_at || recentProject.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Card */}
      <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-white/50">Revenue</span>
          <button className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/10 rounded-md hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
            Details →
          </button>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{formatCurrency(totalSetupFees + monthlyRevenue)}</p>
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
