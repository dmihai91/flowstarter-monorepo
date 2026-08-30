'use client';

/**
 * Step 7 — the info agent: the opening half of the concierge conversation.
 *
 * It shares its shell with the preview step (`ConciergePanes`): the questions
 * on the left, the site-to-be on the right as a page-shaped skeleton, and one
 * "Now:" line above both. Nothing changes shape when generation starts — the
 * same panes stay up and the build agents simply take over the talking — so
 * the visitor experiences one continuous conversation rather than two screens.
 *
 * What it is for: the form gets one-line answers to the questions that matter
 * most ("what makes you different", "what do you actually sell"), and a site
 * written from one-line answers reads like a site written from one-line
 * answers. This asks two or three of them properly, in the visitor's own
 * words, and hands those words to the generator.
 *
 * Two things it is deliberately NOT:
 *
 *   - A gate. Every path through this component reaches the preview. The
 *     Skip button is always live, the wizard's Continue is never disabled
 *     here, and blocking gaps left unanswered become a plainly-worded note
 *     about what will be placeholdered — not a wall. Conversion beats
 *     completeness at this point in the funnel.
 *
 *   - A namer. Suggestions are offered, never applied: the button is an
 *     offer, clicking it is the ask, and picking one is the visitor's own
 *     choice. Nothing auto-fills the business name.
 *
 * The copy here is intentionally literal English rather than `t()` keys: the
 * step is new, the locale catalogue is owned elsewhere, and a heading that
 * renders as `landing.discovery.steps.info.title` would be worse than an
 * untranslated sentence. Moving it into the catalogue is a follow-up.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@flowstarter/flow-design-system';
import type { MissingItem } from '@/lib/flowstarter/sufficiency';
import type { DiscoveryData, IntakeChatTurn } from '../discovery.logic';
import {
  GAP_LABELS,
  MAX_TURN_CHARS,
  answersFromDiscovery,
  assetGaps,
  conversationalGaps,
  gapsForDiscovery,
  mergeExtractedAnswers,
  placeholderedIfSkipped,
  type BusinessNamesResponse,
  type IntakeChatResponse,
} from '../intake-chat.shared';
import { ConciergePanes, NowLine, SiteSkeleton } from './ConciergePanes';

const OPENING_LINE =
  'Before I build your preview — a couple of quick questions. Two minutes, ' +
  'in your own words. You can skip straight to the preview whenever you like.';

interface NameSuggestion {
  name: string;
  rationale: string;
}

export function InfoAgentStep({
  data,
  setData,
  onSkip,
}: {
  data: DiscoveryData;
  setData: (updater: (previous: DiscoveryData) => DiscoveryData) => void;
  /** Jumps to the preview. Wired to the wizard's step control. */
  onSkip: () => void;
}) {
  // Memoised: it is a dependency of the send/skip callbacks, and a fresh
  // `[]` on every render would rebuild them on every keystroke.
  const transcript = useMemo(() => data.intakeChat ?? [], [data.intakeChat]);
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Server-side gate result when we have one; the local gate until then, so
  // the checklist is populated on first paint rather than after a round trip.
  const [missing, setMissing] = useState<MissingItem[]>(() =>
    gapsForDiscovery(data)
  );
  const [names, setNames] = useState<NameSuggestion[] | null>(null);
  const [namesPending, setNamesPending] = useState(false);
  const [namesAsked, setNamesAsked] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optional-called: not every environment the wizard renders in (jsdom,
    // older Safari in a modal) implements it, and a missing scroll is not
    // worth an exception in the middle of a conversation.
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [transcript.length, pending]);

  const turn = useCallback(
    async (next: IntakeChatTurn[]) => {
      setPending(true);
      setError(null);
      try {
        const response = await fetch('/api/discovery/intake-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersFromDiscovery(data),
            transcript: next,
          }),
        });
        if (!response.ok) {
          // 429/413 are the only refusals a visitor can actually cause, and
          // neither is worth stopping the funnel over.
          setData((previous) => ({ ...previous, intakeChatStatus: 'skipped' }));
          setError(
            'Let us come back to this later — your preview is ready to build.'
          );
          return;
        }
        const result = (await response.json()) as IntakeChatResponse;
        setMissing(result.missing ?? []);
        setData((previous) => {
          const merged = mergeExtractedAnswers(
            { ...previous, intakeChat: next },
            result.extracted ?? { answers: [] }
          );
          return {
            ...merged,
            intakeChatDocuments:
              result.documents && result.documents.length > 0
                ? result.documents
                : previous.intakeChatDocuments,
            intakeChat:
              result.status === 'ask' && result.question
                ? [...next, { role: 'agent', text: result.question }]
                : next,
            intakeChatStatus: result.status === 'ask' ? '' : 'complete',
          };
        });
      } catch {
        setData((previous) => ({ ...previous, intakeChatStatus: 'skipped' }));
        setError(
          'Let us come back to this later — your preview is ready to build.'
        );
      } finally {
        setPending(false);
      }
    },
    [data, setData]
  );

  // One opening question, once. `started` rather than a length check so a
  // re-render (or a returning visitor with a transcript) cannot re-ask.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (transcript.length > 0 || (data.intakeChatStatus ?? '')) return;
    void turn([]);
    // Deliberately once on mount: `turn` closes over `data`, which changes on
    // every answer, and re-running this would restart the interview.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(() => {
    const text = reply.trim().slice(0, MAX_TURN_CHARS);
    if (!text || pending) return;
    setReply('');
    void turn([...transcript, { role: 'client', text }]);
  }, [pending, reply, transcript, turn]);

  const askForNames = useCallback(async () => {
    setNamesAsked(true);
    setNamesPending(true);
    try {
      const response = await fetch('/api/discovery/business-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The consent flag the endpoint refuses to work without.
          requested: true,
          niche: data.industry?.trim() || data.description.slice(0, 200),
          location: '',
          audience: data.targetAudience,
          description: data.description,
          ...(data.businessName.trim() ? { avoid: [data.businessName] } : {}),
        }),
      });
      const result = (await response.json()) as Partial<BusinessNamesResponse>;
      setNames(result.names ?? []);
    } catch {
      setNames([]);
    } finally {
      setNamesPending(false);
    }
  }, [data.businessName, data.description, data.industry, data.targetAudience]);

  const skip = useCallback(() => {
    setData((previous) => ({
      ...previous,
      intakeChat: transcript,
      intakeChatStatus: 'skipped',
    }));
    onSkip();
  }, [onSkip, setData, transcript]);

  const conversational = conversationalGaps(missing);
  const assets = assetGaps(missing);
  const placeholdered = placeholderedIfSkipped(missing);
  const done =
    (data.intakeChatStatus ?? '') !== '' || conversational.length === 0;

  return (
    <ConciergePanes
      now={
        <NowLine
          label={
            pending
              ? 'Your info agent is thinking'
              : done
              ? 'Ready to build your preview'
              : 'Answering a couple of questions'
          }
          state={pending ? 'working' : done ? 'done' : 'waiting'}
        />
      }
      site={
        <div className="overflow-hidden rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40">
          <div className="flex items-center gap-1.5 border-b border-[var(--fs-rule)] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-auto shrink-0 text-[11px] font-semibold text-[var(--fs-ink-faint)]">
              Your site, once we start
            </span>
          </div>
          <SiteSkeleton caption="Your site builds here, section by section, the moment the questions are done. Nothing on this panel is real yet." />
        </div>
      }
      conversation={
        <div className="space-y-4">
          {/* The wizard already prints this step's title above the panes, so
            the pane opens with the promise rather than repeating it. */}
          <p className="text-sm text-[var(--fs-ink-faint)]">{OPENING_LINE}</p>
          {/* What the gate says is still missing — in its words, not its codes. */}
          {missing.length > 0 && (
            <section
              aria-label="What is still missing"
              className="rounded-lg border border-[var(--fs-rule)] bg-white/[0.02] p-3.5"
            >
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--fs-ink-faint)]">
                Still missing
              </p>
              <ul className="space-y-2">
                {[...conversational, ...assets].map((item) => (
                  <li key={item.code} className="flex gap-2 text-sm">
                    <span
                      aria-hidden
                      className={[
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        item.severity === 'blocking'
                          ? 'bg-[var(--purple-primary)]'
                          : 'bg-[var(--fs-rule)]',
                      ].join(' ')}
                    />
                    <span>
                      <span className="font-semibold text-[var(--fs-ink)]">
                        {GAP_LABELS[item.code]}
                      </span>
                      <span className="block text-[13px] leading-snug text-[var(--fs-ink-faint)]">
                        {item.message}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {assets.length > 0 && (
                <p className="mt-2.5 text-[12px] leading-snug text-[var(--fs-ink-faint)]">
                  Photos and logos are not something you can type — you will be
                  able to upload those once the preview is yours. Until then the
                  site uses template artwork.
                </p>
              )}
            </section>
          )}

          {/* The conversation */}
          <section
            aria-label="Intake conversation"
            aria-busy={pending}
            className="max-h-72 space-y-2.5 overflow-y-auto rounded-lg border border-[var(--fs-rule)] p-3.5"
          >
            {transcript.length === 0 && !pending && (
              <p className="text-sm text-[var(--fs-ink-faint)]">
                Nothing to ask — your answers already cover what we need.
              </p>
            )}
            {transcript.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={
                  entry.role === 'client'
                    ? 'ml-8 rounded-lg bg-[var(--purple-primary)]/10 px-3 py-2 text-sm text-[var(--fs-ink)]'
                    : 'mr-8 rounded-lg border border-[var(--fs-rule)] px-3 py-2 text-sm text-[var(--fs-ink)]'
                }
              >
                {entry.text}
              </div>
            ))}
            {pending && (
              <p
                role="status"
                className="mr-8 flex items-center gap-2 rounded-lg border border-[var(--fs-rule)] px-3 py-2 text-sm text-[var(--fs-ink-faint)]"
              >
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent"
                />
                Thinking — this takes a few seconds
              </p>
            )}
            <div ref={endRef} />
          </section>

          {error && (
            <p role="alert" className="text-sm text-[var(--fs-ink-faint)]">
              {error}
            </p>
          )}

          {/* Answering */}
          {!done && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={2}
                maxLength={MAX_TURN_CHARS}
                aria-label="Your answer"
                placeholder="Answer in your own words…"
                className="w-full flex-1 rounded-lg border border-[var(--fs-rule)] bg-white px-3.5 py-2.5 text-sm text-[var(--fs-ink)] outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-[var(--fs-ink-faint)] hover:border-[var(--purple-primary)]/30 focus:border-[var(--purple-primary)]/40 focus:shadow-[0_0_0_4px_var(--purple-primary-lightest)] dark:bg-white/[0.03]"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={send}
                disabled={pending || reply.trim().length === 0}
                loading={pending}
              >
                Send
              </Button>
            </div>
          )}

          {/* Names: offered, never applied. */}
          <div className="rounded-lg border border-dashed border-[var(--fs-rule)] p-3.5">
            <p className="text-sm text-[var(--fs-ink)]">
              Still deciding on a name?
              <span className="block text-[13px] text-[var(--fs-ink-faint)]">
                We will only suggest names if you ask. Nothing is filled in for
                you.
              </span>
            </p>
            {!namesAsked ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => void askForNames()}
              >
                Suggest a few names
              </Button>
            ) : namesPending ? (
              <p
                role="status"
                className="mt-2 text-sm text-[var(--fs-ink-faint)]"
              >
                Thinking of names…
              </p>
            ) : names && names.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {names.map((suggestion) => (
                  <li key={suggestion.name}>
                    <button
                      type="button"
                      onClick={() =>
                        setData((previous) => ({
                          ...previous,
                          businessName: suggestion.name,
                        }))
                      }
                      className="w-full rounded-lg border border-[var(--fs-rule)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--purple-primary)]/40"
                    >
                      <span className="font-semibold text-[var(--fs-ink)]">
                        {suggestion.name}
                      </span>
                      <span className="block text-[12px] leading-snug text-[var(--fs-ink-faint)]">
                        {suggestion.rationale}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--fs-ink-faint)]">
                No suggestions this time — your own name is the safer bet
                anyway.
              </p>
            )}
          </div>

          {/* The escape hatch, always live. */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--fs-rule)] pt-3">
            <Button variant="ghost" size="sm" onClick={skip}>
              Skip and show me the preview
            </Button>
            {placeholdered.length > 0 && (
              <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
                If you skip, we will build the preview with placeholder{' '}
                {placeholdered
                  .map((item) => GAP_LABELS[item.code].toLowerCase())
                  .join(', ')}{' '}
                — you can replace all of it later, nothing is locked in.
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}
