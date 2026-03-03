import type { GenerationStep } from '@/hooks/generation/types';
import { InputArea } from '@/components/assistant/InputArea';
import { ProjectDetailsPromptSuggestions } from '@/components/assistant/ProjectDetailsPromptSuggestions';
import { Button } from '@/components/ui/button';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';
import { useAssistantValidation } from '@/hooks/useAssistantValidation';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePlaceholderAnimation } from '@/hooks/usePlaceholderAnimation';
import { useBasicInfoForm } from '@/hooks/wizard/useBasicInfoForm';
import { useIndustries } from '@/hooks/wizard/useIndustries';
import { useNameAvailability } from '@/hooks/wizard/useNameAvailability';
import { useSuggestions } from '@/hooks/wizard/useSuggestions';
import { useTranslations } from '@/lib/i18n';
import { getIndustryPrompts } from '@/lib/industry-prompts';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { useUser } from '@clerk/nextjs';
import type { FormikProps } from 'formik';
import { ArrowRight, Keyboard } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useAIGeneration } from '../../../hooks/useAIGeneration';
import { useCollectMode } from '../../../hooks/useCollectMode';
import { useImageUpload as useImageUploadState } from '../../../hooks/useImageUpload';
import { useValidationStatus } from '../../../hooks/useValidationStatus';
import { AssistantTransition } from './AssistantTransition';
import { IndustrySection } from './sections/IndustrySection';
import { PlatformTypeSection } from './sections/PlatformTypeSection';
import { ProceedModeSection } from './sections/ProceedModeSection';
import { RefineFieldsSection } from './sections/RefineFieldsSection';
import {
  WizardCard,
  WizardCardContent,
  WizardCardHeader,
  WizardCardHeaderContent,
} from './WizardCard';

interface ProjectDetailsSectionProps {
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  templateId: string;
}

const AssistantGreeting = () => {
  const { t } = useTranslations();
  const { user } = useUser();

  return (
    <div className="mb-6">
      <div className="text-base font-medium leading-normal text-gray-900 dark:text-white">
        {t('wizard.detailsChat.greeting', { name: user?.firstName || '' })}
      </div>
      <div className="text-base font-medium leading-normal text-gray-900 dark:text-white">
        {t('wizard.detailsChat.greetingSubtext')}
      </div>
    </div>
  );
};

