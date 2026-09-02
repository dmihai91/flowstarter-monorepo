'use client';

import { useState, type FormEvent } from 'react';

/**
 * Client-side form for the per-tenant Cal.com booking page.
 * Saves via PATCH /api/client/booking/[workspaceId].
 */
export function BookingSettingsForm({
  workspaceId,
  initialCalComUrl,
}: {
  workspaceId: string;
  initialCalComUrl: string;
}) {
  const [value, setValue] = useState(initialCalComUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/client/booking/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calComUrl: value }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        calComUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? 'Could not save your booking link.');
        return;
      }
      setValue(json.calComUrl ?? '');
      setSaved(true);
    } catch {
      setError('Could not save your booking link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
      data-testid="booking-settings-form"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--fs-ink)]">
          Cal.com booking link
        </span>
        <input
          type="url"
          name="calComUrl"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="https://cal.com/your-name/intro"
          autoComplete="off"
          data-testid="booking-cal-url"
          className="rounded-xl border border-[var(--fs-glass-edge)] bg-white/80 px-4 py-3 text-sm text-[var(--fs-ink)] outline-none focus:border-[var(--purple-primary)]"
        />
        <span className="text-xs text-[var(--fs-ink)]/60">
          This embeds on your site&apos;s booking page for this project only.
          Leave blank to remove the calendar until you add one.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-emerald-700" data-testid="booking-saved">
          Saved. Your calendar will go live on the full site build.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        data-testid="booking-save"
        className="w-fit rounded-xl bg-[var(--purple-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save booking link'}
      </button>
    </form>
  );
}
