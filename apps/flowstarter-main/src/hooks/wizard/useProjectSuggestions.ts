import { aiAgentService } from '@/lib/ai/ai-agent-service';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectSuggestions } from './useAiSuggestionsState';
import { useProjectAiSuggestions } from './useProjectAISuggestions';

interface GenericInfo {
  domain?: string;
  goal?: string[];
  targetAudience?: string;
  description?: string;
}

interface BusinessInfo {
  businessType: string;
  industry: string;
  targetAudience: string;
  uniqueSellingPoint: string;
  goals: string;
  description: string;
}

export function useProjectSuggestions(templateId: string) {
  const { t } = useTranslations();
  const ai = useProjectAiSuggestions(templateId);
  const projectConfig = useWizardStore((state) => state.projectConfig);

  const [lastBusinessInfo, setLastBusinessInfo] = useState<BusinessInfo | null>(
    null
  );

  const generateSuggestions = async <T extends BusinessInfo & GenericInfo>(
    businessInfoInput: T
  ): Promise<ProjectSuggestions | undefined> => {
    setLastBusinessInfo(businessInfoInput as BusinessInfo);

    try {
      const businessInfo: BusinessInfo = {
        businessType:
          businessInfoInput.businessType || templateId || 'business',
        industry: businessInfoInput.domain || 'general',
        targetAudience: businessInfoInput.targetAudience,
        uniqueSellingPoint: businessInfoInput.description || 'quality service',
        goals: businessInfoInput.goal?.join(', ') || '',
        description: businessInfoInput.description,
      };

      console.log('Starting AI suggestion generation with business info:', {
        businessType: businessInfo.businessType,
        industry: businessInfo.industry,
        hasTargetAudience: !!businessInfo.targetAudience,
        hasDescription: !!businessInfo.description,
      });

      const res = await ai.generate({
        businessInfo,
        // Do not send a non-UUID projectId to avoid API 22P02 errors
        projectId: undefined,
        pipelineId: `wizard-${Date.now()}`,
      });

      // Type guard for response object
      const result = res as unknown as Record<string, unknown>;
      return {
        names: Array.isArray(result.names) ? result.names : [],
        description:
          typeof result.description === 'string' ? result.description : '',
        targetUsers:
          typeof result.targetUsers === 'string' ? result.targetUsers : '',
        businessGoals:
          typeof result.businessGoals === 'string' ? result.businessGoals : '',
        businessModel:
          typeof result.businessModel === 'string' ? result.businessModel : '',
        brandTone: typeof result.brandTone === 'string' ? result.brandTone : '',
        keyServices:
          typeof result.keyServices === 'string' ? result.keyServices : '',
        USP: typeof result.USP === 'string' ? result.USP : '',
        primaryCTA:
          typeof result.primaryCTA === 'string' ? result.primaryCTA : '',
        contactPreference:
          typeof result.contactPreference === 'string'
            ? result.contactPreference
            : '',
        additionalFeatures:
          typeof result.additionalFeatures === 'string'
            ? result.additionalFeatures
            : '',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error('Failed to generate suggestions:', {
        error: errorMessage,
        templateId,
        businessInfo: {
          businessType:
            businessInfoInput.businessType || templateId || 'business',
          industry: businessInfoInput.domain,
          hasTargetAudience: !!businessInfoInput.targetAudience,
          hasDescription: !!businessInfoInput.description,
        },
      });

      // Determine the type of error and show appropriate message
      let toastTitle = t('ai.generationFailed');
      let toastDescription = t('ai.failedToGenerateSuggestions');

      if (errorMessage.includes('Invalid response format')) {
        toastTitle = t('ai.aiResponseError');
        toastDescription = t('ai.aiServiceReturnedUnexpectedFormat');
      } else if (errorMessage.includes('No content generated')) {
        toastTitle = t('ai.generationError');
        toastDescription = t('ai.aiServiceDidNotGenerateContent');
      } else if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network')
      ) {
        toastTitle = t('ai.connectionError');
        toastDescription = t('ai.unableToConnectToAIService');
      } else if (errorMessage.includes('timeout')) {
        toastTitle = t('ai.timeoutError');
        toastDescription = t('ai.aiServiceTookTooLongToRespond');
      } else if (errorMessage.includes('rate limit')) {
        toastTitle = t('ai.tooManyRequests');
        toastDescription = t('ai.youveMadeTooManyRequestsRecently');
      }

      toast.error(toastTitle, {
        description: toastDescription,
      });
    } finally {
      // ai hook manages isGenerating
    }
  };

  // Function to regenerate specific field using agent service
  const regenerateField = async (
    fieldType: 'names' | 'description' | 'USP',
    overrideAdditionalContext: Record<string, string> = {}
  ) => {
    if (!lastBusinessInfo) {
      toast.error(t('ai.noBusinessInformation'), {
        description: t('ai.pleaseProvideBusinessInformation'),
      });
      return;
    }

    // Set loading state for this specific field
    ai.store.setFieldLoading(fieldType === 'USP' ? 'USP' : fieldType, true);

    try {
      console.log(
        `Regenerating ${fieldType} with business info:`,
        lastBusinessInfo
      );

      const randomSeed = Math.floor(Math.random() * 1000);
      const timestamp = Date.now();

      // Create additional context based on field type
      const additionalContext: Record<string, unknown> = {
        randomSeed,
        timestamp,
      };

      // Add field-specific context
      switch (fieldType) {
        case 'names':
          // eslint-disable-next-line no-case-declarations
          const nameStyles = [
            'creative and innovative',
            'professional and trustworthy',
            'modern and tech-savvy',
            'warm and approachable',
            'bold and memorable',
            'elegant and sophisticated',
          ];
          additionalContext.nameStyle =
            nameStyles[randomSeed % nameStyles.length];
          additionalContext.creativeFocus =
            randomSeed % 2 === 0
              ? 'innovation and growth'
              : 'reliability and expertise';
          break;

        case 'description':
          // eslint-disable-next-line no-case-declarations
          const descriptionApproaches = [
            'benefit-focused and results-oriented',
            'story-driven and emotional',
            'feature-rich and detailed',
            'problem-solving and solution-focused',
            'vision-forward and aspirational',
            'customer-centric and relatable',
          ];
          additionalContext.descriptionApproach =
            descriptionApproaches[randomSeed % descriptionApproaches.length];
          additionalContext.emphasisFocus =
            randomSeed % 2 === 0
              ? 'transformation and impact'
              : 'value and expertise';
          break;

        // targetUsers and businessGoals regeneration disabled
        // no-op
        // break;

        case 'USP':
          // eslint-disable-next-line no-case-declarations
          const uspAngles = [
            'competitive differentiation',
            'unique value delivery',
            'customer benefit focus',
            'innovation and technology',
            'service excellence and quality',
            'market positioning and expertise',
          ];
          additionalContext.uspAngle = uspAngles[randomSeed % uspAngles.length];
          additionalContext.uspEmphasis =
            randomSeed % 2 === 0
              ? 'innovation and uniqueness'
              : 'proven results and reliability';
          break;
      }

      await ai.regenerate({
        field: fieldType,
        businessInfo: lastBusinessInfo,
        context: { ...additionalContext, ...overrideAdditionalContext },
      });
    } catch (error) {
      console.error(`Error regenerating ${fieldType}:`, error);

      toast.error(t('ai.generationFailed'), {
        description: `Failed to regenerate ${fieldType
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()}. Please try again.`,
        duration: 5000,
      });
    } finally {
      ai.store.setFieldLoading(fieldType === 'USP' ? 'USP' : fieldType, false);
    }
  };

  // Function to generate USP with specific context using agent service
  const generateUSPWithContext = async (context: {
    competitorAnalysis: string;
    keyStrengths: string;
    targetMarket: string;
  }) => {
    ai.store.setFieldLoading('USP', true);

    try {
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 1000);

      const uspContext = {
        competitorAnalysis: context.competitorAnalysis,
        keyStrengths: context.keyStrengths,
        targetMarket: context.targetMarket,
        randomSeed,
        timestamp,
      };

      const businessInfo = lastBusinessInfo || {
        businessType: 'business',
        industry:
          projectConfig.designConfig?.businessInfo?.industry || 'general',
        targetAudience: context.targetMarket,
        uniqueSellingPoint: `Key strengths: ${context.keyStrengths}`,
        goals: 'Generate compelling USP',
        description: `Key strengths: ${context.keyStrengths}`,
      };

      const agentResponse = await aiAgentService.generateUSP(
        businessInfo,
        uspContext
      );
      const result = agentResponse.response as Record<string, unknown>;

      // Update the USP field
      const usp =
        typeof result.USP === 'string'
          ? result.USP
          : typeof result.usp === 'string'
          ? result.usp
          : '';
      ai.store.setSuggestions({
        USP: usp,
      });

      // Show suggestions so the user can see the generated USP
      ai.store.setShowSuggestions(true);
    } catch (error) {
      console.error(`Error generating USP:`, error);
      toast.error(t('ai.generationFailed'), {
        description: t('ai.failedToGenerateUSP'),
        duration: 5000,
      });
    } finally {
      ai.store.setFieldLoading('USP', false);
    }
  };

  return {
    suggestions: ai.store.suggestions,
    showSuggestions: ai.store.showSuggestions,
    isGeneratingWithAI: ai.isGenerating,
    generateSuggestions,
    loadingStates: ai.store.loading,
    regenerateNames: (customPrompt?: string) => {
      const ctx: Record<string, string> = {};
      if (customPrompt) {
        ctx.userInstructions = customPrompt;
        ctx.nameStyle = 'follow user instructions';
      } else {
        const styles = ['creative', 'professional', 'modern', 'bold'];
        ctx.nameStyle = styles[Math.floor(Math.random() * styles.length)];
      }
      return regenerateField('names', ctx);
    },
    regenerateDescription: (customPrompt?: string) => {
      const ctx: Record<string, string> = {};
      if (customPrompt) {
        ctx.userInstructions = customPrompt;
        ctx.descriptionApproach = 'follow user instructions';
      } else {
        const approaches = ['benefit-focused', 'story-driven', 'solution-focused'];
        ctx.descriptionApproach = approaches[Math.floor(Math.random() * approaches.length)];
      }
      return regenerateField('description', ctx);
    },
    regenerateTargetUsers: undefined,
    regenerateBusinessGoals: undefined,
    regenerateUSP: (customPrompt?: string) => {
      const ctx: Record<string, string> = {};
      if (customPrompt) {
        ctx.userInstructions = customPrompt;
        ctx.uspAngle = 'follow user instructions';
      } else {
        const angles = ['competitive differentiation', 'customer benefit focus', 'innovation'];
        ctx.uspAngle = angles[Math.floor(Math.random() * angles.length)];
      }
      return regenerateField('USP', ctx);
    },
    generateUSPWithContext,
  };
}
