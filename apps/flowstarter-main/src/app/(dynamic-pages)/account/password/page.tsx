/**
 * The only page a client with a temporary password can reach.
 *
 * The middleware sends them here and keeps sending them here until
 * `publicMetadata.mustChangePassword` is gone. The page itself is reachable by
 * any signed-in user, deliberately: somebody who lands on it without the flag
 * has simply chosen to change their password, which is a thing they are allowed
 * to do, and a gate that only opened for flagged users would make the redirect
 * loop harder to reason about, not easier.
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ChoosePasswordForm } from './ChoosePasswordForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Choose your password',
  description: 'Replace the temporary password we emailed you.',
};

export default async function ChoosePasswordPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/login?next=/account/password');

  const forced =
    (
      sessionClaims as
        | { metadata?: { mustChangePassword?: boolean } }
        | undefined
    )?.metadata?.mustChangePassword === true;

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16 sm:px-8">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Choose your password
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {forced
          ? 'We set your first password for you when your deposit came in. Pick your own now and the temporary one stops working.'
          : 'Set a new password for your account.'}
      </p>

      <ChoosePasswordForm />
    </main>
  );
}
