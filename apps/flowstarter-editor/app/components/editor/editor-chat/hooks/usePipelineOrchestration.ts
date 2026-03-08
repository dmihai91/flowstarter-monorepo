/**
 * usePipelineOrchestration Hook
 *
 * Manages the onboarding pipeline state and step transitions.
 * Ensures only ONE message is generated per step transition,
 * with full context of where the user is coming from and going to.
 */

import { useCallback, useRef, useMemo } from 'react';
import type { OnboardingStep, InitialChatState } from '../types';

// ─── Pipeline Definition ────────────────────────────────────────────────────

/**
 * Ordered list of all pipeline steps.
 * Each step knows what comes next in the default flow.
 */
export const PIPELINE_STEPS: OnboardingStep[] = [
  'welcome',
  'describe',
  'name',
  'business-uvp',
  'business-audience',
  'business-goals',
  'business-tone',
  'business-selling',
  'business-pricing',
  'business-contact',
  'business-summary',
  'template',
  'personalization',
  'integrations',
  'creating',
  'ready',
];

/**
 * Map of step to its default next step.
 * Some transitions may be conditional (handled in transition logic).
 */
const DEFAULT_NEXT_STEP: Partial<Record<OnboardingStep, OnboardingStep>> = {
  welcome: 'describe',
  describe: 'name',
  name: 'business-uvp',
  'business-uvp': 'business-audience',
  'business-audience': 'business-goals',
  'business-goals': 'business-tone',
  'business-tone': 'business-selling',
  'business-selling': 'business-pricing',
  'business-pricing': 'business-contact',
  'business-contact': 'business-summary',
  'business-summary': 'template',
  template: 'personalization',
  personalization: 'integrations',
  integrations: 'creating',
  creating: 'ready',
};

/**
 * Human-readable labels for each step (used in progress indicators).
 */
export const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  describe: 'Describe your project',
  name: 'Name your project',
  'quick-profile': 'Quick profile',
  'business-uvp': 'Value proposition',
  'business-offering': 'Your offering',
  'business-audience': 'Target audience',
  'business-goals': 'Business goals',
  'business-tone': 'Brand tone',
  'business-selling': 'How clients engage',
  'business-pricing': 'Pricing',
  'business-contact': 'Contact info',
  'business-summary': 'Review details',
  template: 'Choose template',
  personalization: 'Customize design',
  integrations: 'Connect services',
  creating: 'Building site',
  ready: 'Complete',
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PipelineState {
  currentStep: OnboardingStep;
  previousStep: OnboardingStep | null;
  nextStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  pendingTransition: {
    fromStep: OnboardingStep;
    toStep: OnboardingStep;
    messageGenerated: boolean;
    timestamp: number;
  } | null;
}

export interface StepTransitionContext {
  projectName?: string;
  projectDescription?: string;
  businessInfo?: Partial<{
    uvp: string;
    targetAudience: string;
    businessGoals: string[];
    brandTone: string;
    sellingMethod: string;
    pricingOffers: string;
  }>;
  templateName?: string;

  // Add more context fields as needed
}

