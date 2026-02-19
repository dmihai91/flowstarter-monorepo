import { useProjectSuggestions } from '@/hooks/wizard/useProjectSuggestions';
import { useTranslations } from '@/lib/i18n';
import {
  detectIndustryFromDescription,
  detectPlatformType,
  normalizeIndustryId,
} from '@/lib/industries';
import { useProjectAIStore } from '@/store/ai-suggestions-store';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { useState } from 'react';
import { toast } from 'sonner';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

interface UseAIGenerationProps<T> {
  templateId: string;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  formik: FormikProps<T>;
}

export function useAIGeneration({
  templateId,
  projectConfig,
  onProjectConfigChange,
  formik,
}: UseAIGenerationProps<{
  industry: string;
  targetUsers: string;
  name: string;
  description: string;
  USP: string;
  businessGoals: string;
}>) {
  const { t } = useTranslations();
  const suggestions = useProjectSuggestions(templateId);
  const setPhase = useWizardStore((s) => s.setDetailsPhase);
  const setHasAIGenerated = useWizardStore((s) => s.setHasAIGenerated);
  const setLastGeneratedDescription = useWizardStore(
    (s) => s.setLastGeneratedDescription
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const handleAIGeneration = async (userDesc: string) => {
    setIsGenerating(true);

    // Initialize generation steps
    const steps: GenerationStep[] = [
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

    try {
      if (!userDesc) {
        toast.error(t('basic.description.required'));
        return;
      }

      // Clear previous validation state
      useProjectAIStore.getState().clearValidation();

      // 1) Moderation validation
      setCurrentStep('moderation');
      try {
        const modRes = await fetch('/api/ai/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessInfo: {
              description: userDesc,
              industry: formik.values.industry || 'general',
            },
          }),
        });
        if (modRes.status === 400) {
          const err = await modRes.json();
          useProjectAIStore.getState().setModerationError(err);
          setCurrentStep(null);
          return;
        }
      } catch (e) {
        console.warn('Moderation check failed', e);
      }

      // 2) Non-blocking sufficiency check (for hint only)
      setCurrentStep('analysis');
      try {
        const suffRes = await fetch('/api/ai/evaluate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessInfo: {
              description: userDesc,
              industry: formik.values.industry || 'general',
              businessType:
                projectConfig.platformType || templateId || 'business',
            },
          }),
        });
        if (suffRes.ok) {
          const json = await suffRes.json();
          const result = json?.result;
          if (result) {
            useProjectAIStore.getState().setSufficiency({
              isSufficient: Boolean(result.isSufficient),
              followUpQuestions: [], // always empty per new policy
            });
          }
        }
      } catch (e) {
        // ignore errors; hint is optional
      }

      // Generate suggestions using the AI service
      setCurrentStep('generation');
      const result = await suggestions.generateSuggestions({
        businessType: projectConfig.platformType || templateId || 'business',
        industry: formik.values.industry || 'general',
        targetAudience: formik.values.targetUsers || '',
        uniqueSellingPoint: userDesc,
        description: userDesc,
        goals: '',
        domain: formik.values.industry || 'general',
        goal: [],
      });

      if (result) {
        setCurrentStep('finalization');
        const next = { ...projectConfig };
        if (Array.isArray(result.names) && result.names.length > 0) {
          const randomIndex = Math.floor(Math.random() * result.names.length);
          next.name = result.names[randomIndex];
          formik.setFieldValue('name', next.name);
        }

        if (result.description) {
          next.description = result.description;
          formik.setFieldValue('description', result.description);
        }
        if (result.USP) {
          next.USP = result.USP;
          formik.setFieldValue('USP', result.USP);
        }
        if (result.targetUsers) {
          next.targetUsers = result.targetUsers;
          formik.setFieldValue('targetUsers', result.targetUsers);
        }
        if (result.businessGoals) {
          next.businessGoals = result.businessGoals;
          formik.setFieldValue('businessGoals', result.businessGoals);
        }

        // Persist industry (from AI or existing formik value) into businessInfo
        // Try multiple sources: user-selected or detect from description
        let detectedIndustry = 'other';

        // 1. Try user-selected industry first (only if it's a valid selection)
        const existingIndustry = (formik.values.industry || '').trim();
        if (existingIndustry && existingIndustry !== 'general') {
          detectedIndustry = normalizeIndustryId(existingIndustry);
        }

        // 2. If still no valid industry, try to detect from user's description
        if (detectedIndustry === 'other' || !existingIndustry) {
          const detected = detectIndustryFromDescription(userDesc);
          if (detected !== 'other') {
            detectedIndustry = detected;
          }
        }

        console.log('[useAIGeneration] Industry detection:', {
          userSelected: formik.values.industry,
          detected: detectedIndustry,
          willUpdate: detectedIndustry !== formik.values.industry,
        });

        // Update formik if we detected a different industry
        if (detectedIndustry && detectedIndustry !== formik.values.industry) {
          console.log(
            `[useAIGeneration] Setting industry to: ${detectedIndustry}`
          );
          formik.setFieldValue('industry', detectedIndustry);
        }

        // Always sync normalized industry to wizard store (whether from AI or user-selected)
        if (detectedIndustry && detectedIndustry !== 'other') {
          useWizardStore.getState().setSelectedIndustry(detectedIndustry);
        }

        // Auto-detect and set platform type if not already set
        let detectedPlatformType = projectConfig.platformType || 'landing';
        if (!projectConfig.platformType) {
          detectedPlatformType = detectPlatformType(userDesc);
          console.log('[useAIGeneration] Platform type detection:', {
            existing: projectConfig.platformType,
            detected: detectedPlatformType,
          });
        }

        const nextBusinessInfo = {
          ...(projectConfig.designConfig?.businessInfo || {
            industry: '',
            targetAudience: '',
            brandValues: '',
            competitors: '',
            additionalNotes: '',
          }),
          industry: detectedIndustry,
        };

        console.log('[useAIGeneration] Calling onProjectConfigChange with:', {
          name: next.name,
          description: next.description?.substring(0, 50),
          USP: next.USP?.substring(0, 50),
          targetUsers: next.targetUsers,
          businessGoals: next.businessGoals,
          platformType: detectedPlatformType,
        });

        onProjectConfigChange({
          ...next,
          platformType: detectedPlatformType,
          designConfig: {
            ...next.designConfig,
            businessInfo: nextBusinessInfo,
          },
        });

        setHasAIGenerated(true);
        setLastGeneratedDescription(next.description || '');

        toast.success(t('ai.appliedToFieldsTitle'), {
          description: t('ai.appliedToFieldsDescription'),
          duration: 6000,
        });
        setPhase('refine');
      } else {
        toast.error(t('ai.generationFailed'), {
          description: t('ai.failedToGenerateSuggestions'),
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error(t('ai.generationFailed'), {
        description: t('ai.failedToGenerateSuggestions'),
        duration: 6000,
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
      setGenerationSteps([]);
    }
  };

  return {
    isGenerating,
    generationSteps,
    currentStep,
    handleAIGeneration,
  };
}
