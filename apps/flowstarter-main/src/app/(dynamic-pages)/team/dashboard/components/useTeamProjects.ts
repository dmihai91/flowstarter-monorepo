'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TableType } from '@/lib/database.types';

interface ProjectWithOwner extends TableType<'projects'> {
  owner_email?: string;
}

const BETA_PRICING_ENABLED = process.env.NEXT_PUBLIC_BETA_PRICING === 'true';
const BETA_DISCOUNT = 0.5;

const applyBetaDiscount = (price: number): number => {
  return Math.round(price * (1 - BETA_DISCOUNT));
};

/**
 * Hook for team project list state management.
 * Single responsibility: project selection, filtering, dialogs, actions.
 */
export function useTeamProjects(projects: ProjectWithOwner[]) {
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'team-projects-view',
    'grid'
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState('');
  const deleteProjectMutation = useTeamDeleteProject();
  const renameProjectMutation = useTeamRenameProject();
  const { formatTimeAgo, formatDate } = useFormatDate();

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

  const handleRenameProject = async () => {
    if (!projectToRename || !newName.trim()) return;

    try {
      await renameProjectMutation.mutateAsync({
        id: projectToRename.id,
        name: newName.trim(),
      });
      toast.success('Project renamed successfully');
      setRenameDialogOpen(false);
      setProjectToRename(null);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename project:', error);
      toast.error('Failed to rename project');
    }
  };

  const openRenameDialog = (project: { id: string; name: string }) => {
    setProjectToRename(project);
    setNewName(project.name);
    setRenameDialogOpen(true);
  };

  // Pricing dialog state
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [projectToPricep, setProjectToPrice] =
    useState<ProjectWithOwner | null>(null);
  const [pricingData, setPricingData] = useState<ProjectPricingData>({
    project_type: 'standard',
    setup_fee: 0,
    monthly_fee: 0,
    is_paid: false,
  });
  const updatePricingMutation = useTeamUpdateProjectPricing();

  // Default pricing by project type (in EUR)
  // Base prices (after founding rate period)
  // Founding rate = ~40% off: Standard €599/€39, Pro €899/€59
  const BASE_PRICING: Record<
    string,
    { setup_fee: number; monthly_fee: number }
  > = {
    standard: { setup_fee: 999, monthly_fee: 59 },
    pro: { setup_fee: 1499, monthly_fee: 99 },
    ecommerce: { setup_fee: 1999, monthly_fee: 149 },
    business: { setup_fee: 1999, monthly_fee: 149 }, // alias for ecommerce
  };

  // Apply beta discount if enabled
  const PRICING_DEFAULTS: Record<
    string,
    { setup_fee: number; monthly_fee: number }
  > = Object.fromEntries(
    Object.entries(BASE_PRICING).map(([key, val]) => [
      key,
      {
        setup_fee: applyBetaDiscount(val.setup_fee),
        monthly_fee: applyBetaDiscount(val.monthly_fee),
      },
    ])
  );

  const openPricingDialog = (project: ProjectWithOwner) => {
    setProjectToPrice(project);
    const projectType = project.project_type || 'standard';
    const defaults = PRICING_DEFAULTS[projectType] || PRICING_DEFAULTS.standard;
    // Use stored values only if > 0, otherwise use defaults
    setPricingData({
      project_type: projectType,
      setup_fee:
        project.setup_fee && project.setup_fee > 0
          ? project.setup_fee
          : defaults.setup_fee,
      monthly_fee:
        project.monthly_fee && project.monthly_fee > 0
          ? project.monthly_fee
          : defaults.monthly_fee,
      is_paid: project.is_paid || false,
    });
    setPricingDialogOpen(true);
  };

  const handleProjectTypeChange = (newType: string) => {
    const defaults = PRICING_DEFAULTS[newType] || PRICING_DEFAULTS.standard;
    setPricingData({
      ...pricingData,
      project_type: newType,
      setup_fee: defaults.setup_fee,
      monthly_fee: defaults.monthly_fee,
    });
  };

  const handleUpdatePricing = async () => {
    if (!projectToPricep) return;

    try {
      await updatePricingMutation.mutateAsync({
        id: projectToPricep.id,
        ...pricingData,
      });
      toast.success('Pricing updated successfully');
      setPricingDialogOpen(false);
      setProjectToPrice(null);
    } catch (error) {
      console.error('Failed to update pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const getTimeAgo = (date: string | null) => formatTimeAgo(date);

  const getOwnerDisplay = (project: ProjectWithOwner) => {
    if (project.owner_name) return project.owner_name;
    if (project.owner_email) return project.owner_email;
    return 'Unknown';
  };

  const { t } = useTranslations();

  const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

  const openInEditor = async (projectId: string) => {
    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error('Handoff failed');
      const data = await res.json();
      window.open(`${editorUrl}?handoff=${data.token}`, '_blank');
    } catch (error) {
      console.error('Failed to open in editor:', error);
      toast.error('Failed to open project in editor');
    }
  };

  const getStatusColor = (status: string) => {
    if (isLive(status)) return 'bg-emerald-500';
    if (isBuilding(status)) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    if (isLive(status)) return t('status.live');
    if (isBuilding(status)) return t('status.building');
    return t('status.draft');
  };

  const getStatusBadgeClass = (status: string) => {
    if (isLive(status)) return STATUS_BADGE_CLASS.live;
    if (isBuilding(status)) return STATUS_BADGE_CLASS.building;
    return STATUS_BADGE_CLASS.draft;
  };


  return {
    filteredProjects, viewMode, setViewMode,
    sortBy, setSortBy, filterStatus, setFilterStatus,
    selectedProjects, setSelectedProjects, toggleSelectAll, toggleSelectProject,
    editingName, setEditingName, editedName, setEditedName,
    savingName, setSavingName,
    pricingProject, setPricingProject,
    pricingData, setPricingData, savingPricing, setSavingPricing,
    handleRename, handleSaveName,
    handleSavePricing,
    handleDeleteSelected,
    getStatusBadgeClass,
    BETA_PRICING_ENABLED, applyBetaDiscount,
    router,
  };
}

export type { ProjectWithOwner };
