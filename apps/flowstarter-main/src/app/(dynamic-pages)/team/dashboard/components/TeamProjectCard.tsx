'use client';

import { isLive, isBuilding, STATUS_BADGE_CLASS } from './TeamProjectsStats';
import { TeamProjectActionMenu } from './TeamProjectActionMenu';
import { useTranslations } from '@/lib/i18n';

interface TeamProjectCardProject {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  project_type?: string | null;
  setup_fee?: number | null;
  monthly_fee?: number | null;
  is_paid?: boolean | null;
  owner_email?: string | null;
  owner_name?: string | null;
  generation_cost_usd?: number | null;
  ai_credits_used?: number | null;
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
      className="group relative cursor-pointer rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_2px_20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.32)]"
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
          project={project}
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
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
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

      {(project.generation_cost_usd != null && project.generation_cost_usd > 0) && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--purple)]/15 bg-[var(--purple)]/8 px-3 py-2 text-sm backdrop-blur-md dark:border-[var(--purple)]/20 dark:bg-[var(--purple)]/12">
          <span className="text-[var(--purple)] dark:text-[var(--purple)] font-medium">
            {project.ai_credits_used || 0} {t('team.dashboard.aiCredits')}
          </span>
          <span className="text-gray-300 dark:text-white/20">&bull;</span>
          <span className="text-gray-500 dark:text-white/50">
            &euro;{(project.generation_cost_usd * 0.92).toFixed(2)} {t('team.dashboard.cost')}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/50 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-white/40">
        <span>{getOwnerDisplay(project, t('team.dashboard.unknownOwner'))}</span>
        <span>{t('team.dashboard.lastEdit', { time: timeAgo })}</span>
      </div>
    </div>
  );
}
