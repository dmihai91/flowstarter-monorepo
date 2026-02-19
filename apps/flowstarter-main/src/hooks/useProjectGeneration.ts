import {
  evaluateDescription,
  generateProjectDetails,
  GenerationStep,
  moderateContent,
} from '@/lib/assistant-api';
import { useTranslations } from '@/lib/i18n';
import {
  detectIndustryFromDescription,
  normalizeIndustryId,
} from '@/lib/industries';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export type GenerationTarget = 'wizard' | 'editor';

export function useProjectGeneration(target: GenerationTarget = 'wizard') {
  const router = useRouter();
  const { t } = useTranslations();
  const setSkipLoadingScreen = useWizardStore(
    (state) => state.setSkipLoadingScreen
  );
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setPrefillImages = useWizardStore((state) => state.setPrefillImages);

  const [isGenerating, setIsGenerating] = useState(false);
  const [moderationError, setModerationError] = useState<{
    error: string;
    message: string;
    details: string[];
    code: string;
  } | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const updateStep = (stepId: string, updates: Partial<GenerationStep>) => {
    setGenerationSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
    );
  };

  const handleGeneration = async (
    input: string,
    uploadedImages: Array<{ url: string; name: string }>,
    customGenerationSteps?: GenerationStep[],
    onCustomGenerate?: (
      input?: string,
      images?: Array<{ url: string; name: string }>,
      updateStep?: (stepId: string, updates: Partial<GenerationStep>) => void
    ) => Promise<void>
  ) => {
    if (!input.trim()) return;

    // If custom generation handler is provided, use it
    if (onCustomGenerate) {
      try {
        setIsGenerating(true);
        setIsStreaming(true);
        if (customGenerationSteps) {
          setGenerationSteps(customGenerationSteps);
        }
        await onCustomGenerate(input.trim(), uploadedImages, updateStep);
      } catch (error) {
        console.error('Custom generation error:', error);
        toast.error(t('assistant.toast.error'), {
          description: t('assistant.toast.errorDescription'),
        });
      } finally {
        setIsGenerating(false);
        setIsStreaming(false);
      }
      return;
    }

    // Default project generation workflow
    setModerationError(null);
    setStreamingText('');
    setIsStreaming(true);

    const steps: GenerationStep[] = customGenerationSteps || [
      {
        id: 'moderation',
        label: t('assistant.steps.checkingContent'),
        status: 'pending',
      },
      {
        id: 'analysis',
        label: t('assistant.steps.analyzingBusiness'),
        status: 'pending',
      },
      {
        id: 'generation',
        label: t('assistant.steps.generatingDetails'),
        status: 'pending',
      },
      {
        id: 'finalization',
        label: t('assistant.steps.preparingProject'),
        status: 'pending',
      },
    ];
    setGenerationSteps(steps);
    setIsGenerating(true);

    try {
      // 1. AI Moderation check
      setCurrentStep('moderation');
      updateStep('moderation', { status: 'in-progress' });

      try {
        await moderateContent(input);
        updateStep('moderation', { status: 'completed' });
      } catch (err: unknown) {
        updateStep('moderation', {
          status: 'error',
          message: t('assistant.messages.contentNotAllowed'),
        });
        setIsGenerating(false);
        setIsStreaming(false);
        setModerationError(
          err && typeof err === 'object' && 'error' in err
            ? (err as {
                error: string;
                message: string;
                details: string[];
                code: string;
              })
            : {
                error: 'moderation_failed',
                message: String(err),
                details: [],
                code: 'unknown',
              }
        );
        return;
      }

      // 2. AI Sufficiency evaluation + Classification
      setCurrentStep('analysis');
      updateStep('analysis', { status: 'in-progress' });

      let detectedIndustry = 'other';
      let detectedPlatformType: string | undefined;

      // Run classification and evaluation in parallel for speed
      const [classificationResult, evaluationResult] = await Promise.all([
        fetch('/api/ai/classify-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
        evaluateDescription(input),
      ]);

      // Get platformType from classification
      if (classificationResult?.platformType) {
        detectedPlatformType = classificationResult.platformType;
      }

      // Get industry from classification first (more reliable)
      if (classificationResult?.industry) {
        detectedIndustry = normalizeIndustryId(classificationResult.industry);
      }

      // Fallback to evaluation result for industry
      if (detectedIndustry === 'other' && evaluationResult?.industry) {
        detectedIndustry = normalizeIndustryId(evaluationResult.industry);
      }

      // Final fallback: detect from description
      if (detectedIndustry === 'other') {
        detectedIndustry = detectIndustryFromDescription(input);
      }

      if (detectedIndustry && detectedIndustry !== 'other') {
        updateStep('analysis', {
          status: 'completed',
          message: `${t(
            'assistant.steps.industryDetected'
          )}: ${detectedIndustry}`,
        });
      } else {
        updateStep('analysis', { status: 'completed' });
      }

      if (evaluationResult && !evaluationResult.isSufficient) {
        console.log('AI Feedback:', evaluationResult.missingInfo);
      }

      // 3. Generate project details
      setCurrentStep('generation');
      updateStep('generation', { status: 'in-progress' });

      const generated = await generateProjectDetails(input, detectedIndustry);

      // Also try to get/normalize industry from generated result
      if (generated.industry) {
        const normalizedGenerated = normalizeIndustryId(generated.industry);
        if (normalizedGenerated !== 'other') {
          detectedIndustry = normalizedGenerated;
        }
      }

      if (generated.description) {
        setStreamingText(generated.description);
      }

      updateStep('generation', { status: 'completed' });

      // 4. Navigate to target (wizard or editor)
      setCurrentStep('finalization');
      updateStep('finalization', { status: 'in-progress' });

      const prefillData = {
        name: generated.names?.[0] || '',
        description: generated.description || input.trim(),
        userDescription: input.trim(),
        targetUsers: generated.targetUsers || '',
        businessGoals: generated.businessGoals || '',
        USP: generated.USP || '',
        platformType: detectedPlatformType,
        designConfig: {
          businessInfo: {
            industry: detectedIndustry,
            targetAudience: '',
            brandValues: '',
            competitors: '',
            additionalNotes: '',
          },
        },
      } as Partial<ProjectConfig> & { images?: string[] };

      if (target === 'editor') {
        // Redirect to editor with handoff
        try {
          const response = await fetch('/api/editor/handoff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'interactive',
              projectConfig: {
                name: prefillData.name,
                description: prefillData.description,
                userDescription: prefillData.userDescription,
                targetUsers: prefillData.targetUsers,
                businessGoals: prefillData.businessGoals,
                USP: prefillData.USP,
                platformType: prefillData.platformType,
                industry: detectedIndustry,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            updateStep('finalization', { status: 'completed' });
            window.location.href = data.editorUrl;
          } else {
            throw new Error('Failed to create handoff');
          }
        } catch (handoffError) {
          console.error(
            'Handoff failed, falling back to wizard:',
            handoffError
          );
          // Fallback to wizard if handoff fails
          setSkipLoadingScreen(true);
          setPrefillData(prefillData);
          setPrefillImages(uploadedImages);
          updateStep('finalization', { status: 'completed' });
          router.push('/dashboard/new?mode=ai-generated');
        }
      } else {
        // Navigate to wizard (default behavior)
        setSkipLoadingScreen(true);
        setPrefillData(prefillData);
        setPrefillImages(uploadedImages);
        updateStep('finalization', { status: 'completed' });
        router.push('/dashboard/new?mode=ai-generated');
      }
    } catch (error) {
      console.error('Submit error:', error);

      if (currentStep) {
        updateStep(currentStep, {
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : t('assistant.messages.somethingWentWrong'),
        });
      }

      setIsGenerating(false);
      setIsStreaming(false);
      toast.error(t('assistant.toast.error'), {
        description: t('assistant.toast.errorDescription'),
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    isGenerating,
    moderationError,
    streamingText,
    isStreaming,
    generationSteps,
    currentStep,
    handleGeneration,
    setModerationError,
  };
}
