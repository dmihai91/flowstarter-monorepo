import { AssistantLoginClient } from './AssistantLoginClient';

// Reads per-request search params (useSearchParams) and is no-store cached, so
// render dynamically rather than statically prerendering (which would require a
// Suspense boundary). The rest of the app stays static — see the root layout.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Flowstarter Assistant',
  description: 'Sign in to edit your website with your Flowstarter assistant.',
};

export default function AssistantLoginPage() {
  return <AssistantLoginClient />;
}
