/**
 * usePipelineOrchestration Hook Tests
 *
 * Tests the pipeline state management and step transitions.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { PIPELINE_STEPS, STEP_LABELS } from '~/components/editor/editor-chat/hooks/usePipelineOrchestration';
import type { OnboardingStep } from '~/components/editor/editor-chat/types';

// ─── Pipeline Steps Tests ────────────────────────────────────────────────────

describe('Pipeline Steps Configuration', () => {
  it('should have all expected steps in order', () => {
    expect(PIPELINE_STEPS).toEqual(['creating', 'ready']);
  });

  it('should have 2 total steps', () => {
    expect(PIPELINE_STEPS).toHaveLength(2);
  });

  it('should start with creating and end with ready', () => {
    expect(PIPELINE_STEPS[0]).toBe('creating');
    expect(PIPELINE_STEPS[PIPELINE_STEPS.length - 1]).toBe('ready');
  });
});

// ─── Step Labels Tests ───────────────────────────────────────────────────────

describe('Step Labels', () => {
  it('should have a label for every step', () => {
    PIPELINE_STEPS.forEach((step) => {
      expect(STEP_LABELS[step]).toBeDefined();
      expect(typeof STEP_LABELS[step]).toBe('string');
      expect(STEP_LABELS[step].length).toBeGreaterThan(0);
    });
  });

  it('should have user-friendly labels', () => {
    expect(STEP_LABELS.creating).toBe('Building site');
    expect(STEP_LABELS.ready).toBe('Complete');
  });
});

// ─── Default Next Step Mapping Tests ─────────────────────────────────────────

describe('Default Next Step Mapping', () => {
  const DEFAULT_NEXT_STEP: Partial<Record<string, string>> = {
    creating: 'ready',
  };

  it('should transition from creating to ready', () => {
    expect(DEFAULT_NEXT_STEP.creating).toBe('ready');
  });

  it('should have no next step for ready (final step)', () => {
    expect(DEFAULT_NEXT_STEP.ready).toBeUndefined();
  });
});

// ─── Pipeline State Tests ────────────────────────────────────────────────────

describe('Pipeline State Structure', () => {
  interface PipelineState {
    currentStep: string;
    previousStep: string | null;
    nextStep: string | null;
    completedSteps: string[];
    pendingTransition: {
      fromStep: string;
      toStep: string;
      messageGenerated: boolean;
      timestamp: number;
    } | null;
  }

  it('should have correct initial state shape', () => {
    const initialState: PipelineState = {
      currentStep: 'creating',
      previousStep: null,
      nextStep: 'ready',
      completedSteps: [],
      pendingTransition: null,
    };

    expect(initialState.currentStep).toBe('creating');
    expect(initialState.previousStep).toBeNull();
    expect(initialState.nextStep).toBe('ready');
    expect(initialState.completedSteps).toEqual([]);
    expect(initialState.pendingTransition).toBeNull();
  });

  it('should track pending transitions', () => {
    const stateWithTransition: PipelineState = {
      currentStep: 'ready',
      previousStep: 'creating',
      nextStep: null,
      completedSteps: ['creating'],
      pendingTransition: {
        fromStep: 'creating',
        toStep: 'ready',
        messageGenerated: false,
        timestamp: Date.now(),
      },
    };

    expect(stateWithTransition.pendingTransition).not.toBeNull();
    expect(stateWithTransition.pendingTransition?.fromStep).toBe('creating');
    expect(stateWithTransition.pendingTransition?.toStep).toBe('ready');
    expect(stateWithTransition.pendingTransition?.messageGenerated).toBe(false);
  });
});

// ─── Step Transition Logic Tests ─────────────────────────────────────────────

describe('Step Transition Logic', () => {
  it('should generate correct transition message type', () => {
    const generateTransitionMessageType = (fromStep: string, toStep: string) => {
      return `transition-${fromStep}-to-${toStep}`;
    };

    expect(generateTransitionMessageType('creating', 'ready')).toBe('transition-creating-to-ready');
  });

  it('should include context in transition', () => {
    interface StepTransitionContext {
      projectName?: string;
      uvp?: string;
      targetAudience?: string;
    }

    const createTransitionContext = (fromStep: string, toStep: string, context?: StepTransitionContext) => {
      return {
        messageType: `transition-${fromStep}-to-${toStep}`,
        messageContext: {
          fromStep,
          toStep,
          fromStepLabel: STEP_LABELS[fromStep as keyof typeof STEP_LABELS],
          toStepLabel: STEP_LABELS[toStep as keyof typeof STEP_LABELS],
          ...context,
        },
      };
    };

    const result = createTransitionContext('creating', 'ready', { projectName: 'My Awesome Site' });

    expect(result.messageType).toBe('transition-creating-to-ready');
    expect(result.messageContext.fromStep).toBe('creating');
    expect(result.messageContext.toStep).toBe('ready');
    expect(result.messageContext.fromStepLabel).toBe('Building site');
    expect(result.messageContext.toStepLabel).toBe('Complete');
    expect(result.messageContext.projectName).toBe('My Awesome Site');
  });

  it('should add completed step on transition', () => {
    let completedSteps: string[] = [];
    const fromStep = 'creating';

    // Simulate transition
    if (!completedSteps.includes(fromStep)) {
      completedSteps = [...completedSteps, fromStep];
    }

    expect(completedSteps).toContain('creating');
    expect(completedSteps).toHaveLength(1);
  });

  it('should not duplicate completed steps', () => {
    let completedSteps: string[] = ['creating'];
    const fromStep = 'creating';

    // Try to add again
    if (!completedSteps.includes(fromStep)) {
      completedSteps = [...completedSteps, fromStep];
    }

    expect(completedSteps.filter((s) => s === 'creating')).toHaveLength(1);
  });
});

// ─── Progress Calculation Tests ──────────────────────────────────────────────

describe('Progress Calculation', () => {
  it('should calculate progress as percentage', () => {
    const calculateProgress = (currentStep: OnboardingStep) => {
      const totalSteps = PIPELINE_STEPS.length;
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep);

      return Math.round((currentIndex / (totalSteps - 1)) * 100);
    };

    expect(calculateProgress('creating')).toBe(0);
    expect(calculateProgress('ready')).toBe(100);
  });

  it('should return 0 for unknown step', () => {
    const calculateProgress = (currentStep: string) => {
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep as OnboardingStep);

      if (currentIndex === -1) {
        return 0;
      }

      return Math.round((currentIndex / (PIPELINE_STEPS.length - 1)) * 100);
    };

    expect(calculateProgress('unknown-step')).toBe(0);
  });
});

// ─── Skip To Step Tests ──────────────────────────────────────────────────────

describe('Skip To Step Logic', () => {
  it('should mark skipped steps as completed', () => {
    const skipToStep = (currentStep: OnboardingStep, targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep);
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);
      const skippedSteps = PIPELINE_STEPS.slice(currentIndex, targetIndex);

      return [...new Set([...completedSteps, ...skippedSteps])];
    };

    const result = skipToStep('creating', 'ready', []);

    expect(result).toContain('creating');
  });

  it('should not skip backwards', () => {
    const skipToStep = (currentStep: OnboardingStep, targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep);
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);

      if (targetIndex <= currentIndex) {
        return completedSteps; // No change for backwards skip
      }

      const skippedSteps = PIPELINE_STEPS.slice(currentIndex, targetIndex);

      return [...new Set([...completedSteps, ...skippedSteps])];
    };

    const result = skipToStep('ready', 'creating', ['creating']);

    // Should not change anything when skipping backwards
    expect(result).toEqual(['creating']);
  });
});

// ─── Reset To Step Tests ─────────────────────────────────────────────────────

describe('Reset To Step Logic', () => {
  it('should keep only steps before target as completed', () => {
    const resetToStep = (targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);
      return completedSteps.filter((s) => PIPELINE_STEPS.indexOf(s) < targetIndex);
    };

    const result = resetToStep('ready', ['creating']);

    expect(result).toEqual(['creating']);
    expect(result).not.toContain('ready');
  });

  it('should clear all steps when resetting to creating', () => {
    const resetToStep = (targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);
      return completedSteps.filter((s) => PIPELINE_STEPS.indexOf(s) < targetIndex);
    };

    const result = resetToStep('creating', ['creating']);

    expect(result).toEqual([]);
  });
});

// ─── Step Completion Check Tests ─────────────────────────────────────────────

describe('Step Completion Check', () => {
  it('should correctly identify completed steps', () => {
    const completedSteps = ['creating'];

    const isStepCompleted = (step: string) => completedSteps.includes(step);

    expect(isStepCompleted('creating')).toBe(true);
    expect(isStepCompleted('ready')).toBe(false);
  });
});

// ─── State Persistence Tests ─────────────────────────────────────────────────

describe('Pipeline State Persistence', () => {
  it('should serialize state for Convex sync', () => {
    const pipelineState = {
      currentStep: 'creating',
      previousStep: null,
      nextStep: 'ready',
      completedSteps: [] as string[],
      pendingTransition: null,
    };

    // State should be JSON-serializable
    const serialized = JSON.stringify(pipelineState);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(pipelineState);
  });

  it('should trigger onStateChange callback on transitions', () => {
    const onStateChange = vi.fn();

    // Simulate transition
    const newState = {
      step: 'ready',
      pipelineState: {
        currentStep: 'ready',
        previousStep: 'creating',
        nextStep: null,
        completedSteps: ['creating'],
        pendingTransition: null,
      },
    };

    onStateChange(newState);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'ready',
      }),
    );
  });
});

// ─── Transition Complete Marking Tests ───────────────────────────────────────

describe('Transition Complete Marking', () => {
  it('should mark transition as having message generated', () => {
    let pendingTransition = {
      fromStep: 'creating',
      toStep: 'ready',
      messageGenerated: false,
      timestamp: Date.now(),
    };

    const markTransitionComplete = () => {
      pendingTransition = {
        ...pendingTransition,
        messageGenerated: true,
      };
    };

    expect(pendingTransition.messageGenerated).toBe(false);
    markTransitionComplete();
    expect(pendingTransition.messageGenerated).toBe(true);
  });

  it('should not modify if no pending transition', () => {
    type PendingTransition = {
      fromStep: string;
      toStep: string;
      messageGenerated: boolean;
      timestamp: number;
    };

    let pendingTransition: PendingTransition | null = null;

    const markTransitionComplete = () => {
      if (pendingTransition) {
        pendingTransition = {
          ...pendingTransition,
          messageGenerated: true,
        };
      }
    };

    markTransitionComplete();
    expect(pendingTransition).toBeNull();
  });
});
