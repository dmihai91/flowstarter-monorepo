import { useState, useCallback } from 'react';
import type { ProjectPricingData } from '@/hooks/useTeamProjects';

interface ProjectRef {
  id: string;
  name: string;
}

interface ProjectWithPricing {
  id: string;
  name: string | null;
  project_type?: string;
  setup_fee?: number;
  monthly_fee?: number;
  is_paid?: boolean;
}

// Beta pricing feature flag
const BETA_PRICING_ENABLED = process.env.NEXT_PUBLIC_BETA_PRICING === 'true';
const BETA_DISCOUNT = 0.5;

const applyBetaDiscount = (price: number): number => {
  if (!BETA_PRICING_ENABLED) return price;
  return Math.round(price * (1 - BETA_DISCOUNT));
};

const BASE_PRICING: Record<string, { setup_fee: number; monthly_fee: number }> = {
  standard: { setup_fee: 999, monthly_fee: 59 },
  pro: { setup_fee: 1499, monthly_fee: 99 },
  ecommerce: { setup_fee: 1999, monthly_fee: 149 },
  business: { setup_fee: 1999, monthly_fee: 149 },
};

const PRICING_DEFAULTS: Record<string, { setup_fee: number; monthly_fee: number }> = Object.fromEntries(
  Object.entries(BASE_PRICING).map(([key, val]) => [
    key,
    {
      setup_fee: applyBetaDiscount(val.setup_fee),
      monthly_fee: applyBetaDiscount(val.monthly_fee),
    },
  ])
);

export { BETA_PRICING_ENABLED, PRICING_DEFAULTS };

export function useTeamProjectDialogs() {
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRef | null>(null);

  // Rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectRef | null>(null);
  const [newName, setNewName] = useState('');

  // Pricing dialog
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [projectToPrice, setProjectToPrice] = useState<ProjectWithPricing | null>(null);
  const [pricingData, setPricingData] = useState<ProjectPricingData>({
    project_type: 'standard',
    setup_fee: 0,
    monthly_fee: 0,
    is_paid: false,
  });

  const openDeleteDialog = useCallback((project: ProjectRef) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  }, []);

  const openRenameDialog = useCallback((project: ProjectRef) => {
    setProjectToRename(project);
    setNewName(project.name);
    setRenameDialogOpen(true);
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenameDialogOpen(false);
    setProjectToRename(null);
    setNewName('');
  }, []);

  const openPricingDialog = useCallback((project: ProjectWithPricing) => {
    setProjectToPrice(project);
    const projectType = project.project_type || 'standard';
    const defaults = PRICING_DEFAULTS[projectType] || PRICING_DEFAULTS.standard;
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
  }, []);

  const closePricingDialog = useCallback(() => {
    setPricingDialogOpen(false);
    setProjectToPrice(null);
  }, []);

  const handleProjectTypeChange = useCallback((newType: string) => {
    const defaults = PRICING_DEFAULTS[newType] || PRICING_DEFAULTS.standard;
    setPricingData((prev) => ({
      ...prev,
      project_type: newType,
      setup_fee: defaults.setup_fee,
      monthly_fee: defaults.monthly_fee,
    }));
  }, []);

  return {
    // Delete
    deleteDialogOpen,
    setDeleteDialogOpen,
    projectToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    // Rename
    renameDialogOpen,
    setRenameDialogOpen,
    projectToRename,
    newName,
    setNewName,
    openRenameDialog,
    closeRenameDialog,
    // Pricing
    pricingDialogOpen,
    setPricingDialogOpen,
    projectToPrice,
    pricingData,
    setPricingData,
    openPricingDialog,
    closePricingDialog,
    handleProjectTypeChange,
  };
}
