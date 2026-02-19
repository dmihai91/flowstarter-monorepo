/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AiRewriteMenu,
  ClearableFieldWrapper,
  FormTextarea,
} from '@/components/ui';
import { InlineModerationError } from '@/components/ui/inline-moderation-error';
import { Label } from '@/components/ui/label';
import {
  RegenContext,
  useProjectAiSuggestions,
} from '@/hooks/wizard/useProjectAISuggestions';
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '@/lib/content-limits';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { FormikProps } from 'formik';
import { useEffect, useRef, useState } from 'react';

interface ProjectDescriptionFieldProps {
  formik: FormikProps<{
    description: string;
    industry?: string;
  }>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  templateId: string;
  isGlobalGenerating?: boolean;
  hideAiMenu?: boolean;
  moderateOnBlur?: boolean;
  hideLabel?: boolean;
}

export function ProjectDescriptionField({
  formik,
  projectConfig,
  onProjectConfigChange,
  templateId,
  isGlobalGenerating = false,
  hideAiMenu = false,
  moderateOnBlur = false,
  hideLabel = false,
}: ProjectDescriptionFieldProps) {
  const ai = useProjectAiSuggestions(templateId);
  const { t } = useTranslations();
  const { loading } = ai.store;
  const isBusy = Boolean(loading.description || isGlobalGenerating);
  const setLastGeneratedDescription = useWizardStore(
    (s) => s.setLastGeneratedDescription
  );
  // Debounce timer for validating userDescription after typing stops
  const validateTimerRef = useRef<number | null>(null);
  // State for inline moderation error
  const [moderationError, setModerationError] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (validateTimerRef.current) {
        window.clearTimeout(validateTimerRef.current);
        validateTimerRef.current = null;
      }
    };
  }, []);

  const handleRegenerateDescription = (
    variant?: 'regenerate' | 'catchy' | 'shorter' | 'alternatives'
  ) => {
    const industry =
      projectConfig.designConfig?.businessInfo?.industry ||
      formik.values.industry ||
      'general';

    const businessInfo = {
      businessType: templateId,
      industry,
      targetAudience:
        projectConfig.designConfig?.businessInfo?.targetAudience || '',
      uniqueSellingPoint:
        projectConfig.description || formik.values.description || '',
      description: projectConfig.description || formik.values.description || '',
    };

    const chipAction =
      variant === 'catchy'
        ? 'makeItCatchy'
        : variant === 'shorter'
        ? 'makeItShorter'
        : variant === 'alternatives'
        ? 'alternatives'
        : 'regenerate';

    const context: RegenContext = {
      previousValue: formik.values.description || '',
      randomSeed: Math.floor(Math.random() * 100000),
      timestamp: Date.now(),
      chipAction,
      ...(variant === 'catchy'
        ? {
            descriptionApproach: 'story-driven and emotional',
            emphasisFocus: 'memorable, punchy phrasing',
          }
        : variant === 'shorter'
        ? {
            descriptionApproach: 'concise and benefit-focused',
            emphasisFocus: 'brevity and clarity (<= 2 sentences)',
          }
        : variant === 'alternatives'
        ? {
            descriptionApproach: 'multiple distinct angles',
            emphasisFocus: 'varied tone and framing',
          }
        : {}),
    };

    ai.regenerate({ field: 'description', businessInfo, context }).then(
      (result) => {
        if (
          result?.response &&
          typeof result.response === 'object' &&
          result.response !== null
        ) {
          const response = result.response as Record<string, unknown>;
          if (
            'description' in response &&
            typeof response.description === 'string'
          ) {
            const newDescription = response.description;
            onProjectConfigChange({
              ...projectConfig,
              description: newDescription,
            });
            formik.setFieldValue('description', newDescription);

            // Update the last generated description so Continue button can be enabled
            setLastGeneratedDescription(newDescription);
          }
        }
      }
    );
  };

  return (
    <div className="mt-[20px] space-y-[8px]">
      {!hideLabel && (
        <div className="flex items-center justify-between form-helper-inline">
          <Label
            htmlFor="description"
            className="text-lg font-medium leading-normal text-gray-900 dark:text-white"
          >
            {t('basic.description.label')}{' '}
          </Label>
        </div>
      )}

      <ClearableFieldWrapper
        hasValue={!!formik.values.description}
        isBusy={isBusy}
        onClear={() => {
          formik.setFieldValue('description', '', true);
          formik.setFieldTouched('description', true, true);
          onProjectConfigChange({ ...projectConfig, description: '' });
        }}
        clearLabel={t('app.clear')}
        className="bg-white dark:bg-transparent"
        counter={
          <>
            {(formik.values.description || '').length}/{DESCRIPTION_MAX}
          </>
        }
        aiMenu={
          <AiRewriteMenu
            loading={loading.description}
            disabled={isBusy}
            presetsDisabled={
              !(formik.values.description || '').trim() || isBusy
            }
            isGlobalGenerating={isGlobalGenerating}
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            customPlaceholder={t('ai.customPrompt.placeholder.description')}
            onSelect={(action) => {
              if (action === 'regenerate')
                return handleRegenerateDescription('regenerate');
              if (action === 'shorter')
                return handleRegenerateDescription('shorter');
              if (action === 'punchy')
                return handleRegenerateDescription('catchy');
              if (action === 'alternatives')
                return handleRegenerateDescription('alternatives');
            }}
            onCustomPrompt={(prompt) => {
              const industry =
                projectConfig.designConfig?.businessInfo?.industry ||
                formik.values.industry ||
                'general';

              const businessInfo = {
                businessType: templateId,
                industry,
                targetAudience:
                  projectConfig.designConfig?.businessInfo?.targetAudience ||
                  '',
                uniqueSellingPoint:
                  projectConfig.description || formik.values.description || '',
                description:
                  projectConfig.description || formik.values.description || '',
              };

              const context: RegenContext = {
                previousValue: formik.values.description || '',
                randomSeed: Math.floor(Math.random() * 100000),
                timestamp: Date.now(),
                chipAction: 'regenerate',
                customPrompt: prompt,
                descriptionApproach: 'follow custom instructions strictly',
              } as RegenContext;

              ai.regenerate({
                field: 'description',
                businessInfo,
                context,
              }).then((result) => {
                if (
                  result?.response &&
                  typeof result.response === 'object' &&
                  result.response !== null
                ) {
                  const response = result.response as Record<string, unknown>;
                  if (
                    'description' in response &&
                    typeof response.description === 'string'
                  ) {
                    formik.setFieldValue('description', response.description);
                    onProjectConfigChange({
                      ...projectConfig,
                      description: response.description,
                    });
                  }
                }
              });
            }}
          />
        }
      >
        <FormTextarea
          id={'project-description'}
          required
          minLength={DESCRIPTION_MIN}
          maxLength={DESCRIPTION_MAX}
          aria-label={t('basic.description.label')}
          value={formik.values.description}
          onChange={(e) => {
            // Clear moderation error when user starts typing
            if (moderationError) {
              setModerationError(null);
            }

            formik.setFieldValue('description', e.target.value);
            onProjectConfigChange({
              ...projectConfig,
              description: e.target.value,
            });
          }}
          onBlur={async () => {
            formik.setFieldTouched('description', true);
            if (moderateOnBlur) {
              try {
                const res = await fetch('/api/ai/moderate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessInfo: {
                      description: formik.values.description || '',
                      industry: formik.values.industry || 'general',
                      targetAudience: '',
                      uniqueSellingPoint: '',
                      keyServices: '',
                      goals: '',
                    },
                  }),
                });
                if (res.status === 400) {
                  const err = await res.json();
                  setModerationError(err);
                  return;
                } else {
                  // Clear moderation error if content is acceptable
                  setModerationError(null);
                }
              } catch (_) {
                // ignore network errors for blur moderation
              }
            }
          }}
          placeholder={t('basic.description.placeholder')}
          disabled={isBusy}
          rows={5}
          className="text-base font-normal leading-normal resize-none transition-all duration-200 !bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus:border-0 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[var(--ui-text-placeholder)] w-full min-h-[120px] max-w-full pl-[16px] pr-[100px] sm:pr-[200px] pt-[16px] pb-[40px] rounded-[8px]"
          style={{
            backgroundColor: 'transparent',
          }}
          showError={false}
        />
      </ClearableFieldWrapper>
      {moderationError && (
        <InlineModerationError
          error={moderationError}
          onDismiss={() => setModerationError(null)}
        />
      )}
      {formik.touched.description && formik.errors.description && (
        <div className="text-sm text-red-600 dark:text-red-400 mt-2">
          {typeof formik.errors.description === 'string'
            ? formik.errors.description
            : null}
        </div>
      )}
      {!hideAiMenu && null}
    </div>
  );
}
