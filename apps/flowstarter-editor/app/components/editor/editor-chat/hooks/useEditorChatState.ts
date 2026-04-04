/**
 * useEditorChatState Hook (Refactored v5)
 *
 * Main composite hook that orchestrates the editor chat experience.
 * Updated to use focused sub-hooks for better organization.
 *
 * Composed hooks:
 * - Sync: useSyncCallbacks
 * - Core: useOnboardingMessages, useOnboardingFlow, useTemplateSelection, usePaletteSelection, useBusinessInfo
 * - State: useStatePersistence, useStateRestoration, useWelcomeInit, useAdditionalState
 * - Flow: useDescriptionFlow, useTemplateFlow, usePersonalizationFlow, useBusinessFlow
 * - Handlers: useFlowHandlers, useSimpleBuildHandlers, useSendHandler
 * - Computed: useBusinessContext
 * - Setup: useAgentSetup, useChatEffects
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useTemplateClone } from '~/lib/hooks/useTemplateClone';
import { useSnapshotBlob } from '~/lib/hooks/useSnapshotBlob';

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
import { usePersonalizationFlow } from './usePersonalizationFlow';
import { useSimpleBuildHandlers } from './useSimpleBuildHandlers';
import { useSendHandler } from './useSendHandler';
import { useFlowHandlers } from './useFlowHandlers';
import { useBusinessContext } from './useBusinessContext';
import { normalizeHandoffStep } from './handoffState';

// Types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PreviewInfo, InitialChatState, OnboardingStep } from '~/components/editor/editor-chat/types';

// Re-export PreviewSource from useAdditionalState
export type { PreviewSource } from './useAdditionalState';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Hook Props
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface UseEditorChatStateProps {
  onProjectReady?: (urlId: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  initialState?: InitialChatState;
  onStateChange?: (state: Partial<InitialChatState>) => void;

  /** External project ID from parent component (e.g., from conversation context) */
  externalProjectId?: string | null;
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Main Hook
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function useEditorChatState({
  onProjectReady,
  onPreviewChange,
  initialState,
  onStateChange,
  externalProjectId,
}: UseEditorChatStateProps) {
  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Sync Callbacks (stable refs for state syncing)
   * ═══════════════════════════════════════════════════════════════════════
   */

  const { handleStepChange, handleTemplateSelectSync, handlePaletteSelectSync, handleBusinessInfoConfirmSync } =
    useSyncCallbacks({ onStateChange });

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Core Hooks
   * ═══════════════════════════════════════════════════════════════════════
   */

  const messageHook = useOnboardingMessages();

  const flowHook = useOnboardingFlow({
    initialStep: initialState ? normalizeHandoffStep(initialState) : 'creating',
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

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Additional State (font, logo, build progress, etc.)
   * ═══════════════════════════════════════════════════════════════════════
   */

  const additionalState = useAdditionalState({
    initialState,
    externalProjectId,
    projectDescription: flowHook.projectDescription,
  });

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * External Hooks
   * ═══════════════════════════════════════════════════════════════════════
   */

  const { isCloning } = useTemplateClone();
  const { createSnapshot } = useSnapshotBlob();

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Agent & Orchestrator Setup
   * ═══════════════════════════════════════════════════════════════════════
   */

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

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * State Restoration & Welcome Init
   * ═══════════════════════════════════════════════════════════════════════
   */

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
    onTemplateBuildStart: handleTemplateBuildStart,
  });

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Effects
   * ═══════════════════════════════════════════════════════════════════════
   */

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
    isCustomizing: false,
    customizeProgress: { phase: 'idle', progress: 0 },
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

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Build Handlers
   * ═══════════════════════════════════════════════════════════════════════
   */

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
    seededIntegrations: initialState?.integrations || [],
    seededTemplate:
      initialState?.selectedTemplateId && initialState?.selectedTemplateName
        ? {
            id: initialState.selectedTemplateId,
            name: initialState.selectedTemplateName,
          }
        : null,
  });

  // Auto-start seeded build once state is restored and all selections are available
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
    buildHandlers.startSeededBuild();
  }, [
    additionalState.selectedFont,
    buildHandlers,
    hasRestoredState,
    paletteHook.selectedPalette,
    templateHook.selectedTemplate,
  ]);

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Flow Handlers (extracted)
   * ═══════════════════════════════════════════════════════════════════════
   */

  const {
    handleTemplateSelect,
    handleRecommendationSelect,
    handleReviewBuildStart,
    handleBusinessInfoConfirm,
    handleSuggestionAccept,
  } = useFlowHandlers({
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    onStateChange,
    buildHandlers,
    pendingSeededBuildRef,
  });

  const { handlePaletteSelect, handleFontSelect, refreshSuggestions } = usePersonalizationFlow({
    paletteHook,
    setSelectedFont: additionalState.setSelectedFont,
    onStateChange,
  });

  const { handleSend } = useSendHandler({
    messageHook,
    flowHook,
    businessHook,
    currentUrlId: additionalState.currentUrlId,
    convexProjectId: additionalState.convexProjectId,
  });

  const noopAsync = useCallback(async () => {}, []);

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Computed: Business Context (extracted)
   * ═══════════════════════════════════════════════════════════════════════
   */

  const { businessContext, isInternalFlow } = useBusinessContext({
    businessHook,
    initialState,
    flowHook,
  });

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Return Public API
   * ═══════════════════════════════════════════════════════════════════════
   */

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

    // Legacy onboarding fields retained as inert values during migration cleanup
    quickProfile: additionalState.quickProfile,
    suggestedQuickProfile: additionalState.suggestedQuickProfile,
    handleQuickProfileComplete: noopAsync,
    handleUvpSubmit: noopAsync,

    // Project details
    projectName: flowHook.projectName,
    projectDescription: flowHook.projectDescription,
    currentUrlId: additionalState.currentUrlId,

    // Template recommendations
    recommendations: templateHook.recommendations,
    recommendationsLoading: templateHook.recommendationsLoading,
    recommendationsError: templateHook.recommendationsError,
    selectedRecommendation: templateHook.selectedRecommendation,
    fetchRecommendations: noopAsync,

    // Handlers
    handleDescriptionSubmit: noopAsync,
    handleNameSubmit: noopAsync,
    handleBusinessInfoConfirm,
    handleTemplateSelect,
    handleRecommendationSelect,
    handlePaletteSelect,
    handleFontSelect,
    handleContactDetailsComplete: buildHandlers.handleContactDetailsComplete,
    handleSkipContactDetails: buildHandlers.handleSkipContactDetails,
    handleBusinessDetailsComplete: noopAsync,
    handleReviewBuildStart,
    handleSuggestionAccept,
    handleSend,
    handleThumbnailError: templateHook.handleThumbnailError,
    refreshSuggestions,
    openPreview: templateHook.openPreview,
    setPreviewTemplate: templateHook.setPreviewTemplate,
    setPreviewRecommendation: templateHook.setPreviewRecommendation,

    // Business discovery
    businessDiscoveryHook: null,

    // Selected items
    selectedFont: additionalState.selectedFont,
    selectedLogo: additionalState.selectedLogo,

    // Internal flow (template-first) - business context display
    businessContext,
    isInternalFlow,
    brandProfile: initialState?.brandProfile || null,
  };
}
