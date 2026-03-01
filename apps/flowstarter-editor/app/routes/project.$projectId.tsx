import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LoadingScreen } from '@flowstarter/flow-design-system';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useParams, useNavigate, useLocation } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useQuery, useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { EditorLayout, ConversationProvider } from '~/components/editor';
import { EditorChatPanel } from '~/components/editor/EditorChatPanel';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import type { OnboardingStep, InitialChatState, BusinessInfo, BuildPhase } from '~/components/editor/editor-chat/types';

import type { OrchestratorStatusDTO } from '~/lib/hooks/types/orchestrator.dto';
import { en } from '~/lib/i18n/locales/en';
import { useTranslation } from '~/lib/i18n/useTranslation';

export const meta: MetaFunction = () => {
  return [
    { title: en.pages.project },
    { name: 'description', content: en.app.description },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ projectId: params.projectId });
};

/**
 * Validate if a string looks like a valid Convex ID.
 * Convex IDs are alphanumeric strings that start with a letter.
 */
function isValidConvexId(id: string): boolean {
  /*
   * Convex IDs are typically 32 characters, alphanumeric, starting with a letter
   * They look like: j57abc123def456ghi789jkl012mno3
   */
  if (!id || typeof id !== 'string') {
    return false;
  }

  if (id.length < 10) {
    return false;
  } // Too short to be a valid ID

  // Must start with a letter and contain only alphanumeric characters
  return /^[a-z][a-z0-9]+$/i.test(id);
}

function LoadingFallback() {
  return <LoadingScreen message="Loading project..." />;
}

/**
 * Redirect to home page to start a new project when project is not found.
 * This handles deleted projects and invalid IDs gracefully without showing an error.
 */
function ProjectNotFoundRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page which will create a new project
    navigate('/', { replace: true });
  }, [navigate]);

  // Show loading while redirecting
  return <LoadingFallback />;
}

interface ProjectEditorContentProps {
  projectId: Id<'conversations'>;
}

// Message limit for conversation loading
// 100 covers most conversations while keeping load times reasonable
// TODO: Implement scroll-based pagination for very long conversations
const INITIAL_MESSAGE_LIMIT = 100;

