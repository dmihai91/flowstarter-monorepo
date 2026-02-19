import {
  AiRewriteMenu,
  ClearableFieldWrapper,
  FormTextarea,
} from '@/components/ui';
import { Label } from '@/components/ui/label';
import {
  RegenContext,
  useProjectAiSuggestions,
} from '@/hooks/wizard/useProjectAISuggestions';
import { UVP_MAX, UVP_MIN } from '@/lib/content-limits';
import { useTranslations } from '@/lib/i18n';
import type { ChipAction } from '@/store/ai-suggestions-store';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';

interface UVPFieldProps {
  formik: FormikProps<ProjectConfig | { USP: string }>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  templateId: string;
  isGlobalGenerating?: boolean;
}

export function UVPField({
  formik,
  projectConfig,
  onProjectConfigChange,
  templateId,
  isGlobalGenerating = false,
}: UVPFieldProps) {
  const ai = useProjectAiSuggestions(templateId);
  const { loading } = ai.store;
  const { t } = useTranslations();

  const handleRegenerateUSP = (mode?: 'regenerate' | 'punchy' | 'benefits') => {
    console.log('handleRegenerateUSP', mode);

    const industry =
      projectConfig.designConfig?.businessInfo?.industry || 'general';

    const businessInfo = {
      businessType: templateId,
      industry,
      targetAudience:
        projectConfig.designConfig?.businessInfo?.targetAudience || '',
      uniqueSellingPoint: projectConfig.description || '',
      description: projectConfig.description || '',
    };

    const chipAction: ChipAction =
      mode === 'punchy'
        ? 'makeItPunchy'
        : mode === 'benefits'
        ? 'makeItBenefitFocused'
        : 'regenerate';

    const context: RegenContext = {
      previousValue: projectConfig.USP || formik.values.USP || '',
      randomSeed: Math.floor(Math.random() * 100000),
      timestamp: Date.now(),
      chipAction,
      ...(mode === 'punchy'
        ? {
            uspAngle: 'customer benefit focus',
            uspEmphasis: 'punchy and memorable phrasing',
          }
        : mode === 'benefits'
        ? {
            uspAngle: 'customer benefit focus',
            uspEmphasis: 'clarify tangible benefits and outcomes',
          }
        : {}),
    };

    ai.regenerate({
      field: 'USP',
      businessInfo,
      context,
    }).then((result) => {
      if (
        result?.response &&
        typeof result.response === 'object' &&
        result.response !== null
      ) {
        const response = result.response as Record<string, unknown>;
        const v =
          'USP' in response && typeof response.USP === 'string'
            ? response.USP
            : 'usp' in response && typeof response.usp === 'string'
            ? response.usp
            : '';
        if (v.trim()) {
          formik.setFieldValue('USP', v, true);
          formik.setFieldTouched('USP', true, true);
          onProjectConfigChange({
            ...projectConfig,
            USP: v,
          });
        }
      }
    });
  };

  return (
    <div className="mt-[20px] space-y-[8px]">
      <div className="flex items-center justify-between form-helper-inline">
        <Label
          htmlFor="uvp"
          className="text-md font-medium leading-normal text-gray-900 dark:text-white"
        >
          {t('basic.uvp.label')}{' '}
        </Label>
      </div>
      <ClearableFieldWrapper
        hasValue={!!formik.values.USP}
        isBusy={loading.USP}
        onClear={() => {
          formik.setFieldValue('USP', '', true);
          formik.setFieldTouched('USP', true, true);
          onProjectConfigChange({ ...projectConfig, USP: '' });
        }}
        clearLabel={t('app.clear')}
        className="bg-white dark:bg-transparent"
        counter={
          <>
            {(formik.values.USP || '').length}/{UVP_MAX}
          </>
        }
        aiMenu={
          <AiRewriteMenu
            showBenefits
            loading={loading.USP}
            disabled={loading.USP}
            presetsDisabled={!(formik.values.USP || '').trim()}
            isGlobalGenerating={isGlobalGenerating}
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            customPlaceholder={t('ai.customPrompt.placeholder.uvp')}
            onSelect={(action) => {
              if (action === 'punchy') return handleRegenerateUSP('punchy');
              if (action === 'benefits') return handleRegenerateUSP('benefits');
              if (action === 'regenerate')
                return handleRegenerateUSP('regenerate');
              if (action === 'shorter') return handleRegenerateUSP('punchy');
              if (action === 'alternatives')
                return handleRegenerateUSP('punchy');
            }}
            onCustomPrompt={(prompt) => {
              const industry =
                projectConfig.designConfig?.businessInfo?.industry || 'general';

              const businessInfo = {
                businessType: templateId,
                industry,
                targetAudience:
                  projectConfig.designConfig?.businessInfo?.targetAudience ||
                  '',
                uniqueSellingPoint: projectConfig.description || '',
                description: projectConfig.description || '',
              };

              const context: RegenContext = {
                previousValue: projectConfig.USP || formik.values.USP || '',
                randomSeed: Math.floor(Math.random() * 100000),
                timestamp: Date.now(),
                chipAction: 'regenerate',
                customPrompt: prompt,
                uspAngle: 'follow custom instructions strictly',
              } as RegenContext;

              ai.regenerate({ field: 'USP', businessInfo, context }).then(
                (result) => {
                  if (
                    result?.response &&
                    typeof result.response === 'object' &&
                    result.response !== null
                  ) {
                    const response = result.response as Record<string, unknown>;
                    const v =
                      'USP' in response && typeof response.USP === 'string'
                        ? response.USP
                        : 'usp' in response && typeof response.usp === 'string'
                        ? response.usp
                        : '';
                    if (v.trim()) {
                      formik.setFieldValue('USP', v, true);
                      formik.setFieldTouched('USP', true, true);
                      onProjectConfigChange({
                        ...projectConfig,
                        USP: v,
                      });
                    }
                  }
                }
              );
            }}
          />
        }
      >
        <FormTextarea
          id="uvp"
          required
          minLength={UVP_MIN}
          maxLength={UVP_MAX}
          value={formik.values.USP}
          onChange={(e) => {
            formik.setFieldValue('USP', e.target.value);
            onProjectConfigChange({
              ...projectConfig,
              USP: e.target.value,
            });
          }}
          onBlur={() => {
            formik.setFieldTouched('USP', true);
          }}
          placeholder={t('basic.uvp.placeholder')}
          rows={3}
          className="text-base font-normal leading-normal resize-none transition-all duration-200 !bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus:border-0 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[var(--ui-text-placeholder)] w-full min-h-[100px] max-w-full pl-[16px] pr-[100px] sm:pr-[200px] pt-[16px] pb-[40px] rounded-[8px]"
          style={{
            backgroundColor: 'transparent',
          }}
          showError={false}
        />
      </ClearableFieldWrapper>
      {formik.touched.USP && formik.errors.USP && (
        <div className="text-sm text-red-600 dark:text-red-400 mt-2">
          {typeof formik.errors.USP === 'string' ? formik.errors.USP : null}
        </div>
      )}
    </div>
  );
}
