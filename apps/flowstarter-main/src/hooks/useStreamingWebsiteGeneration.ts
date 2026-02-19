import { aiAgentService } from '@/lib/ai/ai-agent-service';
import { TemplateInfo, WebsiteProjectDetails } from '@/lib/ai/types';
import { useCallback, useState } from 'react';

// Type definitions
export interface StepData {
  plan?: string;
  files?: number;
  tested?: boolean;
  score?: number;
  issues?: number;
  coverage?: number;
  test_files?: number;
  passed?: boolean;
  docs?: number;
  auto_fixed?: boolean;
  workspace_id?: string;
  [key: string]: unknown;
}

export interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'error';
  message?: string;
  data?: StepData;
}

export interface GenerationProgress {
  stage: string;
  step?: number;
  name?: string;
  message?: string;
  data?: StepData;
  html?: string; // Preview HTML from preview_updated events
  type?: string; // Event type (e.g., 'preview_updated')
  preview_url?: string; // Live preview URL from dev server
}

export interface QualityMetrics {
  code_review?: {
    passed: boolean;
    score: number;
    issues: Array<{
      severity: string;
      category: string;
      file: string;
      line: number;
      message: string;
    }>;
    metrics: {
      total_issues: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  validation?: {
    passed: boolean;
    coverage: number;
    met_requirements: string[];
    missing_requirements: string[];
  };
  performance?: {
    lighthouse_score: {
      performance: number;
      accessibility: number;
      best_practices: number;
      seo: number;
    };
    bundle_size: {
      total: number;
      js: number;
      css: number;
      status: string;
    };
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  siteId: string;
  generatedCode: string;
  files: GeneratedFile[];
  architecture?: string;
  tested: boolean;
  orchestrated: boolean;
  qualityMetrics?: QualityMetrics;
  daytonaWorkspace?: string;
  timestamp?: string;
}

// Re-export from shared types for convenience
export type { TemplateInfo, WebsiteProjectDetails };
// Keep ProjectDetails as alias for backward compatibility
export type ProjectDetails = WebsiteProjectDetails;

export interface UseStreamingWebsiteGenerationOptions {
  sessionId?: string | null; // Convex session ID for real-time sync
}

export interface UseStreamingWebsiteGenerationResult {
  isGenerating: boolean;
  progress: GenerationProgress | null;
  steps: GenerationStep[];
  currentStep: number;
  error: string | null;
  result: GenerationResult | null;
  previewUrl: string | null; // Live preview URL from dev server
  generate: (
    projectDetails: ProjectDetails,
    templateInfo: TemplateInfo,
    templateCode?: string
  ) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

// No longer hardcoded - steps are built dynamically from agent stream

export function useStreamingWebsiteGeneration(
  options?: UseStreamingWebsiteGenerationOptions
): UseStreamingWebsiteGenerationResult {
  const sessionId = options?.sessionId;

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastGenerateParams, setLastGenerateParams] = useState<{
    projectDetails: ProjectDetails;
    templateInfo: TemplateInfo;
    templateCode?: string;
  } | null>(null);

  const updateStep = useCallback(
    (
      stepNumber: number,
      stepName: string,
      status: GenerationStep['status'],
      message?: string,
      data?: StepData
    ) => {
      setSteps((prev) => {
        // Find existing step or create new one
        const existingIndex = prev.findIndex(
          (s) => s.id === String(stepNumber)
        );

        if (existingIndex >= 0) {
          // Update existing step
          return prev.map((step, idx) => {
            if (idx === existingIndex) {
              return { ...step, status, message, data };
            }
            return step;
          });
        } else {
          // Add new step in correct position
          const newStep: GenerationStep = {
            id: String(stepNumber),
            name: stepName,
            status,
            message,
            data,
          };

          // Insert in order
          const newSteps = [...prev, newStep].sort(
            (a, b) => parseInt(a.id) - parseInt(b.id)
          );
          return newSteps;
        }
      });
    },
    []
  );

  const updateStepMessage = useCallback(
    (stepNumber: number, message: string) => {
      console.log(`🔄 Updating step ${stepNumber} message to:`, message);
      setSteps((prev) => {
        const updated = prev.map((step) => {
          if (step.id === String(stepNumber)) {
            console.log(`✅ Found and updating step ${stepNumber}`);
            return { ...step, message };
          }
          return step;
        });
        console.log(`📊 Steps after update:`, updated);
        return updated;
      });
    },
    []
  );

  const generate = useCallback(
    async (
      projectDetails: ProjectDetails,
      templateInfo: TemplateInfo,
      templateCode?: string
    ) => {
      console.log('🎬 generate() called with project:', projectDetails.name);
      console.log('📍 Session ID:', sessionId || 'not provided');

      // Store params for retry
      setLastGenerateParams({ projectDetails, templateInfo, templateCode });

      console.log('🔧 Setting state: isGenerating=true');
      setIsGenerating(true);
      setError(null);
      setResult(null);
      setCurrentStep(0);
      setSteps([]); // Start with empty steps - will be populated from stream

      try {
        console.log('📞 Calling aiAgentService.generateWebsiteCodeStream...');
        // Pass sessionId to enable Convex state sync
        const stream = aiAgentService.generateWebsiteCodeStream(
          projectDetails,
          templateInfo,
          templateCode,
          true, // useOrchestrator
          sessionId || undefined // Pass session ID for Convex sync
        );

        for await (const event of stream) {
          // Safely process each event, catching any parsing errors
          try {
            console.log('Stream event:', event);

            // Handle different event types
            if (
              typeof event === 'object' &&
              event !== null &&
              'status' in event &&
              event.status === 'done'
            ) {
              // Final result
              if ('data' in event) {
                setResult(event.data as GenerationResult);
              }
              setIsGenerating(false);
              setCurrentStep(10);
              return;
            } else if (
              typeof event === 'object' &&
              event !== null &&
              'status' in event &&
              event.status === 'error'
            ) {
              // Check if this is a critical error or recoverable
              const errorMessage =
                'message' in event ? String(event.message) : '';
              const isCritical =
                errorMessage.toLowerCase().includes('fatal') ||
                errorMessage.toLowerCase().includes('authentication') ||
                errorMessage.toLowerCase().includes('permission');

              if (isCritical) {
                // Fatal error - show user-friendly message and stop
                setError(
                  'An error occurred during code generation. Please try again.'
                );
                setIsGenerating(false);
                return;
              }
              // Non-critical error - log and continue
              console.warn('Non-critical error during generation:', event);
            } else if (
              typeof event === 'object' &&
              event !== null &&
              'stage' in event &&
              event.stage === 'error'
            ) {
              // Non-fatal error during generation - log but don't stop
              // The orchestrator may continue despite individual step failures
              console.warn('Non-fatal error during generation:', event);
            }

            // Update progress
            if (typeof event === 'object' && event !== null) {
              setProgress(event as GenerationProgress);

              // Handle step updates
              if (
                'stage' in event &&
                event.stage === 'step_start' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                setCurrentStep(event.step);
                const stepName =
                  'name' in event && typeof event.name === 'string'
                    ? event.name
                    : `Step ${event.step}`;
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                updateStep(event.step, stepName, 'in-progress', message);
              } else if (
                'stage' in event &&
                event.stage === 'step_progress' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                // Handle progress messages within a step (typewriter effect)
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                if (message) {
                  updateStepMessage(event.step, message);
                }
              } else if (
                'stage' in event &&
                event.stage === 'step_activity' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                // Handle detailed activity messages with file information
                const eventMessage =
                  'message' in event ? event.message : undefined;
                const eventActivity =
                  'activity' in event ? event.activity : undefined;
                const translationParams =
                  'translationParams' in event
                    ? event.translationParams
                    : undefined;

                console.log('🎯 Received step_activity event:', {
                  step: event.step,
                  message: eventMessage,
                  activity: eventActivity,
                  translationParams,
                });

                // Use the detailed message which includes file description, size, and lines
                // The message field now contains: "✏️ file.tsx - Description (1/12) • 245 lines, 8.3 KB"
                const displayMessage =
                  typeof eventMessage === 'string'
                    ? eventMessage
                    : typeof eventActivity === 'string'
                    ? eventActivity
                    : undefined;

                if (displayMessage) {
                  console.log(
                    `📝 Step ${event.step} - displaying file info:`,
                    displayMessage
                  );
                  updateStepMessage(event.step, displayMessage);
                } else {
                  console.warn(
                    '⚠️ step_activity event had no displayable message:',
                    event
                  );
                }
              } else if (
                'stage' in event &&
                event.stage === 'step_complete' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                const stepName =
                  'name' in event && typeof event.name === 'string'
                    ? event.name
                    : steps.find((s) => s.id === String(event.step))?.name ||
                      `Step ${event.step}`;
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                updateStep(
                  event.step,
                  stepName,
                  'completed',
                  message,
                  event as StepData
                );
              } else if (
                'stage' in event &&
                event.stage === 'step_skipped' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                const stepName =
                  'name' in event && typeof event.name === 'string'
                    ? event.name
                    : steps.find((s) => s.id === String(event.step))?.name ||
                      `Step ${event.step}`;
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                updateStep(event.step, stepName, 'skipped', message);
              } else if (
                'stage' in event &&
                event.stage === 'step_error' &&
                'step' in event &&
                typeof event.step === 'number'
              ) {
                // Handle step errors - include error detail if available
                const stepName =
                  'name' in event && typeof event.name === 'string'
                    ? event.name
                    : steps.find((s) => s.id === String(event.step))?.name ||
                      `Step ${event.step}`;
                const errorDetail =
                  'error' in event && typeof event.error === 'string'
                    ? event.error
                    : undefined;
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : errorDetail || 'Something went wrong';

                console.warn(
                  `Step ${event.step} error:`,
                  errorDetail || message
                );
                updateStep(event.step, stepName, 'error', message);
              } else if (
                ('stage' in event && event.stage === 'planning') ||
                ('status' in event && event.status === 'planning')
              ) {
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                setProgress({ stage: 'planning', message });
              } else if (
                'status' in event &&
                (event.status === 'initializing' ||
                  event.status === 'started' ||
                  event.status === 'loading_template' ||
                  event.status === 'loading_templates')
              ) {
                // Handle initialization and loading events
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                setProgress({ stage: event.status, message });
              } else if ('stage' in event && event.stage === 'plan_created') {
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                const plan =
                  'plan' in event && typeof event.plan === 'string'
                    ? event.plan
                    : undefined;
                setProgress({ stage: 'plan_created', message, data: { plan } });
              } else if ('stage' in event && event.stage === 'executing') {
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                setProgress({ stage: 'executing', message });
              } else if ('stage' in event && event.stage === 'completed') {
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                setProgress({ stage: 'completed', message });
                setCurrentStep(10);
                // Update all remaining steps to completed
                setSteps((prev) =>
                  prev.map((step) => ({
                    ...step,
                    status:
                      step.status === 'pending' ? 'completed' : step.status,
                  }))
                );
              } else if (
                'stage' in event &&
                event.stage === 'preview' &&
                'type' in event &&
                event.type === 'preview_updated'
              ) {
                // Handle preview_updated events with HTML
                const html =
                  'html' in event && typeof event.html === 'string'
                    ? event.html
                    : undefined;
                const message =
                  'message' in event && typeof event.message === 'string'
                    ? event.message
                    : undefined;
                const eventPreviewUrl =
                  'preview_url' in event &&
                  typeof event.preview_url === 'string'
                    ? event.preview_url
                    : undefined;

                // Update preview URL if provided
                if (eventPreviewUrl) {
                  setPreviewUrl(eventPreviewUrl);
                  console.log('🔗 Preview URL updated:', eventPreviewUrl);
                }

                setProgress({
                  stage: 'preview',
                  type: 'preview_updated',
                  html,
                  message,
                  preview_url: eventPreviewUrl,
                });
              } else if (
                'stage' in event &&
                event.stage === 'preview_ready' &&
                'type' in event &&
                event.type === 'preview_started'
              ) {
                // Handle preview_ready events with live dev server URL
                const eventPreviewUrl =
                  'preview_url' in event &&
                  typeof event.preview_url === 'string'
                    ? event.preview_url
                    : undefined;

                if (eventPreviewUrl) {
                  setPreviewUrl(eventPreviewUrl);
                  console.log('🚀 Live preview started:', eventPreviewUrl);
                }

                setProgress({
                  stage: 'preview_ready',
                  type: 'preview_started',
                  preview_url: eventPreviewUrl,
                });
              }
            }
          } catch (eventError) {
            // Log individual event processing errors but continue with the stream
            console.warn(
              'Error processing stream event, continuing...',
              eventError
            );
          }
        }
      } catch (err) {
        console.error('Generation error:', err);
        // Only show error to user if generation actually failed
        // Some errors are recoverable, so we check isGenerating
        if (isGenerating) {
          setError(
            'An error occurred during code generation. Please try again.'
          );
          setIsGenerating(false);
        }
      }
    },
    [steps, updateStep, updateStepMessage, sessionId]
  );

  const retry = useCallback(async () => {
    if (lastGenerateParams) {
      // Clear error before retrying
      setError(null);
      setSteps([]);
      setIsGenerating(true);

      await generate(
        lastGenerateParams.projectDetails,
        lastGenerateParams.templateInfo,
        lastGenerateParams.templateCode
      );
    }
  }, [lastGenerateParams, generate]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setSteps([]);
    setCurrentStep(0);
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    setLastGenerateParams(null);
  }, []);

  return {
    isGenerating,
    progress,
    steps,
    currentStep,
    error,
    result,
    previewUrl,
    generate,
    retry,
    reset,
  };
}
