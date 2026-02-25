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
import { useTeamDeleteProject } from '@/hooks/useTeamProjects';
import type { Table as TableType } from '@/types';
import {
  CalendarClock,
  LayoutDashboard,
  MoreVertical,
  Trash2,
  ExternalLink,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
      <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10 font-medium rounded-md px-2 py-0.5 text-xs">
        Live
      </Badge>
    );
  }
  if (status === 'generating') {
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10 font-medium rounded-md px-2 py-0.5 text-xs">
        Building
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-white/50 dark:border-white/5 font-medium rounded-md px-2 py-0.5 text-xs">
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

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] p-8 text-center">
        <LayoutDashboard className="h-8 w-8 mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <h3 className="text-sm font-medium text-gray-600 dark:text-white/60 mb-1">No projects yet</h3>
        <p className="text-xs text-gray-400 dark:text-white/40">Client projects will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const status = typeof project.status === 'string' ? project.status : 'draft';

          return (
            <div
              key={project.id}
              className="group p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 border border-gray-200/50 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-base font-bold text-gray-400 dark:text-white/40">
                      {(project.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {project.name || 'Untitled Project'}
                    </h3>
                    <StatusChip status={status} />
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

              {/* Description */}
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-2 mb-3">
                  {project.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex flex-col gap-1 text-xs text-gray-400 dark:text-white/30 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="h-3 w-3" />
                  <span>{getTimeAgo(project.updated_at || project.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span className="truncate">{getOwnerDisplay(project)}</span>
                </div>
              </div>
            </div>
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
