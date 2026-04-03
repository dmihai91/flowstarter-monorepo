/**
 * useWelcomeInit Hook
 *
 * Handles initialization for the supported handoff-only flow.
 * New projects now start in review, existing built projects resume in ready.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { InitialChatState } from '~/components/editor/editor-chat/types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import { hasPreseededTemplateBuild, isCompletedBuildState } from './handoffState';

/** Fallback timeout for initialization (ms) - triggers if normal flow doesn't start */
const WELCOME_INIT_TIMEOUT_MS = 3000;

interface UseWelcomeInitProps {
  initialState?: InitialChatState;
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  hasRestoredState: React.MutableRefObject<boolean>;

  /** Callback to move seeded handoff projects into explicit review before build */
  onTemplateBuildStart?: () => void;
}

export function useWelcomeInit({
  initialState,
  messageHook,
  flowHook,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasRestoredState,
  onTemplateBuildStart,
}: UseWelcomeInitProps): void {
  const hasInitialized = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store hook references in refs to avoid dependency changes triggering re-renders
  const flowHookRef = useRef(flowHook);
  const messageHookRef = useRef(messageHook);
  const initialStateRef = useRef(initialState);
  const onTemplateBuildStartRef = useRef(onTemplateBuildStart);
  flowHookRef.current = flowHook;
  messageHookRef.current = messageHook;
  onTemplateBuildStartRef.current = onTemplateBuildStart;

  // Only update initialStateRef if it's the first value (capture initial state once)
  if (initialState && !initialStateRef.current) {
    initialStateRef.current = initialState;
  }

  const initializeWelcome = useCallback(async () => {
    const flow = flowHookRef.current;
    const msg = messageHookRef.current;
    const state = initialStateRef.current;

    if (state?.projectName) {
      flow.setProjectName(state.projectName);
    }

    if (state?.projectDescription) {
      flow.setProjectDescription(state.projectDescription);
    }

    if (isCompletedBuildState(state)) {
      flow.setStep('ready');
      msg.setSuggestedReplies([]);

      return;
    }

    msg.addAssistantMessage(
      hasPreseededTemplateBuild(state)
        ? '**Project setup received.** Review the selected template, brand direction, and integrations below, then confirm when you want me to build the first version.'
        : '**Welcome!** Review your project details below to get started.',
    );
    msg.setSuggestedReplies([]);
    flow.setStep('review');

    if (hasPreseededTemplateBuild(state)) {
      onTemplateBuildStartRef.current?.();
    }
  }, []);

  /*
   * Initialize welcome - runs once on mount
   * IMPORTANT: This effect must have an empty dependency array to run only once
   */
  useEffect(() => {
    if (hasInitialized.current) {
      return undefined;
    }

    const state = initialStateRef.current;

    // Skip if we have initial state with messages
    if (state?.messages && state.messages.length > 0) {
      hasInitialized.current = true;
      return undefined;
    }

    const _currentStep = flowHookRef.current.step;
    const currentMessages = messageHookRef.current.messages;

    // Timeout fallback
    if (!initTimeoutRef.current) {
      initTimeoutRef.current = setTimeout(() => {
        if (!hasInitialized.current && messageHookRef.current.messages.length === 0) {
          hasInitialized.current = true;
          initializeWelcome();
        }
      }, WELCOME_INIT_TIMEOUT_MS);
    }

    const hasNoMessages = !state || !state.messages || state.messages.length === 0;

    if (hasNoMessages && currentMessages.length === 0) {
      hasInitialized.current = true;

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      initializeWelcome();
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };

    /*
     * Empty dependency array - uses refs for all state access
     * This ensures the effect runs exactly once on mount
     */
  }, []);
}

export type { UseWelcomeInitProps };
