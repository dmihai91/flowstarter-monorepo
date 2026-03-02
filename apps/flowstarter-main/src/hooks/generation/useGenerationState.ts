'use client';

import { useState, useCallback } from 'react';
import type { GenerationStep, GenerationProgress, GenerationResult, StepData } from './types';

/**
 * Manages generation state (steps, progress, errors).
 * Single responsibility: state management only.
 */
export function useGenerationState() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<GenerationStep>) => {
      setSteps((prev) => {
        const existing = prev.find((s) => s.id === stepId);
        if (existing) {
          return prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
        }
        // Auto-create step if it doesn't exist
        return [...prev, { id: stepId, name: stepId, status: 'pending' as const, ...updates }];
      });
    },
    []
  );

  const updateStepMessage = useCallback(
    (stepId: string, message: string) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, message } : s))
      );
    },
    []
  );

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setSteps([]);
    setCurrentStep(0);
    setError(null);
    setResult(null);
    setPreviewUrl(null);
  }, []);

  return {
    // State
    isGenerating, setIsGenerating,
    progress, setProgress,
    steps, setSteps,
    currentStep, setCurrentStep,
    error, setError,
    result, setResult,
    previewUrl, setPreviewUrl,
    // Actions
    updateStep,
    updateStepMessage,
    reset,
  };
}
