'use client';

/**
 * Every version of the site, and the two things you can do with one: go back
 * to it, or put the current one live.
 *
 * The publish button reports what the server actually did rather than a
 * green tick. On an environment with no deploy agent that is "nothing was
 * pushed (dry run)"; on a project with no build of the edited files yet it is
 * "we rebuild it for you". Both are true, and both are better than a client
 * refreshing their live site for ten minutes waiting for a change that was
 * never sent anywhere.
 */
import { useState } from 'react';
import { PolicyNotice } from './PolicyNotice';
import {
  EditorRequestError,
  requestEditor,
  type EditorVersion,
  type PolicyDecision,
} from './editor-client';

export function VersionHistoryPanel({
  base,
  versions,
  currentVersion,
  policy,
  onChanged,
}: {
  base: string;
  versions: EditorVersion[];
  currentVersion: number;
  policy: PolicyDecision;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const allowed = policy.action === 'inline_content_agent';

  async function revert(version: number) {
    setBusy(true);
    setError(null);
    try {
      await requestEditor(`${base}/revert`, {
        method: 'POST',
        body: JSON.stringify({ version }),
      });
      await onChanged();
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'That version could not be restored.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const result = await requestEditor<{
        version: number;
        deploy: { mode: string; detail: string };
      }>(`${base}/publish`, { method: 'POST' });
      setPublishNote(result.deploy.detail);
      await onChanged();
    } catch (caught) {
      setError(
        caught instanceof EditorRequestError
          ? caught.message
          : 'That could not be published.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/70 px-4 py-4">
      <PolicyNotice decision={policy} />

      <button
        type="button"
        data-testid="editor-publish"
        onClick={publish}
        disabled={!allowed || busy}
        className="rounded-full bg-[var(--fs-ink)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        Put this live
      </button>
      {publishNote ? (
        <p
          data-testid="editor-publish-note"
          className="rounded-xl bg-[var(--fs-ink)]/[0.04] px-3 py-2 text-sm text-[var(--fs-ink)]/75"
        >
          {publishNote}
        </p>
      ) : null}

      {versions.length === 0 ? (
        <p className="text-sm text-[var(--fs-ink)]/60">
          You have not changed anything yet.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {versions.map((entry) => (
          <li
            key={entry.version}
            data-testid="editor-version"
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--fs-ink)]/10 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--fs-ink)]">
                v{entry.version}
                {entry.version === currentVersion ? ' · current' : ''}
                {entry.publishedAt ? ' · live' : ''}
              </p>
              <p className="truncate text-xs text-[var(--fs-ink)]/55">
                {entry.summary ?? 'Change'} ·{' '}
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
            {entry.version === currentVersion ? null : (
              <button
                type="button"
                data-testid="editor-revert"
                onClick={() => revert(entry.version)}
                disabled={!allowed || busy}
                className="shrink-0 rounded-full border border-[var(--fs-ink)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--fs-ink)]/75 disabled:opacity-40"
              >
                Go back to this
              </button>
            )}
          </li>
        ))}
      </ul>

      {error ? (
        <p
          data-testid="history-error"
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
