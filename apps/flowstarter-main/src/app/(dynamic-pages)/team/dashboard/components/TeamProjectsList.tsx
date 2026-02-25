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

interface TeamProjectsListProps {
  projects: Array<TableType<'projects'>>;
}

function StatusChip({ status }: { status: string | null }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-emerald-100/90 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        Completed
      </Badge>
    );
  }
  if (status === 'generating') {
    return (
      <Badge className="bg-sky-100/90 text-sky-800 border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        Generating
      </Badge>
    );
  }
  if (status === 'draft') {
    return (
      <Badge className="bg-blue-100/90 text-blue-700 border-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 font-medium shadow-sm rounded-lg px-2.5 py-0.5">
        Draft
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-medium rounded-full px-2.5 py-0.5">
      Unknown
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

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-6 text-center">
        <div className="max-w-sm mx-auto">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--purple)]/5 border border-[var(--purple)]/10 mb-3">
            <LayoutDashboard className="h-5 w-5 text-[var(--purple)] opacity-40" />
          </div>
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-gray-100">
            No projects yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Client projects will appear here once created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {projects.map((project) => {
          const isDraft = (project as { is_draft?: boolean }).is_draft === true;
          const status = typeof project.status === 'string' ? project.status : 'draft';

          return (
            <GlassCard key={project.id} className="group relative h-full min-h-[180px] flex flex-col p-4">
              <div className="relative z-10 flex flex-col gap-4 flex-1">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border ${
                    isDraft 
                      ? 'bg-amber-500/10 border-amber-200/30 dark:border-amber-500/20' 
                      : status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-200/30 dark:border-emerald-500/20'
                        : 'bg-[var(--purple)]/10 border-[var(--purple)]/30'
                  }`}>
                    {isDraft ? (
                      <FileText className="h-5 w-5 text-amber-600/70 dark:text-amber-400/70" />
                    ) : status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600/70 dark:text-emerald-400/70" />
                    ) : status === 'generating' ? (
                      <Loader2 className="h-5 w-5 text-sky-600/70 dark:text-sky-400/70 animate-spin" />
                    ) : (
                      <LayoutDashboard className="h-5 w-5 text-[var(--purple)]/70" />
                    )}
                  </div>

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
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setProjectToDelete({ id: project.id, name: project.name || 'Untitled' });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Project
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
                    <span>
                      Updated: <span className="text-gray-600 dark:text-gray-300">{getTimeAgo(project.updated_at || project.created_at)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Owner: <span className="text-gray-600 dark:text-gray-300">{project.user_id?.substring(0, 8)}...</span>
                    </span>
                  </div>
                </div>

                {/* View button for completed projects */}
                {status === 'completed' && (
                  <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-[var(--purple)]"
                      onClick={() => window.open(`/projects/${project.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      View Project
                    </Button>
                  </div>
                )}
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
