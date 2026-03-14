import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { LoadingScreen } from '~/components/LoadingScreen';

interface HandoffProjectPayload {
  id?: string;
  name?: string;
  description?: string;
  data?: {
    client?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    businessInfo?: Record<string, unknown>;
    contactInfo?: Record<string, unknown>;
  };
}

interface HandoffValidateResponse {
  valid?: boolean;
  projectId?: string;
  userId?: string;
  project?: HandoffProjectPayload;
}

interface HandoffGateProps {
  handoffToken: string | null;
  hasHandoff: boolean;
  loadingMessage: string;
}

const HANDOFF_DATA_KEY = 'flowstarter_handoff_data';
const HANDOFF_TOKEN_KEY = 'flowstarter_handoff_token';
const DEFAULT_DASHBOARD_URL = 'https://flowstarter.dev/team/dashboard';

function getDashboardUrl(): string {
  return `${import.meta.env.VITE_MAIN_PLATFORM_URL || 'https://flowstarter.dev'}/team/dashboard`;
}

function storeHandoffData(data: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(HANDOFF_DATA_KEY, JSON.stringify(data));
}

function storeHandoffToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(HANDOFF_TOKEN_KEY, token);
}

function buildStoredHandoffData(projectId: string, project?: HandoffProjectPayload) {
  const data = project?.data || {};
  const client = data.client || {};
  const contactInfo = data.contactInfo || {};
  const businessInfo = data.businessInfo || {};

  return {
    projectId,
    id: project?.id || projectId,
    name: project?.name || 'Untitled Project',
    projectName: project?.name || 'Untitled Project',
    description: project?.description || '',
    client,
    contactInfo,
    businessInfo: {
      ...businessInfo,
      contactEmail:
        (businessInfo.contactEmail as string | undefined) ||
        client.email ||
        (contactInfo.email as string | undefined),
      contactPhone:
        (businessInfo.contactPhone as string | undefined) ||
        client.phone ||
        (contactInfo.phone as string | undefined),
      contactAddress:
        (businessInfo.contactAddress as string | undefined) ||
        (contactInfo.address as string | undefined),
      website:
        (businessInfo.website as string | undefined) ||
        (contactInfo.website as string | undefined),
    },
  };
}

export function HandoffGate({ handoffToken, hasHandoff, loadingMessage }: HandoffGateProps) {
  const navigate = useNavigate();
  const hasStarted = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const dashboardUrl = useMemo(() => getDashboardUrl() || DEFAULT_DASHBOARD_URL, []);

  useEffect(() => {
    if (!handoffToken || !hasHandoff || hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const initialize = async () => {
      try {
        const validateRes = await fetch(`/api/handoff/validate?token=${encodeURIComponent(handoffToken)}`);
        const validateData = (await validateRes.json().catch(() => ({}))) as HandoffValidateResponse;

        if (!validateRes.ok || !validateData.valid || !validateData.projectId) {
          throw new Error('Invalid or expired handoff link.');
        }

        const fullRes = await fetch('/api/handoff/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: handoffToken }),
        });
        const fullData = (await fullRes.json().catch(() => ({}))) as HandoffValidateResponse;

        storeHandoffToken(handoffToken);
        storeHandoffData(buildStoredHandoffData(validateData.projectId, fullData.project));

        const initRes = await fetch('/api/handoff/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: handoffToken }),
        });

        const initData = (await initRes.json().catch(() => ({}))) as { conversationId?: string; error?: string };
        if (!initRes.ok || !initData.conversationId) {
          throw new Error(initData.error || 'Failed to initialize the editor conversation.');
        }

        sessionStorage.setItem('flowstarter_handoff_session', '1');
        navigate(`/project/${initData.conversationId}`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open the project.');
      }
    };

    initialize();
  }, [handoffToken, hasHandoff, navigate]);

  if (hasHandoff && !error) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Projects are created from the team dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {error || 'Start a project from the dashboard handoff flow, then open it in the editor from there.'}
        </p>
        <a
          className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          href={dashboardUrl || DEFAULT_DASHBOARD_URL}
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
