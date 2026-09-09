'use client';

import { useCallback, useState } from 'react';

/**
 * Starts the server-owned deposit Checkout session. No amount is sent from the
 * browser: the endpoint derives the exact 20% from the stored quote, so this
 * button can only ever ask "start checkout for this workspace".
 */
export function UnlockCheckoutButton({
  workspaceId,
  amountLabel,
}: {
  workspaceId: string;
  amountLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/flowstarter/projects/${workspaceId}/deposit-checkout`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        setError(
          payload.error ?? 'Could not start checkout. Please try again.'
        );
        setBusy(false);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError('Could not reach the payment service. Please try again.');
      setBusy(false);
    }
  }, [workspaceId]);

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex w-fit items-center rounded-full bg-[var(--fs-ink)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {busy ? 'Starting checkout…' : `Pay ${amountLabel} and start the build`}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