const CollectModeOption = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <div
      onClick={() => !disabled && onClick()}
      className={`
        flex items-center justify-between rounded-[12px] border-[1.5px] border-solid pl-[24px] pr-[20px] py-[16px] cursor-pointer transition-all duration-200
        bg-white dark:bg-[rgba(75,75,94,0.4)]
        ${
          isSelected
            ? 'border-gray-900 dark:border-white'
            : 'border-gray-300 dark:border-[rgba(255,255,255,0.1)] hover:border-gray-400 dark:hover:border-white/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-[20px]">
          <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
            <div className="[&>svg]:w-[32px] [&>svg]:h-[32px] [&>svg]:text-gray-900 dark:[&>svg]:text-white">
              {icon}
            </div>
          </div>
          <div className="flex flex-col gap-[6px]">
            <div className="text-base font-medium leading-[1.3] text-gray-900 dark:text-white">
              {title}
            </div>
            <div className="text-sm font-normal leading-[1.4] text-gray-600 dark:text-gray-400">
              {description}
            </div>
          </div>
        </div>
        <div
          className={`
            aspect-square size-5 shrink-0 rounded-full border-2 transition-all outline-none flex items-center justify-center
            ${
              isSelected
                ? 'border-gray-900 dark:border-white'
                : 'border-gray-900 dark:border-white'
            }
          `}
        >
          {isSelected && (
            <span className="block w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-white" />
          )}
        </div>
      </div>
    </div>
  );
};

const CollectModeSelector = ({
  collectMode,
  setCollectMode,
  disabled = false,
}: {
  collectMode: string;
  setCollectMode: (mode: string) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslations();

  return (
    <div className="space-y-2">
      <CollectModeOption
        title={t('ai.generateWithAI')}
        description={t('ai.letAIWorkForYou')}
        icon={<MagicWandIcon className="w-[32px] h-[32px]" />}
        isSelected={collectMode === 'ai'}
        onClick={() => setCollectMode('ai')}
        disabled={disabled}
      />

      <CollectModeOption
        title={t('ai.fillManually')}
        description={t('ai.fillManuallyDescription')}
        icon={<Keyboard className="w-[32px] h-[32px]" />}
        isSelected={collectMode === 'manual'}
        onClick={() => setCollectMode('manual')}
        disabled={disabled}
      />
    </div>
  );
};

export function ProjectDetailsSection({
  projectConfig,
  onProjectConfigChange,
  templateId,
}: ProjectDetailsSectionProps) {
  const { t } = useTranslations();
  const { formik } = useBasicInfoForm(projectConfig);
  const { industries, isLoading: isLoadingIndustries } = useIndustries();
  const { audienceOptions, goalOptions } = useSuggestions();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Store state
  const showAssistantTransition = useWizardStore(
    (s) => s.showAssistantTransition
  );
  const phase = useWizardStore((s) => s.detailsPhase);
  const setPhase = useWizardStore((s) => s.setDetailsPhase);

  // Custom hooks for business logic
  const { collectStep, setCollectStep, collectMode, setCollectMode } =
    useCollectMode({
      projectConfig,
      industry: formik.values.industry,
      userDescription: formik.values.userDescription,
    });

  const { isGenerating, generationSteps, currentStep, handleAIGeneration } =
    useAIGeneration({
      templateId,
      projectConfig,
      onProjectConfigChange,
      formik,
    });

  const { uploadedImages, setUploadedImages } = useImageUploadState();

  const { isUploading, fileInputRef, handleImageClick, handleFileChange } =
    useImageUpload(uploadedImages, setUploadedImages);

  // Name availability validation
  const nameValue = (formik.values.name || '').trim();
  const hasLocalError = Boolean(formik.errors.name);
  const canCheck =
    Boolean(nameValue) && !hasLocalError && Boolean(formik.touched.name);
  const nameAvailability = useNameAvailability(nameValue, canCheck);

  // Animated placeholder examples - now dynamic based on industry
  const promptExamples = useMemo(
    () => getIndustryPrompts(formik.values.industry, t),
    [formik.values.industry, t]
  );

  const { currentIndex, key: placeholderKey } =
    usePlaceholderAnimation(promptExamples);

  const userDesc = (formik.values.userDescription || '').trim();
  const { validationStatus } = useValidationStatus({
    userDesc,
    isGenerating,
    promptExamples,
  });

  const { meetsContentRequirement, wordCount } =
    useAssistantValidation(userDesc);

  /* 
  // Disabled to prevent infinite loop
  // Save collectMode to projectConfig when it changes
  // Only save if we have a valid projectConfig (avoid overwriting AI-generated data on mount)
  const hasValidProjectConfig = Boolean(
    projectConfig.name || projectConfig.description || projectConfig.USP
  );
  
  useEffect(() => {
    if (collectMode) {
      const currentSaved = (
        projectConfig as unknown as { collectMode?: string }
      ).collectMode;
      if (currentSaved !== collectMode) {
        console.log('[ProjectDetailsSection] Saving collectMode:', collectMode);
        // Only update if we have valid data OR we're just starting (to avoid overwriting on mount)
        if (hasValidProjectConfig || currentSaved !== undefined) {
          onProjectConfigChange({
            ...projectConfig,
            collectMode,
          } as unknown as ProjectConfig);
        }
      }
    }
  }, [
    collectMode,
    projectConfig,
    onProjectConfigChange,
    hasValidProjectConfig,
  ]);
  */

  // Track previous industry to detect changes and reset userDescription
  const prevIndustryRef = useRef(formik.values.industry);
  useEffect(() => {
    const currentIndustry = formik.values.industry;
    if (
      prevIndustryRef.current &&
      prevIndustryRef.current !== currentIndustry &&
      formik.values.userDescription
    ) {
      formik.setFieldValue('userDescription', '');
    }
    prevIndustryRef.current = currentIndustry;
  }, [formik.values.industry, formik]);

  const renderCollect = () => {
    const hasIndustry = Boolean((formik.values.industry || '').trim());
    const hasPlatformType = Boolean(projectConfig.platformType);

    return (
      <div className="space-y-4">
        {/* Platform Type Selection */}
        <PlatformTypeSection
          projectConfig={projectConfig}
          onProjectConfigChange={onProjectConfigChange}
        />

        {/* Industry Selection - Optional when using AI */}
        <IndustrySection
          formik={formik as unknown as FormikProps<ProjectConfig>}
          projectConfig={projectConfig}
          onProjectConfigChange={onProjectConfigChange}
          industries={industries}
          isLoadingIndustries={isLoadingIndustries}
          disabled={!hasPlatformType}
        />

        {/* How to Proceed Section */}
        <ProceedModeSection
          hasIndustry={hasIndustry}
          collectMode={collectMode}
          setCollectMode={setCollectMode}
        >
          <CollectModeSelector
            collectMode={collectMode}
            setCollectMode={(mode) => setCollectMode(mode as 'ai' | 'manual')}
            disabled={!hasPlatformType}
          />
        </ProceedModeSection>

        {/* Show assistant prompt when AI is selected and user has proceeded */}
        {collectStep >= 2 && collectMode === 'ai' && (
          <div className="space-y-6">
            {/* Input area - unified assistant design */}
            <div className="flex items-center gap-5 my-6">
              <div className="flex-1">
                <InputArea
                  value={userDesc}
                  onChange={(v) => {
                    formik.setFieldValue('userDescription', v);
                    onProjectConfigChange({
                      ...projectConfig,
                      userDescription: v,
                    });
                  }}
                  onFocus={() => {}}
                  onBlur={() => formik.setFieldTouched('userDescription', true)}
                  disabled={isGenerating}
                  isFocused={false}
                  isStreaming={false}
                  isGenerating={isGenerating}
                  streamingText={''}
                  currentStep={currentStep}
                  generationSteps={
                    generationSteps as unknown as GenerationStep[]
                  }
                  placeholderText={promptExamples[currentIndex]}
                  placeholderKey={placeholderKey}
                  inputRef={inputRef}
                  validationStatus={
                    (validationStatus === 'generating'
                      ? null
                      : validationStatus) as
                      | 'sufficient'
                      | 'insufficient'
                      | null
                  }
                  isUploading={isUploading}
                  fileInputRef={fileInputRef}
                  onImageClick={handleImageClick}
                  onFileChange={handleFileChange}
                  showInlineGenerateButton={true}
                  onInlineGenerate={() => handleAIGeneration(userDesc)}
                  inlineGenerateButtonDisabled={
                    isGenerating ||
                    validationStatus !== 'sufficient' ||
                    !userDesc.trim()
                  }
                />

                {/* Validation feedback */}
                {validationStatus !== null &&
                  validationStatus !== 'generating' &&
                  validationStatus !== 'sufficient' && (
                    <div
                      className={`text-[16px] font-normal leading-[24px] mt-[12px] text-amber-600 dark:text-amber-400`}
                    >
                      {!meetsContentRequirement
                        ? t('assistant.validation.needMoreContent', {
                            current: wordCount,
                            required: 15,
                          })
                        : t('assistant.validation.briefDescription')}
                    </div>
                  )}
              </div>
            </div>

            {/* Prompt suggestions when empty - now below input */}
            {!userDesc.trim() && !isGenerating && (
              <ProjectDetailsPromptSuggestions
                className="mt-[16px]"
                prompts={promptExamples}
                onPromptClick={(prompt) => {
                  formik.setFieldValue('userDescription', prompt);
                  onProjectConfigChange({
                    ...projectConfig,
                    userDescription: prompt,
                  });
                  setTimeout(() => inputRef.current?.blur(), 50);
                }}
              />
            )}

            {/* Generation Progress handled within InputArea */}
          </div>
        )}

        {/* Buttons */}
        <div className="pt-3">
          {/* Only show continue button if not in AI generation mode (collectStep < 2) or if in manual mode */}
          {(collectStep < 2 || collectMode !== 'ai') && (
            <Button
              onClick={() => {
                console.log(
                  '[Continue Button] clicked, collectMode:',
                  collectMode,
                  'collectStep:',
                  collectStep
                );
                if (collectMode === 'ai') {
                  console.log('[Continue Button] Setting collectStep to 2');
                  setCollectStep(2);
                } else {
                  console.log('[Continue Button] Going to refine phase');
                  setPhase('refine');
                }
              }}
              disabled={
                !hasPlatformType ||
                !collectMode ||
                (collectMode === 'manual' && !hasIndustry)
              }
              className="bg-[#000000] hover:bg-[#1a1a1a] disabled:bg-[#000000] disabled:opacity-50 text-white rounded-lg px-[20px] py-[15px] text-[16px] font-medium h-auto min-h-0 shadow-sm transition-all duration-200"
            >
              {t('app.continue')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Read hasAIGenerated from store
  const hasAIGenerated = useWizardStore((s) => s.hasAIGenerated);

  const renderRefine = () => {
    // Only show summary if AI was used to generate the content
    // Don't show summary for manual flow (collectMode === 'manual')
    const shouldShowSummary = hasAIGenerated && collectMode === 'ai';

    return (
      <RefineFieldsSection
        formik={formik as unknown as FormikProps<ProjectConfig>}
        projectConfig={projectConfig}
        onProjectConfigChange={onProjectConfigChange}
        nameAvailability={nameAvailability}
        templateId={templateId}
        audienceOptions={audienceOptions}
        goalOptions={goalOptions}
        showSummary={shouldShowSummary}
      />
    );
  };

  // Show AssistantTransition when triggered by Continue button
  if (showAssistantTransition) {
    return (
      <div className="animate-[fadeSlideUp_.28s_ease] will-change-transform w-full">
        <AssistantTransition projectConfig={projectConfig} />
      </div>
    );
  }

  return (
    <WizardCard>
      {/* Blue header */}
      <WizardCardHeader background="var(--wizard-header-bg)">
        <WizardCardHeaderContent
          title={t('wizard.details.title')}
          description={t('wizard.details.desc2')}
        />
      </WizardCardHeader>

      <WizardCardContent className="space-y-8">
        {phase === 'collect' ? (
          <div className="animate-[fadeSlideUp_.28s_ease] will-change-transform w-full">
            <AssistantGreeting />
            {renderCollect()}
          </div>
        ) : (
          <div className="animate-[fadeSlideUp_.28s_ease] will-change-transform w-full">
            {renderRefine()}
          </div>
        )}
      </WizardCardContent>
    </WizardCard>
  );
}
