import { useState } from 'react';

export interface ProjectSuggestions {
  names: string[];
  description: string;
  targetUsers: string;
  businessGoals: string;
  businessModel: string;
  brandTone: string;
  keyServices: string;
  USP: string;
  primaryCTA: string;
  contactPreference: string;
  additionalFeatures: string;
}

export function useAiSuggestionsState() {
  const [suggestions, setSuggestions] = useState<ProjectSuggestions>({
    names: [],
    description: '',
    targetUsers: '',
    businessGoals: '',
    businessModel: '',
    brandTone: '',
    keyServices: '',
    USP: '',
    primaryCTA: '',
    contactPreference: '',
    additionalFeatures: '',
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    names: false,
    description: false,
    targetUsers: false,
    businessGoals: false,
    USP: false,
  });

  const setFieldLoading = (
    field: keyof typeof loadingStates,
    loading: boolean
  ) => {
    setLoadingStates((prev) => ({ ...prev, [field]: loading }));
  };

  return {
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    isGeneratingWithAI,
    setIsGeneratingWithAI,
    loadingStates,
    setFieldLoading,
  };
}
