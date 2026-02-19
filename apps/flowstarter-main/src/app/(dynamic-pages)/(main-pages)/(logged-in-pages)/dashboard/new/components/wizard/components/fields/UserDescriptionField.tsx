/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssistantInput } from '@/components/assistant/AssistantInput';
import { useProjectAiSuggestions } from '@/hooks/wizard/useProjectAISuggestions';
import { useProjectAIStore } from '@/store/ai-suggestions-store';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { forwardRef } from 'react';

interface UserDescriptionFieldProps {
  formik: FormikProps<{
    description: string;
    userDescription?: string;
    industry?: string;
  }>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  onInputChange?: (value: string) => void;
  templateId: string;
  hideLabel?: boolean;
  enableImageUpload?: boolean;
  images?: Array<{ url: string; name: string }>;
  onImagesChange?: (images: Array<{ url: string; name: string }>) => void;
  // Generate button support
  showGenerateButton?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  generateButtonText?: string;
  generatingButtonText?: string;
  generateButtonDisabled?: boolean;
  generationStep?: string;
  // Validation feedback support
  showValidationFeedback?: boolean;
  validationStatus?: 'sufficient' | 'insufficient' | null;
  validationMessage?: string;
  // Animated placeholder support
  animatedPlaceholders?: string[];
  placeholderPrefix?: string;
}

export const UserDescriptionField = forwardRef<
  HTMLTextAreaElement,
  UserDescriptionFieldProps
>(function UserDescriptionField(
  {
    formik,
    projectConfig,
    onProjectConfigChange,
    onInputChange,
    templateId,
    hideLabel = false,
    enableImageUpload = false,
    images = [],
    onImagesChange,
    showGenerateButton = false,
    onGenerate,
    isGenerating = false,
    generateButtonText,
    generatingButtonText,
    generateButtonDisabled = false,
    generationStep,
    showValidationFeedback = false,
    validationStatus = null,
    validationMessage,
    animatedPlaceholders,
    placeholderPrefix,
  },
  ref
) {
  useProjectAiSuggestions(templateId);
  const moderationError = useProjectAIStore((s) => s.moderationError);

  const handleChange = (value: string) => {
    if (onInputChange) {
      // Use custom handler if provided (includes bot mood updates)
      onInputChange(value);
    } else {
      // Fallback to default behavior
      formik.setFieldValue('userDescription', value);
      onProjectConfigChange({
        ...projectConfig,
        userDescription: value,
      });
    }
  };

  return (
    <AssistantInput
      ref={ref}
      value={formik.values.userDescription || ''}
      onChange={handleChange}
      onBlur={() => formik.handleBlur('userDescription')}
      hideLabel={hideLabel}
      showLabel={!hideLabel}
      error={
        typeof (formik.errors as { userDescription?: string })
          .userDescription === 'string'
          ? (formik.errors as { userDescription?: string }).userDescription
          : null
      }
      touched={
        (formik.touched as { userDescription?: boolean }).userDescription
      }
      moderationError={moderationError}
      onDismissModeration={() =>
        useProjectAIStore.getState().setModerationError(null)
      }
      enableImageUpload={enableImageUpload}
      images={images}
      onImagesChange={onImagesChange}
      showGenerateButton={showGenerateButton}
      onGenerate={onGenerate}
      isGenerating={isGenerating}
      generateButtonText={generateButtonText}
      generatingButtonText={generatingButtonText}
      generateButtonDisabled={generateButtonDisabled}
      generationStep={generationStep}
      showValidationFeedback={showValidationFeedback}
      validationStatus={validationStatus}
      validationMessage={validationMessage}
      animatedPlaceholders={animatedPlaceholders}
      placeholderPrefix={placeholderPrefix}
    />
  );
});

UserDescriptionField.displayName = 'UserDescriptionField';

export default UserDescriptionField;
