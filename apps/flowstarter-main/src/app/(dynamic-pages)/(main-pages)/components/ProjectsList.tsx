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
import { useDeleteProject } from '@/hooks/useProjects';
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
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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

export const ProjectsList = ({
  projects,
  showActions = true,
}: ProjectsListProps) => {
  const { t } = useTranslations();
  const router = useRouter();
  const [highlightProjectId, setHighlightProjectId] = useState<string | null>(
    null
  );
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);
  const deleteProjectMutation = useDeleteProject();

  // Check for newly created project to highlight
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newProjectId = window.sessionStorage.getItem('fs_new_project_id');
      if (newProjectId) {
        setHighlightProjectId(newProjectId);
        // Scroll to the highlighted project after a brief delay
        setTimeout(() => {
          highlightedRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
        // Remove highlight after animation
        setTimeout(() => {
          setHighlightProjectId(null);
          window.sessionStorage.removeItem('fs_new_project_id');
        }, 3000);
      }
    }
  }, [projects]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      // All projects (including drafts) use the same delete endpoint now
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      toast.success(t('projects.deleteSuccess'));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('projects.deleteFailed'));
    }
  };

  const getTemplateLabel = (raw: unknown): string => {
    try {
      // Handle string template IDs
      if (typeof raw === 'string') {
        switch (raw) {
          case 'personal-brand':
            return 'Personal Brand';
          case 'course-launch':
            return 'Course Launch';
          case 'local-business':
            return 'Local Business';
          case 'product-launch':
            return 'Product Launch';
          case 'mini-ecommerce':
            return 'Mini E-commerce';
          default:
            return raw.trim() || 'Custom';
        }
      }

      // Handle object templates with various structures
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;

        // Try to get name from various possible fields
        if ('name' in obj && typeof obj.name === 'string' && obj.name.trim()) {
          return obj.name.trim();
        }

        // Try id field as fallback
        if ('id' in obj && typeof obj.id === 'string' && obj.id.trim()) {
          // Convert kebab-case to Title Case
          return obj.id
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
    } catch (error) {
      // Ignore parsing errors
      console.debug('Error parsing template label:', error);
    }
    return 'Custom';
  };

  const cards = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      description: string;
      templateLabel: string;
      createdAt?: string | null;
      generatedAt?: string | null;
      status: string;
      link: string;
      meta?: string[];
      isDraft?: boolean;
    }> = [];

    // All projects (including drafts) come from the projects array
    for (const p of projects) {
      // Check if this is a draft project
      const isDraft =
        (p as unknown as { is_draft?: boolean }).is_draft === true;

      // Ensure name is always a string
      const name =
        typeof p.name === 'string'
          ? p.name
          : t('dashboard.projects.draftPlaceholderName');

      // Ensure description is always a string
      const description =
        typeof p.description === 'string' ? p.description : '';

      // For drafts, link to the wizard with the draft ID
      const link = isDraft ? `/wizard/project/${p.id}` : `/projects/${p.id}`;

      result.push({
        id: p.id,
        name,
        description,
        templateLabel: getTemplateLabel(
          (p as unknown as { template_id?: unknown }).template_id
        ),
        createdAt: p.updated_at || p.created_at,
        generatedAt: p.generated_at || null,
        status: typeof p.status === 'string' ? p.status : 'draft',
        link,
        isDraft,
      });
    }
    return result;
  }, [projects, t]);

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-6 text-center transition-all duration-250 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-[rgba(124,58,237,0.12)]">
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
      </div>
    );
  }

  // Check if there are any drafts in the projects list
  const hasDrafts = projects.some(
    (p) => (p as unknown as { is_draft?: boolean }).is_draft === true
  );

  return (
    <div className="space-y-6">
      {/* Show info notice if there are drafts */}
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

            // Calculate time ago
            const getTimeAgo = (date: string | null) => {
              if (!date) return '';
              const now = new Date();
              const then = new Date(date);
              const diffInHours = Math.floor(
                (now.getTime() - then.getTime()) / (1000 * 60 * 60)
              );

              if (diffInHours < 1) return t('projects.time.justNow');
              if (diffInHours < 24) {
                return `${diffInHours} ${
                  diffInHours === 1
                    ? t('projects.time.hour')
                    : t('projects.time.hours')
                } ${t('projects.time.ago')}`;
              }
              const diffInDays = Math.floor(diffInHours / 24);
              if (diffInDays < 7) {
                return `${diffInDays} ${
                  diffInDays === 1
                    ? t('projects.time.day')
                    : t('projects.time.days')
                } ${t('projects.time.ago')}`;
              }
              return then.toLocaleDateString();
            };

            // Determine icon and colors based on status
            const getStatusIcon = () => {
              if (p.status === 'completed') {
                return {
                  icon: CheckCircle2,
                  bgGradient:
                    'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
                  borderColor:
                    'border-emerald-200/30 dark:border-emerald-500/20',
                  iconColor: 'text-emerald-600/70 dark:text-emerald-400/70',
                };
              }
              if (p.status === 'generating') {
                return {
                  icon: Loader2,
                  bgGradient:
                    'from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20',
                  borderColor: 'border-sky-200/30 dark:border-sky-500/20',
                  iconColor: 'text-sky-600/70 dark:text-sky-400/70',
                };
              }
              if (p.status === 'draft') {
                return {
                  icon: FileText,
                  bgGradient:
                    'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
                  borderColor: 'border-amber-200/30 dark:border-amber-500/20',
                  iconColor: 'text-amber-600/70 dark:text-amber-400/70',
                };
              }
              return {
                icon: LayoutDashboard,
                bgGradient:
                  'from-[var(--purple)]/10 to-[var(--purple)]/10 dark:from-[var(--purple)]/20 dark:to-[var(--purple)]/20',
                borderColor: 'border-[var(--purple)]/30 dark:border-[var(--purple)]/20',
                iconColor: 'text-[var(--purple)]/70 dark:text-[var(--purple)]/70',
              };
            };

            const statusConfig = getStatusIcon();
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
                  {/* Header Row: Icon, Title, Status Badge, Menu */}
                  <div className="flex items-start gap-3">
                    {/* Project Icon */}
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

                    {/* Title and Menu */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white transition-colors break-words mb-1.5">
                          {p.name}
                        </h3>
                        <StatusChip status={p.status} t={t} />
                      </div>

                      {/* Actions Menu */}
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
                              // TODO: Implement rename functionality
                              toast.info(t('projects.renameComingSoon'));
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            {t('projects.rename') || 'Rename'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete({
                                id: p.id,
                                name: p.name,
                                status: p.status,
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('projects.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {t('projects.lastEdit')}:{' '}
                        <span className="text-gray-600 dark:text-gray-300">
                          {getTimeAgo(p.createdAt ?? null)}
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

                  {/* Continue Setup Button for Draft Projects */}
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
          deleteProjectMutation.isPending
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
