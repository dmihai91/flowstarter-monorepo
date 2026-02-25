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
import { useTeamDeleteProject } from '@/hooks/useTeamProjects';
import type { Table as TableType } from '@/types';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  MoreVertical,
  Trash2,
  ExternalLink,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectWithOwner extends TableType<'projects'> {
  owner_email?: string | null;
  owner_name?: string | null;
}

interface TeamProjectsListProps {
  projects: Array<ProjectWithOwner>;
}

function StatusChip({ status }: { status: string | null }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-emerald-100/90 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        Live
      </Badge>
    );
  }
  if (status === 'generating') {
    return (
      <Badge className="bg-sky-100/90 text-sky-800 border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        Building
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100/90 text-amber-700 border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
      Draft
    </Badge>
  );
}

export function TeamProjectsList({ projects }: TeamProjectsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const deleteProjectMutation = useTeamDeleteProject();

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      toast.success('Project deleted successfully');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString();
  };

  const getOwnerDisplay = (project: ProjectWithOwner) => {
    if (project.owner_name) return project.owner_name;
    if (project.owner_email) return project.owner_email;
    return project.user_id?.substring(0, 12) + '...';
  };

  // Get status icon config (same as client dashboard)
  const getStatusConfig = (status: string) => {
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
    return {
      icon: FileText,
      bgGradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      borderColor: 'border-amber-200/30 dark:border-amber-500/20',
      iconColor: 'text-amber-600/70 dark:text-amber-400/70',
    };
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.03] p-8 text-center shadow-sm">
        <div className="max-w-sm mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-4">
            <LayoutDashboard className="h-6 w-6 text-gray-400 dark:text-white/40" />
          </div>
          <h3 className="text-base font-semibold mb-1 text-gray-900 dark:text-gray-100">
            No projects yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Client projects will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {projects.map((project) => {
          const status = typeof project.status === 'string' ? project.status : 'draft';
          const statusConfig = getStatusConfig(status);
          const StatusIcon = statusConfig.icon;

          return (
            <GlassCard
              key={project.id}
              className="group relative h-full min-h-[180px] flex flex-col"
            >
              <div className="relative z-10 flex flex-col gap-4 flex-1">
                {/* Header Row */}
                <div className="flex items-start gap-3">
                  {/* Project Icon */}
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
                        status === 'generating' && 'animate-spin'
                      )}
                    />
                  </div>

                  {/* Title and Menu */}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words mb-1.5">
                        {project.name || 'Untitled Project'}
                      </h3>
                      <StatusChip status={status} />
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg transition-colors hover:bg-[var(--surface-2)] shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {status === 'completed' && (
                          <DropdownMenuItem onClick={() => window.open(`/projects/${project.id}`, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                            View Project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setProjectToDelete({ id: project.id, name: project.name || 'Untitled' });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Details */}
                <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    <span>Updated: {getTimeAgo(project.updated_at || project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{getOwnerDisplay(project)}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChangeAction={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirmAction={handleDeleteProject}
        confirmVariant="destructive"
      />
    </div>
  );
}
