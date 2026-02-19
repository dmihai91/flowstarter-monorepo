import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWizardNavigation } from '../useWizardNavigation';
import type { ProjectWizardStep } from '@/types/project-config';

// Mock the wizard store
vi.mock('@/store/wizard-store', () => ({
  useWizardStore: vi.fn((selector) => {
    const mockStore = {
      setCurrentStep: vi.fn(),
      showAssistantTransition: false,
    };
    return selector(mockStore);
  }),
}));

import { useWizardStore } from '@/store/wizard-store';

describe('useWizardNavigation', () => {
  const mockSteps: Array<{
    id: ProjectWizardStep;
    title: string;
    description: string;
  }> = [
    { id: 'details', title: 'Details', description: 'Enter details' },
    { id: 'template', title: 'Template', description: 'Choose template' },
    { id: 'design', title: 'Design', description: 'Customize design' },
    { id: 'review', title: 'Review', description: 'Review and confirm' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default state
    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          setCurrentStep: vi.fn(),
          showAssistantTransition: false,
        };
        return selector(mockStore);
      }
    );
    // Reset window.location
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: Partial<Location> }).location = {
      href: 'http://localhost:3000',
    };
    // Mock history.pushState
    window.history.pushState = vi.fn();
  });

  it('should initialize with current step information', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.current).toEqual(mockSteps[0]);
  });

  it('should find correct step index for middle step', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.current).toEqual(mockSteps[2]);
  });

  it('should navigate to a step and update URL', () => {
    const mockSetCurrentStep = vi.fn();

    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          setCurrentStep: mockSetCurrentStep,
          showAssistantTransition: false,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    result.current.navigateToStep('template');

    expect(mockSetCurrentStep).toHaveBeenCalledWith('template');
    expect(window.history.pushState).toHaveBeenCalled();
  });

  it('should determine if step is accessible - before current', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    expect(result.current.isStepAccessible(0, 'details')).toBe(true);
    expect(result.current.isStepAccessible(1, 'template')).toBe(true);
  });

  it('should determine if step is accessible - current', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    expect(result.current.isStepAccessible(2, 'design')).toBe(true);
  });

  it('should determine if step is not accessible - after current', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    expect(result.current.isStepAccessible(3, 'review')).toBe(false);
  });

  it('should make template step accessible during assistant transition', () => {
    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          setCurrentStep: vi.fn(),
          showAssistantTransition: true,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    expect(result.current.isStepAccessible(1, 'template')).toBe(true);
  });

  it('should get step state - completed', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    const state = result.current.getStepState(0, 'details');

    expect(state.isCompleted).toBe(true);
    expect(state.isCurrent).toBe(false);
  });

  it('should get step state - current', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    const state = result.current.getStepState(2, 'design');

    expect(state.isCompleted).toBe(false);
    expect(state.isCurrent).toBe(true);
  });

  it('should get step state - not completed and not current', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'design',
        steps: mockSteps,
      })
    );

    const state = result.current.getStepState(3, 'review');

    expect(state.isCompleted).toBe(false);
    expect(state.isCurrent).toBe(false);
  });

  it('should mark details as completed during assistant transition', () => {
    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          setCurrentStep: vi.fn(),
          showAssistantTransition: true,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    const state = result.current.getStepState(0, 'details');

    expect(state.isCompleted).toBe(false);
    expect(state.isCurrent).toBe(false);
  });

  it('should mark template as current during assistant transition', () => {
    (useWizardStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        const mockStore = {
          setCurrentStep: vi.fn(),
          showAssistantTransition: true,
        };
        return selector(mockStore);
      }
    );

    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    const state = result.current.getStepState(1, 'template');

    expect(state.isCurrent).toBe(true);
  });

  it('should update URL search params when navigating', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'details',
        steps: mockSteps,
      })
    );

    result.current.navigateToStep('design');

    const callArgs = (window.history.pushState as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const urlString = callArgs[2];

    expect(urlString).toContain('step=design');
  });

  it('should handle step not found', () => {
    const { result } = renderHook(() =>
      useWizardNavigation({
        currentStep: 'nonexistent' as ProjectWizardStep,
        steps: mockSteps,
      })
    );

    expect(result.current.currentStepIndex).toBe(-1);
    expect(result.current.current).toBeUndefined();
  });
});
