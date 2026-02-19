import { FormTagsInput } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';

interface FormValues {
  targetUsers: string;
}

interface AudienceFieldProps {
  formik: FormikProps<FormValues>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  audienceOptions: string[];
}

export function AudienceField({
  formik,
  projectConfig,
  onProjectConfigChange,
  audienceOptions,
}: AudienceFieldProps) {
  const { t } = useTranslations();

  return (
    <div className="mt-[20px] space-y-[8px]">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="targetUsers"
          className="text-md font-medium leading-normal text-gray-900 dark:text-white"
        >
          {t('basic.audience.label')}
          <span className="text-base font-normal leading-normal text-gray-500 dark:text-[#bfbfc8] ml-2">
            {t('basic.audience.hint')}
          </span>
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <FormTagsInput
            id="target-users"
            value={formik.values.targetUsers}
            enableCommaSeparator
            onChange={(val) => {
              // enforce <= 5 words per tag and normalize semicolon/newline separators
              const normalized = (val || '')
                .split(/(?:;\s*|\n+)/)
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => t.split(/\s+/).slice(0, 5).join(' '))
                .join('\n');
              formik.setFieldValue('targetUsers', normalized);
              onProjectConfigChange({
                ...projectConfig,
                targetUsers: normalized,
              });
            }}
            onBlur={() => {
              formik.setFieldTouched('targetUsers', true);
            }}
            placeholder={t('basic.audience.placeholder')}
            suggestions={audienceOptions}
            minCharsForSuggestions={1}
            error={
              typeof formik.errors.targetUsers === 'string'
                ? formik.errors.targetUsers
                : null
            }
            showError={Boolean(formik.touched.targetUsers)}
          />
        </div>
      </div>
    </div>
  );
}
