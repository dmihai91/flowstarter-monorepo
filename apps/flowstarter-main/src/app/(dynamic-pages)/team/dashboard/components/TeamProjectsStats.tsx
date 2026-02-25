'use client';

import { FolderOpen, FileEdit, CheckCircle2, Clock } from 'lucide-react';
import { ProjectWithOwner } from '@/hooks/useTeamProjects';

interface TeamProjectsStatsProps {
  projects: ProjectWithOwner[];
}

export function TeamProjectsStats({ projects }: TeamProjectsStatsProps) {
  const totalProjects = projects.length;
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const inProgressCount = projects.filter(p => p.status === 'in_progress' || p.status === 'building').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  const stats = [
    {
      icon: FolderOpen,
      label: 'Total Projects',
      value: totalProjects,
    },
    {
      icon: FileEdit,
      label: 'Drafts',
      value: draftCount,
    },
    {
      icon: Clock,
      label: 'In Progress',
      value: inProgressCount,
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completedCount,
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
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-gray-500 dark:text-white/50" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-white/50">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
