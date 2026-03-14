import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { AuthGuard } from '~/components/TeamAuthGuard';
import { HandoffGate } from '~/components/HandoffGate';
import { LoadingScreen } from '~/components/LoadingScreen';
import { en } from '~/lib/i18n/locales/en';

export const meta: MetaFunction = () => {
  return [
    { title: en.pages.newProject },
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
  return <LoadingScreen message={en.app.loadingProject} />;
}

function NewRouteContent() {
  const { handoffToken, hasHandoff } = useLoaderData<typeof loader>();

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
    <AuthGuard fallback={<LoadingFallback />}>
      <ClientOnly fallback={<LoadingFallback />}>{() => <NewRouteContent />}</ClientOnly>
    </AuthGuard>
  );
}
