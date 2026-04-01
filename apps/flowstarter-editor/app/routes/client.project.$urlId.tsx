import { LoadingScreen } from '@flowstarter/flow-design-system';
import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useParams } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
import { useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../convex/_generated/dataModel';
import { ClientQuickEditor } from '~/components/editor/ClientQuickEditor';

const CLIENT_MODE_KEY = 'flowstarter_mode';
const CLIENT_PROJECT_URL_ID_KEY = 'flowstarter_project_url_id';
const CLIENT_SESSION_TOKEN_KEY = 'flowstarter_client_session_token';

export const meta: MetaFunction = () => [
  { title: 'Client Editor | Flowstarter' },
  { name: 'description', content: 'Quick client-side edits for your Flowstarter site.' },
];

export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ urlId: params.urlId });
};

export function hasStoredClientAccess(urlId?: string): boolean {
  if (typeof window === 'undefined' || !urlId) {
    return false;
  }

  try {
    const mode = localStorage.getItem(CLIENT_MODE_KEY);
    const projectUrlId = localStorage.getItem(CLIENT_PROJECT_URL_ID_KEY);

    return mode === 'client' && projectUrlId === urlId;
  } catch {
    return false;
  }
}

function getStoredClientSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(CLIENT_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function LoadingFallback() {
  return <LoadingScreen message="Loading your editor..." />;
}

function ClientAccessRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Open this project from your access link</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          This client editor is only available from the Flowstarter link that was sent to you.
        </p>
      </div>
    </div>
  );
}

function ClientProjectNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Project not found</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          This project could not be loaded. Ask your Flowstarter team for a fresh access link.
        </p>
      </div>
    </div>
  );
}

function ClientProjectRouteContent() {
  const { urlId } = useParams<{ urlId: string }>();
  const hasClientAccess = useMemo(() => hasStoredClientAccess(urlId), [urlId]);
  const sessionToken = useMemo(() => getStoredClientSessionToken(), []);
  const sessionValidation = useQuery(
    api.magicLinks.validateClientSession,
    hasClientAccess && sessionToken && urlId ? { sessionToken, projectUrlId: urlId } : 'skip',
  );

  const project = useQuery(
    api.projects.getByUrlId,
    hasClientAccess && sessionValidation?.valid && urlId ? { urlId } : 'skip',
  );

  if (!hasClientAccess) {
    return <ClientAccessRequired />;
  }

  if (sessionValidation === undefined || project === undefined) {
    return <LoadingFallback />;
  }

  if (!sessionValidation?.valid) {
    return <ClientAccessRequired />;
  }

  if (!project) {
    return <ClientProjectNotFound />;
  }

  return (
    <ClientQuickEditor
      projectId={project._id as Id<'projects'>}
      projectName={project.name}
      publishedUrl={project.publishedUrl}
    />
  );
}

export default function ClientProjectPage() {
  return <ClientOnly fallback={<LoadingFallback />}>{() => <ClientProjectRouteContent />}</ClientOnly>;
}
