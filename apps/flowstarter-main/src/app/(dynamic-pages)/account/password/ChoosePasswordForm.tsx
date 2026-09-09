'use client';

/**
 * The form a guest-provisioned client meets on their first sign in.
 *
 * Three things have to happen in order, and only the first one is Clerk's job:
 *
 *   1. `user.updatePassword` replaces the temporary password. Clerk requires
 *      the current one, so the field is asked for rather than hidden: the
 *      client has it in front of them in the email that sent them here.
 *   2. the server clears `publicMetadata.mustChangePassword`. Public metadata
 *      is backend-only, so the browser cannot do this itself.
 *   3. the session token is reminted with `getToken({ skipCache: true })`.
 *      Without it the JWT in the cookie still carries the old flag for up to a
 *      minute and the middleware would bounce them straight back here, which
 *      reads as "it did not work" to somebody who just did everything right.
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Clerk's own floor is 8; asking for a little more costs the client nothing. */
const MIN_LENGTH = 10;

export function ChoosePasswordForm() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (busy || !user) return;
    setError(null);

    if (newPassword.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirm) {
      setError('The two new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a password that is not the temporary one.');
      return;
    }

    setBusy(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
        // The temporary password may have been read by anyone with access to
        // that inbox. Every session that was opened with it goes.
        signOutOfOtherSessions: true,
      });
    } catch (clerkError) {
      setError(readableClerkError(clerkError));
      setBusy(false);
      return;
    }

    try {
      const response = await fetch('/api/account/password-changed', {
        method: 'POST',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        // The password IS changed at this point. Say so, so nobody tries the
        // old one again.
        setError(
          body.error ??
            'Your new password is saved but we could not finish. Reload and try again.'
        );
        setBusy(false);
        return;
      }
    } catch {
      setError(
        'Your new password is saved but we could not finish. Reload and try again.'
      );
      setBusy(false);
      return;
    }

    // Remint the session token so the gate sees the cleared flag immediately.
    // A failure here is survivable: the flag is already gone server-side, so
    // the worst case is one more bounce through this page.
    try {
      await getToken({ skipCache: true });
    } catch {
      /* the next token refresh will pick it up */
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <Field
        label="Temporary password"
        hint="The one from the email we sent you."
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />
      <Field
        label="New password"
        hint={`At least ${MIN_LENGTH} characters.`}
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />
      <Field
        label="New password again"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-amber-600 dark:text-amber-400"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !isLoaded}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
      >
        {busy ? 'Saving…' : 'Save and continue'}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      {hint && (
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
      <input
        type="password"
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(inputEvent) => onChange(inputEvent.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  );
}

/**
 * Clerk returns a structured error array. The long message is the one written
 * for a human; the fallback exists because a network failure has neither.
 */
function readableClerkError(error: unknown): string {
  const errors = (error as { errors?: Array<Record<string, string>> })?.errors;
  const first = errors?.[0];
  return (
    first?.longMessage ||
    first?.message ||
    'That did not work. Check the temporary password and try again.'
  );
}
