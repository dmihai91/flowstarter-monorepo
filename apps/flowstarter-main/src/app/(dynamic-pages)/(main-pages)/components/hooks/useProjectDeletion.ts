import { useState, useCallback } from 'react';
import { useDeleteProject } from '@/hooks/useProjects';
import { useTranslations } from '@/lib/i18n';
import { toast } from 'sonner';

interface ProjectToDelete {
  id: string;
  name: string;
  status: string;
}

export function useProjectDeletion() {
  const { t } = useTranslations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectToDelete | null>(null);
  const deleteProjectMutation = useDeleteProject();

  const openDeleteDialog = useCallback((project: ProjectToDelete) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      toast.success(t('projects.deleteSuccess'));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('projects.deleteFailed'));
    }
  }, [projectToDelete, deleteProjectMutation, t]);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    projectToDelete,
    openDeleteDialog,
    handleDeleteProject,
    isDeleting: deleteProjectMutation.isPending,
  };
}
