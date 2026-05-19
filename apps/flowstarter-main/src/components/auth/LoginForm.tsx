'use client';

/**
 * flowstarter-main adapter for the shared `<LoginForm/>` from
 * @flowstarter/flow-design-system.
 *
 * The form markup + flow now live in the design system so the editor
 * and the marketing app render the exact same component. This file
 * only injects the main app's environment:
 *   - `useSignIn` from `@clerk/nextjs/legacy`
 *   - `useTranslations` (the app's i18n runtime)
 *   - `useSearchParams` from `next/navigation`
 *   - `/api/auth/transfer-token` for cross-domain session hand-off
 *     (e.g. redirecting to the editor subdomain after sign-in)
 *
 * The previous ~580-line implementation moved verbatim into
 * `packages/flow-design-system/src/components/auth/LoginForm.tsx`.
 */

import {
  LoginForm as SharedLoginForm,
  type SharedSignInResource,
  type SharedSetActive,
} from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs/legacy';
import { useSearchParams } from 'next/navigation';

interface LoginFormProps {
  /** Controls forgot-password and redirect behaviour. */
  variant: 'client' | 'team';
}

export function LoginForm({ variant }: LoginFormProps) {
  const { signIn, setActive } = useSignIn();
  const { t } = useTranslations();
  const searchParams = useSearchParams();

  // Cross-domain session hand-off — mint a short-lived Clerk sign-in
  // token so the destination app (e.g. the editor subdomain) can
  // adopt the session. Returns the token-bearing URL, or null to fall
  // back to a plain redirect inside the shared component.
  const onTransferToken = async (
    redirectUrl: string
  ): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/transfer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUrl }),
      });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        return url;
      }
    } catch {
      /* fall back to plain redirect */
    }
    return null;
  };

  return (
    <SharedLoginForm
      variant={variant}
      signIn={signIn as unknown as SharedSignInResource | undefined}
      setActive={setActive as unknown as SharedSetActive | undefined}
      t={t as (key: string) => string}
      getSearchParam={(key) => searchParams.get(key)}
      onTransferToken={onTransferToken}
    />
  );
}
