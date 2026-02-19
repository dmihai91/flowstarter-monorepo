'use client';

import type { ProjectConfig, ProjectWizardStep } from '@/types/project-config';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface HostedAvailabilityState {
  suggestedDomain: string | null;
  isAvailable: boolean | null;
  checking: boolean;
  lastCheckedName: string | null;
  error?: string;
}

export type TemplatePath = 'recommendations' | 'gallery' | 'scratch' | null;

interface ReviewState {
  generatedCode: string;
  generatedFiles: Array<{ path: string; content: string }>;
  previewHtml: string;
  qualityMetrics: unknown;
}

interface WizardStoreState {
  currentStep: ProjectWizardStep;
  projectConfig: ProjectConfig;
  isLoaded: boolean;
  selectedIndustry?: string;
  hasAIGenerated: boolean;
  isDiscarding: boolean;
  detailsPhase: 'collect' | 'refine';
  showSummary: boolean; // Show summary view after AI generation
  templatePath: TemplatePath;
  showAssistantTransition: boolean;
  lastGeneratedDescription: string | null;
  startedWithTemplate: boolean;
  skipLoadingScreen: boolean;
  hasGeneratedSite: boolean;
  reviewState: ReviewState | null;
  hostedAvailability: HostedAvailabilityState;
  // Prefill data for navigation from dashboard
  prefillData: (Partial<ProjectConfig> & { images?: string[] }) | null;
  // Store uploaded images separately for prefill
  prefillImages: Array<{ url: string; name: string }>;
  // Wizard actions for navbar
  wizardActions: {
    onCancel?: () => void;
    onPublish?: () => void;
    canPublish: boolean;
    autosaveElement?: React.ReactNode;
  };
  setCurrentStep: (s: ProjectWizardStep) => void;
  setProjectConfig: (c: ProjectConfig) => void;
  setIsLoaded: (v: boolean) => void;
  setSelectedIndustry: (industry?: string) => void;
  setHasAIGenerated: (v: boolean) => void;
  setIsDiscarding: (v: boolean) => void;
  setDetailsPhase: (phase: 'collect' | 'refine') => void;
  setShowSummary: (show: boolean) => void;
  setTemplatePath: (path: TemplatePath) => void;
  setShowAssistantTransition: (show: boolean) => void;
  setLastGeneratedDescription: (desc: string | null) => void;
  setStartedWithTemplate: (started: boolean) => void;
  setSkipLoadingScreen: (skip: boolean) => void;
  setHasGeneratedSite: (v: boolean) => void;
  setReviewState: (state: ReviewState | null) => void;
  setHostedAvailability: (a: HostedAvailabilityState) => void;
  resetHostedAvailability: () => void;
  setPrefillData: (
    data: (Partial<ProjectConfig> & { images?: string[] }) | null
  ) => void;
  setPrefillImages: (images: Array<{ url: string; name: string }>) => void;
  setWizardActions: (
    actions: Partial<WizardStoreState['wizardActions']>
  ) => void;
  reset: (initial?: ProjectConfig) => void;
}

export const initialProjectConfig: ProjectConfig = {
  template: {
    id: '',
    name: '',
    description: '',
    category: 'business',
    features: [],
    complexity: 'simple',
  },
  name: '',
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
  publishImmediately: true,
  designConfig: {
    primaryColor: '#3b82f6',
    generatedPalettes: [],
    selectedPalette: 0,
    logoFile: null,
    logoUrl: null,
    logoPrompt: null,
    logoOption: 'ai',
    logoStyle: null,
    logoColors: null,
    businessInfo: undefined,
  },
  domainConfig: {
    domain: '',
    provider: 'platform',
    domainType: 'hosted',
  },
};

export const useWizardStore = create<WizardStoreState>()(
  persist(
    (set) => ({
      currentStep: 'details',
      projectConfig: initialProjectConfig,
      isLoaded: false,
      selectedIndustry: undefined,
      hasAIGenerated: false,
      isDiscarding: false,
      detailsPhase: 'collect',
      showSummary: false,
      templatePath: null,
      showAssistantTransition: false,
      lastGeneratedDescription: null,
      startedWithTemplate: false,
      skipLoadingScreen: false,
      hasGeneratedSite: false,
      reviewState: null,
      prefillData: null,
      prefillImages: [],
      hostedAvailability: {
        suggestedDomain: null,
        isAvailable: null,
        checking: false,
        lastCheckedName: null,
        error: undefined,
      },
      wizardActions: {
        canPublish: false,
      },
      setCurrentStep: (s) => set({ currentStep: s }),
      setProjectConfig: (c) => {
        console.log('[WizardStore] setProjectConfig called with:', {
          name: c.name,
          description: c.description?.substring(0, 50),
          USP: c.USP?.substring(0, 50),
          targetUsers: c.targetUsers,
          businessGoals: c.businessGoals,
        });
        set({ projectConfig: c });
      },
      setIsLoaded: (v) => set({ isLoaded: v }),
      setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
      setHasAIGenerated: (v) => set({ hasAIGenerated: v }),
      setIsDiscarding: (v) => set({ isDiscarding: v }),
      setDetailsPhase: (phase) => set({ detailsPhase: phase }),
      setShowSummary: (show) => set({ showSummary: show }),
      setTemplatePath: (path) => set({ templatePath: path }),
      setShowAssistantTransition: (show) =>
        set({ showAssistantTransition: show }),
      setLastGeneratedDescription: (desc) =>
        set({ lastGeneratedDescription: desc }),
      setStartedWithTemplate: (started) =>
        set({ startedWithTemplate: started }),
      setSkipLoadingScreen: (skip) => set({ skipLoadingScreen: skip }),
      setHasGeneratedSite: (v) => set({ hasGeneratedSite: v }),
      setReviewState: (state) => set({ reviewState: state }),
      setHostedAvailability: (a) => set({ hostedAvailability: a }),
      resetHostedAvailability: () =>
        set({
          hostedAvailability: {
            suggestedDomain: null,
            isAvailable: null,
            checking: false,
            lastCheckedName: null,
            error: undefined,
          },
        }),
      setPrefillData: (data) => set({ prefillData: data }),
      setPrefillImages: (images) => set({ prefillImages: images }),
      setWizardActions: (actions) =>
        set((state) => ({
          wizardActions: { ...state.wizardActions, ...actions },
        })),
      reset: (initial) =>
        set((state) => ({
          projectConfig: initial ?? initialProjectConfig,
          currentStep: 'details',
          isLoaded: false,
          // Preserve isDiscarding state during reset to prevent flicker when discarding drafts
          isDiscarding: state.isDiscarding,
          detailsPhase: 'collect',
          showSummary: false,
          templatePath: null,
          showAssistantTransition: false,
          lastGeneratedDescription: null,
          startedWithTemplate: false,
          skipLoadingScreen: false,
          hasGeneratedSite: false,
          reviewState: null,
          prefillData: null,
          prefillImages: [],
          wizardActions: { canPublish: false },
        })),
    }),
    {
      name: 'flowstarter-wizard-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // ONLY persist prefill data for AI-generated content
        // The projectConfig itself is managed by the server-side draft system
        // to avoid conflicts between sessionStorage and server state
        prefillData: state.prefillData,
        prefillImages: state.prefillImages,
        skipLoadingScreen: state.skipLoadingScreen,
      }),
    }
  )
);
