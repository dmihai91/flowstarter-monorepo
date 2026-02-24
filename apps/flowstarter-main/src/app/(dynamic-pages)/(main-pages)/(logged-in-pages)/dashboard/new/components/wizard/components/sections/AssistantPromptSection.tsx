import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTranslations } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { motion } from 'framer-motion';
import { Bot, Minus, Plus } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { UserDescriptionField } from '../fields/UserDescriptionField';

interface AssistantPromptSectionProps<T> {
  formik: FormikProps<T>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  templateId: string;
  userDesc: string;
  promptExamples: string[];
  uploadedImages: Array<{ url: string; name: string }>;
  onImagesChange: (images: Array<{ url: string; name: string }>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generateButtonDisabled: boolean;
  generationStep: string;
  validationStatus: 'sufficient' | 'insufficient' | 'generating' | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AssistantPromptSection = forwardRef<
  HTMLTextAreaElement,
  AssistantPromptSectionProps<never>
>(
  (
    {
      formik,
      projectConfig,
      onProjectConfigChange,
      templateId,
      userDesc,
      promptExamples,
      uploadedImages,
      onImagesChange,
      onGenerate,
      isGenerating,
      generateButtonDisabled,
      generationStep,
      validationStatus,
    },
    ref
  ) => {
    const { t } = useTranslations();
    const [isExamplesOpen, setIsExamplesOpen] = useState(false);

    const handleInputChange = (value: string) => {
      formik.setFieldValue('userDescription', value);
      onProjectConfigChange({
        ...projectConfig,
        userDescription: value,
      });
    };

    return (
      <div className="space-y-6">
        {/* Assistant with bot */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,720px)_auto] gap-16 items-center">
          <div className="min-w-0">
            <div className="mb-4 sm:mb-6">
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2 text-md">
                <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {t('wizard.assistantPrompt.label')}
              </div>
            </div>

            {/* Prompt Suggestions - Only show when input is empty */}
            {!userDesc && !isGenerating && (
              <>
                {/* Desktop: Always visible */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block mb-2 sm:mb-3"
                >
                  <div className="flex flex-wrap gap-2 overflow-visible">
                    {promptExamples.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.3,
                          ease: 'easeOut',
                        }}
                        whileHover={{
                          scale: 1.02,
                          rotateY: 2,
                          rotateX: -1,
                          z: 10,
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          formik.setFieldValue('userDescription', prompt);
                          formik.setFieldTouched('userDescription', true);
                          onProjectConfigChange({
                            ...projectConfig,
                            userDescription: prompt,
                          });

                          // Blur the input to trigger validation display
                          setTimeout(() => {
                            if (ref && 'current' in ref) {
                              ref.current?.blur();
                            }
                          }, 100);
                        }}
                        className="group relative overflow-hidden rounded-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl border border-white dark:border-white/40 px-3 py-0.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-[rgba(243,243,243,0.4)] dark:hover:bg-[rgba(58,58,74,0.4)] transition-all duration-200 min-w-fit shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:hover:shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]"
                        style={{
                          transformOrigin: 'center',
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                        }}
                      >
                        {/* Subtle gradient shimmer on hover */}
                        <div className="absolute inset-0 overflow-hidden bg-linear-to-r from-transparent via-white/20 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" />
                        <span className="relative inline-block whitespace-normal">
                          {prompt}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Mobile/Tablet: Collapsible */}
                <Collapsible
                  open={isExamplesOpen}
                  onOpenChange={setIsExamplesOpen}
                  className="lg:hidden mb-2 sm:mb-3"
                >
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-wrap gap-2 overflow-visible mb-2"
                    >
                      {promptExamples.map((prompt, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.1,
                            duration: 0.3,
                            ease: 'easeOut',
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            formik.setFieldValue('userDescription', prompt);
                            formik.setFieldTouched('userDescription', true);
                            onProjectConfigChange({
                              ...projectConfig,
                              userDescription: prompt,
                            });

                            // Blur the input to trigger validation display
                            setTimeout(() => {
                              if (ref && 'current' in ref) {
                                ref.current?.blur();
                              }
                            }, 100);
                            // Collapse after selection on mobile
                            setIsExamplesOpen(false);
                          }}
                          className="group relative overflow-hidden rounded-xl bg-linear-to-br from-[var(--purple)]/5 to-blue-50 dark:from-[var(--purple)]/30 dark:to-blue-950/30 border border-[var(--purple)]/50 dark:border-[var(--purple)]/30 px-3 py-0.5 text-left text-xs text-gray-700 dark:text-gray-300 active:border-[var(--purple)]/30 dark:active:border-[var(--purple)] transition-all duration-200 shadow-[0_2px_4px_rgba(139,92,246,0.15),0_1px_2px_rgba(139,92,246,0.1)] active:shadow-[0_4px_8px_rgba(139,92,246,0.2),0_2px_4px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] min-w-fit touch-manipulation"
                          style={{
                            transformOrigin: 'center',
                            transformStyle: 'preserve-3d',
                            perspective: '1000px',
                          }}
                        >
                          {/* Subtle gradient shimmer on hover */}
                          <div className="absolute inset-0 overflow-hidden bg-linear-to-r from-transparent via-white/20 dark:via-white/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-300 -translate-x-full group-active:translate-x-full" />
                          <span className="relative inline-block whitespace-normal">
                            {prompt}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </CollapsibleContent>
                  <CollapsibleTrigger className="border border-gray-200/50 dark:border-white/10 flex gap-2 items-center px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-gray-800/80 active:bg-white dark:active:bg-gray-800 transition-all duration-200 w-fit touch-manipulation">
                    {isExamplesOpen ? (
                      <Minus className="h-4 w-4 text-gray-700 dark:text-white" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-700 dark:text-white" />
                    )}
                    <p className="text-sm font-medium text-gray-700 dark:text-white">
                      {isExamplesOpen ? 'Less' : 'More'}
                    </p>
                  </CollapsibleTrigger>
                </Collapsible>
              </>
            )}

            <UserDescriptionField
              ref={ref}
              formik={formik}
              projectConfig={projectConfig}
              onProjectConfigChange={onProjectConfigChange}
              onInputChange={handleInputChange}
              templateId={templateId}
              hideLabel
              enableImageUpload
              images={uploadedImages}
              onImagesChange={onImagesChange}
              showGenerateButton
              onGenerate={onGenerate}
              isGenerating={isGenerating}
              generateButtonText={t('ai.generate')}
              generatingButtonText={t('ai.generating')}
              generateButtonDisabled={generateButtonDisabled}
              generationStep={generationStep}
              showValidationFeedback={
                validationStatus !== null &&
                validationStatus !== 'generating' &&
                validationStatus !== 'sufficient'
              }
              validationStatus={
                validationStatus === 'generating' ||
                validationStatus === 'sufficient'
                  ? null
                  : validationStatus
              }
              validationMessage={t('assistant.validation.briefDescription')}
              animatedPlaceholders={promptExamples}
              placeholderPrefix={t('common.eg')}
            />
          </div>
        </div>
      </div>
    );
  }
);

AssistantPromptSection.displayName = 'AssistantPromptSection';
