/**
 * useStateRestoration Hook
 *
 * Handles restoration of state from initialState on mount and
 * template restoration when templates load.
 */

import { useEffect, useRef, useCallback } from 'react';
import { getRandomServicePrompts, getDefaultReadySuggestions } from '../constants';
import type { ChatMessage, InitialChatState, Template } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import type { UsePaletteSelectionReturn } from './usePaletteSelection';
import type { UseBusinessInfoReturn } from './useBusinessInfo';

interface UseStateRestorationProps {
  initialState?: InitialChatState;
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;
  businessHook: UseBusinessInfoReturn;
  setSelectedFont: (font: { id: string; name: string; heading: string; body: string } | null) => void;
  setSelectedLogo: (
    logo: { url: string; storageId?: string; type: 'uploaded' | 'generated'; prompt?: string } | null,
  ) => void;
  setCurrentUrlId: (urlId: string | null) => void;
}

interface UseStateRestorationReturn {
  hasRestoredState: React.MutableRefObject<boolean>;
  hasFetchedRecommendationsRef: React.MutableRefObject<boolean>;
}

export function useStateRestoration({
  initialState,
  messageHook,
  flowHook,
  templateHook,
  paletteHook,
  businessHook,
  setSelectedFont,
  setSelectedLogo,
  setCurrentUrlId,
}: UseStateRestorationProps): UseStateRestorationReturn {
  const hasRestoredState = useRef(false);
  const pendingTemplateRestoreRef = useRef<string | null>(null);
  const hasFetchedRecommendationsRef = useRef(false);

  // Store hook references in refs to avoid infinite loops from unstable object references
  const messageHookRef = useRef(messageHook);
  const flowHookRef = useRef(flowHook);
  const templateHookRef = useRef(templateHook);
  const paletteHookRef = useRef(paletteHook);
  const businessHookRef = useRef(businessHook);
  messageHookRef.current = messageHook;
  flowHookRef.current = flowHook;
  templateHookRef.current = templateHook;
  paletteHookRef.current = paletteHook;
  businessHookRef.current = businessHook;

  // Helper function to restore step-specific state
  const restoreStepState = useCallback(
    (state: InitialChatState) => {
      const msg = messageHookRef.current;
      const flow = flowHookRef.current;
      const step = state.step;

      if (step === 'welcome' || step === 'describe') {
        msg.setSuggestedReplies(getRandomServicePrompts());
      } else if (step === 'name') {
        if (state.projectName) {
          flow.setLastSuggestedName(state.projectName);
          msg.setSuggestedReplies([
            { id: 'accept-name', text: 'Use this name' },
            { id: 'more-punchy', text: 'Make it punchy' },
            { id: 'more-creative', text: 'More creative' },
            { id: 'more-professional', text: 'More professional' },
            { id: 'shorter', text: 'Shorter' },
            { id: 'try-another', text: 'Try another' },
            { id: 'own-name', text: 'I have my own' },
          ]);
        } else {
          msg.setSuggestedReplies([
            { id: 'generate-name', text: 'Suggest a name' },
            { id: 'own-name', text: 'I have my own' },
          ]);
        }
      } else if (step === 'business-summary') {
        if (state.businessInfo) {
          msg.setSuggestedReplies([
            { id: 'confirm-summary', text: 'Looks good!' },
            { id: 'edit-summary', text: 'Let me adjust something' },
          ]);
        } else {
          msg.setSuggestedReplies([{ id: 'skip-business-info', text: 'Skip and continue' }]);
        }
      } else if (
        step === 'business-uvp' ||
        step === 'business-audience' ||
        step === 'business-goals' ||
        step === 'business-tone' ||
        step === 'business-selling' ||
        step === 'business-pricing'
      ) {
        // Business discovery steps - no suggested replies, user types answer
        msg.setSuggestedReplies([]);
      } else if (step === 'template') {
        msg.setSuggestedReplies([]);
        hasFetchedRecommendationsRef.current = false;
      } else if (step === 'personalization') {
        msg.setSuggestedReplies([]);
      } else if (step === 'ready') {
        msg.setSuggestedReplies(getDefaultReadySuggestions());
      }

      // Handle interrupted orchestration
      if (state.orchestrationState === 'running') {
        msg.addAssistantMessage(
          'A build process was interrupted. Your project files have been saved. You can continue making changes or start a new request.',
        );
      }
    },
    [], // Empty deps - uses refs
  );

  // Store initialState in ref to avoid dependency on changing prop
  const initialStateRef = useRef(initialState);

  if (initialState && !initialStateRef.current) {
    initialStateRef.current = initialState;
  }

  // Store setter refs to avoid dependencies
  const setSelectedFontRef = useRef(setSelectedFont);
  const setSelectedLogoRef = useRef(setSelectedLogo);
  const setCurrentUrlIdRef = useRef(setCurrentUrlId);
  setSelectedFontRef.current = setSelectedFont;
  setSelectedLogoRef.current = setSelectedLogo;
  setCurrentUrlIdRef.current = setCurrentUrlId;

  /*
   * Restore state from initialState on mount
   * Note: This effect should only run ONCE on mount, not when dependencies change
   */
  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const state = initialStateRef.current;

    if (!state) {
      // No initial state to restore - mark as done so welcome can proceed
      hasRestoredState.current = true;
      return;
    }

    hasRestoredState.current = true;
    console.log('[useStateRestoration] Restoring state from conversation:', state.step);

    const msg = messageHookRef.current;
    const business = businessHookRef.current;
    const palette = paletteHookRef.current;

    // Restore messages
    if (state.messages && state.messages.length > 0) {
      const restoredMessages: ChatMessage[] = state.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt,
      }));
      msg.setMessages(restoredMessages);
    }

    // Restore business info
    if (state.businessInfo) {
      business.setBusinessInfo(state.businessInfo);
    }

    // Restore selected template (defer if templates not loaded yet)
    if (state.selectedTemplateId) {
      pendingTemplateRestoreRef.current = state.selectedTemplateId;
    }

    // Restore palette
    if (state.selectedPalette) {
      palette.setSelectedPalette(state.selectedPalette);
    }

    // Restore font
    if (state.selectedFont) {
      setSelectedFontRef.current(state.selectedFont);
    }

    // Restore logo
    if (
      state.selectedLogo &&
      state.selectedLogo.url &&
      (state.selectedLogo.type === 'uploaded' || state.selectedLogo.type === 'generated')
    ) {
      setSelectedLogoRef.current({
        url: state.selectedLogo.url,
        storageId: state.selectedLogo.storageId,
        type: state.selectedLogo.type,
        prompt: state.selectedLogo.prompt,
      });
    }

    // Restore project urlId
    if (state.projectUrlId) {
      setCurrentUrlIdRef.current(state.projectUrlId);
    }

    // Handle step-specific restoration
    restoreStepState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore pending template when templates load
  useEffect(() => {
    const template = templateHookRef.current;

    if (!pendingTemplateRestoreRef.current || template.templates.length === 0) {
      return;
    }

    const templateId = pendingTemplateRestoreRef.current;
    const found = template.templates.find((t) => t.id === templateId);

    if (found) {
      template.handleTemplateSelect(found);
      pendingTemplateRestoreRef.current = null;
    } else {
      pendingTemplateRestoreRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateHook.templates.length]);

  // Fetch recommendations when on template step with business info
  useEffect(() => {
    const flow = flowHookRef.current;
    const business = businessHookRef.current;
    const template = templateHookRef.current;

    if (
      flow.step === 'template' &&
      business.businessInfo &&
      !hasFetchedRecommendationsRef.current &&
      template.recommendations.length === 0 &&
      !template.recommendationsLoading
    ) {
      hasFetchedRecommendationsRef.current = true;
      template.fetchRecommendations(business.businessInfo, flow.projectName!, flow.projectDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    flowHook.step,
    businessHook.businessInfo,
    templateHook.recommendations.length,
    templateHook.recommendationsLoading,
  ]);

  // Reset recommendations ref when step changes
  useEffect(() => {
    if (flowHookRef.current.step !== 'template') {
      hasFetchedRecommendationsRef.current = false;
    }
  }, [flowHook.step]);

  return {
    hasRestoredState,
    hasFetchedRecommendationsRef,
  };
}

export type { UseStateRestorationProps, UseStateRestorationReturn };

