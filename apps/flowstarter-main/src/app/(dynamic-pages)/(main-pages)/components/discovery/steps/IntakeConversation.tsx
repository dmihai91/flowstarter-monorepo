'use client';

/**
 * Steps 1–6 — the intake, as a conversation.
 *
 * This replaces the four form screens (about / business / goals / commerce) and
 * wraps the two commercial choices (build package, monthly plan) in the same
 * transcript, so a visitor goes from "hello" to a generated preview without
 * ever being shown a page of labelled inputs.
 *
 * What it is:
 *
 *   - One agent bubble at a time, from `intake-script.ts`. The order, the
 *     validation, the required-field gate and the decision that the intake is
 *     finished are all that file's — deterministic, no model involved. This
 *     component only draws them and collects what the visitor types or taps.
 *
 *   - A transcript that stays. Every earlier question and answer is still on
 *     screen, and every one of the visitor's own bubbles has an Edit button
 *     that re-asks that question with the old answer prefilled. Editing
 *     rewrites the bubble in place instead of appending a correction, because
 *     the transcript is a pure projection of (answers, data) — there is no
 *     second copy of the truth to drift.
 *
 *   - Never a trap. The escape to the preview is in the footer at every point
 *     of the conversation, exactly like the info agent's. It drops every
 *     remaining optional question; the handful the wizard has always required
 *     (a name, an email, what the business does, what the site is for, whether
 *     it sells) are asked in one short run and then the preview is built.
 *
 * The commercial panels keep their existing cards: a four-way price comparison
 * is not something a chat bubble does well, and the point of this screen is to
 * feel like a conversation, not to be dogmatic about the shape of a message.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Button } from '@flowstarter/flow-design-system';
import { type DiscoveryData, type Step, canProceed } from '../discovery.logic';
import {
  type IntakeOption,
  type IntakeQuestion,
  type IntakeQuestionId,
  answerText,
  answeredQuestions,
  conversationProgress,
  interpolate,
  nextQuestion,
  optionLabel,
  promptText,
  questionById,
  essentialRemaining,
} from '../intake-script';
import { ChipsInput } from '../ChipsInput';
import { ChatBubble, ConversationLog } from './ConciergePanes';
import { RecommendationStep } from './RecommendationStep';
import { SubscriptionStep } from './SubscriptionStep';

const composerClass =
  'w-full flex-1 resize-none rounded-xl border border-[var(--fs-rule)] bg-white px-3.5 py-2.5 text-sm text-[var(--fs-ink)] outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-[var(--fs-ink-faint)] hover:border-[var(--purple-primary)]/30 focus:border-[var(--purple-primary)]/40 focus:shadow-[0_0_0_4px_var(--purple-primary-lightest)] dark:bg-white/[0.03]';

const chipClass =
  'rounded-full border px-3 py-1.5 text-sm font-semibold transition-all border-[var(--fs-rule)] text-[var(--fs-ink)] hover:border-[var(--purple-primary)]/50 hover:bg-[var(--purple-primary)]/[0.06]';

export function IntakeConversation({
  data,
  update,
  answered,
  essentialsOnly,
  onAnswer,
  onSkipRest,
  t,
}: {
  data: DiscoveryData;
  update: <K extends keyof DiscoveryData>(
    key: K,
    value: DiscoveryData[K]
  ) => void;
  /** Question ids the visitor has dealt with, in the order they dealt with them. */
  answered: readonly IntakeQuestionId[];
  /** The visitor asked to skip ahead: only the unskippable questions are left. */
  essentialsOnly: boolean;
  /** Applies one answer and files the question as answered. Empty = skipped. */
  onAnswer: (id: IntakeQuestionId, raw: string) => void;
  /** Narrows the conversation to the essentials and heads for the preview. */
  onSkipRest: () => void;
  t: (key: string) => string;
}) {
  const [editing, setEditing] = useState<IntakeQuestionId | null>(null);
  const [draft, setDraft] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const pending = useMemo(
    () => nextQuestion(data, answered, essentialsOnly),
    [data, answered, essentialsOnly]
  );
  const current: IntakeQuestion | null = editing
    ? questionById(editing) ?? null
    : pending;

  const history = useMemo(
    () => answeredQuestions(data, answered),
    [data, answered]
  );
  const progress = useMemo(
    () => conversationProgress(data, answered, essentialsOnly),
    [data, answered, essentialsOnly]
  );
  const stillRequired = useMemo(
    () => essentialRemaining(data, answered),
    [data, answered]
  );

  // The composer opens holding whatever is already on file: an edit shows the
  // old answer, and a restored draft from before this screen existed shows the
  // value the form captured rather than asking for it again from nothing.
  const currentId = current?.id ?? null;
  useEffect(() => {
    if (!currentId) return;
    const question = questionById(currentId);
    setDraft(question ? question.value(data) : '');
    setErrorKey(null);
    composerRef.current?.focus?.();
    // Deliberately keyed on the question alone: re-running as `data` changes
    // would overwrite what the visitor is in the middle of typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const submit = useCallback(
    (raw: string) => {
      if (!current) return;
      const text = raw.trim();
      if (current.required && !text) {
        setErrorKey('landing.discovery.chat.errors.required');
        return;
      }
      // An optional question with nothing in it is a skip, not a bad answer:
      // validators never run on it.
      const failed = text ? current.validate?.(text) ?? null : null;
      if (failed) {
        setErrorKey(failed);
        return;
      }
      setErrorKey(null);
      setEditing(null);
      onAnswer(current.id, text);
    },
    [current, onAnswer]
  );

  const skipRest = useCallback(() => {
    setEditing(null);
    onSkipRest();
  }, [onSkipRest]);

  const agentName = t('landing.discovery.chat.agentName');

  return (
    <div className="space-y-3">
      {/* Progress. A conversation still owes the visitor an answer to "how
          much longer" — but as one quiet line, not eight numbered circles. */}
      <div className="flex items-center gap-3">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--fs-rule)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label={t('landing.discovery.chat.progressLabel')}
        >
          <div
            className="h-full rounded-full bg-[var(--purple-primary)] transition-[width] duration-300"
            style={{
              width: `${
                progress.total === 0
                  ? 100
                  : Math.round((progress.done / progress.total) * 100)
              }%`,
            }}
          />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--fs-ink-faint)]">
          {interpolate(t('landing.discovery.chat.progressCount'), {
            done: progress.done,
            total: progress.total,
          })}
        </span>
      </div>

      <ConversationLog
        label={t('landing.discovery.chat.logLabel')}
        scrollSignal={answered.length + (editing ? 1 : 0)}
      >
        <ChatBubble tone="agent" author={agentName}>
          {t('landing.discovery.chat.intro')}
        </ChatBubble>

        {history.map((question) => {
          const said = answerText(question, data, t);
          return (
            <div key={question.id} className="space-y-2">
              <ChatBubble tone="agent">
                {promptText(question, data, t)}
              </ChatBubble>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditing(question.id)}
                  aria-label={`${t(
                    'landing.discovery.chat.edit'
                  )}: ${promptText(question, data, t)}`}
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--fs-ink-faint)] underline-offset-2 transition-colors hover:text-[var(--purple-primary)] hover:underline"
                >
                  {t('landing.discovery.chat.edit')}
                </button>
                <ChatBubble tone="you">
                  {said || t('landing.discovery.chat.skipped')}
                </ChatBubble>
              </div>
            </div>
          );
        })}

        {essentialsOnly && stillRequired.length > 0 && (
          <ChatBubble tone="alert">
            {interpolate(t('landing.discovery.chat.stillNeeded'), {
              count: stillRequired.length,
            })}
          </ChatBubble>
        )}

        {current && (
          <ChatBubble tone="agent" author={editing ? agentName : undefined}>
            {editing
              ? `${t('landing.discovery.chat.reask')} ${promptText(
                  current,
                  data,
                  t
                )}`
              : promptText(current, data, t)}
          </ChatBubble>
        )}

        {errorKey && <ChatBubble tone="alert">{t(errorKey)}</ChatBubble>}
      </ConversationLog>

      {current && (
        <Composer
          key={current.id}
          question={current}
          data={data}
          update={update}
          draft={draft}
          setDraft={setDraft}
          onSubmit={submit}
          composerRef={composerRef}
          t={t}
        />
      )}

      {/* The escape, live at every point of the conversation. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--fs-rule)] pt-3">
        <Button variant="ghost" size="sm" onClick={skipRest}>
          {t('landing.discovery.chat.skipRest')}
        </Button>
        <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
          {t(
            essentialsOnly
              ? 'landing.discovery.chat.skipRestActive'
              : 'landing.discovery.chat.skipRestHint'
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * The answering surface for one question. Chips for a choice, chips plus their
 * own words for a multi, a box for prose, and the existing cards for the two
 * commercial decisions.
 */
function Composer({
  question,
  data,
  update,
  draft,
  setDraft,
  onSubmit,
  composerRef,
  t,
}: {
  question: IntakeQuestion;
  data: DiscoveryData;
  update: <K extends keyof DiscoveryData>(
    key: K,
    value: DiscoveryData[K]
  ) => void;
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (raw: string) => void;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  t: (key: string) => string;
}) {
  const skipChip = !question.required && (
    <button
      type="button"
      onClick={() => onSubmit('')}
      className={`${chipClass} border-dashed text-[var(--fs-ink-faint)]`}
    >
      {t('landing.discovery.chat.skip')}
    </button>
  );

  if (question.kind === 'panel') {
    // `canProceed` is still the gate — the conversation renders the decision,
    // it does not get to decide it has been made.
    const ready = canProceed(question.step as Step, data);
    return (
      <div className="space-y-4 rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-3.5">
        {question.id === 'selectedTier' ? (
          <RecommendationStep data={data} update={update} t={t} />
        ) : (
          <SubscriptionStep data={data} update={update} t={t} />
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSubmit(question.value(data) || 'confirmed')}
          disabled={!ready}
          aria-disabled={!ready}
        >
          {t('landing.discovery.chat.confirm')}
        </Button>
      </div>
    );
  }

  if (question.kind === 'multi') {
    return (
      <div className="space-y-2.5">
        <ChipsInput
          value={draft}
          presets={(question.options ?? []).map((option) => option.value)}
          onChange={setDraft}
          placeholder={
            question.placeholderKey ? t(question.placeholderKey) : undefined
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onSubmit(draft)}>
            {t('landing.discovery.chat.done')}
          </Button>
          {skipChip}
        </div>
      </div>
    );
  }

  if (question.kind === 'choice') {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2">
          {(question.options ?? []).map((option: IntakeOption) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSubmit(option.value)}
              className={chipClass}
            >
              {optionLabel(option, t)}
            </button>
          ))}
          {skipChip}
        </div>
        {question.freeText && (
          <TypedAnswer
            question={question}
            draft={draft}
            setDraft={setDraft}
            onSubmit={onSubmit}
            composerRef={composerRef}
            rows={1}
            t={t}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <TypedAnswer
        question={question}
        draft={draft}
        setDraft={setDraft}
        onSubmit={onSubmit}
        composerRef={composerRef}
        rows={question.kind === 'longtext' ? 3 : 1}
        t={t}
      />
      {!question.required && <div className="flex gap-2">{skipChip}</div>}
    </div>
  );
}

function TypedAnswer({
  question,
  draft,
  setDraft,
  onSubmit,
  composerRef,
  rows,
  t,
}: {
  question: IntakeQuestion;
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (raw: string) => void;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  rows: number;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <textarea
        ref={composerRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends, Shift+Enter breaks the line — the convention every
          // chat the visitor already uses follows.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit(draft);
          }
        }}
        rows={rows}
        aria-label={t('landing.discovery.chat.composerLabel')}
        placeholder={
          question.placeholderKey
            ? t(question.placeholderKey)
            : t('landing.discovery.chat.composerPlaceholder')
        }
        className={composerClass}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={() => onSubmit(draft)}
        disabled={question.required && draft.trim().length === 0}
      >
        {t('landing.discovery.chat.send')}
      </Button>
    </div>
  );
}
