import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useProjects', () => ({
  useDeleteProject: () => ({
    mutateAsync: mockMutateAsync,
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

import { useProjectDeletion } from '../useProjectDeletion';

describe('useProjectDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with dialog closed and no project selected', () => {
    const { result } = renderHook(() => useProjectDeletion());

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.projectToDelete).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it('openDeleteDialog sets project and opens dialog', () => {
    const { result } = renderHook(() => useProjectDeletion());
    const project = { id: 'p1', name: 'My Project', status: 'active' };

    act(() => {
      result.current.openDeleteDialog(project);
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.projectToDelete).toEqual(project);
  });

  it('setDeleteDialogOpen closes dialog', () => {
    const { result } = renderHook(() => useProjectDeletion());

    act(() => {
      result.current.openDeleteDialog({ id: 'p1', name: 'Test', status: 'active' });
    });
    expect(result.current.deleteDialogOpen).toBe(true);

    act(() => {
      result.current.setDeleteDialogOpen(false);
    });
    expect(result.current.deleteDialogOpen).toBe(false);
  });

  it('handleDeleteProject calls mutateAsync and shows success toast', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useProjectDeletion());

    act(() => {
      result.current.openDeleteDialog({ id: 'p1', name: 'Test', status: 'active' });
    });

    await act(async () => {
      await result.current.handleDeleteProject();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith('p1');
    expect(mockToastSuccess).toHaveBeenCalledWith('projects.deleteSuccess');
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.projectToDelete).toBeNull();
  });

  it('handleDeleteProject shows error toast on failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useProjectDeletion());

    act(() => {
      result.current.openDeleteDialog({ id: 'p1', name: 'Test', status: 'active' });
    });

    await act(async () => {
      await result.current.handleDeleteProject();
    });

    expect(mockToastError).toHaveBeenCalledWith('projects.deleteFailed');
  });

  it('handleDeleteProject does nothing when no project selected', async () => {
    const { result } = renderHook(() => useProjectDeletion());

    await act(async () => {
      await result.current.handleDeleteProject();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
