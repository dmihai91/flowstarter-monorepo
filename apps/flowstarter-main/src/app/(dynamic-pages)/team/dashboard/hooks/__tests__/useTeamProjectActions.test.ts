import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockDeleteMutateAsync = vi.fn();
const mockRenameMutateAsync = vi.fn();
const mockPricingMutateAsync = vi.fn();

vi.mock('@/hooks/useTeamProjects', () => ({
  useTeamDeleteProject: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useTeamRenameProject: () => ({
    mutateAsync: mockRenameMutateAsync,
    isPending: false,
  }),
  useTeamUpdateProjectPricing: () => ({
    mutateAsync: mockPricingMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

import { useTeamProjectActions } from '../useTeamProjectActions';

describe('useTeamProjectActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleDeleteProject', () => {
    it('calls mutateAsync and shows success toast', async () => {
      mockDeleteMutateAsync.mockResolvedValueOnce(undefined);
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleDeleteProject('p1', onSuccess);
      });

      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('p1');
      expect(mockToastSuccess).toHaveBeenCalledWith('team.dashboard.toast.deleteSuccess');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
      mockDeleteMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleDeleteProject('p1');
      });

      expect(mockToastError).toHaveBeenCalledWith('team.dashboard.toast.deleteFailed');
    });
  });

  describe('handleRenameProject', () => {
    it('calls mutateAsync with trimmed name and shows success', async () => {
      mockRenameMutateAsync.mockResolvedValueOnce(undefined);
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleRenameProject('p1', '  New Name  ', onSuccess);
      });

      expect(mockRenameMutateAsync).toHaveBeenCalledWith({ id: 'p1', name: 'New Name' });
      expect(mockToastSuccess).toHaveBeenCalledWith('team.dashboard.toast.renameSuccess');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('does nothing for empty name', async () => {
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleRenameProject('p1', '   ');
      });

      expect(mockRenameMutateAsync).not.toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
      mockRenameMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleRenameProject('p1', 'Name');
      });

      expect(mockToastError).toHaveBeenCalledWith('team.dashboard.toast.renameFailed');
    });
  });

  describe('handleUpdatePricing', () => {
    it('calls mutateAsync with pricing data and shows success', async () => {
      mockPricingMutateAsync.mockResolvedValueOnce(undefined);
      const onSuccess = vi.fn();
      const pricingData = { setup_fee: 500, monthly_fee: 30, is_paid: true, project_type: 'pro' };
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleUpdatePricing('p1', pricingData as any, onSuccess);
      });

      expect(mockPricingMutateAsync).toHaveBeenCalledWith({ id: 'p1', ...pricingData });
      expect(mockToastSuccess).toHaveBeenCalledWith('team.dashboard.toast.pricingSuccess');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
      mockPricingMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.handleUpdatePricing('p1', {} as any);
      });

      expect(mockToastError).toHaveBeenCalledWith('team.dashboard.toast.pricingFailed');
    });
  });

  describe('openInEditor', () => {
    it('calls fetch and opens editor URL', async () => {
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, projectId: 'p1', token: 'tok', editorUrl: 'https://editor.example.com' }),
      });

      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.openInEditor('p1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/editor/handoff', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ projectId: 'p1' }),
      }));
      expect(mockOpen).toHaveBeenCalledWith('https://editor.example.com', '_blank');

      vi.unstubAllGlobals();
    });

    it('shows error toast on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => useTeamProjectActions());

      await act(async () => {
        await result.current.openInEditor('p1');
      });

      expect(mockToastError).toHaveBeenCalledWith('team.dashboard.toast.editorFailed');
    });
  });
});
