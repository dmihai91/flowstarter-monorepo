/**
 * useWelcomeInit Hook
 *
 * Handles the initialization of the welcome/onboarding flow,
 * including handoff data from the main platform.
 */

import { useEffect, useRef, useCallback } from 'react';
import { profileStore } from '~/lib/stores/profile';
import { SUGGESTED_REPLIES, MESSAGE_KEYS, getMessage } from '../constants';
import type { InitialChatState } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';

/** Fallback timeout for welcome initialization (ms) - triggers if normal flow doesn't start */
const WELCOME_INIT_TIMEOUT_MS = 3000;

interface UseWelcomeInitProps {
  initialState?: InitialChatState;
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  hasRestoredState: React.MutableRefObject<boolean>;
}

export function useWelcomeInit({ initialState, messageHook, flowHook, hasRestoredState }: UseWelcomeInitProps): void {
  const hasInitialized = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store hook references in refs to avoid dependency changes triggering re-renders
  const flowHookRef = useRef(flowHook);
  const messageHookRef = useRef(messageHook);
  const initialStateRef = useRef(initialState);
  flowHookRef.current = flowHook;
  messageHookRef.current = messageHook;

  // Only update initialStateRef if it's the first value (capture initial state once)
  if (initialState && !initialStateRef.current) {
    initialStateRef.current = initialState;
  }

  const initializeWelcome = useCallback(async () => {
    const flow = flowHookRef.current;
    const msg = messageHookRef.current;

    // Check for handoff data
    const handoffDataStr = typeof window !== 'undefined' ? localStorage.getItem('flowstarter_handoff_data') : null;

    if (handoffDataStr) {
      try {
        const handoffData = JSON.parse(handoffDataStr) as {
          fromMainPlatform?: boolean;
          name?: string;
          description?: string;
          config?: { userDescription?: string };
        };

        localStorage.removeItem('flowstarter_handoff_data');

        if (handoffData.fromMainPlatform) {
          const description = handoffData.config?.userDescription || handoffData.description || handoffData.name || '';

          if (description) {
            flow.setProjectDescription(description);
            msg.addAssistantMessage(
              `**Great, let's continue building your site!**\n\nI see you want to create: "${description}"\n\nLet's give it a name. What would you like to call your project?`,
            );
            flow.setStep('name');
            msg.setSuggestedReplies(SUGGESTED_REPLIES.nameChoice());

            return;
          }
        }
      } catch (e) {
        console.warn('[useWelcomeInit] Failed to parse handoff data:', e);
        localStorage.removeItem('flowstarter_handoff_data');
      }
    }

    /*
     * STREAMLINED FLOW: Welcome showcases what Flowstarter builds
     * All strings come from localized MESSAGE_KEYS
     */
    const profile = profileStore.get();
    const username = profile?.username || undefined;
    
    // Build welcome message from localized strings
    const greeting = username 
      ? getMessage(MESSAGE_KEYS.WELCOME_GREETING_USER, { username })
      : getMessage(MESSAGE_KEYS.WELCOME_GREETING);
    
    const showcase = getMessage(MESSAGE_KEYS.WELCOME_SHOWCASE);
    const cta = getMessage(MESSAGE_KEYS.WELCOME_CTA);
    
    msg.addAssistantMessage(`${greeting}\n\n${showcase}\n\n${cta}`);
    
    // Stay on welcome step with "Let's go" button
    flow.setStep('welcome');
    msg.setSuggestedReplies(SUGGESTED_REPLIES.welcomeStart());
  }, []); // Empty deps - uses refs instead

  /*
   * Initialize welcome - runs once on mount
   * IMPORTANT: This effect must have an empty dependency array to run only once
   */
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    const state = initialStateRef.current;

    // Skip if we have initial state with messages
    if (state?.messages && state.messages.length > 0) {
      hasInitialized.current = true;
      return;
    }

    const currentStep = flowHookRef.current.step;
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

    if (hasNoMessages && currentStep === 'welcome' && currentMessages.length === 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export type { UseWelcomeInitProps };
