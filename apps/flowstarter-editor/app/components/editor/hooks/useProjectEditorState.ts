/**
 * useProjectEditorState — Manages all Convex state for the project editor route.
 *
 * Handles conversation/message queries, project ID derivation,
 * initial state capture, and state change syncing to Convex + Supabase.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import type {
  OnboardingStep,
  InitialChatState,
  BusinessInfo,
  BuildPhase,
  IntegrationConfig,
} from '~/components/editor/editor-chat/types';
import type { OrchestratorStatusDTO } from '~/lib/hooks/types/orchestrator.dto';
import { useSupabaseSync } from './useSupabaseSync';
import { normalizeHandoffStep } from '~/components/editor/editor-chat/hooks/handoffState';

const INITIAL_MESSAGE_LIMIT = 100;
const HANDOFF_DATA_KEY = 'flowstarter_handoff_data';

function readStoredHandoffData(): {
  brandProfile?: InitialChatState['brandProfile'];
  integrations?: IntegrationConfig[];
} | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(HANDOFF_DATA_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      brandProfile?: InitialChatState['brandProfile'];
      integrations?: string[];
    };

    return {
      brandProfile: parsed.brandProfile || null,
      integrations: Array.isArray(parsed.integrations)
        ? parsed.integrations.map((id) => ({ id, name: id, enabled: true }))
        : undefined,
    };
  } catch {
    return null;
  }
}

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
  useEffect(() => {
    updateStateMutationRef.current = updateStateMutation;
  }, [updateStateMutation]);

  // UI state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('review');
  const [orchestrationStatus, setOrchestrationStatus] = useState<OrchestratorStatusDTO | null>(null);
  const [localProjectUrlId, setLocalProjectUrlId] = useState<string | null>(null);

  // Sync conversation → local state
  useEffect(() => {
    if (!conversation) {
      return;
    }

    const normalizedStep = normalizeHandoffStep({
      step: conversation.step as OnboardingStep | undefined,
      projectUrlId: conversation.projectUrlId ?? null,
      buildPhase: (conversation.buildPhase as BuildPhase | undefined) ?? undefined,
      selectedTemplateId: conversation.selectedTemplateId ?? null,
      selectedPalette: conversation.selectedPalette ?? null,
      selectedFont: conversation.selectedFont ?? null,
      businessInfo: (conversation.businessInfo as BusinessInfo | null) ?? null,
      projectDescription: conversation.projectDescription ?? '',
    });
    setOnboardingStep(normalizedStep);

    if (conversation.projectUrlId) {
      setLocalProjectUrlId(conversation.projectUrlId);
    }
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
  const isConversationLoading = conversation === undefined;
  const isMessagesLoading = conversation !== null && conversation !== undefined && messages === undefined;
  const isLoading = (isConversationLoading || isMessagesLoading) && !initialConversationFromState;
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
    'step',
    'projectDescription',
    'projectName',
    'selectedTemplateId',
    'selectedTemplateName',
    'selectedPalette',
    'selectedFont',
    'selectedLogo',
    'buildPhase',
    'businessInfo',
  ];

  for (const key of keys) {
    if (state[key]) {
      update[key] = state[key];
    }
  }

  return update;
}

function normalizeIntegrations(value: unknown): IntegrationConfig[] | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((id) => ({ id, name: id, enabled: true }));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const selected = record.selected;

    if (Array.isArray(selected)) {
      return selected
        .filter((entry): entry is string => typeof entry === 'string')
        .map((id) => ({ id, name: id, enabled: true }));
    }
  }

  return undefined;
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

  if (
    !hasInitialized.current &&
    (conversation || initialFromNav) &&
    (messages !== undefined || initialFromNav?.messages)
  ) {
    const src = conversation || initialFromNav;
    hasInitialized.current = true;

    if (src) {
      const storedHandoffData = readStoredHandoffData();
      ref.current = {
        step: normalizeHandoffStep({
          step: (src.step as OnboardingStep | undefined) || undefined,
          projectUrlId: src.projectUrlId || null,
          buildPhase: (src.buildPhase as BuildPhase | undefined) || undefined,
          selectedTemplateId: src.selectedTemplateId || null,
          selectedPalette: src.selectedPalette || null,
          selectedFont: src.selectedFont || null,
          businessInfo: (src.businessInfo as BusinessInfo | null) || null,
          projectDescription: src.projectDescription || '',
        }),
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
        brandProfile: (src.brandProfile as InitialChatState['brandProfile']) || storedHandoffData?.brandProfile || null,
        integrations:
          normalizeIntegrations((src as Record<string, unknown>).selectedIntegrations) ||
          storedHandoffData?.integrations ||
          undefined,
        messages: messages || initialFromNav?.messages || [],
        conversationId: projectId,
      };
    }
  }

  return ref.current;
}
