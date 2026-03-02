import type { GenerationStep, GenerationProgress, GenerationResult, StepData } from './types';

interface StreamHandlers {
  setResult: (r: GenerationResult) => void;
  setPreviewUrl: (url: string | null) => void;
  setProgress: (p: GenerationProgress | null) => void;
  updateStep: (id: string, updates: Partial<GenerationStep>) => void;
  updateStepMessage: (id: string, message: string) => void;
  setCurrentStep: (n: number) => void;
}

/**
 * Process a single stream event from the website generation pipeline.
 * Pure function — no React dependencies, fully testable.
 * 
 * @returns 'done' if generation is complete, 'continue' otherwise
 */
export function processStreamEvent(
  event: unknown,
  handlers: StreamHandlers
): 'done' | 'continue' {
  if (typeof event !== 'object' || event === null) return 'continue';

  const e = event as Record<string, unknown>;

  // Final result
  if (e.status === 'done') {
    if ('data' in e) {
      handlers.setResult(e.data as GenerationResult);
    }
    return 'done';
  }

  // Error
  if (e.status === 'error') {
    throw new Error((e.message as string) || 'Generation failed');
  }

  // Preview URL
  if (e.type === 'preview_updated' && typeof e.preview_url === 'string') {
    handlers.setPreviewUrl(e.preview_url);
  }

  // Preview HTML (legacy)
  if (typeof e.html === 'string') {
    handlers.setProgress({
      stage: 'preview',
      html: e.html,
      type: 'preview_updated',
    });
  }

  // Step progress
  if (typeof e.step === 'number' && typeof e.name === 'string') {
    const stepId = String(e.step);
    handlers.setCurrentStep(e.step as number);
    handlers.updateStep(stepId, {
      name: e.name as string,
      status: e.stage === 'complete' ? 'completed' : 'in-progress',
      message: (e.message as string) || undefined,
      data: e.data as StepData | undefined,
    });

    handlers.setProgress({
      stage: (e.stage as string) || 'processing',
      step: e.step as number,
      name: e.name as string,
      message: e.message as string | undefined,
      data: e.data as StepData | undefined,
      preview_url: e.preview_url as string | undefined,
    });
  }

  // Generic progress
  if (e.stage && !e.step) {
    handlers.setProgress({
      stage: e.stage as string,
      message: e.message as string | undefined,
    });
  }

  return 'continue';
}
