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
    (stepId: number | string, name: string | undefined, status: GenerationStep['status'], message?: string, data?: StepData) => {
      const id = String(stepId);
      setSteps((prev) => {
        const existing = prev.find((s) => s.id === id);
        const updates = {
          ...(name ? { name } : {}),
          status,
          ...(message ? { message } : {}),
          ...(data ? { data } : {}),
        };
        if (existing) {
          return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        }
        return [...prev, { id, name: name || `Step ${stepId}`, status, ...(message ? { message } : {}), ...(data ? { data } : {}) }].sort(
          (a, b) => Number(a.id) - Number(b.id)
        );
      });
    },
    []
  );

  const updateStepMessage = useCallback(
    (stepId: number | string, message: string) => {
      const id = String(stepId);
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, message } : s))
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