function ProjectEditorContent({ projectId }: ProjectEditorContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialConversationFromState = location.state?.initialConversation;

  // Fetch conversation data (the "project" in the URL maps to a conversation internally)
  const conversation = useQuery(api.conversations.getById, { id: projectId });

  /*
   * Load initial batch of messages (most recent) for faster startup
   * Full message history can be loaded on-demand when user scrolls up
   */
  const messages = useQuery(api.conversations.getMessages, {
    conversationId: projectId,
    limit: INITIAL_MESSAGE_LIMIT,
    offset: 0,
  });

  // Mutations for syncing state
  const updateStateMutation = useMutation(api.conversations.updateState);
  const saveMessagesMutation = useMutation(api.conversations.saveMessages);

  // Local state for UI
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [orchestrationStatus, setOrchestrationStatus] = useState<OrchestratorStatusDTO | null>(null);

  // Store locally available project URL ID (for immediate preview before DB sync)
  const [localProjectUrlId, setLocalProjectUrlId] = useState<string | null>(null);

  // Debounce ref for state changes
  const stateChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update state when conversation loads
  useEffect(() => {
    if (conversation) {
      // Set step from conversation
      if (conversation.step) {
        setOnboardingStep(conversation.step as OnboardingStep);
      }

      // Set project URL ID from conversation if available
      if (conversation.projectUrlId) {
        setLocalProjectUrlId(conversation.projectUrlId);
      }
    }
  }, [conversation]);

  /*
   * Query project by urlId if we have one (to get the actual Convex projectId)
   * Use either the local state (immediate) or the conversation state (persisted)
   */
  const effectiveUrlId = localProjectUrlId || conversation?.projectUrlId;

  const projectByUrlId = useQuery(api.projects.getByUrlId, effectiveUrlId ? { urlId: effectiveUrlId } : 'skip');

  // Derive the actual projectId - either from conversation directly or from urlId lookup
  const convexProjectId = useMemo(() => {
    // First check if conversation has direct projectId
    if (conversation?.projectId) {
      return conversation.projectId;
    }

    // Fallback: look up by urlId
    if (projectByUrlId?._id) {
      return projectByUrlId._id;
    }

    return null;
  }, [conversation?.projectId, projectByUrlId?._id]);

  // Store mutation refs to avoid callback recreation
  const updateStateMutationRef = useRef(updateStateMutation);
  const saveMessagesMutationRef = useRef(saveMessagesMutation);
  useEffect(() => {
    updateStateMutationRef.current = updateStateMutation;
  }, [updateStateMutation]);
  useEffect(() => {
    saveMessagesMutationRef.current = saveMessagesMutation;
  }, [saveMessagesMutation]);

  /*
   * TEMPORARILY DISABLED - investigating infinite loop
   * Handle state changes from the chat panel
   * IMPORTANT: This callback must have stable identity to prevent infinite loops
   */
  const handleStateChange = useCallback(
    async (state: Partial<InitialChatState>) => {
      // Save to Convex
      try {
        const convexUpdate: Record<string, unknown> = {};
        if (state.step) convexUpdate.step = state.step;
        if (state.projectDescription) convexUpdate.projectDescription = state.projectDescription;
        if (state.projectName) convexUpdate.projectName = state.projectName;
        if (state.selectedTemplateId) convexUpdate.selectedTemplateId = state.selectedTemplateId;
        if (state.selectedTemplateName) convexUpdate.selectedTemplateName = state.selectedTemplateName;
        if (state.selectedPalette) convexUpdate.selectedPalette = state.selectedPalette;
        if (state.selectedFont) convexUpdate.selectedFont = state.selectedFont;
        if (state.selectedLogo) convexUpdate.selectedLogo = state.selectedLogo;
        if (state.buildPhase) convexUpdate.buildPhase = state.buildPhase;
        if (state.businessInfo) convexUpdate.businessInfo = state.businessInfo;

        if (Object.keys(convexUpdate).length > 0) {
          await updateStateMutationRef.current({
            id: projectId,
            ...convexUpdate,
          });
        }
      } catch (e) {
        console.error('[handleStateChange] Convex update failed:', e);
      }

      // Sync to Supabase via editor API (uses Clerk auth, no handoff token needed)
      // First try handoff-based sync, fallback to editor API
      const supabaseId = projectByUrlId?.supabaseProjectId;
      if (supabaseId) {
        fetch('/api/project/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            projectData: {
              supabaseProjectId: supabaseId,
              name: state.projectName || undefined,
              description: state.projectDescription || undefined,
              templateId: state.selectedTemplateId || undefined,
              businessInfo: state.businessInfo || undefined,
            },
          }),
        }).catch(e => console.warn('[handleStateChange] Supabase sync failed:', e));
      } else if (state.projectName && convexProjectId) {
        // No Supabase project yet — create one
        fetch('/api/project/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            projectData: {
              convexProjectId: String(convexProjectId),
              name: state.projectName,
              description: state.projectDescription || '',
              templateId: state.selectedTemplateId || undefined,
              businessInfo: state.businessInfo || undefined,
            },
          }),
        }).catch(e => console.warn('[handleStateChange] Supabase create failed:', e));
      }
    },
    [projectId],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (stateChangeDebounceRef.current) {
        clearTimeout(stateChangeDebounceRef.current);
      }
    };
  }, []);

  /*
   * Capture initial state only once when conversation first loads
   * This prevents infinite loops where message syncs cause initialState to change
   */
  const initialStateRef = useRef<InitialChatState | null>(null);
  const hasInitializedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);

  // Reset initialization when projectId changes (navigation or refresh with different conversation)
  if (lastProjectIdRef.current !== projectId) {
    lastProjectIdRef.current = projectId;
    hasInitializedRef.current = false;
    initialStateRef.current = null;
  }

  // Only set initial state once when data is first available
  if (
    !hasInitializedRef.current &&
    (conversation || initialConversationFromState) &&
    (messages !== undefined || initialConversationFromState?.messages)
  ) {
    const sourceConv = conversation || initialConversationFromState;
    const sourceMessages = messages || initialConversationFromState?.messages || [];

    hasInitializedRef.current = true;
    initialStateRef.current = {
      step: (sourceConv.step as OnboardingStep) || 'welcome',
      projectDescription: sourceConv.projectDescription || '',
      selectedTemplateId: sourceConv.selectedTemplateId || null,
      selectedTemplateName: sourceConv.selectedTemplateName || null,
      selectedPalette: sourceConv.selectedPalette || null,
      selectedFont: sourceConv.selectedFont || null,
      selectedLogo: sourceConv.selectedLogo || null,
      projectUrlId: sourceConv.projectUrlId || null,
      buildPhase: (sourceConv.buildPhase as BuildPhase) || 'idle',
      projectName: sourceConv.projectName || null,
      businessInfo: (sourceConv.businessInfo as BusinessInfo | null) || null,
      messages: sourceMessages || [],
    };
  }

  /*
   * Loading state - wait for both conversation and messages to load
   * This prevents the welcome message from showing during the loading period
   * If we have initial state from navigation, we can skip the loading screen
   */
  if ((conversation === undefined || messages === undefined) && !initialConversationFromState) {
    return <LoadingFallback />;
  }

  // Not found (only if query finished and returned null, and we don't have local state)
  if (conversation === null && !initialConversationFromState) {
    return <ProjectNotFoundRedirect />;
  }

  // Use the available data (prefer query result, fallback to local state)
  const activeConversation = conversation || initialConversationFromState;

  return (
    <ConversationProvider initialConversationId={projectId}>
      <EditorLayout
        projectName={activeConversation?.projectName || en.pages.createNewProject}
        projectId={convexProjectId}
        onboardingStep={onboardingStep}
        orchestrationStatus={orchestrationStatus}
      >
        <EditorChatPanel
          key={projectId} // Force re-mount when project changes
          conversationId={projectId}
          initialState={initialStateRef.current!}
          onProjectReady={(urlId) => {
            console.log('Project ready:', urlId);

            // Set local state to immediately trigger the project lookup query
            setLocalProjectUrlId(urlId);
          }}
          onStepChange={setOnboardingStep}
          onStateChange={handleStateChange}
          onOrchestrationStatusChange={setOrchestrationStatus}
        />
      </EditorLayout>
    </ConversationProvider>
  );
}

function ProjectEditorWrapper() {
  const { projectId } = useParams<{ projectId: string }>();

  // Validate the projectId before passing to Convex
  if (!projectId || !isValidConvexId(projectId)) {
    return <ProjectNotFoundRedirect />;
  }

  return <ProjectEditorContent key={projectId} projectId={projectId as Id<'conversations'>} />;
}

export default function ProjectPage() {
  return <ClientOnly fallback={<LoadingFallback />}>{() => <ProjectEditorWrapper />}</ClientOnly>;
}
