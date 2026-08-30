'use client';

/**
 * The concierge conversation, for whoever is looking at it.
 *
 * One component serves both sides. The client dashboard renders it with
 * `viewerSide="client"`; the operator console will render the same thread with
 * `viewerSide="operator"` (and, for a read-only audit view, `readOnly`). It
 * therefore takes no client-only styling and makes no assumption about who is
 * signed in beyond which side of the conversation to align.
 *
 * The one rule it enforces about itself: a reply never carries a direction.
 * `POST /api/projects/[workspaceId]/messages` decides inbound vs outbound from
 * the caller's role, which is the only way a client cannot forge a message
 * that looks like it came from us.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type ProjectMessageDirection = 'outbound' | 'inbound';
export type ProjectMessageKind =
  | 'asset_request'
  | 'clarification'
  | 'reminder'
  | 'client_reply';
export type ProjectMessageStatus = 'sent' | 'answered' | 'expired';

/**
 * One item a message asks for.
 *
 * `lib/flowstarter/sufficiency.ts` produces `{code, severity, message,
 * affects}`, so `message` is what a client should read. The other keys are
 * kept because the classifier owns this shape and has changed it once already;
 * `askLabel` reads whichever is populated rather than depending on one key.
 */
export interface ProjectAsk {
  id?: string;
  code?: string;
  message?: string;
  label?: string;
  title?: string;
  name?: string;
  description?: string;
  kind?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface ProjectMessage {
  id: string;
  workspace_id: string;
  direction: ProjectMessageDirection;
  kind: ProjectMessageKind;
  body: string | null;
  asks: ProjectAsk[];
  status: ProjectMessageStatus;
  sent_at: string | null;
  answered_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectThreadProps {
  /** The workspace whose thread this is. Drives both API calls. */
  workspaceId: string;
  /**
   * Server-rendered thread, newest last. When supplied the component does not
   * fetch on mount, so the first paint has no empty flash.
   */
  initialMessages?: ProjectMessage[];
  /** Hides the reply box. The API is still the only writer of direction. */
  readOnly?: boolean;
  /** Which side of the conversation the viewer is on. Affects alignment only. */
  viewerSide?: 'client' | 'operator';
  className?: string;
  /** Placeholder for the reply box, so each surface can word it its own way. */
  replyPlaceholder?: string;
  /** Shown when the thread is empty. */
  emptyLabel?: string;
  /** Fired after the server accepts a reply, for parent-side refreshes. */
  onMessagePosted?: (message: ProjectMessage | null) => void;
}

/** Best-effort human label for one ask. */
export function askLabel(ask: ProjectAsk): string {
  const candidate =
    ask.message ??
    ask.label ??
    ask.title ??
    ask.name ??
    ask.description ??
    ask.kind;
  if (typeof candidate === 'string' && candidate.trim())
    return candidate.trim();
  return 'Something we asked for';
}

/**
 * One message, in one casing.
 *
 * Two sources feed this component and they disagree: a server component hands
 * it raw `project_messages` rows (snake_case), while
 * `GET /api/projects/[workspaceId]/messages` serialises the messaging
 * library's camelCase view. Normalising on the way in means the render path
 * and the sort have exactly one set of field names to know about.
 */
export function normalizeMessage(input: unknown): ProjectMessage | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const id = row.id;
  if (typeof id !== 'string' || !id) return null;

  const pick = (snake: string, camel: string): string | null => {
    const value = row[snake] ?? row[camel];
    return typeof value === 'string' && value ? value : null;
  };

  return {
    id,
    workspace_id: pick('workspace_id', 'workspaceId') ?? '',
    direction: row.direction === 'inbound' ? 'inbound' : 'outbound',
    kind: (row.kind as ProjectMessageKind) ?? 'clarification',
    body: typeof row.body === 'string' ? row.body : null,
    asks: Array.isArray(row.asks) ? (row.asks as ProjectAsk[]) : [],
    status: (row.status as ProjectMessageStatus) ?? 'sent',
    sent_at: pick('sent_at', 'sentAt'),
    answered_at: pick('answered_at', 'answeredAt'),
    created_by: pick('created_by', 'createdBy'),
    created_at: pick('created_at', 'createdAt') ?? '',
  };
}

/**
 * Accepts every reasonable envelope the messaging API might use — a bare
 * array, `{messages}` or `{data}` — so a shape change on the other side
 * degrades to an empty thread rather than a crash.
 */
export function messagesFromPayload(payload: unknown): ProjectMessage[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { messages?: unknown })?.messages)
    ? (payload as { messages: unknown[] }).messages
    : Array.isArray((payload as { data?: unknown })?.data)
    ? (payload as { data: unknown[] }).data
    : [];
  return list
    .map(normalizeMessage)
    .filter((message): message is ProjectMessage => message !== null);
}

