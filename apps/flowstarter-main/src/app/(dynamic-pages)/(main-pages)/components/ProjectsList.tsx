'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlassCard } from '@/components/ui/glass-card';
import { useFormatDate } from '@/hooks/useFormatDate';
import { PLATFORM_CONFIG } from '@/lib/const';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Table as TableType } from '@/types';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  MoreVertical,
  Pencil,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProjectHighlight } from './hooks/useProjectHighlight';
import { useProjectDeletion } from './hooks/useProjectDeletion';
import { useProjectCards } from './hooks/useProjectCards';

interface ProjectsListProps {
  projects: Array<TableType<'projects'>>;
  showActions?: boolean;
}

function StatusChip({
  status,
  t,
}: {
  status: string | null;
  t: (key: string) => string;
}) {
  if (status === 'completed') {
    return (
      <Badge className="bg-emerald-100/90 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        {t('projects.status.completed')}
      </Badge>
    );
  }
  if (status === 'generating') {
    return (
      <Badge className="bg-sky-100/90 text-sky-800 border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        {t('projects.status.generating')}
      </Badge>
    );
  }
  if (status === 'draft') {
    return (
      <Badge className="bg-blue-100/90 text-blue-700 border-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        {t('dashboard.projects.inProgress')}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="font-medium rounded-full px-2.5 py-0.5"
    >
      {t('projects.status.unknown')}
    </Badge>
  );
}

function getStatusConfig(status: string) {
  if (status === 'completed') {
    return {
      icon: CheckCircle2,
      bgGradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      borderColor: 'border-emerald-200/30 dark:border-emerald-500/20',
      iconColor: 'text-emerald-600/70 dark:text-emerald-400/70',
    };
  }
  if (status === 'generating') {
    return {
      icon: Loader2,
      bgGradient: 'from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20',
      borderColor: 'border-sky-200/30 dark:border-sky-500/20',
      iconColor: 'text-sky-600/70 dark:text-sky-400/70',
    };
  }
  if (status === 'draft') {
    return {
      icon: FileText,
      bgGradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      borderColor: 'border-amber-200/30 dark:border-amber-500/20',
      iconColor: 'text-amber-600/70 dark:text-amber-400/70',
    };
  }
  return {
    icon: LayoutDashboard,
    bgGradient: 'from-[var(--purple)]/10 to-[var(--purple)]/10 dark:from-[var(--purple)]/20 dark:to-[var(--purple)]/20',
    borderColor: 'border-[var(--purple)]/30 dark:border-[var(--purple)]/20',
    iconColor: 'text-[var(--purple)]/70 dark:text-[var(--purple)]/70',
  };
}

export const ProjectsList = ({
  projects,
  showActions = true,
}: ProjectsListProps) => {
  const { t } = useTranslations();
  const router = useRouter();
  const { formatTimeAgo } = useFormatDate();
  const { highlightProjectId, highlightedRef } = useProjectHighlight([projects]);
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    projectToDelete,
    openDeleteDialog,
    handleDeleteProject,
    isDeleting,
  } = useProjectDeletion();
  const cards = useProjectCards(projects);

  if (cards.length === 0) {
    return (
      <GlassCard noHover className="p-6 text-center">
        <div className="max-w-sm mx-auto">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 mb-3">
            <LayoutDashboard className="h-5 w-5 text-[var(--purple)] opacity-40" />
          </div>
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-gray-100">
            Your website will appear here
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Once we build your site, you'll manage it from here.
          </p>
        </div>
      </GlassCard>
    );
  }

  const hasDrafts = projects.some(
    (p) => (p as unknown as { is_draft?: boolean }).is_draft === true
  );

  return (
    <div className="space-y-6">
      {showActions && hasDrafts && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('draft.inProgressDesc')}
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {t('projects.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('projects.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/dashboard/new" className="w-full sm:w-auto">
              <Button className="flex items-center justify-center gap-2 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto">
                <PlusCircle className="h-4 w-4" />
                {t('projects.new')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div style={{ maxWidth: PLATFORM_CONFIG.PAGE_MAX_WIDTH }}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {cards.map((p) => {
            const isHighlighted = highlightProjectId === p.id;
            const statusConfig = getStatusConfig(p.status);
            const StatusIcon = statusConfig.icon;

            return (
              <GlassCard
                key={p.id}
                ref={isHighlighted ? highlightedRef : null}
                href={p.link}
                as="link"
                className={cn(
                  'group relative h-full min-h-[180px] flex flex-col',
                  isHighlighted &&
                    'ring-2 ring-[var(--purple)]/50 dark:ring-[var(--purple)]/50 animate-pulse'
                )}
              >
                <div className="relative z-10 flex flex-col gap-4 flex-1">
                  {/* Header Row */}
                  <div className="flex items-start gap-3">
                    {p.status === 'draft' ? (
                      <div className="h-[48px] w-[48px] rounded-[8px] overflow-hidden shrink-0 relative flex items-center justify-center backdrop-blur-sm bg-white/20 dark:bg-[rgba(58,58,74,0.2)] border border-white/40 dark:border-white/10">
                        <FileText
                          className="h-5 w-5 text-gray-500 dark:text-gray-400 opacity-60"
                          strokeWidth={1.5}
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg bg-linear-to-br shrink-0 flex items-center justify-center border',
                          statusConfig.bgGradient,
                          statusConfig.borderColor
                        )}
                      >
                        <StatusIcon
                          className={cn(
                            'h-5 w-5',
                            statusConfig.iconColor,
                            p.status === 'generating' && 'animate-spin'
                          )}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white transition-colors break-words mb-1.5">
                          {p.name}
                        </h3>
                        <StatusChip status={p.status} t={t} />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg transition-colors hover:bg-[var(--surface-2)] shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          alignOffset={-8}
                          className="w-52"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(t('projects.renameComingSoon'));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            {t('projects.rename')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog({
                                id: p.id,
                                name: p.name,
                                status: p.status,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('projects.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {t('projects.lastEdit')}:{' '}
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatTimeAgo(p.createdAt ?? null)}
                        </span>
                      </span>
                    </div>
                    {p.templateLabel && p.templateLabel !== 'Custom' ? (
                      <div className="flex items-start gap-1.5">
                        <LayoutDashboard className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          {t('projects.fromTemplate')}: "{p.templateLabel}"
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <LayoutDashboard className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="text-gray-400 dark:text-gray-500">
                          {t('projects.noTemplateSelected')}
                        </span>
                      </div>
                    )}
                  </div>

                  {p.status === 'draft' && (
                    <div className="mt-auto pt-2">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(p.link);
                        }}
                        variant="outline"
                        className="rounded-lg text-xs font-medium h-8 border-gray-200 dark:border-gray-700 transition-all duration-300 px-3 w-auto"
                        style={{
                          backgroundColor: 'var(--surface-2)',
                        }}
                      >
                        {t('dashboard.projects.continueSetup')}
                      </Button>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChangeAction={setDeleteDialogOpen}
        title={t('projects.deleteDialog.title')}
        description={t('projects.deleteDialog.description', {
          name: projectToDelete?.name || '',
        })}
        confirmLabel={
          isDeleting
            ? t('projects.deleteDialog.deleting')
            : t('projects.deleteDialog.delete')
        }
        cancelLabel={t('projects.deleteDialog.cancel')}
        onConfirmAction={handleDeleteProject}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default ProjectsList;
