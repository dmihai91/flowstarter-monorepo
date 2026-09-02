import 'server-only';

/**
 * LangGraph HITL intake.
 *
 *   rules decide  → `intake-script.ts` (next question, validate, apply, done)
 *   models phrase → `phraseAsk` / `extractAnswers`
 *   interrupt     → pause for the visitor; resume with Command
 *
 * Checkpoints live in a process-local MemorySaver. That matches the single-
 * instance funnel rate limit; if the process restarts mid-chat the API rebuilds
 * from the client mirror and fails open to the scripted prompt.
 */
import { randomUUID } from 'node:crypto';
import {
  Annotation,
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
  isInterrupted,
} from '@langchain/langgraph';
import {
  type DiscoveryData,
  EMPTY_DISCOVERY,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import {
  type IntakeQuestionId,
  nextQuestion,
  promptText,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/intake-script';
import en from '@/locales/en';
import ro from '@/locales/ro';
import {
  applyResumeTurn,
  localeTag,
  mergeDiscovery,
  progressFor,
  sanitizeAnswered,
  scriptedAsk,
} from './script-bridge';
import { extractAnswers, phraseAsk } from './llm-turns';
import type {
  IntakeGraphAsk,
  IntakeGraphLocale,
  IntakeGraphResume,
  IntakeGraphResumeInput,
  IntakeGraphStartInput,
  IntakeGraphTurnResult,
} from './types';

type Translate = (key: string) => string;

const IntakeState = Annotation.Root({
  data: Annotation<DiscoveryData>,
  answered: Annotation<IntakeQuestionId[]>,
  essentialsOnly: Annotation<boolean>,
  locale: Annotation<IntakeGraphLocale>,
  status: Annotation<'pending' | 'complete'>,
  /** Last ask surfaced to the client (also carried on the interrupt value). */
  lastAsk: Annotation<IntakeGraphAsk | null>,
  errorKey: Annotation<string | null>,
});

type GraphState = typeof IntakeState.State;

export type IntakeGraphDeps = {
  phraseAsk: typeof phraseAsk;
  extractAnswers: typeof extractAnswers;
  translate: (locale: IntakeGraphLocale) => Translate;
};

const EN = en as unknown as Record<string, string>;
const RO = ro as unknown as Record<string, string>;

const defaultTranslate = (locale: IntakeGraphLocale): Translate => {
  return (key) => (locale === 'ro' ? RO[key] : undefined) ?? EN[key] ?? key;
};

const defaultDeps: IntakeGraphDeps = {
  phraseAsk,
  extractAnswers,
  translate: defaultTranslate,
};

let deps: IntakeGraphDeps = defaultDeps;

/** Test seam — swap LLM + locale without mocking the whole module graph. */
export function setIntakeGraphDeps(partial: Partial<IntakeGraphDeps>): void {
  deps = { ...defaultDeps, ...partial };
}

export function resetIntakeGraphDeps(): void {
  deps = defaultDeps;
}

function parseResume(value: unknown): IntakeGraphResume {
  if (!value || typeof value !== 'object') {
    return { kind: 'text', text: String(value ?? '') };
  }
  const record = value as Record<string, unknown>;
  if (record.kind === 'skip') return { kind: 'skip' };
  if (record.kind === 'panel') {
    return { kind: 'panel', value: String(record.value ?? '') };
  }
  if (record.kind === 'text') {
    return { kind: 'text', text: String(record.text ?? '') };
  }
  // Back-compat: bare `{ text }` from early clients.
  if (typeof record.text === 'string') {
    return { kind: 'text', text: record.text };
  }
  return { kind: 'text', text: '' };
}

async function buildAsk(
  state: GraphState,
  questionId: IntakeQuestionId
): Promise<IntakeGraphAsk> {
  const question = nextQuestion(
    state.data,
    state.answered,
    state.essentialsOnly
  );
  // Prefer the id we already decided; fall back to live nextQuestion.
  const pending =
    question && question.id === questionId
      ? question
      : nextQuestion(state.data, state.answered, state.essentialsOnly);
  if (!pending) {
    throw new Error('buildAsk called with no pending question');
  }
  const t = deps.translate(state.locale);
  const scripted = scriptedAsk(pending, state.data, t);
  if (pending.kind === 'panel') return scripted;

  try {
    const prompt = await deps.phraseAsk({
      question: pending,
      scriptedPrompt: scripted.prompt,
      data: state.data,
      answered: state.answered,
      essentialsOnly: state.essentialsOnly,
      locale: state.locale,
      t,
    });
    return { ...scripted, prompt: prompt.trim() || scripted.prompt };
  } catch {
    return scripted;
  }
}

async function turnNode(state: GraphState): Promise<Partial<GraphState>> {
  const pending = nextQuestion(
    state.data,
    state.answered,
    state.essentialsOnly
  );
  if (!pending) {
    return { status: 'complete', lastAsk: null, errorKey: null };
  }

  const ask = await buildAsk(state, pending.id);
  let errorKey: string | null = null;

  // Stay in this node until the pending question validates. Each failed
  // attempt re-interrupts with the same ask plus an errorKey for the UI.
  for (;;) {
    const resumeRaw = interrupt(errorKey ? { ...ask, errorKey } : ask);
    const resume = parseResume(resumeRaw);

    let extracted: Array<{ id: string; value: string }> = [];
    if (
      resume.kind === 'text' &&
      resume.text.trim() &&
      pending.kind !== 'panel'
    ) {
      try {
        extracted = await deps.extractAnswers({
          pendingId: pending.id,
          userText: resume.text,
          data: state.data,
          answered: state.answered,
          essentialsOnly: state.essentialsOnly,
          locale: state.locale,
          t: deps.translate(state.locale),
        });
      } catch {
        extracted = [];
      }
    }

    const applied = applyResumeTurn({
      data: state.data,
      answered: state.answered,
      pendingId: pending.id,
      resume,
      extracted,
    });

    if (applied.errorKey) {
      errorKey = applied.errorKey;
      continue;
    }

    return {
      data: applied.data,
      answered: applied.answered,
      status: 'pending',
      lastAsk: ask,
      errorKey: null,
    };
  }
}

function routeAfterTurn(state: GraphState): typeof END | 'turn' {
  if (state.status === 'complete') return END;
  const pending = nextQuestion(
    state.data,
    state.answered,
    state.essentialsOnly
  );
  return pending ? 'turn' : END;
}

const checkpointer = new MemorySaver();

const compiled = new StateGraph(IntakeState)
  .addNode('turn', turnNode)
  .addEdge(START, 'turn')
  .addConditionalEdges('turn', routeAfterTurn, {
    turn: 'turn',
    [END]: END,
  })
  .compile({ checkpointer });

function toResult(
  threadId: string,
  state: GraphState,
  interruptedAsk: IntakeGraphAsk | null,
  extras: Partial<IntakeGraphTurnResult> = {}
): IntakeGraphTurnResult {
  const ask = interruptedAsk;
  const status: IntakeGraphTurnResult['status'] = ask
    ? ask.type === 'panel'
      ? 'panel'
      : 'ask'
    : 'complete';
  // If the node ended because of validation without a fresh interrupt, keep ask.
  const finalAsk =
    ask ?? (state.errorKey && state.lastAsk ? state.lastAsk : null);
  return {
    threadId,
    status: finalAsk
      ? finalAsk.type === 'panel'
        ? 'panel'
        : 'ask'
      : status === 'complete'
      ? 'complete'
      : 'ask',
    ask: finalAsk,
    data: state.data ?? EMPTY_DISCOVERY,
    answered: sanitizeAnswered(state.answered),
    progress: progressFor(
      state.data ?? EMPTY_DISCOVERY,
      state.answered ?? [],
      Boolean(state.essentialsOnly)
    ),
    errorKey: state.errorKey ?? null,
    ...extras,
  };
}

function interruptFromResult(result: unknown): {
  ask: IntakeGraphAsk | null;
  errorKey: string | null;
} {
  if (!isInterrupted(result)) return { ask: null, errorKey: null };
  const payload = result as { __interrupt__?: Array<{ value?: unknown }> };
  const value = payload.__interrupt__?.[0]?.value;
  if (!value || typeof value !== 'object') return { ask: null, errorKey: null };
  const record = value as IntakeGraphAsk & { errorKey?: string };
  if (!record.questionId || !record.prompt) {
    return { ask: null, errorKey: null };
  }
  const { errorKey: interruptError, ...ask } = record;
  return {
    ask: ask as IntakeGraphAsk,
    errorKey: interruptError ?? null,
  };
}

export async function startIntakeGraph(
  input: IntakeGraphStartInput = {}
): Promise<IntakeGraphTurnResult> {
  const threadId = randomUUID();
  const locale = localeTag(input.locale);
  const data = mergeDiscovery(input.data);
  const answered = sanitizeAnswered(input.answered);
  const essentialsOnly = Boolean(input.essentialsOnly);

  // Cheap path: script already spent — no model, no checkpoint work.
  if (!nextQuestion(data, answered, essentialsOnly)) {
    return {
      threadId,
      status: 'complete',
      ask: null,
      data,
      answered,
      progress: progressFor(data, answered, essentialsOnly),
    };
  }

  try {
    const result = await compiled.invoke(
      {
        data,
        answered,
        essentialsOnly,
        locale,
        status: 'pending',
        lastAsk: null,
        errorKey: null,
      },
      { configurable: { thread_id: threadId } }
    );

    const { ask, errorKey } = interruptFromResult(result);
    const snap = await compiled.getState({
      configurable: { thread_id: threadId },
    });
    const values = {
      data,
      answered,
      essentialsOnly,
      locale,
      status: 'pending' as const,
      lastAsk: ask,
      errorKey,
      ...(snap.values as Partial<GraphState>),
    } as GraphState;

    if (ask) {
      return toResult(threadId, { ...values, lastAsk: ask, errorKey }, ask, {
        errorKey,
        ...(errorKey ? { reason: 'validation' as const } : {}),
      });
    }

    return toResult(threadId, result as GraphState, null);
  } catch (error) {
    console.error(
      '[intake-graph] start failed:',
      error instanceof Error ? error.message : error
    );
    return scriptedFallback({
      threadId,
      data,
      answered,
      essentialsOnly,
      locale,
      reason: 'error',
    });
  }
}

export async function resumeIntakeGraph(
  input: IntakeGraphResumeInput
): Promise<IntakeGraphTurnResult> {
  const threadId = input.threadId?.trim();
  if (!threadId) {
    return scriptedFallback({
      threadId: randomUUID(),
      data: mergeDiscovery(input.data),
      answered: sanitizeAnswered(input.answered),
      essentialsOnly: Boolean(input.essentialsOnly),
      locale: localeTag(input.locale),
      reason: 'error',
    });
  }

  const essentialsOnly = Boolean(input.essentialsOnly);

  try {
    const existing = await compiled.getState({
      configurable: { thread_id: threadId },
    });
    if (!existing.values || Object.keys(existing.values).length === 0) {
      return recoverFromClientMirror(input);
    }

    if (essentialsOnly) {
      await compiled.updateState(
        { configurable: { thread_id: threadId } },
        { essentialsOnly: true }
      );
    }

    const result = await compiled.invoke(
      new Command({ resume: input.resume }),
      {
        configurable: { thread_id: threadId },
      }
    );

    const { ask, errorKey } = interruptFromResult(result);
    const snap = await compiled.getState({
      configurable: { thread_id: threadId },
    });
    const values = (snap.values ?? result) as GraphState;

    if (ask) {
      return toResult(threadId, { ...values, lastAsk: ask, errorKey }, ask, {
        errorKey,
        ...(errorKey ? { reason: 'validation' as const } : {}),
      });
    }

    const finalState = values as GraphState;
    if (
      !nextQuestion(
        finalState.data,
        finalState.answered,
        finalState.essentialsOnly || essentialsOnly
      )
    ) {
      return toResult(
        threadId,
        { ...finalState, status: 'complete', lastAsk: null },
        null
      );
    }

    return toResult(threadId, finalState, finalState.lastAsk ?? null);
  } catch (error) {
    console.error(
      '[intake-graph] resume failed:',
      error instanceof Error ? error.message : error
    );
    return recoverFromClientMirror(input, 'error');
  }
}

async function recoverFromClientMirror(
  input: IntakeGraphResumeInput,
  reason: IntakeGraphTurnResult['reason'] = 'error'
): Promise<IntakeGraphTurnResult> {
  const data = mergeDiscovery(input.data);
  const answered = sanitizeAnswered(input.answered);
  const essentialsOnly = Boolean(input.essentialsOnly);
  const locale = localeTag(input.locale);
  const pending = nextQuestion(data, answered, essentialsOnly);

  if (!pending) {
    return {
      threadId: input.threadId || randomUUID(),
      status: 'complete',
      ask: null,
      data,
      answered,
      progress: progressFor(data, answered, essentialsOnly),
      skipped: true,
      reason,
    };
  }

  // Apply the resume against the pending question without the checkpoint, then
  // open a fresh thread on whatever remains.
  const applied = applyResumeTurn({
    data,
    answered,
    pendingId: pending.id,
    resume: input.resume,
  });

  if (applied.errorKey) {
    const t = deps.translate(locale);
    return {
      threadId: input.threadId || randomUUID(),
      status: pending.kind === 'panel' ? 'panel' : 'ask',
      ask: scriptedAsk(pending, data, t),
      data,
      answered,
      progress: progressFor(data, answered, essentialsOnly),
      errorKey: applied.errorKey,
      reason: 'validation',
      skipped: true,
    };
  }

  return startIntakeGraph({
    data: applied.data,
    answered: applied.answered,
    essentialsOnly,
    locale,
  }).then((result) => ({ ...result, skipped: true, reason }));
}

function scriptedFallback(input: {
  threadId: string;
  data: DiscoveryData;
  answered: IntakeQuestionId[];
  essentialsOnly: boolean;
  locale: IntakeGraphLocale;
  reason: IntakeGraphTurnResult['reason'];
}): IntakeGraphTurnResult {
  const pending = nextQuestion(
    input.data,
    input.answered,
    input.essentialsOnly
  );
  if (!pending) {
    return {
      threadId: input.threadId,
      status: 'complete',
      ask: null,
      data: input.data,
      answered: input.answered,
      progress: progressFor(input.data, input.answered, input.essentialsOnly),
      skipped: true,
      reason: input.reason,
    };
  }
  const t = deps.translate(input.locale);
  return {
    threadId: input.threadId,
    status: pending.kind === 'panel' ? 'panel' : 'ask',
    ask: scriptedAsk(pending, input.data, t),
    data: input.data,
    answered: input.answered,
    progress: progressFor(input.data, input.answered, input.essentialsOnly),
    skipped: true,
    reason: input.reason,
  };
}

/** Exposed for unit tests that want a scripted prompt without invoking LLM. */
export function scriptedPromptFor(
  data: DiscoveryData,
  answered: readonly string[],
  essentialsOnly: boolean,
  locale: IntakeGraphLocale = 'en'
): string | null {
  const pending = nextQuestion(data, answered, essentialsOnly);
  if (!pending) return null;
  return promptText(pending, data, deps.translate(locale));
}
