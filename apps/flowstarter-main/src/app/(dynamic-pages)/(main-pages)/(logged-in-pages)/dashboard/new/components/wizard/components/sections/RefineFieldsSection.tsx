import { useIndustries } from '@/hooks/wizard/useIndustries';
import type { ProjectNameAvailability } from '@/hooks/wizard/useNameAvailability';
import { useTranslations } from '@/lib/i18n';
import { detectIndustryFromDescription } from '@/lib/industries';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AudienceField } from '../fields/AudienceField';
import { BusinessGoalsField } from '../fields/BusinessGoalsField';
import { IndustryField } from '../fields/IndustryField';
import { ProjectDescriptionField } from '../fields/ProjectDescriptionField';
import { ProjectNameField } from '../fields/ProjectNameField';
import { UVPField } from '../fields/UVPField';

import { PlatformTypeSection } from './PlatformTypeSection';

interface RefineFieldsSectionProps {
  formik: FormikProps<ProjectConfig>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  nameAvailability: ProjectNameAvailability;
  templateId: string;
  audienceOptions: string[];
  goalOptions: string[];
  showSummary?: boolean;
}

export function RefineFieldsSection({
  formik,
  projectConfig,
  onProjectConfigChange,
  nameAvailability,
  templateId,
  audienceOptions,
  goalOptions,
  showSummary = false,
}: RefineFieldsSectionProps) {
  const { t } = useTranslations();
  const { industries, isLoading: isLoadingIndustries } = useIndustries();
  const hasDetectedIndustry = useRef(false);

  // Auto-detect industry from description if not already set
  useEffect(() => {
    // Only run once and only if industry is empty
    if (hasDetectedIndustry.current) return;

    const currentIndustry =
      formik.values.industry ||
      projectConfig?.designConfig?.businessInfo?.industry;
    if (currentIndustry) {
      hasDetectedIndustry.current = true;
      return;
    }

    // Try to detect from description
    const description =
      projectConfig.description || projectConfig.userDescription || '';
    if (description) {
      const detectedIndustry = detectIndustryFromDescription(description);

      if (detectedIndustry && detectedIndustry !== 'other') {
        console.log(
          '[RefineFieldsSection] Auto-detected industry:',
          detectedIndustry
        );
        hasDetectedIndustry.current = true;

        // Update formik
        formik.setFieldValue('industry', detectedIndustry);

        // Update wizard store
        useWizardStore.getState().setSelectedIndustry(detectedIndustry);

        // Update projectConfig
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

        onProjectConfigChange({
          ...projectConfig,
          designConfig: {
            ...projectConfig.designConfig,
            businessInfo: nextBusinessInfo,
          },
        });
      }
    }
  }, [
    projectConfig.description,
    projectConfig.userDescription,
    formik,
    projectConfig,
    onProjectConfigChange,
  ]);

  // Create summary bullet points
  const summaryPoints: string[] = [];

  if (projectConfig.platformType) {
    summaryPoints.push(
      `${t('platformType.label')}: ${t(
        `platformType.${projectConfig.platformType}` as keyof typeof t
      )}`
    );
  }

  if (projectConfig.name) {
    summaryPoints.push(`${t('basic.name.label')}: ${projectConfig.name}`);
  }

  if (projectConfig.description) {
    summaryPoints.push(
      `${t('basic.description.label')}: ${projectConfig.description}`
    );
  }

  if (projectConfig.businessGoals) {
    summaryPoints.push(
      `${t('wizard.summary.mainGoal')}: ${projectConfig.businessGoals}`
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Section - only show if AI generated the fields */}
      {showSummary && summaryPoints.length > 0 && (
        <div className="bg-[rgba(243,243,243,0.7)] dark:bg-[rgba(75,75,94,0.5)] backdrop-blur-sm border border-dashed border-[#000000] dark:border-white/40 rounded-[12px] px-[24px] py-[16px]">
          <div className="flex gap-[8px] items-center mb-[12px]">
            <Bot className="h-[28px] w-[29px] text-[#000000] dark:text-white" />
            <h3 className="text-lg font-medium leading-[1.4] text-[#000000] dark:text-white">
              {t('wizard.summary.title')}
            </h3>
          </div>
          <ul className="space-y-1 list-disc list-inside text-md font-medium leading-[1.6] text-[#2e2e2e] dark:text-gray-300 ml-[4px]">
            {summaryPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Info notice */}
      {showSummary && (
        <div className="bg-[#ececec] dark:bg-[rgba(75,75,94,0.4)] rounded-[8px] px-[20px] py-[16px] flex gap-[12px] items-start">
          <div className="w-[24px] h-[24px] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[#000000] dark:text-white"
              />
              <path
                d="M12 16V12M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-[#000000] dark:text-white"
              />
            </svg>
          </div>
          <p className="text-sm font-normal leading-[1.4] text-[#000000] dark:text-white">
            {t('wizard.summary.instruction')}
          </p>
        </div>
      )}

      {/* Mandatory Notice */}
      <div className="flex justify-start">
        <span className="text-sm italic text-gray-500 dark:text-gray-400">
          {t('wizard.details.allFieldsMandatory')}
        </span>
      </div>

      {/* Platform Type Selection */}
      <PlatformTypeSection
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
      />

      {/* Industry Field */}
      <div className="space-y-[8px]">
        <label className="block text-md font-medium leading-normal text-gray-900 dark:text-white">
          {t('ai.industry')}
        </label>
        <IndustryField
          formik={formik}
          projectConfig={projectConfig}
          onProjectConfigChange={onProjectConfigChange}
          industries={industries}
          isLoadingIndustries={isLoadingIndustries}
        />
      </div>

      <ProjectNameField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        nameAvailability={nameAvailability}
        templateId={templateId}
      />
      <ProjectDescriptionField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        templateId={templateId}
      />
      <UVPField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        templateId={templateId}
      />
      <AudienceField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        audienceOptions={audienceOptions}
      />
      <BusinessGoalsField
        formik={formik}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        goalOptions={goalOptions}
        templateId={templateId}
      />
    </div>
  );
}
