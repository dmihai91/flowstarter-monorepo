import { useState, useEffect, useRef } from 'react';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useNavigate, useLoaderData, useSearchParams } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useQuery, useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

export const meta: MetaFunction = () => {
  return [
    { title: 'Flowstarter - AI Website Builder' },
    { name: 'description', content: 'Build stunning websites with AI-powered assistance' },
  ];
};

// Check for handoff token in URL and validate it server-side
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const handoffToken = url.searchParams.get('handoff');

  if (handoffToken) {
    /*
     * We have a handoff token - return it for client-side validation
     * Server-side validation requires the secret which may not be available in Cloudflare
     */
    return json({ handoffToken, hasHandoff: true });
  }

  return json({ handoffToken: null, hasHandoff: false });
};

// Session ID management
const SESSION_ID_KEY = 'flowstarter_session_id';
const HANDOFF_DATA_KEY = 'flowstarter_handoff_data';

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

// Handoff token key for sync operations
const HANDOFF_TOKEN_KEY = 'flowstarter_handoff_token';

// Store handoff data for the onboarding flow
function storeHandoffData(data: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(HANDOFF_DATA_KEY, JSON.stringify(data));
}

// Store handoff token for sync operations
function storeHandoffToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(HANDOFF_TOKEN_KEY, token);
}

// Get stored handoff data
export function getHandoffData(): unknown | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const data = localStorage.getItem(HANDOFF_DATA_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Clear handoff data after use
export function clearHandoffData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(HANDOFF_DATA_KEY);
}

function LoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-screen w-screen"
      style={{ backgroundColor: 'var(--flowstarter-elements-bg-depth-1)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm" style={{ color: 'var(--flowstarter-elements-textSecondary)' }}>
          Loading Flowstarter...
        </span>
      </div>
    </div>
  );
}

interface HandoffProject {
  id: string;
  name: string;
  description: string;
  config?: {
    userDescription?: string;
    targetUsers?: string;
    businessGoals?: string;
    USP?: string;
    industry?: string;
    platformType?: string;
  };
}

function IndexRedirector() {
  const navigate = useNavigate();
  const { handoffToken, hasHandoff } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(getOrCreateSessionId);
  const hasRedirected = useRef(false);
  const [isValidatingHandoff, setIsValidatingHandoff] = useState(hasHandoff);

  // Query for existing conversations
  const conversations = useQuery(api.conversations.getBySessionId, sessionId ? { sessionId } : 'skip');

  // Mutation to create new conversation
  const createConversation = useMutation(api.conversations.create);

  // Handle handoff token validation
  useEffect(() => {
    if (!handoffToken || !hasHandoff || hasRedirected.current) {
      return;
    }

    const validateAndRedirect = async () => {
      try {
        console.log('[Index] Validating handoff token...');

        // Validate the handoff token via API
        const response = await fetch(`/api/handoff/validate?token=${encodeURIComponent(handoffToken)}`);

        if (!response.ok) {
          console.warn('[Index] Handoff token validation failed:', response.status);
          setIsValidatingHandoff(false);

          return; // Fall through to normal flow
        }

        const data = (await response.json()) as { valid?: boolean; projectId?: string; userId?: string };
        console.log('[Index] Handoff validated:', data);

        // If we need full project data, fetch it
        if (data.valid && data.projectId) {
          // Store the handoff token for sync operations
          storeHandoffToken(handoffToken);

          // Store minimal handoff info for the onboarding flow
          storeHandoffData({
            projectId: data.projectId,
            userId: data.userId,
            fromMainPlatform: true,
          });

          // Also try to fetch full project data from main platform
          const fullDataResponse = await fetch('/api/handoff/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: handoffToken }),
          });

          if (fullDataResponse.ok) {
            const fullData = (await fullDataResponse.json()) as {
              project?: HandoffProject;
              userId?: string;
            };

            if (fullData.project) {
              storeHandoffData({
                projectId: fullData.project.id,
                userId: fullData.userId,
                name: fullData.project.name,
                description: fullData.project.description,
                config: fullData.project.config,
                fromMainPlatform: true,
              });
            }
          }
        }

        // Create new conversation with handoff data
        hasRedirected.current = true;

        const newConversationId = await createConversation({
          sessionId,
          title: 'New Project',
        });

        // Clear URL params and redirect
        console.log('[Index] Created conversation from handoff, redirecting:', newConversationId);
        navigate(`/project/${newConversationId}`, { replace: true });
      } catch (error) {
        console.error('[Index] Handoff validation error:', error);
        setIsValidatingHandoff(false);
      }
    };

    validateAndRedirect();
  }, [handoffToken, hasHandoff, sessionId, createConversation, navigate]);

  // Normal flow (no handoff or handoff failed)
  useEffect(() => {
    // Prevent double redirect
    if (hasRedirected.current) {
      return;
    }

    // Wait if we're still validating handoff
    if (isValidatingHandoff) {
      return;
    }

    // Wait for conversations to load
    if (conversations === undefined) {
      return;
    }

    const redirectToConversation = async () => {
      hasRedirected.current = true;

      // If there are existing conversations, redirect to the most recent one
      if (conversations && conversations.length > 0) {
        const mostRecent = conversations[0]; // Already sorted by updatedAt desc
        console.log('[Index] Redirecting to existing conversation:', mostRecent._id);
        navigate(`/project/${mostRecent._id}`, { replace: true });

        return;
      }

      // No conversations - redirect to /new (conversation will be created on first message)
      console.log('[Index] No conversations, redirecting to /new');
      navigate('/new', { replace: true });
    };

    redirectToConversation();
  }, [conversations, navigate, isValidatingHandoff]);

  return <LoadingFallback />;
}

export default function Index() {
  return <ClientOnly fallback={<LoadingFallback />}>{() => <IndexRedirector />}</ClientOnly>;
}
