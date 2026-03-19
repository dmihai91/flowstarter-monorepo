import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock useLocalStorage before importing the hook
const mockSetViewMode = vi.fn();
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, initial: string) => [initial, mockSetViewMode, vi.fn()]),
}));

import { useTeamProjectsView } from '../useTeamProjectsView';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const mockedUseLocalStorage = vi.mocked(useLocalStorage);
type ViewMode = 'grid' | 'list';

describe('useTeamProjectsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseLocalStorage.mockImplementation(
      (_key: string, initial: ViewMode) => [initial, mockSetViewMode, vi.fn()]
    );
  });

  it('defaults to grid view mode', () => {
    const { result } = renderHook(() => useTeamProjectsView());
    expect(result.current.viewMode).toBe('grid');
  });

  it('calls useLocalStorage with the correct key and default', () => {
    renderHook(() => useTeamProjectsView());
    expect(mockedUseLocalStorage).toHaveBeenCalledWith('team-projects-view', 'grid');
  });

  it('exposes setViewMode from useLocalStorage', () => {
    const { result } = renderHook(() => useTeamProjectsView());
    expect(result.current.setViewMode).toBe(mockSetViewMode);
  });

  it('returns list when localStorage has list value', () => {
    mockedUseLocalStorage.mockImplementation(
      () => ['list', mockSetViewMode, vi.fn()]
    );
    const { result } = renderHook(() => useTeamProjectsView());
    expect(result.current.viewMode).toBe('list');
  });
});
