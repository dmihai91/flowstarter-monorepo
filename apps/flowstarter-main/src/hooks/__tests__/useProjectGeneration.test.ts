/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assistantApi from '@/lib/assistant-api';
import * as industries from '@/lib/industries';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { useProjectGeneration } from '../useProjectGeneration';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/assistant-api', () => ({
  moderateContent: vi.fn(),
  evaluateDescription: vi.fn(),
  generateProjectDetails: vi.fn(),
}));

vi.mock('@/lib/industries', () => ({
  detectIndustryFromDescription: vi.fn(),
  normalizeIndustryId: vi.fn(),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/wizard-store', () => ({
  useWizardStore: (
    selector: (state: {
      setSkipLoadingScreen: () => void;
      setPrefillData: () => void;
      setPrefillImages: () => void;
    }) => unknown
  ) => {
    const mockState = {
      setSkipLoadingScreen: vi.fn(),
      setPrefillData: vi.fn(),
      setPrefillImages: vi.fn(),
    };
    return selector(mockState);
  },
}));

describe('useProjectGeneration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
    (assistantApi.moderateContent as Mock).mockResolvedValue(undefined);
    (assistantApi.evaluateDescription as Mock).mockResolvedValue({
      isSufficient: true,
      industry: 'technology',
    });
    (assistantApi.generateProjectDetails as Mock).mockResolvedValue({
      names: ['Test Project'],
      description: 'Test description',
      targetUsers: 'Test users',
      businessGoals: 'Test goals',
      USP: 'Test USP',
      industry: 'technology',
    });
    (industries.normalizeIndustryId as Mock).mockReturnValue('technology');
    (industries.detectIndustryFromDescription as Mock).mockReturnValue(
      'technology'
    );
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProjectGeneration());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.moderationError).toBeNull();
    expect(result.current.streamingText).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.generationSteps).toEqual([]);
    expect(result.current.currentStep).toBeNull();
  });

  it('should handle successful generation flow', async () => {
    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test business description', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(assistantApi.moderateContent).toHaveBeenCalledWith(
      'Test business description'
    );
    expect(assistantApi.evaluateDescription).toHaveBeenCalledWith(
      'Test business description'
    );
    expect(assistantApi.generateProjectDetails).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard/new?mode=ai-generated');
  });

  it('should not proceed with empty input', async () => {
    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('', []);

    expect(assistantApi.moderateContent).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle moderation errors', async () => {
    const moderationError = {
      error: 'moderation_failed',
      message: 'Content not allowed',
      details: ['Inappropriate content'],
      code: 'MODERATION_FAILED',
    };

    (assistantApi.moderateContent as Mock).mockRejectedValue(moderationError);

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Inappropriate content', []);

    await waitFor(() => {
      expect(result.current.moderationError).toBeTruthy();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(assistantApi.evaluateDescription).not.toHaveBeenCalled();
  });

  it('should handle moderation error without structured error object', async () => {
    (assistantApi.moderateContent as Mock).mockRejectedValue(
      new Error('Moderation failed')
    );

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test content', []);

    await waitFor(() => {
      expect(result.current.moderationError).toBeTruthy();
    });

    expect(result.current.moderationError?.error).toBe('moderation_failed');
  });

  it('should detect industry from evaluation result', async () => {
    (assistantApi.evaluateDescription as Mock).mockResolvedValue({
      isSufficient: true,
      industry: 'healthcare',
    });
    (industries.normalizeIndustryId as Mock).mockReturnValue('healthcare');

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Healthcare business', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(industries.normalizeIndustryId).toHaveBeenCalledWith('healthcare');
  });

  it('should fallback to description-based industry detection', async () => {
    (assistantApi.evaluateDescription as Mock).mockResolvedValue({
      isSufficient: true,
      industry: undefined,
    });
    (industries.normalizeIndustryId as Mock).mockReturnValue('other');
    (industries.detectIndustryFromDescription as Mock).mockReturnValue(
      'retail'
    );

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Retail business', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(industries.detectIndustryFromDescription).toHaveBeenCalledWith(
      'Retail business'
    );
  });

  it('should update streaming text when description is generated', async () => {
    (assistantApi.generateProjectDetails as Mock).mockResolvedValue({
      names: ['Test Project'],
      description: 'Generated description',
      targetUsers: 'Target users',
      businessGoals: 'Business goals',
      USP: 'Unique value',
      industry: 'technology',
    });

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test input', []);

    await waitFor(() => {
      expect(result.current.streamingText).toBe('Generated description');
    });
  });

  it('should handle generation errors', async () => {
    (assistantApi.generateProjectDetails as Mock).mockRejectedValue(
      new Error('Generation failed')
    );

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test input', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle custom generation workflow', async () => {
    const customGenerate = vi.fn().mockResolvedValue(undefined);
    const customSteps = [
      { id: 'custom1', label: 'Custom Step 1', status: 'pending' as const },
      { id: 'custom2', label: 'Custom Step 2', status: 'pending' as const },
    ];

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration(
      'Test input',
      [],
      customSteps,
      customGenerate
    );

    await waitFor(() => {
      expect(customGenerate).toHaveBeenCalled();
    });

    expect(assistantApi.moderateContent).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle custom generation errors', async () => {
    const customGenerate = vi.fn().mockRejectedValue(new Error('Custom error'));

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration(
      'Test input',
      [],
      undefined,
      customGenerate
    );

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle uploaded images', async () => {
    const uploadedImages = [
      { url: 'https://example.com/image1.jpg', name: 'image1.jpg' },
      { url: 'https://example.com/image2.jpg', name: 'image2.jpg' },
    ];

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test input', uploadedImages);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('should update generation steps correctly', async () => {
    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test input', []);

    await waitFor(() => {
      expect(result.current.generationSteps.length).toBeGreaterThan(0);
    });

    // Check that steps were created
    const steps = result.current.generationSteps;
    expect(steps.some((s) => s.id === 'moderation')).toBe(true);
    expect(steps.some((s) => s.id === 'analysis')).toBe(true);
    expect(steps.some((s) => s.id === 'generation')).toBe(true);
    expect(steps.some((s) => s.id === 'finalization')).toBe(true);
  });

  it('should handle insufficient description evaluation', async () => {
    (assistantApi.evaluateDescription as Mock).mockResolvedValue({
      isSufficient: false,
      missingInfo: ['More details needed'],
      industry: 'technology',
    });

    const { result } = renderHook(() => useProjectGeneration());
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await result.current.handleGeneration('Vague business idea', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith('AI Feedback:', [
      'More details needed',
    ]);
    consoleSpy.mockRestore();
  });

  it('should normalize industry from generated result', async () => {
    (assistantApi.generateProjectDetails as Mock).mockResolvedValue({
      names: ['Test Project'],
      description: 'Test description',
      targetUsers: 'Test users',
      businessGoals: 'Test goals',
      USP: 'Test USP',
      industry: 'e-commerce',
    });
    (industries.normalizeIndustryId as Mock)
      .mockReturnValueOnce('other')
      .mockReturnValueOnce('ecommerce');

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('E-commerce business', []);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(industries.normalizeIndustryId).toHaveBeenCalledWith('e-commerce');
  });

  it('should set moderation error using setModerationError', () => {
    const { result } = renderHook(() => useProjectGeneration());

    const error = {
      error: 'test_error',
      message: 'Test error message',
      details: ['detail1'],
      code: 'TEST_CODE',
    };

    act(() => {
      result.current.setModerationError(error);
    });

    expect(result.current.moderationError).toEqual(error);
  });

  it('should handle industry detection when industry is not other', async () => {
    (assistantApi.evaluateDescription as Mock).mockResolvedValue({
      isSufficient: true,
      industry: 'technology',
    });
    (industries.normalizeIndustryId as Mock).mockReturnValue('technology');

    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Tech startup', []);

    await waitFor(() => {
      const completedAnalysisStep = result.current.generationSteps.find(
        (s) => s.id === 'analysis' && s.status === 'completed'
      );
      expect(completedAnalysisStep).toBeTruthy();
    });
  });

  it('should pass updateStep to custom generation handler', async () => {
    const customGenerate = vi.fn();
    const { result } = renderHook(() => useProjectGeneration());

    await result.current.handleGeneration('Test input', [], [], customGenerate);

    await waitFor(() => {
      expect(customGenerate).toHaveBeenCalled();
    });

    const callArgs = customGenerate.mock.calls[0];
    expect(typeof callArgs[2]).toBe('function'); // updateStep function
  });
});
