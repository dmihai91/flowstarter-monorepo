/**
 * useOnboardingFlow Hook
 *
 * Manages the wizard step flow and navigation state for the onboarding process.
 * Handles step transitions, project description, and project name state.
 */

import { useState, useCallback } from 'react';
import type { OnboardingStep } from '../types';
import type { UseOnboardingFlowOptions, UseOnboardingFlowReturn } from '../types/sharedState';

export function useOnboardingFlow(options: UseOnboardingFlowOptions = {}): UseOnboardingFlowReturn {
  const { initialStep = 'welcome', initialDescription = '', initialProjectName = null, onStepChange } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [step, setStepInternal] = useState<OnboardingStep>(initialStep);
  const [projectDescription, setProjectDescription] = useState(initialDescription);
  const [projectName, setProjectName] = useState<string | null>(initialProjectName);
  const [inputValue, setInputValue] = useState('');
  const [lastSuggestedName, setLastSuggestedName] = useState<string | null>(null);

  // ─── Callbacks ────────────────────────────────────────────────────────────

  const setStep = useCallback(
    (newStep: OnboardingStep) => {
      setStepInternal(newStep);
      onStepChange?.(newStep);
    },
    [onStepChange],
  );

  return {
    // State
    step,
    projectDescription,
    projectName,
    inputValue,
    lastSuggestedName,

    // Actions
    setStep,
    setProjectDescription,
    setProjectName,
    setInputValue,
    setLastSuggestedName,
  };
}

export type { UseOnboardingFlowOptions, UseOnboardingFlowReturn };

