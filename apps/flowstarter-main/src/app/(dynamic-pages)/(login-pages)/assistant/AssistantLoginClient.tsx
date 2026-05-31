'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthRedirectWrapper } from '@/components/AuthRedirectWrapper';

/**
 * Flowstarter Assistant sign-in — the client-facing login a workspace owner
 * reaches from their operator landing ("Sign in"). Same email/password flow
 * as the platform Client Login (shared <LoginForm variant="client" />, which
 * honours `redirect_url` for the cross-domain hand-off back to the workspace),
 * but branded as the Assistant rather than the platform/team console.
 */
export function AssistantLoginClient() {
  return (
    <AuthRedirectWrapper>
      <AuthLayout
        title="Flowstarter Assistant"
        subtitle="Sign in to edit your website with your assistant."
        showStats={false}
      >
        <AuthFormCard>
          <LoginForm variant="client" />
        </AuthFormCard>
      </AuthLayout>
    </AuthRedirectWrapper>
  );
}
