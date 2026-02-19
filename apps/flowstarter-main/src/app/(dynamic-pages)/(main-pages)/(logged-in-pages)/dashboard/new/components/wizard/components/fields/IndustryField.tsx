import { AutoComplete, type AutoCompleteOption } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { FormikProps } from 'formik';

interface IndustryFieldProps {
  formik: FormikProps<ProjectConfig | { industry: string }>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  industries: { id: string; name: string }[];
  isLoadingIndustries: boolean;
  disabled?: boolean;
}

export function IndustryField({
  formik,
  projectConfig,
  onProjectConfigChange,
  industries,
  isLoadingIndustries,
  disabled = false,
}: IndustryFieldProps) {
  const { t } = useI18n();

  return (
    <div>
      <AutoComplete
        options={
          industries.map((i) => ({
            value: i.id,
            label: i.name,
          })) as AutoCompleteOption[]
        }
        value={formik.values.industry}
        onValueChange={(val) => {
          // Update Formik
          formik.setFieldValue('industry', val);
          // Update shared store
          useWizardStore.getState().setSelectedIndustry(val);
          const nextBusinessInfo = {
            ...(projectConfig.designConfig?.businessInfo || {
              industry: '',
              targetAudience: '',
              brandValues: '',
              competitors: '',
              additionalNotes: '',
            }),
            industry: val,
          };
          onProjectConfigChange({
            ...projectConfig,
            designConfig: {
              ...projectConfig.designConfig,
              businessInfo: nextBusinessInfo,
            },
          });
        }}
        placeholder={
          isLoadingIndustries
            ? t('basic.industry.loadingPlaceholder')
            : t('basic.industry.selectPlaceholder')
        }
        searchPlaceholder={t('basic.industry.searchPlaceholder')}
        emptyMessage={t('basic.industry.emptyMessage')}
        disabled={isLoadingIndustries || disabled}
      />
      {formik.errors.industry && formik.touched.industry && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {formik.errors.industry}
        </div>
      )}
    </div>
  );
}
