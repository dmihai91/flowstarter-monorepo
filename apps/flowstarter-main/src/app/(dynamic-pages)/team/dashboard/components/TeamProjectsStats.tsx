'use client';

import { FolderOpen, FileEdit, CheckCircle2, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { ProjectWithOwner } from '@/hooks/useTeamProjects';

interface TeamProjectsStatsProps {
  projects: ProjectWithOwner[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TeamProjectsStats({ projects }: TeamProjectsStatsProps) {
  const totalProjects = projects.length;
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const inProgressCount = projects.filter(p => p.status === 'in_progress' || p.status === 'building').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  // Revenue calculations
  const totalSetupFees = projects.reduce((sum, p) => sum + (p.setup_fee || 0), 0);
  const monthlyRevenue = projects
    .filter(p => p.is_paid)
    .reduce((sum, p) => sum + (p.monthly_fee || 0), 0);

  const stats = [
    {
      icon: FolderOpen,
      label: 'Total Projects',
      value: totalProjects.toString(),
      iconColor: 'text-[var(--purple)]',
      iconBg: 'bg-[var(--purple)]/10',
      iconBorder: 'border-[var(--purple)]/20',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completedCount.toString(),
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
    },
    {
      icon: DollarSign,
      label: 'Setup Fees',
      value: formatCurrency(totalSetupFees),
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      iconBorder: 'border-blue-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      iconBorder: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.iconBg} border ${stat.iconBorder} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 dark:text-white truncate">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-white/50">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
