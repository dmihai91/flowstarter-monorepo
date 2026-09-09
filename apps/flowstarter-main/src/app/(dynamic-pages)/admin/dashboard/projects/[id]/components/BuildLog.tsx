'use client';

/**
 * The full build log, as a console: every line the agents and the machine
 * wrote, not just the conversation's curated highlights.
 *
 * It auto-follows the newest line while the build is live, the way a
 * terminal tails a file, until the operator scrolls up to read something —
 * at which point it stops shoving new lines into view and waits for them to
 * scroll back down themselves. A finished build's log is not tailed at all;
 * there is nothing left to follow, so it opens wherever the scrollbar starts.
 */
import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import {
  buildJobLogDownloadUrl,
  useBuildJobLog,
  type BuildLogLine,
  type BuildLogSource,
} from '@/hooks/usePipeline';

const LIVE_STATUSES = new Set(['queued', 'running']);

/**
 * The route flattens in a build's other event kinds (phase, note, reply)
 * alongside the streamed agent/tool/machine output, each tagged by its own
 * kind — so a line's source is not always one of the three the filter chips
 * name. Anything else still gets a badge, just a neutral one.
 */
function sourceTone(source: string): string {
  switch (source) {
    case 'agent':
      return 'border-purple-400/40 bg-purple-400/15 text-purple-300';
    case 'tool':
      return 'border-sky-400/40 bg-sky-400/15 text-sky-300';
    case 'machine':
      return 'border-amber-400/40 bg-amber-400/15 text-amber-300';
    default:
      return 'border-white/15 bg-white/5 text-white/50';
  }
}

type SourceFilter = 'all' | BuildLogSource;

const FILTERS: ReadonlyArray<{ id: SourceFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'agent', label: 'Agents' },
  { id: 'tool', label: 'Tools' },
  { id: 'machine', label: 'Machine' },
];

function timestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

function LogLine({ line }: { line: BuildLogLine }) {
  return (
    <div className="flex items-start gap-2 px-2 py-0.5">
      <span className="shrink-0 tabular-nums text-white/35">
        {timestamp(line.at)}
      </span>
      <span
        className={`mt-[1px] shrink-0 rounded border px-1 text-[9px] font-semibold uppercase tracking-wide leading-[14px] ${sourceTone(
          line.source
        )}`}
      >
        {line.source}
      </span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-white/85">
        {line.text}
      </span>
    </div>
  );
}

export function BuildLog({
  projectId,
  jobId,
  status,
  className = '',
}: {
  projectId: string;
  jobId: string;
  status: string;
  className?: string;
}) {
  const live = LIVE_STATUSES.has(status);
  const { data, isLoading, error } = useBuildJobLog(projectId, jobId, {
    live,
  });
  const [filter, setFilter] = useState<SourceFilter>('all');
  // Starts true so a freshly opened live build lands on its newest line;
  // a manual scroll away from the bottom clears it until scrolled back.
  const [pinnedToBottom, setPinnedToBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lines = data?.lines ?? [];
  const visible =
    filter === 'all' ? lines : lines.filter((line) => line.source === filter);

  useEffect(() => {
    if (!live) return;
    const el = scrollRef.current;
    if (el && pinnedToBottom) el.scrollTop = el.scrollHeight;
  }, [visible.length, pinnedToBottom, live]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPinnedToBottom(distanceFromBottom < 24);
  };

  return (
    <div
      data-testid="build-log"
      className={`flex min-h-0 flex-col ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                filter === f.id
                  ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/15 text-[var(--purple-primary)]'
                  : 'border-[var(--fs-rule)] text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink-dim)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--fs-ink-faint)]">
          <span>
            {visible.length} line{visible.length === 1 ? '' : 's'}
          </span>
          {data && (
            <a
              href={buildJobLogDownloadUrl(projectId, jobId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--purple-primary)] hover:underline"
            >
              <Download className="h-3 w-3" aria-hidden />
              Download .txt
            </a>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-500">
          {error instanceof Error
            ? error.message
            : 'Could not load the build log.'}
        </p>
      ) : isLoading ? (
        <div className="h-40 flex-1 animate-pulse rounded-lg bg-[var(--fs-glass-bg)]" />
      ) : !data || lines.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-[var(--fs-rule)] bg-black/90 p-6">
          <p className="text-xs text-white/40">
            No log captured for this build yet.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--fs-rule)] bg-black/90 py-1.5 font-mono text-[11px] leading-relaxed"
        >
          {visible.length === 0 ? (
            <p className="px-2 py-2 text-white/40">
              No lines from this source.
            </p>
          ) : (
            visible.map((line, i) => (
              // Lines are append-only and not individually addressable by the
              // API, so position within the (already filtered) list is the
              // only stable key available.
              <LogLine key={`${line.at}-${i}`} line={line} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
