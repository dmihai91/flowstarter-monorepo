import type { ProjectConfig } from '@/types/project-config';
import { renderHook, waitFor } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIGeneration } from '../useAIGeneration';

vi.mock('@/hooks/wizard/useProjectSuggestions', () => ({
  useProjectSuggestions: vi.fn(() => ({
    generateSuggestions: vi.fn(),
  })),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

vi.mock('@/store/ai-suggestions-store', () => ({
  useProjectAIStore: {
    getState: vi.fn(() => ({
      clearValidation: vi.fn(),
      setModerationError: vi.fn(),
      setSufficiency: vi.fn(),
    })),
  },
}));

vi.mock('@/store/wizard-store', () => ({
  useWizardStore: vi.fn((selector) => {
    const mockStore = {
      setDetailsPhase: vi.fn(),
      setShowSummary: vi.fn(),
      setHasAIGenerated: vi.fn(),
      setLastGeneratedDescription: vi.fn(),
    };
    return selector(mockStore);
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useProjectSuggestions } from '@/hooks/wizard/useProjectSuggestions';
import { toast } from 'sonner';

describe('useAIGeneration', () => {
  const mockFormik = {
    values: {
      industry: 'technology',
      targetUsers: 'developers',
      name: '',
      description: '',
      USP: '',
      businessGoals: '',
    },
    setFieldValue: vi.fn(),
  } as unknown as FormikProps<{
    industry: string;
    targetUsers: string;
    name: string;
    description: string;
    USP: string;
    businessGoals: string;
  }>;

  const mockProjectConfig: ProjectConfig = {
    name: '',
    description: '',
    USP: '',
    targetUsers: '',
    businessGoals: '',
    designConfig: {
      businessInfo: {
        industry: '',
        targetAudience: '',
        brandValues: '',
        competitors: '',
        additionalNotes: '',
      },
    },
  } as ProjectConfig;

  const mockOnProjectConfigChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationSteps).toEqual([]);
    expect(result.current.currentStep).toBe(null);
  });

  it('should handle empty description error', async () => {
    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    await result.current.handleAIGeneration('');

    expect(toast.error).toHaveBeenCalledWith('basic.description.required');
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle successful AI generation', async () => {
    const mockGenerateSuggestions = vi.fn().mockResolvedValue({
      names: ['Project Alpha', 'Project Beta'],
      description: 'Generated description',
      USP: 'Generated USP',
      targetUsers: 'Generated target users',
      businessGoals: 'Generated business goals',
    });

    (useProjectSuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
      generateSuggestions: mockGenerateSuggestions,
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { isSufficient: true } }),
    });

    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    await result.current.handleAIGeneration('Create a tech startup');

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(mockGenerateSuggestions).toHaveBeenCalled();
    expect(mockFormik.setFieldValue).toHaveBeenCalled();
    expect(mockOnProjectConfigChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle moderation failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 400,
      json: async () => ({ error: 'Moderation failed' }),
    });

    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    await result.current.handleAIGeneration('inappropriate content');

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.currentStep).toBe(null);
    expect(result.current.generationSteps).toEqual([]);
  });

  it('should handle generation failure', async () => {
    const mockGenerateSuggestions = vi.fn().mockResolvedValue(null);

    (useProjectSuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
      generateSuggestions: mockGenerateSuggestions,
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { isSufficient: true } }),
    });

    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    await result.current.handleAIGeneration('Valid description');

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'ai.generationFailed',
      expect.any(Object)
    );
  });

  it('should update bot mood during generation', async () => {
    const mockGenerateSuggestions = vi.fn().mockResolvedValue({
      names: ['Project Name'],
      description: 'Description',
    });

    (useProjectSuggestions as ReturnType<typeof vi.fn>).mockReturnValue({
      generateSuggestions: mockGenerateSuggestions,
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: { isSufficient: true } }),
    });

    const { result } = renderHook(() =>
      useAIGeneration({
        templateId: 'business',
        projectConfig: mockProjectConfig,
        onProjectConfigChange: mockOnProjectConfigChange,
        formik: mockFormik,
      })
    );

    await result.current.handleAIGeneration('Valid description');

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });
});
