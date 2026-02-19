import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TranslationKeys, useI18n } from '@/lib/i18n';
import type { PlatformType, ProjectConfig } from '@/types/project-config';
import { FormikProps } from 'formik';
import { useCallback } from 'react';

interface PlatformTypeFieldProps {
  formik: FormikProps<ProjectConfig | { platformType?: PlatformType }>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  disabled?: boolean;
}

const platformOptions: PlatformType[] = [
  'business-site',
  'personal-brand',
  'portfolio',
];

export function PlatformTypeField({
  formik,
  projectConfig,
  onProjectConfigChange,
  disabled = false,
}: PlatformTypeFieldProps) {
  const { t } = useI18n();

  // Prefer formik value, fall back to projectConfig, then empty string
  const value = formik.values.platformType || projectConfig.platformType || '';

  // Memoize the change handler to prevent unnecessary function references
  const handleValueChange = useCallback(
    (val: string) => {
      // Only update if value actually changed
      if (val === value) return;

      // Update Formik first (local state)
      formik.setFieldValue('platformType', val);

      // Update global store
      onProjectConfigChange({
        ...projectConfig,
        platformType: val as PlatformType,
      });
    },
    [formik, projectConfig, onProjectConfigChange, value]
  );

  // Convert kebab-case to camelCase for translation keys
  const getTranslationKey = (option: PlatformType): string => {
    const camelCase = option.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    return `wizard.platform.${camelCase}.title`;
  };

  return (
    <div className="space-y-[8px]">
      <div className="group relative rounded-[8px] border-[1.5px] border-solid bg-transparent border-gray-300 dark:border-[var(--border-subtle)] focus-within:border-gray-400 dark:focus-within:border-white/40 transition-all duration-200 overflow-hidden">
        <Select
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-[16px] px-[16px] rounded-[8px]">
            <SelectValue placeholder={t('platformType.label')} />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {t(getTranslationKey(option) as TranslationKeys)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formik.errors.platformType && formik.touched.platformType && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {formik.errors.platformType as string}
        </div>
      )}
    </div>
  );
}
