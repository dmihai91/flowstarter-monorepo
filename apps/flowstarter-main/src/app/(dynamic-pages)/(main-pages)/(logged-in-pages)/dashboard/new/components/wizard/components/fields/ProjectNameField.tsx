import {
  AiRewriteMenu,
  ClearableFieldWrapper,
  FormInput,
} from '@/components/ui';
import { Label } from '@/components/ui/label';
import {
  RegenContext,
  useProjectAiSuggestions,
} from '@/hooks/wizard/useProjectAISuggestions';
import { useTranslations } from '@/lib/i18n';
import { NameValidator } from '@/lib/utils';
import type { ProjectConfig } from '@/types/project-config';
import { FormikProps } from 'formik';
import { AlertCircle, Check } from 'lucide-react';

interface ProjectNameAvailability {
  isAvailable: boolean;
  isChecking: boolean;
  suggestedDomain: string | null;
  suggestions: string[];
  error?: string;
}

interface ProjectNameFieldProps {
  formik: FormikProps<
    | ProjectConfig
    | {
        name: string;
        description: string;
        targetUsers: string;
        businessGoals: string;
        USP: string;
        industry: string;
      }
  >;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  nameAvailability: ProjectNameAvailability;
  templateId: string;
  isGlobalGenerating?: boolean;
}

