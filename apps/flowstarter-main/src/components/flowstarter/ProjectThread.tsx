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
import {
  askLabel,
  formatWhen,
  messageFromPayload,
  messagesFromPayload,
  normalizeMessage,
  senderLabel,
  type ProjectAsk,
  type ProjectMessage,
} from './project-messages';

// Server pages import the pure shapes from './project-messages'; these
// re-exports keep every existing client-side import site working unchanged.
export * from './project-messages';

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
          <li className="rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 px-4 py-6 text-sm text-[var(--fs-ink-faint)]">
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
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--fs-ink-faint)]">
                  {senderLabel(message.direction, viewerSide)}
                  {formatWhen(message) ? ` · ${formatWhen(message)}` : ''}
                </span>
                <div
                  className={cn(
                    'max-w-[42rem] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    own
                      ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-md shadow-[var(--purple-primary-lightest)]'
                      : 'border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/70 text-[var(--fs-ink)] backdrop-blur-sm'
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
            className="w-full rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-4 py-3 text-sm text-[var(--fs-ink)] outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-[var(--fs-ink-faint)] hover:border-[var(--purple-primary)]/30 focus:border-[var(--purple-primary)]/40 focus:shadow-[0_0_0_4px_var(--purple-primary-lightest)]"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="inline-flex w-fit items-center rounded-lg bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--purple-primary-lightest)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,var(--landing-btn-hover-from),var(--landing-btn-hover-via))] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
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
