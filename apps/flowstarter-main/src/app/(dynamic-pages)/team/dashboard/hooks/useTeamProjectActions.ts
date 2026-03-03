import { useCallback } from 'react';
import {
  useTeamDeleteProject,
  useTeamRenameProject,
  useTeamUpdateProjectPricing,
} from '@/hooks/useTeamProjects';
import type { ProjectPricingData } from '@/hooks/useTeamProjects';
import { useTranslations } from '@/lib/i18n';
import { toast } from 'sonner';

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export function useTeamProjectActions() {
  const { t } = useTranslations();
  const deleteProjectMutation = useTeamDeleteProject();
  const renameProjectMutation = useTeamRenameProject();
  const updatePricingMutation = useTeamUpdateProjectPricing();

  const handleDeleteProject = useCallback(
    async (projectId: string, onSuccess?: () => void) => {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
        toast.success(t('team.dashboard.toast.deleteSuccess'));
        onSuccess?.();
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error(t('team.dashboard.toast.deleteFailed'));
      }
    },
    [deleteProjectMutation, t]
  );

  const handleRenameProject = useCallback(
    async (projectId: string, newName: string, onSuccess?: () => void) => {
      if (!newName.trim()) return;
      try {
        await renameProjectMutation.mutateAsync({ id: projectId, name: newName.trim() });
        toast.success(t('team.dashboard.toast.renameSuccess'));
        onSuccess?.();
      } catch (error) {
        console.error('Failed to rename project:', error);
        toast.error(t('team.dashboard.toast.renameFailed'));
      }
    },
    [renameProjectMutation, t]
  );

  const handleUpdatePricing = useCallback(
    async (projectId: string, pricingData: ProjectPricingData, onSuccess?: () => void) => {
      try {
        await updatePricingMutation.mutateAsync({ id: projectId, ...pricingData });
        toast.success(t('team.dashboard.toast.pricingSuccess'));
        onSuccess?.();
      } catch (error) {
        console.error('Failed to update pricing:', error);
        toast.error(t('team.dashboard.toast.pricingFailed'));
      }
    },
    [updatePricingMutation, t]
  );

  const openInEditor = useCallback(async (projectId: string) => {
    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error('Handoff failed');
      const data = await res.json();
      window.open(`${EDITOR_URL}?handoff=${data.token}`, '_blank');
    } catch (error) {
      console.error('Failed to open in editor:', error);
      toast.error(t('team.dashboard.toast.editorFailed'));
    }
  }, [t]);

  return {
    handleDeleteProject,
    handleRenameProject,
    handleUpdatePricing,
    openInEditor,
    isDeleting: deleteProjectMutation.isPending,
    isRenaming: renameProjectMutation.isPending,
    isUpdatingPricing: updatePricingMutation.isPending,
  };
}
