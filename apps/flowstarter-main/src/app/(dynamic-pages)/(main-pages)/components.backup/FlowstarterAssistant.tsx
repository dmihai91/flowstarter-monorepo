'use client';

import { ImagePreviews } from '@/components/assistant/ImagePreviews';
import { InputArea } from '@/components/assistant/InputArea';
import { PromptSuggestions } from '@/components/assistant/PromptSuggestions';
import { InlineModerationError } from '@/components/ui/inline-moderation-error';
import { useControlledInput } from '@/hooks/useControlledInput';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePlaceholderAnimation } from '@/hooks/usePlaceholderAnimation';
import {
  GenerationTarget,
  useProjectGeneration,
} from '@/hooks/useProjectGeneration';
import { useValidationStatus } from '@/hooks/useValidationStatus';
import { useTranslations } from '@/lib/i18n';
import { useMemo, useRef, useState } from 'react';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

interface FlowstarterAssistantProps {
  className?: string;
  customGenerationSteps?: GenerationStep[];
  onCustomGenerate?: (
    input?: string,
    images?: Array<{ url: string; name: string }>,
    updateStep?: (stepId: string, updates: Partial<GenerationStep>) => void
  ) => Promise<void>;
  variant?: 'hero' | 'wizard';
  /** Where to redirect after generation: 'wizard' (default) or 'editor' */
  target?: GenerationTarget;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  images?: Array<{ url: string; name: string }>;
  onImagesChange?: (images: Array<{ url: string; name: string }>) => void;
  generateButtonText?: string;
  generatingButtonText?: string;
  generateButtonDisabled?: boolean;
  showValidationFeedback?: boolean;
  customValidationStatus?: 'sufficient' | 'insufficient' | null;
  customValidationMessage?: string;
  customPromptExamples?: string[];
  placeholderPrefix?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function FlowstarterAssistant({
  className = '',
  customGenerationSteps,
  onCustomGenerate,
  target = 'wizard',
  value: externalValue,
  onChange: externalOnChange,
  images: externalImages,
  onImagesChange: externalOnImagesChange,
  customPromptExamples,
  inputRef: externalInputRef,
}: FlowstarterAssistantProps) {
  const { t } = useTranslations();

  // Input state (controlled/uncontrolled)
  const { value: input, setValue: setInput } = useControlledInput<string>(
    externalValue,
    externalOnChange
  );

  // Images state (controlled/uncontrolled wrapper)
  const isImagesControlled = externalImages !== undefined;
  const [internalUploadedImages, setInternalUploadedImages] = useState<
    Array<{ url: string; name: string }>
  >([]);
  const uploadedImages = isImagesControlled
    ? externalImages!
    : internalUploadedImages;
  const setUploadedImages = isImagesControlled
    ? externalOnImagesChange || (() => {})
    : setInternalUploadedImages;

  // Hooks
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const [isFocused, setIsFocused] = useState(false);

  const promptExamples = useMemo(
    () =>
      customPromptExamples || [
        t('assistant.prompts.examples.saas'),
        t('assistant.prompts.examples.localBusiness'),
        t('assistant.prompts.examples.portfolio'),
        t('assistant.prompts.examples.ecommerce'),
        t('assistant.prompts.examples.agency'),
        t('assistant.prompts.examples.consulting'),
      ],
    [t, customPromptExamples]
  );
  const { currentIndex, key: placeholderKey } =
    usePlaceholderAnimation(promptExamples);

  const { setHasBlurred, validateLocally, getValidationStatus } =
    useValidationStatus(input || '', promptExamples);

  const {
    isUploading,
    fileInputRef,
    handleImageClick,
    handleFileChange,
    removeImage,
  } = useImageUpload(uploadedImages, setUploadedImages);

  const {
    isGenerating,
    moderationError,
    streamingText,
    isStreaming,
    generationSteps,
    currentStep,
    handleGeneration,
    setModerationError,
  } = useProjectGeneration(target);

  const validationStatus = getValidationStatus(isGenerating);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setHasBlurred(true);
    validateLocally(prompt);
    setTimeout(() => inputRef.current?.blur(), 50);
  };

  const onChangeInput = (newValue: string) => {
    setInput(newValue);
    if (!newValue.trim()) setHasBlurred(false);
  };

  return (
    <div className={`mt-8 ${className} min-w-0`}>
      <div className="space-y-6 min-w-0">
        {/* Prompt Suggestions - Above Input Area */}
        {!(input || '').trim() && !isGenerating && (
          <PromptSuggestions
            prompts={promptExamples}
            onPromptClick={handlePromptClick}
          />
        )}

        <div className="flex items-center gap-8 min-w-0">
          <InputArea
            value={input || ''}
            onChange={onChangeInput}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setHasBlurred(true);
            }}
            disabled={isGenerating}
            isFocused={isFocused}
            isStreaming={isStreaming}
            isGenerating={isGenerating}
            streamingText={streamingText}
            currentStep={currentStep}
            generationSteps={generationSteps}
            placeholderText={promptExamples[currentIndex]}
            placeholderKey={placeholderKey}
            inputRef={inputRef}
            validationStatus={
              validationStatus === 'generating' ? null : validationStatus
            }
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            onImageClick={handleImageClick}
            onFileChange={handleFileChange}
            showInlineGenerateButton={true}
            onInlineGenerate={() =>
              handleGeneration(
                (input || '').trim(),
                uploadedImages,
                customGenerationSteps,
                onCustomGenerate
              )
            }
            inlineGenerateButtonDisabled={
              isGenerating ||
              validationStatus !== 'sufficient' ||
              !(input || '').trim()
            }
          />
        </div>

        <div className="space-y-4 mt-4">
          <ImagePreviews
            images={uploadedImages}
            onRemove={removeImage}
            isGenerating={isGenerating}
          />

          {moderationError &&
            moderationError.error &&
            moderationError.message && (
              <InlineModerationError
                error={
                  moderationError as {
                    error: string;
                    message: string;
                    details: string[];
                    code: string;
                  }
                }
                onDismiss={() => setModerationError(null)}
              />
            )}
        </div>
      </div>
    </div>
  );
}

export default FlowstarterAssistant;
