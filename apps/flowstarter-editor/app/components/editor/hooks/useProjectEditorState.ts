/**
 * useProjectEditorState — Manages all Convex state for the project editor route.
 *
 * Handles conversation/message queries, project ID derivation,
 * initial state capture, and state change syncing to Convex + Supabase.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import { useQuery, useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import type { OnboardingStep, InitialChatState, BusinessInfo, BuildPhase } from '~/components/editor/editor-chat/types';
import type { OrchestratorStatusDTO } from '~/lib/hooks/types/orchestrator.dto';
import { useSupabaseSync } from './useSupabaseSync';

const INITIAL_MESSAGE_LIMIT = 100;

export function useProjectEditorState(projectId: Id<'conversations'>) {
  const location = useLocation();
  const initialConversationFromState = location.state?.initialConversation;

  // Convex queries
  const conversation = useQuery(api.conversations.getById, { id: projectId });
  const messages = useQuery(api.conversations.getMessages, {
    conversationId: projectId,
    limit: INITIAL_MESSAGE_LIMIT,
    offset: 0,
  });

  // Mutations (stored in refs for stable callback identity)
  const updateStateMutation = useMutation(api.conversations.updateState);
  const updateStateMutationRef = useRef(updateStateMutation);
  useEffect(() => { updateStateMutationRef.current = updateStateMutation; }, [updateStateMutation]);

  // UI state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [orchestrationStatus, setOrchestrationStatus] = useState<OrchestratorStatusDTO | null>(null);
  const [localProjectUrlId, setLocalProjectUrlId] = useState<string | null>(null);

  // Sync conversation → local state
  useEffect(() => {
    if (!conversation) return;
    if (conversation.step) setOnboardingStep(conversation.step as OnboardingStep);
    if (conversation.projectUrlId) setLocalProjectUrlId(conversation.projectUrlId);
  }, [conversation]);

  // Derive Convex project ID
  const effectiveUrlId = localProjectUrlId || conversation?.projectUrlId;
  const projectByUrlId = useQuery(api.projects.getByUrlId, effectiveUrlId ? { urlId: effectiveUrlId } : 'skip');

  const convexProjectId = useMemo(() => {
    return conversation?.projectId || projectByUrlId?._id || null;
  }, [conversation?.projectId, projectByUrlId?._id]);

  // Supabase sync (uses refs internally — stable callback)
  const { syncStateToSupabase } = useSupabaseSync({
    supabaseProjectId: projectByUrlId?.supabaseProjectId,
    convexProjectId,
    conversationName: conversation?.projectName,
  });

  // Handle state changes from the chat panel
  const handleStateChange = useCallback(
    async (state: Partial<InitialChatState>) => {
      try {
        const update = buildConvexUpdate(state);

        if (Object.keys(update).length > 0) {
          await updateStateMutationRef.current({ id: projectId, ...update });
        }
      } catch (e) {
        console.error('[handleStateChange] Convex update failed:', e);
      }

      syncStateToSupabase(state);
    },
    [projectId, syncStateToSupabase],
  );

  // Capture initial state once
  const initialState = useInitialState(projectId, conversation, messages, initialConversationFromState);

  // Loading / not-found flags
  const isLoading = (conversation === undefined || messages === undefined) && !initialConversationFromState;
  const isNotFound = conversation === null && !initialConversationFromState;
  const activeConversation = conversation || initialConversationFromState;

  return {
    conversation: activeConversation,
    convexProjectId,
    initialState,
    isLoading,
    isNotFound,
    onboardingStep,
    orchestrationStatus,
    setOnboardingStep,
    setOrchestrationStatus,
    setLocalProjectUrlId,
    handleStateChange,
  };
}

/** Build a Convex-compatible update object from a partial state change. */
function buildConvexUpdate(state: Partial<InitialChatState>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  const keys: (keyof InitialChatState)[] = [
    'step', 'projectDescription', 'projectName',
    'selectedTemplateId', 'selectedTemplateName',
    'selectedPalette', 'selectedFont', 'selectedLogo',
    'buildPhase', 'businessInfo',
  ];

  for (const key of keys) {
    if (key === 'businessInfo' && state[key]) {
      // Strip to only Convex-allowed fields — unknown fields cause ArgumentValidationError
      const bi = state[key] as unknown as Record<string, unknown>;
      const cleanBi: Record<string, unknown> = {};
      const allowedBiKeys = ['uvp','targetAudience','businessGoals','brandTone','sellingMethod',
        'sellingMethodDetails','pricingOffers','industry','offerings','contactEmail','contactPhone',
        'contactAddress','website'] as const;
      for (const bKey of allowedBiKeys) {
        if (bi[bKey] !== undefined && bi[bKey] !== null) cleanBi[bKey] = bi[bKey];
      }
      if (Object.keys(cleanBi).length > 0) update[key] = cleanBi;
    } else if (key === 'selectedPalette' && state[key]) {
      // Convex expects { id, name, colors: string[] } — colors may be object in app
      const p = state[key] as unknown as Record<string, unknown>;
      const colors = Array.isArray(p.colors)
        ? (p.colors as unknown[]).filter((c): c is string => typeof c === 'string')
        : typeof p.colors === 'object' && p.colors !== null
          ? Object.values(p.colors as Record<string, unknown>).filter((c): c is string => typeof c === 'string')
          : [];
      if (p.id && p.name) update[key] = { id: p.id, name: p.name, colors };
    } else if (key === 'selectedFont' && state[key]) {
      // Convex expects { id, name, heading, body }
      const f = state[key] as unknown as Record<string, unknown>;
      if (f.id && f.name && f.heading && f.body) update[key] = { id: f.id, name: f.name, heading: f.heading, body: f.body };
    } else if (state[key]) {
      update[key] = state[key];
    }
  }

  return update;
}

/** Capture initial state exactly once when conversation data first loads. */
function useInitialState(
  projectId: Id<'conversations'>,
  conversation: ReturnType<typeof useQuery<typeof api.conversations.getById>>,
  messages: ReturnType<typeof useQuery<typeof api.conversations.getMessages>>,
  initialFromNav: InitialChatState | undefined,
): InitialChatState | null {
  const ref = useRef<InitialChatState | null>(null);
  const hasInitialized = useRef(false);
  const lastProjectId = useRef<string | null>(null);

  if (lastProjectId.current !== projectId) {
    lastProjectId.current = projectId;
    hasInitialized.current = false;
    ref.current = null;
  }

  if (!hasInitialized.current && (conversation || initialFromNav) && (messages !== undefined || initialFromNav?.messages)) {
    const src = conversation || initialFromNav;
    hasInitialized.current = true;
    if (src) {
      ref.current = {
        step: (src.step as OnboardingStep) || 'welcome',
        projectDescription: src.projectDescription || '',
        selectedTemplateId: src.selectedTemplateId || null,
        selectedTemplateName: src.selectedTemplateName || null,
        selectedPalette: src.selectedPalette || null,
        selectedFont: src.selectedFont || null,
        selectedLogo: src.selectedLogo || null,
        projectUrlId: src.projectUrlId || null,
        buildPhase: (src.buildPhase as BuildPhase) || 'idle',
        projectName: src.projectName || null,
        businessInfo: (src.businessInfo as BusinessInfo | null) || null,
        messages: messages || initialFromNav?.messages || [],
      };
    }
  }

  return ref.current;
}
