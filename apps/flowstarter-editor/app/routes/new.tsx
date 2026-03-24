import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { AuthGuard } from '~/components/TeamAuthGuard';
import { HandoffGate } from '~/components/HandoffGate';
import { LoadingScreen } from '~/components/LoadingScreen';
import { en } from '~/lib/i18n/locales/en';

export const meta: MetaFunction = () => {
  return [{ title: en.pages.newProject }, { name: 'description', content: en.app.description }];
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
  return <LoadingScreen message={en.app.loadingProject} />;
}

function NewRouteContent() {
  const { handoffToken, hasHandoff } = useLoaderData<typeof loader>();

  // No handoff token — redirect to the operator dashboard to start a new project
  if (!hasHandoff) {
    const dashboardUrl =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname.replace('editor.', '')}` +
          '/team/dashboard/new'
        : 'https://flowstarter.dev/team/dashboard/new';

    if (typeof window !== 'undefined') {
      window.location.href = dashboardUrl;
    }

    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  return (
    <HandoffGate
      handoffToken={handoffToken}
      hasHandoff={hasHandoff}
      loadingMessage={en.app.loadingProject}
    />
  );
}

export default function NewProjectPage() {
  return (
    <AuthGuard fallback={<LoadingFallback />} requireTeam>
      <ClientOnly fallback={<LoadingFallback />}>{() => <NewRouteContent />}</ClientOnly>
    </AuthGuard>
  );
}
