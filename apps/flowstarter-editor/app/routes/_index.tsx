import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { AuthGuard } from '~/components/TeamAuthGuard';
import { HandoffGate } from '~/components/HandoffGate';
import { LoadingScreen } from '~/components/LoadingScreen';
import { en } from '~/lib/i18n/locales/en';

export const meta: MetaFunction = () => {
  return [
    { title: en.app.title },
    { name: 'description', content: en.app.description },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const handoffToken = url.searchParams.get('handoff');

  return json({
    handoffToken,
    hasHandoff: Boolean(handoffToken),
  });
};

function LoadingFallback() {
  return <LoadingScreen message={en.app.loadingFlowstarterEditor} />;
}

function NoDashboardCard() {
  const dashboardUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname.replace('editor.', '')}/team/dashboard`
      : 'https://flowstarter.dev/team/dashboard';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0810',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          margin: '0 16px',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          padding: '40px 36px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(99,82,237,0.12)',
            border: '1px solid rgba(99,82,237,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              stroke="rgba(139,122,255,0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 20.25 6v3.776"
            />
          </svg>
        </div>
        <h1
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 20,
            fontWeight: 600,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          No project open
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          Start a project from the team dashboard, complete the business and template setup, then open it here through the handoff flow.
        </p>
        <a
          href={dashboardUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6352ed, #7c3aed)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
          }}
        >
          Go to Dashboard
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

function IndexContent() {
  const { handoffToken, hasHandoff } = useLoaderData<typeof loader>();

  if (!hasHandoff) {
    return <NoDashboardCard />;
  }

  return (
    <HandoffGate
      handoffToken={handoffToken}
      hasHandoff={hasHandoff}
      loadingMessage={en.app.loadingFlowstarterEditor}
    />
  );
}

export default function Index() {
  const { hasHandoff } = useLoaderData<typeof loader>();

  // Skip AuthGuard for handoff URLs — HandoffGate validates the token independently
  if (hasHandoff) {
    return (
      <ClientOnly fallback={<LoadingFallback />}>{() => <IndexContent />}</ClientOnly>
    );
  }

  return (
    <AuthGuard fallback={<LoadingFallback />}>
      <ClientOnly fallback={<LoadingFallback />}>{() => <IndexContent />}</ClientOnly>
    </AuthGuard>
  );
}
