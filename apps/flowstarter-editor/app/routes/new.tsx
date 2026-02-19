import { useState, useCallback, useRef } from 'react';
import { type MetaFunction } from '@remix-run/cloudflare';
import { useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { EditorChatPanel } from '~/components/editor/EditorChatPanel';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EditorLayout, ConversationProvider } from '~/components/editor';
import { useConversationContext } from '~/components/editor/ConversationContext';
import { useResizablePanel } from '~/components/editor/hooks';
import { EditorHeader, EmptyState, ResizeHandle } from '~/components/editor/components';
import type { OnboardingStep } from '~/components/editor/editor-chat/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Project - Flowstarter' },
    { name: 'description', content: 'Build stunning websites with AI-powered assistance' },
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
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: colors.bgGradient,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `2px solid ${colors.spinnerColor}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', color: colors.textSubtle }}>Loading project...</span>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
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

  // Mutations
  const createEmptyProject = useMutation(api.projects.createEmpty);
  const createConversationWithProject = useMutation(api.conversations.createWithProject);

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
          const { projectId, urlId } = await createEmptyProject();
          console.log('[New] Created project:', projectId, urlId);

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
    [sessionId, createEmptyProject, createConversationWithProject, selectConversation],
  );

  return (
    <EditorLayout
      projectName="New Project"
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
  return <ClientOnly fallback={<LoadingFallback />}>{() => <NewProjectContent />}</ClientOnly>;
}
