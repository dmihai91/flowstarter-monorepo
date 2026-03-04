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
        const hasBusinessData = !!(
          config?.userDescription ||
          bi?.description ||
          projectDescription.length > 10
        );
        const businessInfo = hasBusinessData
          ? {
              description: bi?.description || config?.userDescription || projectDescription || undefined,
              uvp: bi?.uvp || config?.USP || undefined,
              targetAudience: bi?.targetAudience || config?.targetUsers || undefined,
              businessGoals: bi?.goal ? [bi.goal] : config?.businessGoals ? [config.businessGoals] : undefined,
              brandTone: bi?.brandTone || undefined,
              industry: bi?.industry || config?.industry || undefined,
              offerings: bi?.offerType || undefined,
              contactEmail: ci?.email || undefined,
              contactPhone: ci?.phone || undefined,
              contactAddress: ci?.address || undefined,
              website: ci?.website || undefined,
              sellingMethod: bi?.goal || undefined,
            }
          : undefined;

        // Store handoff data for downstream use
        storeHandoffData({
          projectId: supabaseProjectId,
          userId: data.userId,
          name: projectName,
          description: projectDescription,
          config,
          fromMainPlatform: true,
        });

        hasRedirected.current = true;

        // Check if a Convex project already exists for this Supabase UUID
        const existingConvexProject = await convex.query(
          api.projects.getBySupabaseId,
          { supabaseProjectId }
        );

        if (existingConvexProject) {
          // Project already linked — sync name from Supabase
          console.log('[Index] Found existing Convex project for Supabase UUID:', existingConvexProject._id);
          if (projectName && projectName !== existingConvexProject.name) {
            await convex.mutation(api.projects.update, {
              projectId: existingConvexProject._id,
              name: projectName,
            });
            console.log('[Index] Synced project name from Supabase:', projectName);
          }

          // Look for existing conversation linked to this project
          const existingConvos = conversations || [];
          const linkedConvo = existingConvos.find(
            (c) => c.projectId === existingConvexProject!._id
          );

          if (linkedConvo) {
            console.log('[Index] Redirecting to existing conversation:', linkedConvo._id);
            navigate(`/project/${linkedConvo._id}`, { replace: true });
          } else {
            const newConversationId = await createConversation({
              sessionId,
              title: projectName,
            });
            console.log('[Index] Created new conversation for existing project:', newConversationId);
            navigate(`/project/${newConversationId}`, { replace: true });
          }
        } else {
          // Create new Convex project linked to Supabase
          console.log('[Index] Creating new Convex project for Supabase UUID:', supabaseProjectId);

          const { projectId: convexProjectId, urlId } = await createEmptyProject({
            name: projectName,
            description: config?.userDescription || projectDescription,
            templateId: handoffProject?.templateId || '',
            supabaseProjectId,
            ...(hasBusinessData
              ? {
                  businessDetails: {
                    businessName: projectName,
                    description: config?.userDescription || projectDescription,
                    targetAudience: config?.targetUsers,
                    goals: config?.businessGoals ? [config.businessGoals] : undefined,
                  },
                }
              : {}),
          });

          // Create conversation linked to the new project
          // If business data exists, set step to 'welcome' so useWelcomeInit
          // detects businessInfo/projectDescription and skips to template selection
          const conversationId = await createConversationWithProject({
            sessionId,
            projectId: convexProjectId,
            projectUrlId: urlId,
            projectName,
            projectDescription: config?.userDescription || projectDescription,
            step: hasBusinessData ? 'welcome' : 'describe',
            businessInfo,
          });

          console.log('[Index] Created project + conversation from handoff:', convexProjectId, conversationId);
          navigate(`/project/${conversationId}`, { replace: true });
        }
      } catch (error) {
        console.error('[Index] Handoff validation error:', error);
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
