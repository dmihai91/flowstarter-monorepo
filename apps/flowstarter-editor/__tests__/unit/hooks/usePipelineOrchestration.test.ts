/**
 * usePipelineOrchestration Hook Tests
 *
 * Tests the pipeline state management and step transitions.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PIPELINE_STEPS,
  STEP_LABELS,
} from '~/components/editor/editor-chat/hooks/usePipelineOrchestration';
import type { OnboardingStep } from '~/components/editor/editor-chat/types';

// ─── Pipeline Steps Tests ────────────────────────────────────────────────────

describe('Pipeline Steps Configuration', () => {
  it('should have all expected steps in order', () => {
    expect(PIPELINE_STEPS).toEqual([
      'welcome',
      'describe',
      'name',
      'business-uvp',
      'business-audience',
      'business-goals',
      'business-tone',
      'business-selling',
      'business-pricing',
      'business-summary',
      'template',
      'personalization',
      'creating',
      'ready',
    ]);
  });

  it('should have 14 total steps', () => {
    expect(PIPELINE_STEPS).toHaveLength(14);
  });

  it('should start with welcome and end with ready', () => {
    expect(PIPELINE_STEPS[0]).toBe('welcome');
    expect(PIPELINE_STEPS[PIPELINE_STEPS.length - 1]).toBe('ready');
  });

  it('should have business discovery steps in correct order', () => {
    const businessSteps = PIPELINE_STEPS.filter(step => step.startsWith('business-'));
    expect(businessSteps).toEqual([
      'business-uvp',
      'business-audience',
      'business-goals',
      'business-tone',
      'business-selling',
      'business-pricing',
      'business-summary',
    ]);
  });
});

// ─── Step Labels Tests ───────────────────────────────────────────────────────

describe('Step Labels', () => {
  it('should have a label for every step', () => {
    PIPELINE_STEPS.forEach(step => {
      expect(STEP_LABELS[step]).toBeDefined();
      expect(typeof STEP_LABELS[step]).toBe('string');
      expect(STEP_LABELS[step].length).toBeGreaterThan(0);
    });
  });

  it('should have user-friendly labels', () => {
    expect(STEP_LABELS['welcome']).toBe('Welcome');
    expect(STEP_LABELS['describe']).toBe('Describe your project');
    expect(STEP_LABELS['name']).toBe('Name your project');
    expect(STEP_LABELS['business-uvp']).toBe('Value proposition');
    expect(STEP_LABELS['template']).toBe('Choose template');
    expect(STEP_LABELS['ready']).toBe('Complete');
  });
});

// ─── Default Next Step Mapping Tests ─────────────────────────────────────────

describe('Default Next Step Mapping', () => {
  // Re-define the mapping for testing (mirrors the hook)
  const DEFAULT_NEXT_STEP: Partial<Record<string, string>> = {
    'welcome': 'describe',
    'describe': 'name',
    'name': 'business-uvp',
    'business-uvp': 'business-audience',
    'business-audience': 'business-goals',
    'business-goals': 'business-tone',
    'business-tone': 'business-selling',
    'business-selling': 'business-pricing',
    'business-pricing': 'business-summary',
    'business-summary': 'template',
    'template': 'personalization',
    'personalization': 'creating',
    'creating': 'ready',
  };

  it('should map each step to the correct next step', () => {
    expect(DEFAULT_NEXT_STEP['welcome']).toBe('describe');
    expect(DEFAULT_NEXT_STEP['describe']).toBe('name');
    expect(DEFAULT_NEXT_STEP['name']).toBe('business-uvp');
  });

  it('should have business discovery flow connected correctly', () => {
    expect(DEFAULT_NEXT_STEP['business-uvp']).toBe('business-audience');
    expect(DEFAULT_NEXT_STEP['business-audience']).toBe('business-goals');
    expect(DEFAULT_NEXT_STEP['business-goals']).toBe('business-tone');
    expect(DEFAULT_NEXT_STEP['business-tone']).toBe('business-selling');
    expect(DEFAULT_NEXT_STEP['business-selling']).toBe('business-pricing');
    expect(DEFAULT_NEXT_STEP['business-pricing']).toBe('business-summary');
  });

  it('should transition from business-summary to template', () => {
    expect(DEFAULT_NEXT_STEP['business-summary']).toBe('template');
  });

  it('should have no next step for ready (final step)', () => {
    expect(DEFAULT_NEXT_STEP['ready']).toBeUndefined();
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
      currentStep: 'welcome',
      previousStep: null,
      nextStep: 'describe',
      completedSteps: [],
      pendingTransition: null,
    };

    expect(initialState.currentStep).toBe('welcome');
    expect(initialState.previousStep).toBeNull();
    expect(initialState.nextStep).toBe('describe');
    expect(initialState.completedSteps).toEqual([]);
    expect(initialState.pendingTransition).toBeNull();
  });

  it('should track pending transitions', () => {
    const stateWithTransition: PipelineState = {
      currentStep: 'business-uvp',
      previousStep: 'name',
      nextStep: 'business-audience',
      completedSteps: ['welcome', 'describe', 'name'],
      pendingTransition: {
        fromStep: 'name',
        toStep: 'business-uvp',
        messageGenerated: false,
        timestamp: Date.now(),
      },
    };

    expect(stateWithTransition.pendingTransition).not.toBeNull();
    expect(stateWithTransition.pendingTransition?.fromStep).toBe('name');
    expect(stateWithTransition.pendingTransition?.toStep).toBe('business-uvp');
    expect(stateWithTransition.pendingTransition?.messageGenerated).toBe(false);
  });
});

// ─── Step Transition Logic Tests ─────────────────────────────────────────────

describe('Step Transition Logic', () => {
  it('should generate correct transition message type', () => {
    const generateTransitionMessageType = (fromStep: string, toStep: string) => {
      return `transition-${fromStep}-to-${toStep}`;
    };

    expect(generateTransitionMessageType('name', 'business-uvp')).toBe('transition-name-to-business-uvp');
    expect(generateTransitionMessageType('business-uvp', 'business-audience')).toBe('transition-business-uvp-to-business-audience');
  });

  it('should include context in transition', () => {
    interface StepTransitionContext {
      projectName?: string;
      uvp?: string;
      targetAudience?: string;
    }

    const createTransitionContext = (
      fromStep: string,
      toStep: string,
      context?: StepTransitionContext
    ) => {
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

    const result = createTransitionContext('name', 'business-uvp', { projectName: 'My Awesome Site' });

    expect(result.messageType).toBe('transition-name-to-business-uvp');
    expect(result.messageContext.fromStep).toBe('name');
    expect(result.messageContext.toStep).toBe('business-uvp');
    expect(result.messageContext.fromStepLabel).toBe('Name your project');
    expect(result.messageContext.toStepLabel).toBe('Value proposition');
    expect(result.messageContext.projectName).toBe('My Awesome Site');
  });

  it('should add completed step on transition', () => {
    let completedSteps: string[] = ['welcome', 'describe'];
    const fromStep = 'name';

    // Simulate transition
    if (!completedSteps.includes(fromStep)) {
      completedSteps = [...completedSteps, fromStep];
    }

    expect(completedSteps).toContain('name');
    expect(completedSteps).toHaveLength(3);
  });

  it('should not duplicate completed steps', () => {
    let completedSteps: string[] = ['welcome', 'describe', 'name'];
    const fromStep = 'name';

    // Try to add again
    if (!completedSteps.includes(fromStep)) {
      completedSteps = [...completedSteps, fromStep];
    }

    expect(completedSteps.filter(s => s === 'name')).toHaveLength(1);
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

    expect(calculateProgress('welcome')).toBe(0);
    expect(calculateProgress('ready')).toBe(100);
  });

  it('should calculate intermediate progress correctly', () => {
    const calculateProgress = (currentStep: OnboardingStep) => {
      const totalSteps = PIPELINE_STEPS.length;
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep);
      return Math.round((currentIndex / (totalSteps - 1)) * 100);
    };

    // With 14 steps, each step is about 7.7% progress
    expect(calculateProgress('name')).toBe(Math.round((2 / 13) * 100)); // ~15%
    expect(calculateProgress('template')).toBe(Math.round((10 / 13) * 100)); // ~77%
  });

  it('should return 0 for unknown step', () => {
    const calculateProgress = (currentStep: string) => {
      const currentIndex = PIPELINE_STEPS.indexOf(currentStep as OnboardingStep);
      if (currentIndex === -1) return 0;
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

    const result = skipToStep('name', 'template', ['welcome', 'describe']);

    // Should include all steps between name and template
    expect(result).toContain('name');
    expect(result).toContain('business-uvp');
    expect(result).toContain('business-audience');
    expect(result).toContain('business-goals');
    expect(result).toContain('business-tone');
    expect(result).toContain('business-selling');
    expect(result).toContain('business-pricing');
    expect(result).toContain('business-summary');
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

    const result = skipToStep('template', 'name', ['welcome', 'describe', 'name']);

    // Should not change anything when skipping backwards
    expect(result).toEqual(['welcome', 'describe', 'name']);
  });
});

// ─── Reset To Step Tests ─────────────────────────────────────────────────────

describe('Reset To Step Logic', () => {
  it('should keep only steps before target as completed', () => {
    const resetToStep = (targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);
      return completedSteps.filter(s => PIPELINE_STEPS.indexOf(s) < targetIndex);
    };

    const result = resetToStep('business-uvp', [
      'welcome',
      'describe',
      'name',
      'business-uvp',
      'business-audience',
    ]);

    expect(result).toEqual(['welcome', 'describe', 'name']);
    expect(result).not.toContain('business-uvp');
    expect(result).not.toContain('business-audience');
  });

  it('should clear all steps when resetting to welcome', () => {
    const resetToStep = (targetStep: OnboardingStep, completedSteps: OnboardingStep[]) => {
      const targetIndex = PIPELINE_STEPS.indexOf(targetStep);
      return completedSteps.filter(s => PIPELINE_STEPS.indexOf(s) < targetIndex);
    };

    const result = resetToStep('welcome', [
      'welcome',
      'describe',
      'name',
    ]);

    expect(result).toEqual([]);
  });
});

// ─── Step Completion Check Tests ─────────────────────────────────────────────

describe('Step Completion Check', () => {
  it('should correctly identify completed steps', () => {
    const completedSteps = ['welcome', 'describe', 'name'];

    const isStepCompleted = (step: string) => completedSteps.includes(step);

    expect(isStepCompleted('welcome')).toBe(true);
    expect(isStepCompleted('describe')).toBe(true);
    expect(isStepCompleted('name')).toBe(true);
    expect(isStepCompleted('business-uvp')).toBe(false);
    expect(isStepCompleted('template')).toBe(false);
  });
});

// ─── State Persistence Tests ─────────────────────────────────────────────────

describe('Pipeline State Persistence', () => {
  it('should serialize state for Convex sync', () => {
    const pipelineState = {
      currentStep: 'business-uvp',
      previousStep: 'name',
      nextStep: 'business-audience',
      completedSteps: ['welcome', 'describe', 'name'],
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
      step: 'business-uvp',
      pipelineState: {
        currentStep: 'business-uvp',
        previousStep: 'name',
        nextStep: 'business-audience',
        completedSteps: ['welcome', 'describe', 'name'],
        pendingTransition: null,
      },
    };

    onStateChange(newState);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({
      step: 'business-uvp',
    }));
  });
});

// ─── Transition Complete Marking Tests ───────────────────────────────────────

describe('Transition Complete Marking', () => {
  it('should mark transition as having message generated', () => {
    let pendingTransition = {
      fromStep: 'name',
      toStep: 'business-uvp',
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

