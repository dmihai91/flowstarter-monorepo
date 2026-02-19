/* eslint-disable @typescript-eslint/no-explicit-any */
import { aiAgentService } from '@/lib/ai/ai-agent-service';
import { useTranslations } from '@/lib/i18n';
import { ChipAction, useProjectAIStore } from '@/store/ai-suggestions-store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export type FieldType = 'names' | 'description' | 'USP';

interface BusinessInfo {
  businessType: string;
  industry: string;
  targetAudience?: string;
  uniqueSellingPoint?: string;
  goals?: string; // ignored by API prompt
  description?: string;
}

export type RegenContext = Record<string, unknown> & {
  chipAction?: ChipAction;
};

export function useProjectAiSuggestions(templateId: string) {
  const { t } = useTranslations();
  const store = useProjectAIStore();

  const generateMutation = useMutation({
    mutationFn: async (params: {
      businessInfo: BusinessInfo;
      projectId?: string;
      pipelineId?: string;
    }) => {
      const res = await aiAgentService.generateProjectSuggestions(
        templateId,
        params.businessInfo,
        params.projectId,
        params.pipelineId
      );
      return res.response;
    },
    onMutate: () => {
      store.setIsGenerating(true);

      // Turn on per-field loading indicators during full generation
      store.setFieldLoading('names', true);
      store.setFieldLoading('description', true);
      store.setFieldLoading('USP', true);
    },
    onSuccess: (response) => {
      // Type guard for response object
      const res = response as Record<string, unknown>;
      store.setSuggestions({
        names: Array.isArray(res.names) ? res.names : [],
        description: typeof res.description === 'string' ? res.description : '',
        businessModel:
          typeof res.businessModel === 'string' ? res.businessModel : '',
        brandTone: typeof res.brandTone === 'string' ? res.brandTone : '',
        keyServices: typeof res.keyServices === 'string' ? res.keyServices : '',
        USP: typeof res.USP === 'string' ? res.USP : '',
        primaryCTA: typeof res.primaryCTA === 'string' ? res.primaryCTA : '',
        contactPreference:
          typeof res.contactPreference === 'string'
            ? res.contactPreference
            : '',
        additionalFeatures:
          typeof res.additionalFeatures === 'string'
            ? res.additionalFeatures
            : '',
      });
      store.setShowSuggestions(true);
    },
    onError: (err: Error & { response?: { status?: number; data?: any } }) => {
      console.error(err);

      // Check if this is a content moderation error
      const status = (err as any)?.response?.status;
      const code = (err as any)?.response?.data?.code;
      const isContentViolation = status === 400 && code === 'CONTENT_REJECTED';

      if (isContentViolation) {
        // Content moderation errors are now handled inline by individual fields
        toast.error(t('ai.contentViolation'), {
          description:
            err?.response?.data?.message || t('ai.pleaseReviewContent'),
        });
        return;
      }

      // Regular error handling
      toast.error(t('ai.generationFailed'), {
        description: err?.message || t('ai.unableToGenerateSuggestions'),
      });
    },
    onSettled: () => {
      store.setIsGenerating(false);
      store.setFieldLoading('names', false);
      store.setFieldLoading('description', false);
      store.setFieldLoading('USP', false);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (params: {
      field: FieldType;
      businessInfo: BusinessInfo;
      context?: RegenContext;
    }) => {
      const { field, businessInfo, context } = params;
      const res = await aiAgentService.regenerateProjectField(
        field,
        templateId,
        businessInfo,
        context || {}
      );
      return {
        field,
        response: res.response,
        chipAction: context?.chipAction,
      };
    },
    onMutate: (vars) => {
      const map: Record<FieldType, keyof typeof store.loading> = {
        names: 'names',
        description: 'description',
        USP: 'USP',
      };
      store.setFieldLoading(map[vars.field], true);
      if (vars.context && 'chipAction' in vars.context) {
        store.setFieldAction(
          map[vars.field],
          String(vars.context.chipAction) as ChipAction
        );
      }
    },
    onSuccess: ({ field, response }) => {
      if (
        field === 'names' &&
        typeof response === 'object' &&
        response !== null
      ) {
        const names =
          'names' in response && Array.isArray(response.names)
            ? response.names
            : [];
        store.setSuggestions({ names });
      } else if (
        field === 'description' &&
        typeof response === 'object' &&
        response !== null
      ) {
        const description =
          'description' in response && typeof response.description === 'string'
            ? response.description
            : '';
        store.setSuggestions({ description });
      } else if (
        field === 'USP' &&
        typeof response === 'object' &&
        response !== null
      ) {
        const usp =
          'USP' in response && typeof response.USP === 'string'
            ? response.USP
            : 'usp' in response && typeof response.usp === 'string'
            ? response.usp
            : '';
        store.setSuggestions({ USP: usp });
      }
    },
    onError: (err: Error & { response?: { status?: number; data?: any } }) => {
      console.error(err);

      // Check if this is a content moderation error
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const isContentViolation = status === 400 && code === 'CONTENT_REJECTED';

      if (isContentViolation) {
        // Content moderation errors are now handled inline by individual fields
        toast.error(t('ai.contentViolation'), {
          description:
            err?.response?.data?.message || t('ai.pleaseReviewContent'),
        });
        return;
      }

      // Regular error handling
      toast.error(t('ai.generationFailed'), {
        description: err?.message || 'Please try again.',
      });
    },
    onSettled: (_data, _err, vars) => {
      const map: Record<FieldType, keyof typeof store.loading> = {
        names: 'names',
        description: 'description',
        USP: 'USP',
      };
      store.setFieldLoading(map[vars.field], false);
      store.setFieldAction(map[vars.field], '');
    },
  });

  return {
    store,
    generate: generateMutation.mutateAsync,
    isGenerating: store.isGenerating,
    regenerate: regenerateMutation.mutateAsync,
  };
}
