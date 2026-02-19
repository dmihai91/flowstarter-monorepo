import { useCallback, useEffect, useState } from 'react';
import { useAssistantValidation } from './useAssistantValidation';

interface ValidationResult {
  isSufficient: boolean;
  missingInfo?: string[];
  suggestions?: string[];
  industry?: string;
  businessType?: string;
}

export function useValidationStatus(input: string, promptExamples: string[]) {
  const [localValidation, setLocalValidation] =
    useState<ValidationResult | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const baseValidation = useAssistantValidation(input);

  const validateLocally = useCallback(
    (text: string) => {
      if (!text.trim() || text.trim().length < 10) {
        setLocalValidation(null);
        return;
      }

      const matchesSuggestedPrompt = promptExamples.some(
        (prompt) => text.trim() === prompt
      );

      const isSufficient =
        matchesSuggestedPrompt ||
        (baseValidation.hasContent &&
          !baseValidation.isGibberish &&
          baseValidation.meetsContentRequirement);

      setLocalValidation({
        isSufficient,
        missingInfo: [],
        suggestions: [],
      });
    },
    [
      baseValidation.hasContent,
      baseValidation.isGibberish,
      baseValidation.meetsContentRequirement,
      promptExamples,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      validateLocally(input);
    }, 300);

    return () => clearTimeout(timer);
  }, [input, validateLocally]);

  const getValidationStatus = useCallback(
    (isGenerating: boolean) => {
      if (!input.trim()) return null;
      if (!hasBlurred) return null;
      if (input.trim().length < 10) return 'insufficient';
      if (isGenerating) return 'generating';
      if (localValidation?.isSufficient) return 'sufficient';
      if (localValidation && !localValidation.isSufficient)
        return 'insufficient';
      return null;
    },
    [input, hasBlurred, localValidation]
  );

  return {
    setHasBlurred,
    validateLocally,
    getValidationStatus,
  };
}
