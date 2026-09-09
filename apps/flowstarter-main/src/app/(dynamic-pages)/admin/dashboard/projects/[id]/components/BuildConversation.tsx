'use client';

/**
 * The build conversation: what the worker is doing, what the agents said
 * when they finished a pass, and what the team told them.
 *
 * It reads like a chat because that is what it is, with one honest
 * difference spelled out under the composer: a note cannot interrupt a
 * running agent session, so it is folded into the next pass. The server
 * decides whether a note can still land (`acceptsNotes`); the composer only
 * mirrors that so a refused send shows the server's own reason.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { compactRelative } from '@/lib/format-utils';
import {
  useBuildJobFeed,
  useSendBuildNote,
  type BuildJobEvent,
} from '@/hooks/usePipeline';

const LIVE_STATUSES = new Set(['queued', 'running']);

const DELIVERY_COPY = {
  build_start: 'Saved. The agents read it when the build starts.',
  next_pass: 'Saved. The agents pick it up at the end of their current pass.',
  next_attempt: 'Saved. The agents read it on the next attempt.',
} as const;

function EventLine({ event }: { event: BuildJobEvent }) {
  if (event.kind === 'phase') {
    return (
      <li className="flex items-center gap-2 py-0.5 text-[11px] text-[var(--fs-ink-faint)]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-primary)]/60" />
        <span className="min-w-0 flex-1 truncate">{event.body}</span>
        <span className="shrink-0 tabular-nums">
          {compactRelative(event.createdAt)}
        </span>
      </li>
    );
  }
  if (event.kind === 'note') {
    return (
      <li className="flex justify-end py-1">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[var(--purple-primary)] px-3 py-2 text-[13px] leading-snug text-white">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Team · {compactRelative(event.createdAt)}
          </p>
          <p className="whitespace-pre-wrap break-words">{event.body}</p>
        </div>
      </li>
    );
  }
  if (event.kind === 'log') {
    return (
      <li className="py-1">
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-snug text-[var(--fs-ink-dim)]">
          {event.body}
        </pre>
      </li>
    );
  }
  return (
    <li className="py-1">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-3 py-2 text-[13px] leading-snug text-[var(--fs-ink)]">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fs-ink-faint)]">
          Build agents · {compactRelative(event.createdAt)}
        </p>
        <p className="whitespace-pre-wrap break-words">{event.body}</p>
      </div>
    </li>
  );
}

export function BuildConversation({
  projectId,
  jobId,
  status,
}: {
  projectId: string;
  jobId: string;
  status: string;
}) {
  const live = LIVE_STATUSES.has(status);
  const { data, isLoading, error } = useBuildJobFeed(projectId, jobId, {
    live,
  });
  const send = useSendBuildNote(projectId, jobId);
  const [message, setMessage] = useState('');
  const logRef = useRef<HTMLOListElement>(null);
  const count = data?.events.length ?? 0;

  // Follow the newest line, scrolling only the log so the page stays put.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  const onSend = async () => {
    const text = message.trim();
    if (text.length < 3) return;
    try {
      const result = await send.mutateAsync({ message: text });
      setMessage('');
      toast.success(DELIVERY_COPY[result.delivery]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the note');
    }
  };

  const acceptsNotes = data?.job.acceptsNotes ?? live;

  return (
    <div
      data-testid="build-conversation"
      className="mt-3 space-y-2 border-t border-[var(--fs-rule)] pt-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fs-ink-dim)]">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Build conversation
        </p>
        {data?.job.latestPhase && (
          <p className="min-w-0 truncate text-[11px] text-[var(--fs-ink-faint)]">
            {live && (
              <span className="mr-1.5 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent align-[-1px]" />
            )}
            Now: {data.job.latestPhase}
          </p>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-500">
          {error instanceof Error
            ? error.message
            : 'Could not load the build conversation.'}
        </p>
      ) : isLoading || !data ? (
        <div className="h-16 animate-pulse rounded-lg bg-[var(--fs-glass-bg)]" />
      ) : (
        <ol
          ref={logRef}
          role="log"
          aria-label="Build conversation"
          className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-2"
        >
          {data.events.length === 0 ? (
            <li className="px-1 py-2 text-[11px] text-[var(--fs-ink-faint)]">
              {live
                ? 'Nothing said yet. The worker reports here as soon as it picks the job up.'
                : 'This build ran before the conversation channel existed.'}
            </li>
          ) : (
            data.events.map((event) => (
              <EventLine key={event.id} event={event} />
            ))
          )}
        </ol>
      )}

      <div className="space-y-1.5">
        <Textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void onSend();
            }
          }}
          disabled={!acceptsNotes || send.isPending}
          placeholder={
            acceptsNotes
              ? 'Tell the agents something, e.g. "Use the client’s logo from the assets folder on every page header."'
              : 'This build has finished; notes only reach a build that is still in flight.'
          }
          aria-label="Note to the build agents"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--fs-ink-faint)]">
            Notes land at the agents&apos; next pass: before the build, after
            the first pass is checked, or on the next attempt.
          </p>
          <Button
            size="xs"
            onClick={onSend}
            disabled={
              !acceptsNotes || send.isPending || message.trim().length < 3
            }
          >
            <Send className="h-3.5 w-3.5" />
            {send.isPending ? 'Sending…' : 'Send to the agents'}
          </Button>
        </div>
      </div>
    </div>
  );
}
