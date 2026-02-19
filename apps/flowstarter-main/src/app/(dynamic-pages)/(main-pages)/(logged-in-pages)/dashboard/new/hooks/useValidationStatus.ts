import { useAssistantValidation } from '@/hooks/useAssistantValidation';
import { useMemo } from 'react';

interface UseValidationStatusProps {
  userDesc: string;
  isGenerating: boolean;
  promptExamples: string[];
}

export function useValidationStatus({
  userDesc,
  isGenerating,
  promptExamples,
}: UseValidationStatusProps) {
  const normalizedDesc = (userDesc ?? '').trim();
  const validation = useAssistantValidation(normalizedDesc);

  // Check if current input matches one of our suggested prompts
  const isSuggestedPrompt = useMemo(
    () => promptExamples.some((prompt) => normalizedDesc === prompt),
    [normalizedDesc, promptExamples]
  );

  // Get validation status
  type WizardValidationStatus =
    | 'sufficient'
    | 'insufficient'
    | 'generating'
    | null;

  const getValidationStatus = (): WizardValidationStatus => {
    if (!normalizedDesc || normalizedDesc.length < 10) return null;
    if (isGenerating) return 'generating';
    // If it's a suggested prompt, it's always sufficient
    if (isSuggestedPrompt) return 'sufficient';
    if (validation.isValid) return 'sufficient';
    if (!validation.isValid) return 'insufficient';
    return null;
  };

  const validationStatus: WizardValidationStatus = getValidationStatus();

  return {
    validationStatus,
    isSuggestedPrompt,
  };
}
