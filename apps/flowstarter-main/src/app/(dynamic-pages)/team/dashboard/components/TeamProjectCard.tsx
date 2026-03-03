'use client';

import { isLive, isBuilding, STATUS_BADGE_CLASS } from './TeamProjectsStats';
import { TeamProjectActionMenu } from './TeamProjectActionMenu';
import { useTranslations } from '@/lib/i18n';

interface TeamProjectCardProject {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  project_type?: string;
  setup_fee?: number;
  monthly_fee?: number;
  is_paid?: boolean;
  owner_email?: string | null;
  owner_name?: string | null;
}

interface TeamProjectCardProps {
  project: TeamProjectCardProject;
  timeAgo: string;
  onOpenInEditor: (projectId: string) => void;
  onRename: (project: { id: string; name: string }) => void;
  onPricing: (project: TeamProjectCardProject) => void;
  onDelete: (project: { id: string; name: string }) => void;
}

function getStatusLabel(status: string, t: (key: string) => string) {
  if (isLive(status)) return t('status.live');
  if (isBuilding(status)) return t('status.building');
  return t('status.draft');
}

function getStatusBadgeClass(status: string) {
  if (isLive(status)) return STATUS_BADGE_CLASS.live;
  if (isBuilding(status)) return STATUS_BADGE_CLASS.building;
  return STATUS_BADGE_CLASS.draft;
}

function getOwnerDisplay(project: TeamProjectCardProject, fallback: string) {
  if (project.owner_name) return project.owner_name;
  if (project.owner_email) return project.owner_email;
  return fallback;
}

export function TeamProjectCard({
  project,
  timeAgo,
  onOpenInEditor,
  onRename,
  onPricing,
  onDelete,
}: TeamProjectCardProps) {
  const { t } = useTranslations();
  const status = typeof project.status === 'string' ? project.status : 'draft';

  return (
    <div
      className="group relative p-5 rounded-2xl bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),1px_1px_0_rgba(0,0,0,0.3)_inset,-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15),-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] hover:border-t-[var(--purple)]/20 hover:border-l-[var(--purple)]/20 transition-all duration-300 cursor-pointer"
      onClick={() =>
        (window.location.href = `/team/dashboard/projects/${project.id}`)
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-lg font-semibold text-[var(--purple)] shrink-0">
          {project.name?.charAt(0)?.toUpperCase() || 'P'}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-1 ${getStatusBadgeClass(status)}`}
          >
            {getStatusLabel(status, t)}
          </span>
          <p className="font-semibold text-gray-900 dark:text-white text-base truncate">
            {project.name || t('team.dashboard.untitledProject')}
          </p>
        </div>
        <TeamProjectActionMenu
          project={project as any}
          onOpenInEditor={onOpenInEditor}
          onRename={onRename}
          onPricing={onPricing}
          onDelete={onDelete}
          stopPropagation
        />
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 dark:text-white/40 line-clamp-2 mb-4">
          {project.description}
        </p>
      )}

      {project.setup_fee !== null &&
        project.setup_fee !== undefined &&
        Number(project.setup_fee) > 0 && (
          <div className="flex items-center gap-3 mb-4 py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
            <span className="text-gray-600 dark:text-white/60">
              &euro;{project.setup_fee} {t('team.dashboard.setup')}
            </span>
            <span className="text-gray-300 dark:text-white/20">&bull;</span>
            <span className="text-gray-600 dark:text-white/60">
              &euro;{project.monthly_fee || 0}{t('team.dashboard.perMonth')}
            </span>
            {project.is_paid && (
              <>
                <span className="text-gray-300 dark:text-white/20">&bull;</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('team.dashboard.paid')}
                </span>
              </>
            )}
          </div>
        )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40 pt-3 border-t border-gray-100 dark:border-white/5">
        <span>{getOwnerDisplay(project, t('team.dashboard.unknownOwner'))}</span>
        <span>{t('team.dashboard.lastEdit', { time: timeAgo })}</span>
      </div>
    </div>
  );
}
