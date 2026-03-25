'use client';
import { useRouter } from 'next/navigation';

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
  deposit_status?: string | null;
  deposit_amount?: number | null;
  final_status?: string | null;
  final_amount?: number | null;
  subscription_status?: string | null;
  plan_name?: string | null;
}

interface TeamProjectCardProps {
  project: TeamProjectCardProject;
  timeAgo: string;
  onOpenInEditor: (projectId: string) => void;
  onRename: (project: { id: string; name: string }) => void;
  onPricing: (project: TeamProjectCardProject) => void;
  onDelete: (project: { id: string; name: string }) => void;
}

function paymentColor(s: string) {
  if (s === 'paid' || s === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
  if (s === 'invoiced' || s === 'trialing') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400';
  if (s === 'overdue') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400';
  return 'bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-white/30';
}
function paymentDot(s: string) {
  if (s === 'paid' || s === 'active') return 'bg-emerald-500';
  if (s === 'invoiced' || s === 'trialing') return 'bg-blue-500';
  if (s === 'overdue') return 'bg-red-500';
  return 'bg-gray-400';
}
function PaymentPill({ label, status }: { label: string; status: string | null | undefined }) {
  const s = status ?? 'pending';
  return (
    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ' + paymentColor(s)}>
      <span className={'w-1 h-1 rounded-full ' + paymentDot(s)} />
      {label}: {s}
    </span>
  );
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
  const router = useRouter();
  const { t } = useTranslations();
  const status = typeof project.status === 'string' ? project.status : 'draft';

  return (
    <div
      className="group relative cursor-pointer rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 bg-white/55 backdrop-blur-2xl backdrop-saturate-200 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:bg-[rgba(18,12,42,0.55)] dark:backdrop-blur-2xl dark:border-white/[0.08] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:shadow-[0_16px_56px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]"
      onClick={() => router.push(`/team/dashboard/projects/${project.id}`)}
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
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/80 px-3 py-2 text-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.04]">
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

      {/* Payment status row */}
      {(project.deposit_status || project.subscription_status) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.deposit_status && project.deposit_amount && project.deposit_amount > 0 && (
            <PaymentPill label="Deposit" status={project.deposit_status} />
          )}
          {project.final_status && project.final_amount && project.final_amount > 0 && (
            <PaymentPill label="Final" status={project.final_status} />
          )}
          {project.subscription_status && (
            <PaymentPill label={project.plan_name ?? 'Sub'} status={project.subscription_status} />
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/50 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-white/40">
        <span>{getOwnerDisplay(project, t('team.dashboard.unknownOwner'))}</span>
        <span>{t('team.dashboard.lastEdit', { time: timeAgo })}</span>
      </div>
    </div>
  );
}
