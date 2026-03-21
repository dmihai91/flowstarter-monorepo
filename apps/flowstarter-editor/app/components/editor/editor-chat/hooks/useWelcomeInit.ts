/**
 * useWelcomeInit Hook
 *
 * Handles the initialization of the welcome/onboarding flow,
 * including handoff data from the main platform.
 *
 * INTERNAL FLOW (Template-First):
 * When the project already has businessDetails (from team dashboard),
 * we skip the business info collection and go directly to template selection.
 */

import { useEffect, useRef, useCallback } from 'react';
import { profileStore } from '~/lib/stores/profile';
import { SUGGESTED_REPLIES, MESSAGE_KEYS, getMessage } from '../constants';
import type { InitialChatState, BusinessInfo } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';

/** Fallback timeout for welcome initialization (ms) - triggers if normal flow doesn't start */
const WELCOME_INIT_TIMEOUT_MS = 3000;

/**
 * Check if project has sufficient business details to skip onboarding.
 * This indicates an "internal flow" where details were collected in team dashboard.
 */
function hasBusinessDetails(state?: InitialChatState): boolean {
  // Check for businessInfo from the new schema
  if (state?.businessInfo?.description && state?.businessInfo?.description.length > 10) {
    return true;
  }
  // Check for project description as fallback
  if (state?.projectDescription && state?.projectDescription.length > 10) {
    return true;
  }
  return false;
}

function hasPreseededTemplateBuild(state?: InitialChatState): boolean {
  return Boolean(
    state?.selectedTemplateId &&
      state?.selectedPalette &&
      state?.selectedFont &&
      (state?.businessInfo?.description || state?.projectDescription),
  );
}

/**
 * Extract business context from initial state for display.
 */
function getBusinessContext(state?: InitialChatState): {
  businessName?: string;
  description?: string;
  targetAudience?: string;
  goals?: string[];
  industry?: string;
  uvp?: string;
} | null {
  if (!state) return null;

  const businessInfo = state.businessInfo;
  return {
    businessName: state.projectName || businessInfo?.businessType || undefined,
    description: businessInfo?.description || state.projectDescription || undefined,
    targetAudience: businessInfo?.targetAudience || undefined,
    goals: businessInfo?.businessGoals || undefined,
    industry: businessInfo?.industry || undefined,
    uvp: businessInfo?.uvp || undefined,
  };
}

interface UseWelcomeInitProps {
  initialState?: InitialChatState;
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  hasRestoredState: React.MutableRefObject<boolean>;
  /** Callback to fetch ALL templates for manual selection (internal flow) */
  onFetchTemplates?: () => void;
  /** Callback to trigger template recommendations fetch (self-serve flow) */
  onInternalFlowStart?: (businessInfo: BusinessInfo, projectName: string, description: string) => void;
  /** Callback to trigger auto-build when template data was pre-seeded upstream */
  onTemplateBuildStart?: () => void;
}

