'use client';

/**
 * "Bigger changes" — the fourth tab of the editor, and the answer to the
 * question the other three cannot: what does a client do when they want a new
 * page, a different layout, a booking calendar?
 *
 * They describe it. Rules classify it (server-side, deterministically): the
 * self-serviceable asks are pointed back at the Words/Pictures tab with a
 * one-tap way there; the real work is filed into the project thread where the
 * team answers it. A client who reads "you can do this yourself" and insists
 * gets a send-anyway button — the classification routes, it does not refuse.
 */
import { useState } from 'react';
import { PolicyNotice } from './PolicyNotice';
import {
  EditorRequestError,
  editorApiBase,
  requestEditor,
  type PolicyDecision,
} from './editor-client';

type Outcome =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'sent' }
  | { state: 'self-serve'; capability: 'content' | 'image'; request: string }
  | { state: 'error'; message: string };

const SELF_SERVE_HINT: Record<'content' | 'image', string> = {
  content:
    'This looks like a wording change you can make yourself, right now, in the Words tab: no waiting on us.',
  image:
    'This looks like a picture swap you can do yourself, right now, in the Pictures tab: no waiting on us.',
};

export function EscalationPanel({
  workspaceId,
  policy,
  onGoToTab,
}: {
  workspaceId: string;
  policy: PolicyDecision;
  onGoToTab: (tab: 'text' | 'images') => void;
}) {
  const [request, setRequest] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ state: 'idle' });

  // A lapsed plan is the one thing that closes this door; the policy's own
  // words say so. maintenance_request is the normal, open-for-business state.
  if (policy.action === 'deny') {
    return <PolicyNotice decision={policy} />;
  }

  async function submit(force: boolean) {
    const text = request.trim();
    if (text.length < 10 || outcome.state === 'sending') return;
    setOutcome({ state: 'sending' });
    try {
      const result = await requestEditor<{
        classification: 'structural' | 'image' | 'content';
        escalated: boolean;
      }>(`${editorApiBase(workspaceId)}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ request: text, force }),
      });
      if (result.escalated) {
        setOutcome({ state: 'sent' });
        setRequest('');
      } else {
        setOutcome({
          state: 'self-serve',
          capability: result.classification === 'image' ? 'image' : 'content',
          request: text,
        });
      }
    } catch (error) {
      setOutcome({
        state: 'error',
        message:
          error instanceof EditorRequestError
            ? error.message
            : 'That did not go through. Please try again.',
      });
    }
  }

  return (
    <div
      data-testid="editor-escalation-panel"
      className="flex flex-col gap-3 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/70 px-4 py-4"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--fs-ink)]">
          Want something bigger?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--fs-ink)]/70">
          New pages, layout changes, bookings, colors: describe it and it goes
          straight to your team. Wording and picture changes you can do yourself
          in the other tabs.
        </p>
      </div>

      <textarea
        data-testid="escalation-request"
        value={request}
        onChange={(event) => {
          setRequest(event.target.value);
          if (outcome.state === 'sent' || outcome.state === 'error') {
            setOutcome({ state: 'idle' });
          }
        }}
        rows={4}
        maxLength={2000}
        placeholder="e.g. Add a page for group workshops with its own booking calendar"
        className="w-full resize-y rounded-xl border border-[var(--fs-ink)]/15 bg-white px-3 py-2 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink)]/35 focus:border-[var(--fs-ink)]/40 focus:outline-none"
      />

      {outcome.state === 'self-serve' ? (
        <div
          data-testid="escalation-self-serve"
          className="rounded-xl border border-[var(--fs-ink)]/15 bg-[var(--fs-ink)]/[0.04] px-4 py-3"
        >
          <p className="text-sm text-[var(--fs-ink)]/80">
            {SELF_SERVE_HINT[outcome.capability]}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onGoToTab(outcome.capability === 'image' ? 'images' : 'text')
              }
              className="rounded-full bg-[var(--fs-ink)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              {outcome.capability === 'image'
                ? 'Open the Pictures tab'
                : 'Open the Words tab'}
            </button>
            <button
              type="button"
              data-testid="escalation-send-anyway"
              onClick={() => void submit(true)}
              className="rounded-full border border-[var(--fs-ink)]/20 px-3 py-1.5 text-sm font-semibold text-[var(--fs-ink)]/75"
            >
              Send it to the team anyway
            </button>
          </div>
        </div>
      ) : outcome.state === 'sent' ? (
        <p
          data-testid="escalation-sent"
          className="rounded-xl border border-emerald-600/25 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          Sent to your team. You will get a reply on your project page, and by
          email.
        </p>
      ) : outcome.state === 'error' ? (
        <p className="text-sm text-red-600">{outcome.message}</p>
      ) : null}

      <button
        type="button"
        data-testid="escalation-submit"
        onClick={() => void submit(false)}
        disabled={request.trim().length < 10 || outcome.state === 'sending'}
        className="self-start rounded-full bg-[var(--fs-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {outcome.state === 'sending' ? 'Sending…' : 'Send to my team'}
      </button>
    </div>
  );
}
