import { useState, useEffect, useRef } from 'react';
import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useNavigate, useLoaderData, useSearchParams } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useQuery, useMutation, useConvex } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
import { AuthGuard } from '~/components/TeamAuthGuard';
import { ClientNoProjectScreen } from '~/components/ClientNoProjectScreen';
import { getUserMode } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';
import { en } from '~/lib/i18n/locales/en';

export const meta: MetaFunction = () => {
  return [
    { title: en.app.title },
    { name: 'description', content: en.app.description },
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
  return <LoadingScreen message={en.app.loadingFlowstarterEditor} />;
}

interface HandoffProject {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  status?: string;
  domainName?: string;
  projectType?: string;
  config?: {
    userDescription?: string;
    targetUsers?: string;
    businessGoals?: string;
    USP?: string;
    industry?: string;
    platformType?: string;
    businessInfo?: Record<string, unknown>;
    contactInfo?: Record<string, unknown>;
    description?: string;
  };
}

function IndexRedirector() {
  const navigate = useNavigate();
  const { handoffToken, hasHandoff } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(getOrCreateSessionId);
  const hasRedirected = useRef(false);
  const [showBookingScreen, setShowBookingScreen] = useState(false);
  const [isValidatingHandoff, setIsValidatingHandoff] = useState(hasHandoff);

  // Query for existing conversations
  const conversations = useQuery(api.conversations.getBySessionId, sessionId ? { sessionId } : 'skip');

  // Mutation to create new conversation
  const createConversation = useMutation(api.conversations.create);

  // Convex client for one-off queries
  const convex = useConvex();

  // Mutations for project cross-linking
  const createEmptyProject = useMutation(api.projects.createEmpty);
  const createConversationWithProject = useMutation(api.conversations.createWithProject);

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

        if (!data.valid || !data.projectId) {
          setIsValidatingHandoff(false);
          return;
        }

        // Store the handoff token for sync operations
        storeHandoffToken(handoffToken);

        // Fetch full project data from main platform
        let handoffProject: HandoffProject | null = null;
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
          handoffProject = fullData.project || null;
        }

        const supabaseProjectId = data.projectId;
        const projectName = handoffProject?.name || 'Untitled Project';
        const projectDescription = handoffProject?.description || '';
        const config = handoffProject?.config;

        // Build businessInfo from handoff config (if dashboard collected business data)
        // Check both top-level fields and nested businessInfo/contactInfo from buildChatData
        const bi = config?.businessInfo || {};
        const ci = config?.contactInfo || {};
        const hasName = !!(projectName && projectName !== 'Untitled Project' && projectName.length > 1);
        const hasBusinessData = !!(
          config?.userDescription ||
          bi?.description ||
          projectDescription.length > 10
        );
        const businessInfo = hasBusinessData
          ? {
              description: (bi?.description as string) || (config?.userDescription as string) || projectDescription || undefined,
              uvp: (bi?.uvp as string) || (config?.USP as string) || undefined,
              targetAudience: (bi?.targetAudience as string) || (config?.targetUsers as string) || undefined,
              businessGoals: bi?.goal ? [bi.goal as string] : config?.businessGoals ? [config.businessGoals] : undefined,
              brandTone: (bi?.brandTone as string) || undefined,
              industry: (bi?.industry as string) || (config?.industry as string) || undefined,
              offerings: (bi?.offerType as string) || undefined,
              contactEmail: (ci?.email as string) || undefined,
              contactPhone: (ci?.phone as string) || undefined,
              contactAddress: (ci?.address as string) || undefined,
              website: (ci?.website as string) || undefined,
              sellingMethod: (bi?.goal as string) || undefined,
            }
          : undefined;

        hasRedirected.current = true;

        // Use server-side initialization — avoids browser Convex WS auth dependency
        console.log('[Index] Calling /api/handoff/initialize (server-side)...');
        const initRes = await fetch('/api/handoff/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: handoffToken }),
        });

        if (!initRes.ok) {
          const err = await initRes.json().catch(() => ({})) as { error?: string };
          throw new Error(`Server init failed: ${err.error || initRes.status}`);
        }

        const { conversationId } = await initRes.json() as { conversationId: string };
        console.log('[Index] Server-side init complete, conversationId:', conversationId);
        sessionStorage.setItem('flowstarter_handoff_session', '1');
        hasRedirected.current = true;
        navigate(`/project/${conversationId}`, { replace: true });
        return; // done — skip rest of old flow
      } catch (error) {
        console.error('[Index] Handoff validation error:', error);
        // Log full error details to help diagnose
        if (error instanceof Error) {
          console.error('[Index] Error name:', error.name, '| message:', error.message);
          console.error('[Index] Error stack:', error.stack);
        }
        setIsValidatingHandoff(false);
      }
    };

    validateAndRedirect();
  }, [handoffToken, hasHandoff, sessionId, createConversation, createEmptyProject, createConversationWithProject, convex, conversations, navigate]);

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

    // If handoff was present but failed (Convex error etc.), log it
    if (hasHandoff && !hasRedirected.current) {
      console.warn('[Index] Handoff flow did not complete — falling through to normal flow');
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

      // No conversations — route based on user role
      const userMode = getUserMode();
      if (userMode === 'team') {
        // Team: create a new conversation so they can start building
        console.log('[Index] Team user, no projects — creating new conversation');
        try {
          const newConversationId = await createConversation({
            sessionId,
            title: en.pages.createNewProject,
          });
          console.log('[Index] Created new conversation for team user:', newConversationId);
          navigate(`/project/${newConversationId}`, { replace: true });
        } catch (error) {
          console.error('[Index] Failed to create conversation:', error);
          // Fallback: redirect to main dashboard
          const mainUrl = window.location.hostname.includes('flowstarter.dev')
            ? 'https://flowstarter.dev'
            : 'https://flowstarter.dev';
          window.location.href = mainUrl + '/team/dashboard';
        }
      } else {
        // Client: show booking screen (don't redirect — render inline)
        console.log('[Index] Client user, no projects — showing booking screen');
        hasRedirected.current = false; // allow re-render
        setShowBookingScreen(true);
      }
    };

    redirectToConversation();
  }, [conversations, navigate, isValidatingHandoff]);

  if (showBookingScreen) {
    return <ClientNoProjectScreen />;
  }

  return <LoadingFallback />;
}

export default function Index() {
  return (
    <AuthGuard fallback={<LoadingFallback />}>
      <ClientOnly fallback={<LoadingFallback />}>
        {() => <IndexRedirector />}
      </ClientOnly>
    </AuthGuard>
  );
}