export function ProjectNameField({
  formik,
  projectConfig,
  onProjectConfigChange,
  nameAvailability,
  templateId,
  isGlobalGenerating = false,
}: ProjectNameFieldProps) {
  const ai = useProjectAiSuggestions(templateId);
  const { t } = useTranslations();
  const { loading } = ai.store;
  const isBusy = Boolean(loading.names || isGlobalGenerating);
  const handleRegenerateNames = (
    cue?: 'catchy' | 'alternatives' | 'shorter'
  ) => {
    const industry =
      projectConfig.designConfig?.businessInfo?.industry ||
      formik.values.industry ||
      'general';
    const targetAudience =
      projectConfig.designConfig?.businessInfo?.targetAudience ||
      formik.values.targetUsers ||
      '';
    const baseDesc =
      projectConfig.description || formik.values.description || '';
    const fallbackUSP = formik.values.USP || projectConfig.USP || '';
    const ensuredDescription = (() => {
      const text = (baseDesc || fallbackUSP).trim();
      if (text.length >= 10) return text;
      const audiencePart = targetAudience
        ? `for ${targetAudience}`
        : 'for customers';
      const uspPart = fallbackUSP ? `, focusing on ${fallbackUSP}` : '';
      return `A ${industry} project ${audiencePart}${uspPart}.`;
    })();

    const businessInfo = {
      businessType: templateId,
      industry,
      targetAudience,
      uniqueSellingPoint: fallbackUSP || ensuredDescription,
      description: ensuredDescription,
    };

    const chipAction =
      cue === 'catchy'
        ? 'makeItCatchy'
        : cue === 'alternatives'
        ? 'alternatives'
        : cue === 'shorter'
        ? 'makeItShorter'
        : ('regenerate' as const);

    const context: RegenContext = {
      previousValue: formik.values.name || '',
      randomSeed: Math.floor(Math.random() * 100000),
      timestamp: Date.now(),
      chipAction,
      ...(cue === 'catchy'
        ? {
            nameStyle: 'creative and memorable',
            creativeFocus: 'catchy and brandable',
          }
        : cue === 'alternatives'
        ? {
            nameStyle: 'professional and diverse',
            creativeFocus: 'varied approaches',
          }
        : cue === 'shorter'
        ? {
            nameStyle: 'concise and clear',
            creativeFocus: 'brevity and readability',
          }
        : {}),
    };

    ai.regenerate({ field: 'names', businessInfo, context }).then((result) => {
      if (
        result?.response &&
        typeof result.response === 'object' &&
        result.response !== null
      ) {
        const response = result.response as Record<string, unknown>;
        if (
          'names' in response &&
          Array.isArray(response.names) &&
          response.names.length > 0
        ) {
          const candidate = response.names[0];
          const normalized = NameValidator.normalize(candidate);
          formik.setFieldValue('name', normalized);
          onProjectConfigChange({
            ...projectConfig,
            name: normalized,
          });
        }
      }
    });
  };

  return (
    <div className="space-y-[8px]">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="name"
          className="text-md font-medium leading-normal text-gray-900 dark:text-white"
        >
          {t('basic.name.label')}{' '}
        </Label>
      </div>

      <ClearableFieldWrapper
        hasValue={!!formik.values.name}
        isBusy={isBusy}
        onClear={() => {
          formik.setFieldValue('name', '', true);
          formik.setFieldTouched('name', true, true);
          onProjectConfigChange({ ...projectConfig, name: '' });
        }}
        clearLabel={t('app.clear')}
        aiMenu={
          <AiRewriteMenu
            loading={loading.names}
            disabled={isBusy}
            presetsDisabled={!(formik.values.name || '').trim() || isBusy}
            isGlobalGenerating={isGlobalGenerating}
            customPlaceholder={t('ai.customPrompt.placeholder.name')}
            onSelect={(action) => {
              if (action === 'punchy') return handleRegenerateNames('catchy');
              if (action === 'shorter') return handleRegenerateNames('shorter');
              if (action === 'alternatives')
                return handleRegenerateNames('alternatives');
              if (action === 'regenerate') return handleRegenerateNames();
            }}
            onCustomPrompt={(prompt) => {
              const industry =
                projectConfig.designConfig?.businessInfo?.industry ||
                formik.values.industry ||
                'general';
              const targetAudience =
                projectConfig.designConfig?.businessInfo?.targetAudience ||
                formik.values.targetUsers ||
                '';
              const baseDesc =
                projectConfig.description || formik.values.description || '';
              const fallbackUSP = formik.values.USP || projectConfig.USP || '';
              const ensuredDescription = (() => {
                const text = (baseDesc || fallbackUSP).trim();
                if (text.length >= 10) return text;
                const audiencePart = targetAudience
                  ? `for ${targetAudience}`
                  : 'for customers';
                const uspPart = fallbackUSP
                  ? `, focusing on ${fallbackUSP}`
                  : '';
                return `A ${industry} project ${audiencePart}${uspPart}.`;
              })();

              const businessInfo = {
                businessType: templateId,
                industry,
                targetAudience,
                uniqueSellingPoint: fallbackUSP || ensuredDescription,
                description: ensuredDescription,
              };

              const context: RegenContext = {
                previousValue: formik.values.name || '',
                randomSeed: Math.floor(Math.random() * 100000),
                timestamp: Date.now(),
                chipAction: 'regenerate',
                customPrompt: prompt,
                nameStyle: 'follow custom instructions strictly',
                creativeFocus: 'custom',
              } as RegenContext;

              ai.regenerate({ field: 'names', businessInfo, context }).then(
                (result) => {
                  if (
                    result?.response &&
                    typeof result.response === 'object' &&
                    result.response !== null
                  ) {
                    const response = result.response as Record<string, unknown>;
                    if (
                      'names' in response &&
                      Array.isArray(response.names) &&
                      response.names.length > 0
                    ) {
                      const candidate = response.names[0];
                      const normalized = NameValidator.normalize(candidate);
                      formik.setFieldValue('name', normalized);
                      onProjectConfigChange({
                        ...projectConfig,
                        name: normalized,
                      });
                    }
                  }
                }
              );
            }}
          />
        }
      >
        <FormInput
          id="name"
          value={formik.values.name}
          onChange={(e) => {
            const newValue = e.target.value;
            formik.setFieldValue('name', newValue);

            onProjectConfigChange({
              ...projectConfig,
              name: newValue,
            });
          }}
          onBlur={() => {
            formik.setFieldTouched('name', true);
            const currentValue = formik.values.name || '';
            const normalized = NameValidator.normalize(currentValue);

            if (normalized !== currentValue) {
              formik.setFieldValue('name', normalized);
              onProjectConfigChange({ ...projectConfig, name: normalized });
            }
          }}
          placeholder={t('basic.name.placeholder')}
          disabled={isBusy}
          className="h-auto text-base font-normal leading-normal !bg-transparent dark:!bg-transparent !backdrop-blur-none border-0 focus:ring-0 focus-visible:ring-0 focus:border-0 shadow-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[var(--ui-text-placeholder)] rounded-[8px] outline-none w-full py-4 pl-3 pr-[100px] sm:pr-[200px]"
          style={{
            backgroundColor: 'transparent',
          }}
          showError={false}
        />
      </ClearableFieldWrapper>

      {projectConfig.name &&
        projectConfig.name.length > 1 &&
        !nameAvailability.isChecking && (
          <div className="space-y-3">
            {formik.errors.name &&
            (formik.touched.name || formik.values.name.length > 0) ? (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{String(formik.errors.name)}</span>
              </div>
            ) : nameAvailability.isAvailable ? (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                <Check className="w-4 h-4" />
                <span>
                  "{formik.values.name}" {t('basic.name.available')}
                </span>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mb-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    "{formik.values.name}" {t('basic.name.taken')}
                  </span>
                </div>

                {nameAvailability.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                      {t('basic.suggestions.availableAlternatives')}
                    </p>
                    <div className="grid gap-3">
                      {nameAvailability.suggestions
                        .slice(0, 3)
                        .map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              const domainName = suggestion.replace(
                                '.flowstarter.io',
                                ''
                              );
                              const normalizedName = NameValidator.normalize(
                                domainName.replace(/-/g, ' ')
                              );
                              formik.setFieldValue('name', normalizedName);
                              onProjectConfigChange({
                                ...projectConfig,
                                name: normalizedName,
                              });
                            }}
                            className="flex items-center justify-between p-2 bg:(var(--surface-2)) rounded border border-red-200 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            <span className="text-gray-900 dark:text-gray-100 text-sm">
                              {suggestion}
                            </span>
                            <span className="text-red-600 dark:text-red-400 text-xs">
                              {t('basic.suggestions.useThis')}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
