import { useState, useCallback, useRef } from 'react';
import { type MetaFunction } from '@remix-run/cloudflare';
import { useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useMutation } from 'convex/react';
import { useSession } from '@clerk/remix';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { linkProjectToSupabase } from '~/lib/services/projectLinkService';
import { EditorChatPanel } from '~/components/editor/EditorChatPanel';
import { AuthGuard } from '~/components/TeamAuthGuard';
import { LoadingScreen } from '~/components/LoadingScreen';
import { en } from '~/lib/i18n/locales/en';
import { EditorLayout, ConversationProvider } from '~/components/editor';
import { useConversationContext } from '~/components/editor/ConversationContext';
import type { OnboardingStep } from '~/components/editor/editor-chat/types';

export const meta: MetaFunction = () => {
  return [
    { title: en.pages.newProject },
    { name: 'description', content: en.app.description },
  ];
};

// Session ID management
const SESSION_ID_KEY = 'flowstarter_session_id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

function LoadingFallback() {
  return <LoadingScreen message={en.app.loadingProject} />;
}

const PANEL_CONFIG = {
  initialWidth: 440,
  minWidth: 320,
  maxWidth: 600,
} as const;

/**
 * NewProjectContent - Wrapped in ConversationProvider for seamless transition
 */
function NewProjectInner() {
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const isCreatingRef = useRef(false);
  const descriptionRef = useRef<string>('');
  const messagesRef = useRef<Array<{ id: string; role: string; content: string; createdAt: number }>>([]);

  const { selectConversation, activeConversation } = useConversationContext();
  const convexProjectId = activeConversation?.projectId;
  const { session } = useSession();

  // Mutations
  const createEmptyProject = useMutation(api.projects.createEmpty);
  const createConversationWithProject = useMutation(api.conversations.createWithProject);
  const linkToSupabase = useMutation(api.projects.linkToSupabase);

  // Session ID needed for creation
  const [sessionId] = useState(getOrCreateSessionId);

  /*
   * This callback is triggered by EditorChatPanel when state changes
   * We intercept first meaningful state change to create project + conversation
   */
  const handleStateChange = useCallback(
    async (state: {
      step?: OnboardingStep;
      projectDescription?: string;
      messages?: Array<{ id: string; role: string; content: string; createdAt: number }>;
    }) => {
      // Track description for when we create the conversation
      if (state.projectDescription) {
        descriptionRef.current = state.projectDescription;
      }

      // Track messages for when we create the conversation
      if (state.messages && state.messages.length > 0) {
        messagesRef.current = state.messages;
      }

      /*
       * Create project + conversation on first state change after welcome
       * (which happens when user sends first message/clicks suggestion)
       */
      if (!isCreatingRef.current && state.step && state.step !== 'welcome' && state.step !== 'describe') {
        isCreatingRef.current = true;
        console.log('[New] Creating project and conversation on first interaction...', {
          description: descriptionRef.current,
          messagesCount: messagesRef.current.length,
        });

        try {
          // 1. Create empty project first
          const { projectId, urlId } = await createEmptyProject({});
          console.log('[New] Created project:', projectId, urlId);

          // 1b. Fire-and-forget: sync to Supabase for dashboard visibility
          (async () => {
            try {
              const token = await session?.getToken();
              if (!token) return;
              const result = await linkProjectToSupabase({
                convexProjectId: projectId,
                projectName: descriptionRef.current || 'New Project',
                projectDescription: descriptionRef.current,
                clerkToken: token,
              });
              if (result?.supabaseProjectId) {
                await linkToSupabase({
                  projectId,
                  supabaseProjectId: result.supabaseProjectId,
                });
                console.log('[New] Linked to Supabase:', result.supabaseProjectId);
              }
            } catch (e) {
              console.warn('[New] Supabase sync failed (non-blocking):', e);
            }
          })();

          // 2. Create conversation linked to project with initial state AND messages
          const conversationId = await createConversationWithProject({
            sessionId,
            projectId,
            projectUrlId: urlId,
            projectDescription: descriptionRef.current || state.projectDescription,
            step: state.step,
            messages:
              messagesRef.current.length > 0
                ? messagesRef.current.map((m) => ({
                    id: m.id,
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content,
                    createdAt: m.createdAt,
                  }))
                : state.messages?.map((m) => ({
                    id: m.id,
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content,
                    createdAt: m.createdAt,
                  })),
          });

          console.log('[New] Created conversation, switching context:', conversationId);

          /*
           * 3. Seamlessly switch context to the new conversation
           * This keeps EditorChatPanel mounted but updates its sync target
           */
          await selectConversation(conversationId);

          // 4. Silently update URL without navigation/re-render
          window.history.replaceState(
            {
              initialConversation: {
                _id: conversationId,
                projectId,
                projectUrlId: urlId,
                step: state.step,
                projectDescription: descriptionRef.current || state.projectDescription,
                projectName: null,
                messages: messagesRef.current,
              },
            },
            '',
            `/project/${conversationId}`,
          );
        } catch (error) {
          console.error('[New] Failed to create project/conversation:', error);
          isCreatingRef.current = false; // Allow retry
        }
      }
    },
    [sessionId, session, createEmptyProject, createConversationWithProject, linkToSupabase, selectConversation],
  );

  return (
    <EditorLayout
      projectName={en.pages.createNewProject}
      projectId={convexProjectId} // Pass null initially, then actual ID after creation
      onboardingStep={onboardingStep}
    >
      <EditorChatPanel
        projectId={convexProjectId} // Pass project ID to sync with build handlers
        onStepChange={setOnboardingStep}
        onStateChange={handleStateChange}
      />
    </EditorLayout>
  );
}

function NewProjectContent() {
  return (
    <ConversationProvider>
      <NewProjectInner />
    </ConversationProvider>
  );
}

export default function NewProjectPage() {
  return (
    <AuthGuard fallback={<LoadingFallback />}>
      <ClientOnly fallback={<LoadingFallback />}>{() => <NewProjectContent />}</ClientOnly>
    </AuthGuard>
  );
}