export function useWelcomeInit({
  initialState,
  messageHook,
  flowHook,
  hasRestoredState,
  onFetchTemplates,
  onInternalFlowStart,
  onTemplateBuildStart,
}: UseWelcomeInitProps): void {
  const hasInitialized = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store hook references in refs to avoid dependency changes triggering re-renders
  const flowHookRef = useRef(flowHook);
  const messageHookRef = useRef(messageHook);
  const initialStateRef = useRef(initialState);
  const onFetchTemplatesRef = useRef(onFetchTemplates);
  const onInternalFlowStartRef = useRef(onInternalFlowStart);
  const onTemplateBuildStartRef = useRef(onTemplateBuildStart);
  flowHookRef.current = flowHook;
  messageHookRef.current = messageHook;
  onFetchTemplatesRef.current = onFetchTemplates;
  onInternalFlowStartRef.current = onInternalFlowStart;
  onTemplateBuildStartRef.current = onTemplateBuildStart;

  // Only update initialStateRef if it's the first value (capture initial state once)
  if (initialState && !initialStateRef.current) {
    initialStateRef.current = initialState;
  }

  /**
   * Initialize the INTERNAL FLOW (template-first).
   * Called when project already has business details from team dashboard.
   * Shows ALL templates for manual selection instead of AI recommendations.
   */
  const initializeInternalFlow = useCallback(async () => {
    const flow = flowHookRef.current;
    const msg = messageHookRef.current;
    const state = initialStateRef.current;

    const context = getBusinessContext(state);
    const businessName = context?.businessName || state?.projectName;

    // Set project name and description in flow state
    if (state?.projectName) {
      flow.setProjectName(state.projectName);
    }
    if (state?.projectDescription || context?.description) {
      flow.setProjectDescription(state?.projectDescription || context?.description || '');
    }

    // Build welcome message for internal flow
    const welcomeMessage = businessName
      ? getMessage(MESSAGE_KEYS.INTERNAL_WELCOME_WITH_NAME, { businessName })
      : getMessage(MESSAGE_KEYS.INTERNAL_WELCOME);

    // Updated prompt for manual template selection
    const templatePrompt =
      '**Choose a template** from the gallery below. Click any template to preview it, then select the one that best fits your vision.';

    msg.addAssistantMessage(`${welcomeMessage}\n\n${templatePrompt}`);

    // Go directly to template step
    flow.setStep('template');

    // Clear suggested replies - full template gallery will be shown
    msg.setSuggestedReplies([]);

    // Fetch ALL templates for manual selection
    if (onFetchTemplatesRef.current) {
      console.log('[useWelcomeInit] Fetching all templates for manual selection...');
      onFetchTemplatesRef.current();
    }

    // Also set business info if available (for build step later)
    if (onInternalFlowStartRef.current && state?.businessInfo) {
      onInternalFlowStartRef.current(
        state.businessInfo,
        state.projectName || 'My Site',
        state.projectDescription || context?.description || '',
      );
    }

    console.log('[useWelcomeInit] Internal flow started - showing full template gallery');
  }, []); // Empty deps - uses refs

  const initializeWelcome = useCallback(async () => {
    const flow = flowHookRef.current;
    const msg = messageHookRef.current;
    const state = initialStateRef.current;

    console.log('[DEBUG hasPreseededTemplateBuild]', {
      selectedTemplateId: state?.selectedTemplateId,
      hasPalette: !!state?.selectedPalette,
      hasFont: !!state?.selectedFont,
      description: state?.businessInfo?.description || state?.projectDescription,
    });
    if (hasPreseededTemplateBuild(state)) {
      if (state?.projectName) {
        flow.setProjectName(state.projectName);
      }
      if (state?.projectDescription) {
        flow.setProjectDescription(state.projectDescription);
      }

      msg.addAssistantMessage(
        '**Template selections received.** I’m opening your seeded project and starting the first build now.',
      );
      msg.setSuggestedReplies([]);
      flow.setStep('creating');
      onFetchTemplatesRef.current?.();
      onTemplateBuildStartRef.current?.();
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERNAL FLOW: Skip to templates if business details already exist
    // ═══════════════════════════════════════════════════════════════════════
    if (hasBusinessDetails(state)) {
      console.log('[useWelcomeInit] Business details found - using internal flow');
      await initializeInternalFlow();
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP DETERMINATION FROM SUPABASE DATA (via Convex initialState)
    // The handoff token seeds projectName / projectDescription / businessInfo
    // into the Convex conversation on creation. Use that — not localStorage.
    // ═══════════════════════════════════════════════════════════════════════
    const projectName = state?.projectName;
    const projectDescription = state?.projectDescription;
    const hasName = !!(projectName && projectName !== 'Untitled Project' && projectName.length > 1);
    const hasDescription = !!(projectDescription && projectDescription.length > 10);

    if (hasName) {
      // Sync name into flow state so header / ProjectNameEditor reflects it
      flow.setProjectName(projectName!);
    }

    if (hasName && hasDescription) {
      // Both name + description from Supabase → treat like internal flow (skip to template)
      flow.setProjectDescription(projectDescription!);
      await initializeInternalFlow();
      return;
    }

    if (hasName && !hasDescription) {
      // Name known, business description not yet collected → skip naming step
      msg.addAssistantMessage(
        `**Great, "${projectName}" is all set.** Now tell me about your business — what do you do and who do you serve?`,
      );
      flow.setStep('describe');
      msg.setSuggestedReplies([]);
      return;
    }

    // Clean up any stale localStorage artefact (legacy, can be removed later)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flowstarter_handoff_data');
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

    const cta = getMessage(MESSAGE_KEYS.WELCOME_CTA);

    msg.addAssistantMessage(`${greeting}\n\n${cta}`);

    // Stay on welcome step with "Let's go" button
    flow.setStep('welcome');
    msg.setSuggestedReplies(SUGGESTED_REPLIES.welcomeStart());
  }, [initializeInternalFlow]); // Empty deps - uses refs instead

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

    if (hasNoMessages && (currentStep === 'welcome' || currentStep === 'describe') && currentMessages.length === 0) {
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
