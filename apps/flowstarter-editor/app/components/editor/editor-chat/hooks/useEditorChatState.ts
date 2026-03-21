/**
 * useEditorChatState Hook (Refactored v4)
 *
 * Main composite hook that orchestrates the editor chat experience.
 * Updated to use focused sub-hooks for better organization.
 *
 * Composed hooks:
 * - Sync: useSyncCallbacks
 * - Core: useOnboardingMessages, useOnboardingFlow, useTemplateSelection, usePaletteSelection, useBusinessInfo
 * - State: useStatePersistence, useStateRestoration, useWelcomeInit, useAdditionalState
 * - Flow: useDescriptionFlow, useTemplateFlow, usePersonalizationFlow, useBusinessFlow
 * - Handlers: useProjectNameHandlers, useSimpleBuildHandlers, useSuggestionHandlers, useSendHandler
 * - Setup: useAgentSetup, useChatEffects
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useTemplateClone } from '~/lib/hooks/useTemplateClone';
import { useSnapshotBlob } from '~/lib/hooks/useSnapshotBlob';
import { useTemplateCustomization } from '~/lib/hooks/useTemplateCustomization';

// Core composed hooks
import { useOnboardingMessages } from './useOnboardingMessages';
import { useOnboardingFlow } from './useOnboardingFlow';
import { useTemplateSelection } from './useTemplateSelection';
import { usePaletteSelection } from './usePaletteSelection';
import { useBusinessInfo } from './useBusinessInfo';
import { useStatePersistence } from './useStatePersistence';
import { useStateRestoration } from './useStateRestoration';
import { useWelcomeInit } from './useWelcomeInit';
import { useAgentSetup } from './useAgentSetup';
import { useChatEffects } from './useChatEffects';

// Focused flow & handler hooks
import { useSyncCallbacks } from './useSyncCallbacks';
import { useAdditionalState } from './useAdditionalState';
import { useDescriptionFlow } from './useDescriptionFlow';
import { useTemplateFlow } from './useTemplateFlow';
import { usePersonalizationFlow } from './usePersonalizationFlow';
import { useBusinessFlow } from './useBusinessFlow';
import { useProjectNameHandlers } from './useProjectNameHandlers';
import { useSimpleBuildHandlers } from './useSimpleBuildHandlers';
import { useSuggestionHandlers } from './useSuggestionHandlers';
import { useSendHandler } from './useSendHandler';

// Types
import type { PreviewInfo, InitialChatState, OnboardingStep, BusinessDetailsData } from '../types';

// Re-export PreviewSource from useAdditionalState
export type { PreviewSource } from './useAdditionalState';

// ═══════════════════════════════════════════════════════════════════════════
// Hook Props
// ═══════════════════════════════════════════════════════════════════════════

interface UseEditorChatStateProps {
  onProjectReady?: (urlId: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  initialState?: InitialChatState;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  /** External project ID from parent component (e.g., from conversation context) */
  externalProjectId?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useEditorChatState({
  onProjectReady,
  onPreviewChange,
  initialState,
  onStateChange,
  externalProjectId,
}: UseEditorChatStateProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // Sync Callbacks (stable refs for state syncing)
  // ═══════════════════════════════════════════════════════════════════════

  const { handleStepChange, handleTemplateSelectSync, handlePaletteSelectSync, handleBusinessInfoConfirmSync } =
    useSyncCallbacks({ onStateChange });

  // ═══════════════════════════════════════════════════════════════════════
  // Core Hooks
  // ═══════════════════════════════════════════════════════════════════════

  const messageHook = useOnboardingMessages();

  const flowHook = useOnboardingFlow({
    initialStep: initialState?.step || 'welcome',
    initialDescription: initialState?.projectDescription || '',
    initialProjectName: initialState?.projectName || null,
    onStepChange: handleStepChange,
  });

  const templateHook = useTemplateSelection({
    onTemplateSelect: handleTemplateSelectSync,
  });

  const paletteHook = usePaletteSelection({
    initialPalette: initialState?.selectedPalette || null,
    onPaletteSelect: handlePaletteSelectSync,
  });

  const businessHook = useBusinessInfo({
    onBusinessInfoConfirm: handleBusinessInfoConfirmSync,
  });

  useStatePersistence({ initialState, onStateChange });

  // ═══════════════════════════════════════════════════════════════════════
  // Additional State (font, logo, build progress, etc.)
  // ═══════════════════════════════════════════════════════════════════════

  const additionalState = useAdditionalState({
    initialState,
    externalProjectId,
    projectDescription: flowHook.projectDescription,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // External Hooks
  // ═══════════════════════════════════════════════════════════════════════

  const { isCloning } = useTemplateClone();
  const { progress: customizeProgress, isCustomizing } = useTemplateCustomization();
  const { createSnapshot } = useSnapshotBlob();

  // ═══════════════════════════════════════════════════════════════════════
  // Agent & Orchestrator Setup
  // ═══════════════════════════════════════════════════════════════════════

  const { agentState, cancelAgent } = useAgentSetup({ messageHook });

  // Orchestrator stub (replaced with Claude Agent SDK)
  const orchestratorStatus = useMemo(
    () => ({
      phase: 'idle' as const,
      state: 'idle' as const,
      orchestrationId: null,
      message: undefined,
      progress: undefined,
      currentTask: undefined,
    }),
    [],
  );
  const orchestratorRunning = false;
  const stopOrchestration = useCallback(() => {}, []);

  // ═══════════════════════════════════════════════════════════════════════
  // State Restoration & Welcome Init
  // ═══════════════════════════════════════════════════════════════════════

  const { hasRestoredState } = useStateRestoration({
    initialState,
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    businessHook,
    setSelectedFont: additionalState.setSelectedFont,
    setSelectedLogo: additionalState.setSelectedLogo,
    setCurrentUrlId: additionalState.setCurrentUrlId,
  });

  /**
   * Callback to fetch ALL templates for manual selection (internal flow).
   */
  const handleFetchTemplates = useCallback(() => {
    // Trigger template fetch via React Query
    templateHook.refetchTemplates();
  }, [templateHook]);

  /**
   * Callback for internal flow (template-first) initialization.
   * Sets business info when business details are already known.
   */
  const handleInternalFlowStart = useCallback(
    (businessInfo: import('../types').BusinessInfo, projectName: string, description: string) => {
      // Update business hook with initial state
      businessHook.setBusinessInfo(businessInfo);
      // Fetch AI recommendations using the pre-populated business data
      // This gives a tailored shortlist first; full gallery is still accessible
      templateHook.fetchRecommendations(businessInfo, projectName, description);
    },
    [businessHook, templateHook],
  );

  const pendingSeededBuildRef = useRef(
    Boolean(
      initialState?.selectedTemplateId &&
        initialState?.selectedPalette &&
        initialState?.selectedFont &&
        (initialState?.businessInfo?.description || initialState?.projectDescription) &&
        (!initialState?.messages || initialState.messages.length === 0),
    ),
  );

  const handleTemplateBuildStart = useCallback(() => {
    pendingSeededBuildRef.current = true;
  }, []);

  useWelcomeInit({
    initialState,
    messageHook,
    flowHook,
    hasRestoredState,
    onFetchTemplates: handleFetchTemplates,
    onInternalFlowStart: handleInternalFlowStart,
    onTemplateBuildStart: handleTemplateBuildStart,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════

  useChatEffects({
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    selectedFont: additionalState.selectedFont,
    currentUrlId: additionalState.currentUrlId,
    convexProjectId: additionalState.convexProjectId,
    buildPhase: additionalState.buildPhase,
    hasRestoredState,
    isCustomizing,
    customizeProgress,
    agentPhase: agentState.phase,
    orchestratorState: orchestratorStatus.state,
    orchestratorOrchestrationId: orchestratorStatus.orchestrationId,
    initialState,
    onStateChange,
    onProjectReady,
    setBuildProgress: additionalState.setBuildProgress,
    setBuildStep: additionalState.setBuildStep,
    createSnapshot,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Build Handlers
  // ═══════════════════════════════════════════════════════════════════════

  const buildHandlers = useSimpleBuildHandlers({
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    businessHook,
    selectedFont: additionalState.selectedFont,
    selectedLogo: additionalState.selectedLogo,
    setSelectedFont: additionalState.setSelectedFont,
    setSelectedLogo: additionalState.setSelectedLogo,
    setConvexProjectId: additionalState.setConvexProjectId,
    setCurrentUrlId: additionalState.setCurrentUrlId,
    setBuildStep: additionalState.setBuildStep,
    setBuildProgress: additionalState.setBuildProgress,
    setBuildPhase: additionalState.setBuildPhase,
    onPreviewChange,
    onProjectReady,
    onStateChange,
    existingProjectId: additionalState.convexProjectId,
    convexConversationId: initialState?.conversationId || null,
  });

  useEffect(() => {
    if (!pendingSeededBuildRef.current) {
      return;
    }

    if (!hasRestoredState.current) {
      return;
    }

    if (!templateHook.selectedTemplate || !paletteHook.selectedPalette || !additionalState.selectedFont) {
      return;
    }

    pendingSeededBuildRef.current = false;
    void buildHandlers.startSeededBuild();
  }, [
    additionalState.selectedFont,
    buildHandlers,
    hasRestoredState,
    paletteHook.selectedPalette,
    templateHook.selectedTemplate,
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // Flow Handlers
  // ═══════════════════════════════════════════════════════════════════════

  const { handleDescriptionSubmit, handleQuickProfileComplete, handleUvpSubmit } = useDescriptionFlow({
    messageHook,
    flowHook,
    businessHook,
    templateHook,
    setQuickProfile: additionalState.setQuickProfile,
    onStateChange,
  });

  const { handleTemplateSelect, handleRecommendationSelect, fetchRecommendationsWrapped } = useTemplateFlow({
    messageHook,
    flowHook,
    templateHook,
    businessHook,
    onStateChange,
  });

  const { handlePaletteSelect, handleFontSelect, handleLogoSelect, refreshSuggestions } = usePersonalizationFlow({
    messageHook,
    flowHook,
    paletteHook,
    selectedFont: additionalState.selectedFont,
    setSelectedFont: additionalState.setSelectedFont,
    setSelectedLogo: additionalState.setSelectedLogo,
    handlePersonalizationComplete: buildHandlers.handlePersonalizationComplete,
    onStateChange,
  });

  const { businessDiscoveryHook, handleBusinessInfoConfirm } = useBusinessFlow({
    messageHook,
    flowHook,
    businessHook,
    templateHook,
    onStateChange,
  });

  /**
   * Handle the consolidated BusinessDetailsForm submission.
   * Updates business info with UVP, offerings, contact details, then advances to template.
   */
  const handleBusinessDetailsComplete = useCallback(
    async (data: BusinessDetailsData) => {
      // Merge new business-details data into existing businessInfo
      const currentInfo = businessHook.businessInfo || {
        description: flowHook.projectDescription,
        quickProfile: additionalState.quickProfile || {
          goal: 'leads' as const,
          offerType: 'free' as const,
          tone: 'professional' as const,
        },
      };

      const updatedInfo = {
        ...currentInfo,
        uvp: data.uvp,
        offerings:
          data.offerings.map((o) => `${o.name}${o.price ? ` (${o.price})` : ''}: ${o.description}`).join('; ') ||
          undefined,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        website: data.website,
      };

      businessHook.setBusinessInfo(updatedInfo);
      onStateChange?.({ businessInfo: updatedInfo });

      // Also store contact details separately
      if (data.contactEmail) {
        onStateChange?.({
          contactDetails: {
            email: data.contactEmail,
            phone: data.contactPhone,
            address: data.contactAddress,
            website: data.website,
            ...(data.socialLinks || {}),
          },
        });
      }

      // Transition to template step
      messageHook.addAssistantMessage(
        "Great! I've got your business details. Now let's pick the perfect template for your site.",
      );
      flowHook.setStep('template');

      // Fetch AI recommendations using the updated info
      templateHook.fetchRecommendations(updatedInfo, flowHook.projectName!, flowHook.projectDescription);
    },
    [messageHook, flowHook, businessHook, templateHook, additionalState, onStateChange],
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Other Handlers
  // ═══════════════════════════════════════════════════════════════════════

  const { generateProjectName, handleNameSubmit } = useProjectNameHandlers({
    messageHook,
    flowHook,
    businessHook,
    onStateChange,
    lastAction: additionalState.lastAction,
    setLastAction: additionalState.setLastAction,
  });

  const { handleSuggestionAccept } = useSuggestionHandlers({
    messageHook,
    flowHook,
    businessHook,
    lastAction: additionalState.lastAction,
    setLastAction: additionalState.setLastAction,
    handleDescriptionSubmit,
    handleNameSubmit,
    generateProjectName,
    handleBusinessInfoConfirm,
    onStateChange,
  });

  const { handleSend } = useSendHandler({
    messageHook,
    flowHook,
    businessHook,
    businessDiscoveryHook,
    currentUrlId: additionalState.currentUrlId,
    convexProjectId: additionalState.convexProjectId,
    handleDescriptionSubmit,
    handleNameSubmit,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Computed: Business Context (for display in UI)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Business context computed from initial state and business info.
   * Used to display business details in the UI for the internal flow.
   */
  const businessContext = useMemo(() => {
    const info = businessHook.businessInfo;
    if (!info && !initialState?.businessInfo && !initialState?.projectDescription) {
      return null;
    }

    const source = info || initialState?.businessInfo;
    return {
      businessName: flowHook.projectName || source?.businessType || initialState?.projectName || undefined,
      description: source?.description || initialState?.projectDescription || undefined,
      targetAudience: source?.targetAudience || undefined,
      goals: source?.businessGoals || undefined,
      industry: source?.industry || undefined,
      uvp: source?.uvp || undefined,
    };
  }, [businessHook.businessInfo, initialState, flowHook.projectName]);

  /**
   * Check if we're in internal flow (template-first) mode.
   * This is true when business details were pre-populated from team dashboard.
   */
  const isInternalFlow = useMemo(() => {
    return Boolean(businessContext?.description && businessContext.description.length > 10);
  }, [businessContext]);

  // ═══════════════════════════════════════════════════════════════════════
  // Return Public API
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // State
    messages: messageHook.messages,
    setMessages: messageHook.setMessages,
    inputValue: flowHook.inputValue,
    setInputValue: flowHook.setInputValue,
    step: flowHook.step,
    suggestedReplies: messageHook.suggestedReplies,
    isTyping: messageHook.isTyping,
    thumbnailErrors: templateHook.thumbnailErrors,
    previewTemplate: templateHook.previewTemplate,
    previewPalette: paletteHook.previewPalette,
    previewRecommendation: templateHook.previewRecommendation,
    templatePalette: paletteHook.templatePalette,
    showCustomPalette: paletteHook.showCustomPalette,
    setShowCustomPalette: paletteHook.setShowCustomPalette,
    customColors: paletteHook.customColors,
    setCustomColors: paletteHook.setCustomColors,
    selectedPalette: paletteHook.selectedPalette,
    setSelectedPalette: paletteHook.setSelectedPalette,
    messagesEndRef: messageHook.messagesEndRef,

    // Templates
    templates: templateHook.templates,
    selectedTemplate: templateHook.selectedTemplate,
    templatesLoading: templateHook.templatesLoading,
    templatesError: templateHook.templatesError,
    refetchTemplates: templateHook.refetchTemplates,
    isCloning,

    // Agent state
    agentState,
    agentRunning: agentState.isRunning,
    cancelAgent,

    // Orchestrator
    orchestratorStatus,
    orchestratorRunning,
    stopOrchestration,

    // Preview source
    previewSource: additionalState.previewSource,

    // Build progress
    buildStep: additionalState.buildStep,
    buildProgress: additionalState.buildProgress,
    buildPhase: additionalState.buildPhase,

    // Chat state
    isLoadingState: false,
    isGeneratingMessage: messageHook.isGeneratingMessage,

    // Business info
    businessInfo: businessHook.businessInfo,
    setBusinessInfo: businessHook.setBusinessInfo,

    // Quick Profile (streamlined flow)
    quickProfile: additionalState.quickProfile,
    suggestedQuickProfile: additionalState.suggestedQuickProfile,
    handleQuickProfileComplete,
    handleUvpSubmit,

    // Project details
    projectName: flowHook.projectName,
    projectDescription: flowHook.projectDescription,
    currentUrlId: additionalState.currentUrlId,

    // Template recommendations
    recommendations: templateHook.recommendations,
    recommendationsLoading: templateHook.recommendationsLoading,
    recommendationsError: templateHook.recommendationsError,
    selectedRecommendation: templateHook.selectedRecommendation,
    fetchRecommendations: fetchRecommendationsWrapped,

    // Handlers
    handleDescriptionSubmit,
    handleNameSubmit,
    handleBusinessInfoConfirm,
    handleTemplateSelect,
    handleRecommendationSelect,
    handlePaletteSelect,
    handleFontSelect,
    handleLogoSelect,
    handlePersonalizationComplete: buildHandlers.handlePersonalizationComplete,
    handleContactDetailsComplete: buildHandlers.handleContactDetailsComplete,
    handleSkipContactDetails: buildHandlers.handleSkipContactDetails,
    handleIntegrationsComplete: buildHandlers.handleIntegrationsComplete,
    handleSkipIntegrations: buildHandlers.handleSkipIntegrations,
    handleBusinessDetailsComplete,
    handleSuggestionAccept,
    handleSend,
    handleThumbnailError: templateHook.handleThumbnailError,
    refreshSuggestions,
    openPreview: templateHook.openPreview,
    setPreviewTemplate: templateHook.setPreviewTemplate,
    setPreviewRecommendation: templateHook.setPreviewRecommendation,

    // Business discovery
    businessDiscoveryHook,

    // Selected items
    selectedFont: additionalState.selectedFont,
    selectedLogo: additionalState.selectedLogo,

    // Internal flow (template-first) - business context display
    businessContext,
    isInternalFlow,
  };
}
