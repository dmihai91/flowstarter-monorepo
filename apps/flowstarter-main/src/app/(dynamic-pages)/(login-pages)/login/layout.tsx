import { ClientLayout } from '../ClientLayout';
import { FlowBackgroundLayer } from '@/components/ui/flow-background-layer';

// Auth pages read per-request search params (redirect target, notice messages)
// via useSearchParams and are no-store cached anyway, so render them
// dynamically. This keeps the rest of the app statically prerenderable (the
// root layout no longer opts everything into dynamic) without forcing a
// Suspense boundary around the login client.
export const dynamic = 'force-dynamic';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <div className="relative min-h-screen">
        <FlowBackgroundLayer variant="auth" />
        <div className="relative z-10">{children}</div>
      </div>
    </ClientLayout>
  );
}
