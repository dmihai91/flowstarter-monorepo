import { useTranslations } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { IndustryField } from '../fields/IndustryField';

interface IndustrySectionProps {
  formik: FormikProps<ProjectConfig>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  industries: Array<{ id: string; name: string }>;
  isLoadingIndustries: boolean;
  disabled?: boolean;
}

export function IndustrySection({
  formik,
  projectConfig,
  onProjectConfigChange,
  industries,
  isLoadingIndustries,
  disabled = false,
}: IndustrySectionProps) {
  const { t } = useTranslations();

  return (
    <div
      className={`space-y-4 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium leading-[1.3] text-gray-900 dark:text-white">
          {t('ai.industry')}
        </label>
        <div className="text-sm font-normal leading-[1.4] text-gray-600 dark:text-gray-400">
          {t('basic.industry.selectIndustryDescription')}
        </div>
      </div>
      <IndustryField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        industries={industries}
        isLoadingIndustries={isLoadingIndustries}
        disabled={disabled}
      />
    </div>
  );
}