function messageFromPayload(payload: unknown): ProjectMessage | null {
  if (payload && typeof payload === 'object') {
    const wrapped = (payload as { message?: unknown }).message;
    if (wrapped && typeof wrapped === 'object' && 'id' in wrapped) {
      return wrapped as ProjectMessage;
    }
    if ('id' in (payload as Record<string, unknown>)) {
      return payload as ProjectMessage;
    }
  }
  return null;
}

function formatWhen(message: ProjectMessage): string {
  const iso = message.sent_at ?? message.created_at;
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Who a message came from, in words, from the viewer's point of view. */
export function senderLabel(
  direction: ProjectMessageDirection,
  viewerSide: 'client' | 'operator'
): string {
  if (viewerSide === 'client') {
    return direction === 'outbound' ? 'Flowstarter' : 'You';
  }
  return direction === 'outbound' ? 'You' : 'Client';
}

export function ProjectThread({
  workspaceId,
  initialMessages,
  readOnly = false,
  viewerSide = 'client',
  className,
  replyPlaceholder = 'Write your reply…',
  emptyLabel = 'No messages yet. Anything we need from you will show up here.',
  onMessagePosted,
}: ProjectThreadProps) {
  const [messages, setMessages] = useState<ProjectMessage[]>(() =>
    messagesFromPayload(initialMessages ?? [])
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(Boolean(initialMessages));
  const endpoint = `/api/projects/${workspaceId}/messages`;
  // Kept in a ref so the reply handler does not re-create on every keystroke.
  const postedCallback = useRef(onMessagePosted);
  postedCallback.current = onMessagePosted;

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) {
        // The thread endpoint may not be deployed yet on every environment.
        // An empty, quiet thread beats an error the client cannot act on.
        setLoaded(true);
        return;
      }
      const payload: unknown = await response.json().catch(() => null);
      setMessages(messagesFromPayload(payload));
    } catch {
      /* Offline or unreachable: leave whatever we already have. */
    } finally {
      setLoaded(true);
    }
  }, [endpoint]);

  useEffect(() => {
    if (initialMessages) return;
    void load();
  }, [initialMessages, load]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Body only. Direction is the server's to decide.
        body: JSON.stringify({ body }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          payload.error ??
            (response.status === 404
              ? 'Messaging is not available on this project yet.'
              : 'Your reply could not be sent. Please try again.')
        );
        return;
      }
      const payload: unknown = await response.json().catch(() => null);
      const posted = messageFromPayload(payload);
      if (posted) {
        setMessages((current) => [...current, posted]);
      } else {
        await load();
      }
      setDraft('');
      postedCallback.current?.(posted);
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  }, [draft, endpoint, load, sending]);

  const ordered = useMemo(
    () =>
      [...messages].sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '')
      ),
    [messages]
  );

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-slot="project-thread"
    >
      <ol className="flex flex-col gap-3" aria-label="Project messages">
        {ordered.length === 0 ? (
          <li className="rounded-xl border border-[var(--fs-ink)]/10 bg-white/50 px-4 py-6 text-sm text-[var(--fs-ink)]/60">
            {loaded ? emptyLabel : 'Loading messages…'}
          </li>
        ) : (
          ordered.map((message) => {
            const own =
              viewerSide === 'client'
                ? message.direction === 'inbound'
                : message.direction === 'outbound';
            return (
              <li
                key={message.id}
                data-testid="project-message"
                data-direction={message.direction}
                data-own={own ? 'true' : 'false'}
                className={cn(
                  'flex flex-col gap-1',
                  own ? 'items-end text-right' : 'items-start text-left'
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--fs-ink)]/50">
                  {senderLabel(message.direction, viewerSide)}
                  {formatWhen(message) ? ` · ${formatWhen(message)}` : ''}
                </span>
                <div
                  className={cn(
                    'max-w-[42rem] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    own
                      ? 'bg-[var(--fs-ink)] text-white'
                      : 'border border-[var(--fs-ink)]/10 bg-white/70 text-[var(--fs-ink)]'
                  )}
                >
                  {message.body ? (
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  ) : null}
                  {Array.isArray(message.asks) && message.asks.length > 0 ? (
                    <ul
                      className="mt-2 flex list-disc flex-col gap-1 pl-5 text-left"
                      aria-label="Requested items"
                    >
                      {message.asks.map((ask, index) => (
                        <li key={ask.id ?? `${message.id}-ask-${index}`}>
                          {askLabel(ask)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ol>

      {readOnly ? null : (
        <div className="flex flex-col gap-2">
          <label htmlFor={`reply-${workspaceId}`} className="sr-only">
            Write a reply
          </label>
          <textarea
            id={`reply-${workspaceId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={replyPlaceholder}
            rows={3}
            className="w-full rounded-xl border border-[var(--fs-ink)]/15 bg-white/70 px-4 py-3 text-sm text-[var(--fs-ink)] outline-none focus:border-[var(--fs-ink)]/40"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="inline-flex w-fit items-center rounded-full bg-[var(--fs-ink)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send reply'}
            </button>
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectThread;
