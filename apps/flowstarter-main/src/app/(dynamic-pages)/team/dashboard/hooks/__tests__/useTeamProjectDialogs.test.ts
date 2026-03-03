import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the useTeamProjects import so TypeScript resolves ProjectPricingData
vi.mock('@/hooks/useTeamProjects', () => ({}));

import { useTeamProjectDialogs, PRICING_DEFAULTS } from '../useTeamProjectDialogs';

describe('useTeamProjectDialogs', () => {
  it('starts with all dialogs closed and no projects selected', () => {
    const { result } = renderHook(() => useTeamProjectDialogs());

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.projectToDelete).toBeNull();
    expect(result.current.renameDialogOpen).toBe(false);
    expect(result.current.projectToRename).toBeNull();
    expect(result.current.newName).toBe('');
    expect(result.current.pricingDialogOpen).toBe(false);
    expect(result.current.projectToPrice).toBeNull();
  });

  describe('delete dialog', () => {
    it('openDeleteDialog sets project and opens dialog', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = { id: 'p1', name: 'My Project' };

      act(() => {
        result.current.openDeleteDialog(project);
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.projectToDelete).toEqual(project);
    });

    it('closeDeleteDialog resets state', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openDeleteDialog({ id: 'p1', name: 'Project' });
      });
      expect(result.current.deleteDialogOpen).toBe(true);

      act(() => {
        result.current.closeDeleteDialog();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.projectToDelete).toBeNull();
    });
  });

  describe('rename dialog', () => {
    it('openRenameDialog sets project, name, and opens dialog', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = { id: 'p2', name: 'Old Name' };

      act(() => {
        result.current.openRenameDialog(project);
      });

      expect(result.current.renameDialogOpen).toBe(true);
      expect(result.current.projectToRename).toEqual(project);
      expect(result.current.newName).toBe('Old Name');
    });

    it('closeRenameDialog resets all rename state', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openRenameDialog({ id: 'p2', name: 'Some Name' });
      });

      act(() => {
        result.current.closeRenameDialog();
      });

      expect(result.current.renameDialogOpen).toBe(false);
      expect(result.current.projectToRename).toBeNull();
      expect(result.current.newName).toBe('');
    });

    it('setNewName updates the name', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openRenameDialog({ id: 'p2', name: 'Original' });
      });

      act(() => {
        result.current.setNewName('Updated Name');
      });

      expect(result.current.newName).toBe('Updated Name');
    });
  });

  describe('pricing dialog', () => {
    it('openPricingDialog sets project and pricing data with defaults', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = {
        id: 'p3',
        name: 'Shop',
        project_type: 'ecommerce',
      };

      act(() => {
        result.current.openPricingDialog(project);
      });

      expect(result.current.pricingDialogOpen).toBe(true);
      expect(result.current.projectToPrice).toEqual(project);
      expect(result.current.pricingData.project_type).toBe('ecommerce');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.ecommerce.setup_fee);
      expect(result.current.pricingData.monthly_fee).toBe(PRICING_DEFAULTS.ecommerce.monthly_fee);
      expect(result.current.pricingData.is_paid).toBe(false);
    });

    it('openPricingDialog uses existing fees when project has them', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = {
        id: 'p3',
        name: 'Custom',
        project_type: 'standard',
        setup_fee: 500,
        monthly_fee: 30,
        is_paid: true,
      };

      act(() => {
        result.current.openPricingDialog(project);
      });

      expect(result.current.pricingData.setup_fee).toBe(500);
      expect(result.current.pricingData.monthly_fee).toBe(30);
      expect(result.current.pricingData.is_paid).toBe(true);
    });

    it('openPricingDialog falls back to standard defaults for unknown type', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = {
        id: 'p4',
        name: 'Unknown',
        project_type: 'nonexistent',
      };

      act(() => {
        result.current.openPricingDialog(project);
      });

      expect(result.current.pricingData.project_type).toBe('nonexistent');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.standard.setup_fee);
      expect(result.current.pricingData.monthly_fee).toBe(PRICING_DEFAULTS.standard.monthly_fee);
    });

    it('openPricingDialog defaults to standard when project_type is undefined', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());
      const project = { id: 'p5', name: 'No Type' };

      act(() => {
        result.current.openPricingDialog(project);
      });

      expect(result.current.pricingData.project_type).toBe('standard');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.standard.setup_fee);
    });

    it('closePricingDialog resets dialog state', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openPricingDialog({ id: 'p3', name: 'Shop' });
      });
      expect(result.current.pricingDialogOpen).toBe(true);

      act(() => {
        result.current.closePricingDialog();
      });

      expect(result.current.pricingDialogOpen).toBe(false);
      expect(result.current.projectToPrice).toBeNull();
    });

    it('handleProjectTypeChange updates pricing data with new type defaults', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openPricingDialog({ id: 'p6', name: 'Test', project_type: 'standard' });
      });

      expect(result.current.pricingData.project_type).toBe('standard');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.standard.setup_fee);

      act(() => {
        result.current.handleProjectTypeChange('pro');
      });

      expect(result.current.pricingData.project_type).toBe('pro');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.pro.setup_fee);
      expect(result.current.pricingData.monthly_fee).toBe(PRICING_DEFAULTS.pro.monthly_fee);
    });

    it('handleProjectTypeChange falls back to standard for unknown type', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openPricingDialog({ id: 'p7', name: 'Test' });
      });

      act(() => {
        result.current.handleProjectTypeChange('invalid');
      });

      expect(result.current.pricingData.project_type).toBe('invalid');
      expect(result.current.pricingData.setup_fee).toBe(PRICING_DEFAULTS.standard.setup_fee);
      expect(result.current.pricingData.monthly_fee).toBe(PRICING_DEFAULTS.standard.monthly_fee);
    });

    it('handleProjectTypeChange preserves is_paid', () => {
      const { result } = renderHook(() => useTeamProjectDialogs());

      act(() => {
        result.current.openPricingDialog({
          id: 'p8',
          name: 'Paid',
          is_paid: true,
          project_type: 'standard',
        });
      });

      expect(result.current.pricingData.is_paid).toBe(true);

      act(() => {
        result.current.handleProjectTypeChange('pro');
      });

      // is_paid is preserved because handleProjectTypeChange spreads prev
      expect(result.current.pricingData.is_paid).toBe(true);
    });
  });
});
