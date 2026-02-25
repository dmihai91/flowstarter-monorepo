'use client';

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
  MoreVertical,
  Trash2,
  ExternalLink,
  Clock,
  User,
  Circle,
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
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'text-emerald-500';
    if (status === 'generating') return 'text-blue-500';
    return 'text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Live';
    if (status === 'generating') return 'Building';
    return 'Draft';
  };

  if (projects.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
        <p className="text-gray-500 dark:text-white/50 text-sm">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[1fr_120px_150px_120px_40px] gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
        <div>Project</div>
        <div>Status</div>
        <div>Owner</div>
        <div>Updated</div>
        <div></div>
      </div>

      {/* Project Rows */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-white/10">
        {projects.map((project) => {
          const status = typeof project.status === 'string' ? project.status : 'draft';

          return (
            <div
              key={project.id}
              className="bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid md:grid-cols-[1fr_120px_150px_120px_40px] gap-4 px-4 py-3 items-center">
                {/* Project Name */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {project.name || 'Untitled Project'}
                  </p>
                  {project.description && (
                    <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-0.5">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <Circle className={`w-2 h-2 fill-current ${getStatusColor(status)}`} />
                  <span className="text-sm text-gray-600 dark:text-white/60">{getStatusLabel(status)}</span>
                </div>

                {/* Owner */}
                <div className="text-sm text-gray-600 dark:text-white/60 truncate">
                  {getOwnerDisplay(project)}
                </div>

                {/* Updated */}
                <div className="text-sm text-gray-500 dark:text-white/40">
                  {getTimeAgo(project.updated_at || project.created_at)}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {status === 'completed' && (
                      <DropdownMenuItem onClick={() => window.open(`/projects/${project.id}`, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                        View
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

              {/* Mobile Row */}
              <div className="md:hidden p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {project.name || 'Untitled Project'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-white/40">
                      <span className="flex items-center gap-1">
                        <Circle className={`w-2 h-2 fill-current ${getStatusColor(status)}`} />
                        {getStatusLabel(status)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getOwnerDisplay(project)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(project.updated_at || project.created_at)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {status === 'completed' && (
                        <DropdownMenuItem onClick={() => window.open(`/projects/${project.id}`, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                          View
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
