/**
 * useEditorChatState Hook (Refactored v3 + Streamlined Flow)
 *
 * Main composite hook that orchestrates the editor chat experience.
 * Updated to support the streamlined 6-step onboarding flow.
 *
 * Composed hooks:
 * - Core: useOnboardingMessages, useOnboardingFlow, useTemplateSelection, usePaletteSelection, useBusinessInfo
 * - State: useStatePersistence, useStateRestoration, useWelcomeInit
 * - Handlers: useProjectNameHandlers, useBuildHandlers, useSuggestionHandlers, useSendHandler
 * - Setup: useOrchestratorSetup, useAgentSetup, useChatEffects
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTemplateClone } from '~/lib/hooks/useTemplateClone';
import { useSnapshotBlob } from '~/lib/hooks/useSnapshotBlob';
import { useTemplateCustomization } from '~/lib/hooks/useTemplateCustomization';
import { getRandomServicePrompts, SUGGESTED_REPLIES } from '../constants';
import {
  syncTemplateSelection,
  syncPaletteSelection,
  syncBusinessInfo as syncBusinessInfoToMain,
  hasHandoffConnection,
} from '~/lib/services/projectSyncService';
import { DEFAULT_PALETTE } from '~/lib/config/palettes';

// Import composed hooks
import { useOnboardingMessages } from './useOnboardingMessages';
import { useOnboardingFlow } from './useOnboardingFlow';
import { useTemplateSelection } from './useTemplateSelection';
import { usePaletteSelection } from './usePaletteSelection';
import { useBusinessInfo } from './useBusinessInfo';
import { useStatePersistence } from './useStatePersistence';
import { useStateRestoration } from './useStateRestoration';
import { useWelcomeInit } from './useWelcomeInit';
import { useProjectNameHandlers } from './useProjectNameHandlers';
import { useSimpleBuildHandlers } from './useSimpleBuildHandlers';
import { useSuggestionHandlers } from './useSuggestionHandlers';
import { useBusinessDiscoveryHandlers } from './useBusinessDiscoveryHandlers';
import { useAgentSetup } from './useAgentSetup';
import { useChatEffects } from './useChatEffects';
import { useSendHandler } from './useSendHandler';

// Streamlined onboarding utilities
import { 
  getQuickProfileAckMessage, 
  getDescribeAckMessage, 
  getSuggestedQuickProfile 
} from './streamlined-onboarding';
import { inferBusinessInfo } from '~/lib/inference/auto-inference';

// Types
import type {
  ColorPalette,
  SystemFont,
  LogoInfo,
  Template,
  PreviewInfo,
  InitialChatState,
  OnboardingStep,
  BusinessInfo,
  QuickProfile,
} from '../types';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';

// ═══════════════════════════════════════════════════════════════════════════
// Preview Source
// ═══════════════════════════════════════════════════════════════════════════

export type PreviewSource = 'daytona';

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
  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Stable Callback Refs
   * Store callbacks in refs to avoid re-creating hook options on every render
   * This prevents infinite loops from unstable callback references
   */
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Stable Callbacks
   * These callbacks have stable identity across renders
   */
  const handleStepChange = useCallback((newStep: OnboardingStep) => {
    onStateChangeRef.current?.({ step: newStep });
  }, []);

  const handleTemplateSelectSync = useCallback((template: Template) => {
    if (hasHandoffConnection()) {
      syncTemplateSelection({ id: template.id, name: template.name, slug: template.id });
    }
  }, []);

  const handlePaletteSelectSync = useCallback((palette: ColorPalette) => {
    if (hasHandoffConnection()) {
      syncPaletteSelection({
        id: palette.id,
        name: palette.name,
        colors: {
          primary: palette.colors[0] || '#000000',
          secondary: palette.colors[1] || '#333333',
          accent: palette.colors[2] || '#666666',
          background: palette.colors[3] || '#ffffff',
          text: palette.colors[4] || '#000000',
        },
      });
    }
  }, []);

  const handleBusinessInfoConfirmSync = useCallback(
    (info: {
      uvp: string;
      targetAudience: string;
      businessGoals: string[];
      brandTone: string;
      pricingOffers?: string;
    }) => {
      if (hasHandoffConnection()) {
        syncBusinessInfoToMain({
          uvp: info.uvp,
          targetAudience: info.targetAudience,
          businessGoals: info.businessGoals,
          brandTone: info.brandTone,
          pricingOffers: info.pricingOffers,
        });
      }
    },
    [],
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Core Hooks
  // ═══════════════════════════════════════════════════════════════════════

  /*
   * Note: Messages are synced via EditorChatPanel's syncMessages effect, not here
   * This prevents double-sync and infinite loops
   */
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
  // Additional State
  // ═══════════════════════════════════════════════════════════════════════

  const [selectedFont, setSelectedFont] = useState<SystemFont | null>(initialState?.selectedFont || null);
  const [selectedLogo, setSelectedLogo] = useState<LogoInfo | null>(initialState?.selectedLogo || null);
  const [currentUrlId, setCurrentUrlId] = useState<string | null>(initialState?.projectUrlId || null);
  
  // Quick Profile state (streamlined flow)
  const [quickProfile, setQuickProfile] = useState<QuickProfile | null>(initialState?.quickProfile || null);

  /*
   * Initialize from externalProjectId (from parent), then initialState, then null
   * externalProjectId takes precedence as it comes from conversation context which is authoritative
   */
  const [convexProjectId, setConvexProjectId] = useState<string | null>(
    externalProjectId || initialState?.convexProjectId || null,
  );

  // Effect to sync with externalProjectId when it changes (e.g., when conversation is created)
  useEffect(() => {
    if (externalProjectId && externalProjectId !== convexProjectId) {
      console.log('[useEditorChatState] Syncing project ID from external source:', externalProjectId);
      setConvexProjectId(externalProjectId);
    }
  }, [externalProjectId, convexProjectId]);

  const [previewSource] = useState<PreviewSource>('daytona');
  const [buildStep, setBuildStep] = useState<string>('');
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [buildPhase, setBuildPhase] = useState<string>('idle');
  const [lastAction, setLastAction] = useState<{ type: string; payload?: unknown } | null>(null);

  // ═══════════════════════════════════════════════════════════════════════
  // Suggested Quick Profile (computed from description)
  // ═══════════════════════════════════════════════════════════════════════
  
  const suggestedQuickProfile = useMemo(() => {
    if (!flowHook.projectDescription) return {};
    return getSuggestedQuickProfile(flowHook.projectDescription);
  }, [flowHook.projectDescription]);

  // ═══════════════════════════════════════════════════════════════════════
  // External Hooks
  // ═══════════════════════════════════════════════════════════════════════

  const { cloneTemplate, isCloning } = useTemplateClone();
  const { progress: customizeProgress, isCustomizing } = useTemplateCustomization();
  const { createSnapshot, createSnapshotFromFiles } = useSnapshotBlob();

  // ═══════════════════════════════════════════════════════════════════════
  // Agent & Orchestrator Setup
  // ═══════════════════════════════════════════════════════════════════════

  const { agentState, cancelAgent } = useAgentSetup({ messageHook });

  /*
   * Orchestrator has been replaced with Claude Agent SDK
   * These are stub values for backwards compatibility
   * Use useMemo to ensure stable reference across renders
   */
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
  const startOrchestration = async () => null;

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
    setSelectedFont,
    setSelectedLogo,
    setCurrentUrlId,
  });

  useWelcomeInit({ initialState, messageHook, flowHook, hasRestoredState });

  // ═══════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════

  useChatEffects({
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    selectedFont,
    currentUrlId,
    convexProjectId,
    buildPhase,
    hasRestoredState,
    isCustomizing,
    customizeProgress,
    agentPhase: agentState.phase,
    orchestratorState: orchestratorStatus.state,
    orchestratorOrchestrationId: orchestratorStatus.orchestrationId,
    initialState,
    onStateChange,
    onProjectReady,
    setBuildProgress,
    setBuildStep,
    createSnapshot,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Handler Hooks
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * STREAMLINED FLOW: Description submission goes to quick-profile step
   * (instead of the legacy name step)
   */
  const handleDescriptionSubmit = useCallback(
    async (description: string) => {
      flowHook.setProjectDescription(description);
      messageHook.addUserMessage(description);
      messageHook.setSuggestedReplies([]);

      // Auto-infer business info from description
      const inference = inferBusinessInfo(description);
      
      // Generate acknowledgment with quick profile prompt
      const ackMessage = getDescribeAckMessage(description, inference);
      await messageHook.addAssistantMessage(ackMessage.content);

      // Suggest a project name from description
      const suggestedName = inference.businessType 
        ? inference.businessType.type
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : '';
      
      if (suggestedName) {
        flowHook.setLastSuggestedName(suggestedName);
      }

      /*
       * IMPORTANT: Notify parent with ALL messages so project can be created
       */
      const allMessages = messageHook.getMessagesSync().map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.timestamp,
      }));
      onStateChange?.({ 
        projectDescription: description, 
        step: 'name', 
        messages: allMessages as any,
      });

      // Ask for project name with refinement options
      await messageHook.addAssistantMessage(
        `**What would you like to call your project?**\n\n` +
        (suggestedName ? `I suggest: **${suggestedName}**\n\n` : '') +
        `This will be used as your site title.`
      );
      
      // Show refinement cards if we have a suggestion
      messageHook.setSuggestedReplies(
        suggestedName 
          ? SUGGESTED_REPLIES.nameRefinementWithName(suggestedName)
          : SUGGESTED_REPLIES.nameChoice()
      );

      // Move to name step
      flowHook.setStep('name');
    },
    [flowHook, messageHook, onStateChange],
  );

  const { generateProjectName, handleNameSubmit } = useProjectNameHandlers({
    messageHook,
    flowHook,
    businessHook,
    onStateChange,
    lastAction,
    setLastAction,
  });

  // Business Discovery Handlers (legacy flow)
  const businessDiscoveryHook = useBusinessDiscoveryHandlers({
    messageHook,
    flowHook,
    projectDescription: flowHook.projectDescription,
    onBusinessInfoComplete: useCallback(
      async (businessInfo: BusinessInfo) => {
        // Store business info
        businessHook.setBusinessInfo(businessInfo);

        // Sync with main platform if connected
        if (hasHandoffConnection()) {
          syncBusinessInfoToMain(businessInfo);
        }

        // Sync complete business info to Convex
        onStateChange?.({ businessInfo });

        // Use unified step transition message for moving to template selection
        await messageHook.addStepTransitionMessage('business-summary', 'template', { businessInfo });
        flowHook.setStep('template');

        // Fetch AI-powered recommendations
        templateHook.fetchRecommendations(
          businessInfo,
          flowHook.projectName!,
          flowHook.projectDescription,
        );
      },
      [messageHook, flowHook, businessHook, templateHook, onStateChange],
    ),
    onStateChange,
  });

  // Delegate to the discovery hook's handleSummaryConfirmation which properly
  // assembles businessInfo from collected fields and triggers recommendations
  const handleBusinessInfoConfirm = useCallback(
    async (confirmed: boolean) => {
      businessDiscoveryHook.handleSummaryConfirmation(confirmed, confirmed ? undefined : undefined);
    },
    [businessDiscoveryHook],
  );

  /**
   * STREAMLINED FLOW: Quick Profile completion handler
   * Transitions from quick-profile to template selection with recommendations
   */
  const handleQuickProfileComplete = useCallback(
    async (profile: QuickProfile) => {
      setQuickProfile(profile);
      
      // Add user message with formatted choices
      const labels: Record<string, string> = {
        leads: 'Get Leads',
        sales: 'Make Sales',
        bookings: 'Get Bookings',
        'high-ticket': 'Premium',
        'low-ticket': 'Accessible',
        free: 'Free First',
        professional: 'Professional',
        bold: 'Bold',
        friendly: 'Friendly',
      };
      const choiceSummary = `${labels[profile.goal]} • ${labels[profile.offerType]} • ${labels[profile.tone]}`;
      messageHook.addUserMessage(choiceSummary);
      
      // Generate acknowledgment
      const ackMessage = getQuickProfileAckMessage(profile);
      await messageHook.addAssistantMessage(ackMessage.content);
      
      // Build business info from quick profile + auto-inference
      const description = flowHook.projectDescription || '';
      const inference = inferBusinessInfo(description);
      const businessInfo: BusinessInfo = {
        description,
        quickProfile: profile,
        businessType: inference.businessType?.type,
        targetAudience: inference.targetAudience?.audience,
        uvp: inference.uvp || undefined,
        industry: inference.businessType?.category,
      };
      
      // Update state - transition to UVP step
      businessHook.setBusinessInfo(businessInfo);
      onStateChange?.({ 
        quickProfile: profile,
        businessInfo,
        step: 'business-uvp',
      });
      
      // Show UVP prompt
      await messageHook.addAssistantMessage(
        '**What makes you different?**\n\n' +
        'Tell me your unique approach or what sets you apart from others.\n\n' +
        '*Example: "I use a holistic 3-step method that combines mindfulness with practical action plans."*'
      );
      messageHook.setSuggestedReplies([
        { id: 'uvp-method', text: 'I have a unique method' },
        { id: 'uvp-experience', text: 'Years of experience' },
        { id: 'uvp-results', text: 'Proven results' },
        { id: 'uvp-skip', text: 'Skip for now' },
      ]);
      flowHook.setStep('business-uvp');
    },
    [messageHook, flowHook, businessHook, onStateChange],
  );
  
  /**
   * STREAMLINED FLOW: UVP submission handler
   * Transitions from business-uvp to template selection
   */
  const handleUvpSubmit = useCallback(
    async (uvp: string, skipped: boolean = false) => {
      // Add user message
      if (skipped) {
        messageHook.addUserMessage('Skip for now');
      } else {
        messageHook.addUserMessage(uvp);
      }
      messageHook.setSuggestedReplies([]);
      
      // Update business info with UVP
      const currentBusinessInfo = businessHook.businessInfo || {} as BusinessInfo;
      const updatedBusinessInfo: BusinessInfo = {
        ...currentBusinessInfo,
        uvp: skipped ? undefined : uvp,
      };
      businessHook.setBusinessInfo(updatedBusinessInfo);
      
      // Generate acknowledgment
      const ackContent = skipped 
        ? "No problem! We can always add this later.\n\nNow let's pick your template. I've selected **3 that match your profile**:"
        : `Love it! "${uvp}" - that's a great differentiator.\n\nNow let's pick your template. I've selected **3 that match your profile**:`;
      await messageHook.addAssistantMessage(ackContent);
      
      // Fetch template recommendations
      const description = flowHook.projectDescription || '';
      const projectName = flowHook.projectName || 'My Site';
      templateHook.fetchRecommendations(
        updatedBusinessInfo,
        projectName,
        description,
      );
      
      // Update state and move to template step
      onStateChange?.({ 
        businessInfo: updatedBusinessInfo,
        step: 'template',
      });
      flowHook.setStep('template');
    },
    [messageHook, flowHook, templateHook, businessHook, onStateChange],
  );

  // Build handlers using Claude Agent SDK for site generation
  const { handlePersonalizationComplete, handleContactDetailsComplete, handleSkipContactDetails, handleIntegrationsComplete, handleSkipIntegrations } = useSimpleBuildHandlers({
    messageHook,
    flowHook,
    templateHook,
    paletteHook,
    businessHook,
    selectedFont,
    selectedLogo,
    setSelectedFont,
    setSelectedLogo,
    setConvexProjectId,
    setCurrentUrlId,
    setBuildStep,
    setBuildProgress,
    setBuildPhase,
    onPreviewChange,
    onProjectReady,
    onStateChange,
    existingProjectId: convexProjectId,
  });

  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      templateHook.handleTemplateSelect(template);

      // Sync template selection to Convex
      onStateChange?.({ selectedTemplateId: template.id, selectedTemplateName: template.name });
      messageHook.addUserMessage(`I'll use the "${template.name}" template`);

      // Use unified step transition message
      await messageHook.addStepTransitionMessage('template', 'personalization', { templateName: template.name });

      // Move to personalization step (palette, font, logo)
      flowHook.setStep('personalization');
    },
    [templateHook, messageHook, flowHook, onStateChange],
  );

  const handleRecommendationSelect = useCallback(
    async (recommendation: TemplateRecommendation) => {
      templateHook.handleRecommendationSelect(recommendation);

      // Sync template selection to Convex
      onStateChange?.({
        selectedTemplateId: recommendation.template.id,
        selectedTemplateName: recommendation.template.name,
      });
      messageHook.addUserMessage(`I'll use the "${recommendation.template.name}" template`);

      // Use unified step transition message
      await messageHook.addStepTransitionMessage('template', 'personalization', {
        templateName: recommendation.template.name,
      });
      flowHook.setStep('personalization');
    },
    [templateHook, messageHook, flowHook, onStateChange],
  );

  /*
   * Personalization handlers (called from PersonalizationPanel)
   * Sync customization data to Convex as it's selected
   */
  const handlePaletteSelect = useCallback(
    (palette: ColorPalette) => {
      paletteHook.handlePaletteSelect(palette);

      // Sync palette to Convex
      onStateChange?.({ selectedPalette: palette });
    },
    [paletteHook, onStateChange],
  );

  const handleFontSelect = useCallback(
    (font: SystemFont) => {
      setSelectedFont(font);

      // Sync font to Convex
      onStateChange?.({ selectedFont: font });
    },
    [onStateChange],
  );

  // Use ref to always have the latest font value (avoids stale closure in handleLogoSelect)
  const selectedFontRef = useRef<SystemFont | null>(selectedFont);
  useEffect(() => {
    selectedFontRef.current = selectedFont;
  }, [selectedFont]);

  const handleLogoSelect = useCallback(
    (logo: LogoInfo, useAiImages?: boolean) => {
      setSelectedLogo(logo);

      // Sync logo and AI images preference to state
      onStateChange?.({ selectedLogo: logo, useAiImages });

      /*
       * After logo is selected, we have all personalization done
       * Now trigger the build
       * Use ref to get latest font value (avoids stale closure issue)
       */
      const currentFont = selectedFontRef.current;
      if (currentFont) {
        handlePersonalizationComplete(currentFont, logo, useAiImages);
      } else {
        console.warn('Logo selected but no font selected yet - font ref is null');
      }
    },
    [handlePersonalizationComplete, onStateChange],
  );

  const { handleSuggestionAccept } = useSuggestionHandlers({
    messageHook,
    flowHook,
    businessHook,
    lastAction,
    setLastAction,
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
    currentUrlId,
    convexProjectId,
    handleDescriptionSubmit,
    handleNameSubmit,
  });

  const refreshSuggestions = useCallback(() => {
    if (flowHook.step === 'welcome' || flowHook.step === 'describe') {
      messageHook.setSuggestedReplies(getRandomServicePrompts(5));
    }
  }, [flowHook.step, messageHook]);

  // Wrapped fetchRecommendations that uses current state
  const fetchRecommendationsWrapped = useCallback(() => {
    if (businessHook.businessInfo) {
      return templateHook.fetchRecommendations(
        businessHook.businessInfo,
        flowHook.projectName!,
        flowHook.projectDescription,
      );
    }

    return Promise.resolve();
  }, [businessHook.businessInfo, flowHook.projectName, flowHook.projectDescription, templateHook.fetchRecommendations]);

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
    previewSource,

    // Build progress
    buildStep,
    buildProgress,
    buildPhase,

    // Chat state
    isLoadingState: false,
    isGeneratingMessage: messageHook.isGeneratingMessage,

    // Business info
    businessInfo: businessHook.businessInfo,
    setBusinessInfo: businessHook.setBusinessInfo,

    // Quick Profile (streamlined flow)
    quickProfile,
    suggestedQuickProfile,
    handleQuickProfileComplete,
    handleUvpSubmit,

    // Project details
    projectName: flowHook.projectName,
    projectDescription: flowHook.projectDescription,
    currentUrlId,

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
    handlePersonalizationComplete,
    handleContactDetailsComplete,
    handleSkipContactDetails,
    handleIntegrationsComplete,
    handleSkipIntegrations,
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
    selectedFont,
    selectedLogo,
  };
}
