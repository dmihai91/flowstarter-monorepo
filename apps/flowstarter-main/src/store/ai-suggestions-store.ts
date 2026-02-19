'use client';

import { create } from 'zustand';

export interface ProjectAISuggestions {
  names: string[];
  description: string;
  targetUsers: string;
  businessGoals: string[];
  businessModel: string;
  brandTone: string;
  keyServices: string;
  USP: string;
  primaryCTA: string;
  contactPreference: string;
  additionalFeatures: string;
}

export type ChipAction =
  | 'makeItCatchy'
  | 'makeItShorter'
  | 'makeItPunchy'
  | 'makeItBenefitFocused'
  | 'alternatives'
  | 'regenerate'
  | '';

export interface ProjectAILoadingStates {
  names: boolean;
  description: boolean;
  targetUsers: boolean;
  USP: boolean;
  businessGoals: boolean;
}

interface ModerationError {
  error: string;
  message: string;
  details: string[];
  code: string;
  requestId: string;
  timestamp: string;
}

interface ProjectAIStoreState {
  suggestions: ProjectAISuggestions;
  showSuggestions: boolean;
  isGenerating: boolean;
  loading: ProjectAILoadingStates;
  currentActionByField: Partial<
    Record<keyof ProjectAILoadingStates, ChipAction>
  >;
  moderationError: ModerationError | null;
  sufficiency: { isSufficient: boolean; followUpQuestions?: string[] } | null;
  setSuggestions: (s: Partial<ProjectAISuggestions>) => void;
  setShowSuggestions: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  setFieldLoading: (field: keyof ProjectAILoadingStates, v: boolean) => void;
  setFieldAction: (
    field: keyof ProjectAILoadingStates,
    action: ChipAction
  ) => void;
  setModerationError: (err: ModerationError | null) => void;
  setSufficiency: (
    v: { isSufficient: boolean; followUpQuestions?: string[] } | null
  ) => void;
  clearValidation: () => void;
  reset: () => void;
}

const initialSuggestions: ProjectAISuggestions = {
  names: [],
  description: '',
  targetUsers: '',
  businessGoals: [],
  businessModel: '',
  brandTone: '',
  keyServices: '',
  USP: '',
  primaryCTA: '',
  contactPreference: '',
  additionalFeatures: '',
};

const initialLoading: ProjectAILoadingStates = {
  names: false,
  description: false,
  targetUsers: false,
  USP: false,
  businessGoals: false,
};

export const useProjectAIStore = create<ProjectAIStoreState>((set) => ({
  suggestions: initialSuggestions,
  showSuggestions: false,
  isGenerating: false,
  loading: initialLoading,
  currentActionByField: {},
  moderationError: null,
  sufficiency: null,
  setSuggestions: (s) =>
    set((prev) => ({ suggestions: { ...prev.suggestions, ...s } })),
  setShowSuggestions: (v) => set({ showSuggestions: v }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setFieldLoading: (field, v) =>
    set((prev) => ({ loading: { ...prev.loading, [field]: v } })),
  setFieldAction: (field, action) =>
    set((prev) => ({
      currentActionByField: { ...prev.currentActionByField, [field]: action },
    })),
  setModerationError: (err) => set({ moderationError: err }),
  setSufficiency: (v) => set({ sufficiency: v }),
  clearValidation: () => set({ moderationError: null, sufficiency: null }),
  reset: () =>
    set({
      suggestions: initialSuggestions,
      loading: initialLoading,
      showSuggestions: false,
      isGenerating: false,
      currentActionByField: {},
      moderationError: null,
      sufficiency: null,
    }),
}));