export interface UsePipelineOrchestrationProps {
  initialStep?: OnboardingStep;
  initialCompletedSteps?: OnboardingStep[];
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export interface UsePipelineOrchestrationReturn {
  // State
  pipelineState: PipelineState;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  progress: number; // 0-100 percentage

  // Actions
  /**
   * Transition to the next step in the pipeline.
   * Returns the transition message type and context for generating a single message.
   */
  transitionToStep: (
    toStep: OnboardingStep,
    context?: StepTransitionContext,
  ) => {
    messageType: string;
    messageContext: Record<string, unknown>;
  };

  /**
   * Mark current transition as having its message generated.
   */
  markTransitionComplete: () => void;

  /**
   * Get the default next step from current step.
   */
  getNextStep: (fromStep?: OnboardingStep) => OnboardingStep | null;

  /**
   * Check if a step has been completed.
   */
  isStepCompleted: (step: OnboardingStep) => boolean;

  /**
   * Skip to a specific step (for skipping optional steps).
   */
  skipToStep: (step: OnboardingStep) => void;

  /**
   * Reset pipeline to a specific step (for going back).
   */
  resetToStep: (step: OnboardingStep) => void;

  /**
   * Get the pipeline state for Convex persistence.
   */
  getPipelineStateForSync: () => PipelineState;
}

// ─── Hook Implementation ────────────────────────────────────────────────────

export function usePipelineOrchestration({
  initialStep = 'welcome',
  initialCompletedSteps = [],
  onStateChange,
}: UsePipelineOrchestrationProps): UsePipelineOrchestrationReturn {
  // Use ref to track state to avoid re-render loops
  const stateRef = useRef<PipelineState>({
    currentStep: initialStep,
    previousStep: null,
    nextStep: DEFAULT_NEXT_STEP[initialStep] || null,
    completedSteps: initialCompletedSteps,
    pendingTransition: null,
  });

  // Compute progress as percentage
  const progress = useMemo(() => {
    const totalSteps = PIPELINE_STEPS.length;
    const currentIndex = PIPELINE_STEPS.indexOf(stateRef.current.currentStep);

    return Math.round((currentIndex / (totalSteps - 1)) * 100);
  }, [stateRef.current.currentStep]);

  /**
   * Get the default next step from a given step.
   */
  const getNextStep = useCallback((fromStep?: OnboardingStep): OnboardingStep | null => {
    const step = fromStep || stateRef.current.currentStep;
    return DEFAULT_NEXT_STEP[step] || null;
  }, []);

  /**
   * Check if a step has been completed.
   */
  const isStepCompleted = useCallback((step: OnboardingStep): boolean => {
    return stateRef.current.completedSteps.includes(step);
  }, []);

  /**
   * Transition to a new step.
   * Returns the message type and context for generating a SINGLE transition message.
   */
  const transitionToStep = useCallback(
    (
      toStep: OnboardingStep,
      context?: StepTransitionContext,
    ): { messageType: string; messageContext: Record<string, unknown> } => {
      const fromStep = stateRef.current.currentStep;

      // Update state
      const newCompletedSteps = stateRef.current.completedSteps.includes(fromStep)
        ? stateRef.current.completedSteps
        : [...stateRef.current.completedSteps, fromStep];

      stateRef.current = {
        currentStep: toStep,
        previousStep: fromStep,
        nextStep: DEFAULT_NEXT_STEP[toStep] || null,
        completedSteps: newCompletedSteps,
        pendingTransition: {
          fromStep,
          toStep,
          messageGenerated: false,
          timestamp: Date.now(),
        },
      };

      // Sync to Convex
      onStateChange?.({
        step: toStep,
        pipelineState: stateRef.current,
      } as Partial<InitialChatState>);

      /*
       * Return the unified message type for this transition
       * The API will generate a SINGLE message that handles both the acknowledgment
       * and the next prompt in one coherent message
       */
      return {
        messageType: `transition-${fromStep}-to-${toStep}`,
        messageContext: {
          fromStep,
          toStep,
          fromStepLabel: STEP_LABELS[fromStep],
          toStepLabel: STEP_LABELS[toStep],
          ...context,
        },
      };
    },
    [onStateChange],
  );

  /**
   * Mark the current transition as having its message generated.
   */
  const markTransitionComplete = useCallback(() => {
    if (stateRef.current.pendingTransition) {
      stateRef.current = {
        ...stateRef.current,
        pendingTransition: {
          ...stateRef.current.pendingTransition,
          messageGenerated: true,
        },
      };

      onStateChange?.({
        pipelineState: stateRef.current,
      } as Partial<InitialChatState>);
    }
  }, [onStateChange]);

  /**
   * Skip to a specific step (marks intermediate steps as skipped).
   */
  const skipToStep = useCallback(
    (step: OnboardingStep) => {
      const currentIndex = PIPELINE_STEPS.indexOf(stateRef.current.currentStep);
      const targetIndex = PIPELINE_STEPS.indexOf(step);

      // Add all skipped steps to completed
      const skippedSteps = PIPELINE_STEPS.slice(currentIndex, targetIndex);
      const newCompletedSteps = [...new Set([...stateRef.current.completedSteps, ...skippedSteps])];

      stateRef.current = {
        currentStep: step,
        previousStep: stateRef.current.currentStep,
        nextStep: DEFAULT_NEXT_STEP[step] || null,
        completedSteps: newCompletedSteps,
        pendingTransition: null,
      };

      onStateChange?.({
        step,
        pipelineState: stateRef.current,
      } as Partial<InitialChatState>);
    },
    [onStateChange],
  );

  /**
   * Reset to a specific step (for going back).
   */
  const resetToStep = useCallback(
    (step: OnboardingStep) => {
      const targetIndex = PIPELINE_STEPS.indexOf(step);

      // Keep only steps before the target as completed
      const newCompletedSteps = stateRef.current.completedSteps.filter((s) => PIPELINE_STEPS.indexOf(s) < targetIndex);

      stateRef.current = {
        currentStep: step,
        previousStep: stateRef.current.currentStep,
        nextStep: DEFAULT_NEXT_STEP[step] || null,
        completedSteps: newCompletedSteps,
        pendingTransition: null,
      };

      onStateChange?.({
        step,
        pipelineState: stateRef.current,
      } as Partial<InitialChatState>);
    },
    [onStateChange],
  );

  /**
   * Get pipeline state for Convex sync.
   */
  const getPipelineStateForSync = useCallback((): PipelineState => {
    return { ...stateRef.current };
  }, []);

  return {
    // State
    pipelineState: stateRef.current,
    currentStep: stateRef.current.currentStep,
    completedSteps: stateRef.current.completedSteps,
    progress,

    // Actions
    transitionToStep,
    markTransitionComplete,
    getNextStep,
    isStepCompleted,
    skipToStep,
    resetToStep,
    getPipelineStateForSync,
  };
}

export type { OnboardingStep };


