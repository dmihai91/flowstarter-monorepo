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
    { icon: FolderOpen, label: 'Total Projects', value: totalProjects.toString() },
    { icon: CheckCircle2, label: 'Completed', value: completedCount.toString() },
    { icon: DollarSign, label: 'Setup Fees', value: formatCurrency(totalSetupFees) },
    { icon: TrendingUp, label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-[var(--purple)]/70" />
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
