'use client';

/**
 * The operator pipeline board.
 *
 * One screen that answers "what is stuck?". Columns are the lifecycle states in
 * order, cards are newest first, and anything the API flagged as stalled is
 * pulled to the top of its column and given a reason in plain language — a
 * queued build nobody picked up, a failed job, a project that has sat in one
 * state too long. The stalled count in the header is the number an operator
 * should be trying to drive to zero.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, GitBranch, RefreshCw } from 'lucide-react';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import { TeamDashboardShell } from '../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { compactRelative } from '@/lib/format-utils';
import {
  usePipelineBoard,
  type PipelineCard as PipelineCardData,
} from '@/hooks/usePipeline';

const STATE_LABEL: Record<ProjectState, string> = {
  [ProjectState.INTAKE]: 'Intake',
  [ProjectState.PREVIEW_READY]: 'Preview ready',
  [ProjectState.DEPOSIT_PAID]: 'Deposit paid',
  [ProjectState.AGENTS_WORKING]: 'Agents working',
  [ProjectState.HUMAN_QA]: 'Human QA',
  [ProjectState.LIVE_SUBSCRIPTION]: 'Live',
};

const JOB_TONE: Record<string, string> = {
  queued: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  running: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  succeeded: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  canceled: 'bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]',
};

const DEPOSIT_TONE: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  refunded: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

/** Mirrors `formatDuration` in the board lib, for values computed client-side. */
function humanDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function money(minor: number, currency: string): string {
  if (!minor) return 'No quote';
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency.toUpperCase()}`;
  }
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function PipelineCard({ card }: { card: PipelineCardData }) {
  return (
    <Link
      href={`/admin/dashboard/projects/${card.workspaceId}`}
      className={`block rounded-xl border p-3 transition-colors hover:border-[var(--ls-accent)] ${
        card.stalled
          ? 'border-amber-500/50 bg-amber-500/[0.06]'
          : 'border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-[var(--ls-ink)]">
          {card.businessName}
        </span>
        {card.stalled && (
          <AlertTriangle
            className="h-3.5 w-3.5 shrink-0 text-amber-500"
            aria-label="Needs attention"
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone="bg-[var(--ls-glass-bg)] text-[var(--ls-ink-dim)]">
          {money(card.quoteMinor, card.currency)}
        </Pill>
        <Pill
          tone={
            DEPOSIT_TONE[card.depositStatus] ??
            'bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]'
          }
        >
          {card.depositStatus === 'paid' ? 'Deposit paid' : 'No deposit'}
        </Pill>
        {card.latestJob && (
          <Pill
            tone={
              JOB_TONE[card.latestJob.status] ??
              'bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]'
            }
          >
            {card.latestJob.kind} · {card.latestJob.status}
          </Pill>
        )}
      </div>

      <p className="mt-2 text-[11px] text-[var(--ls-ink-faint)]">
        In state {humanDuration(card.timeInStateMs)} · created{' '}
        {compactRelative(card.createdAt)}
      </p>

      {card.stallReasons.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-amber-500/20 pt-2">
          {card.stallReasons.map((reason) => (
            <li
              key={reason}
              className="text-[11px] leading-snug text-amber-600 dark:text-amber-400"
            >
              {reason}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default function PipelineBoardPage() {
  const { data, isLoading, error, refetch, isFetching } = usePipelineBoard();
  const [stalledOnly, setStalledOnly] = useState(false);

  const columns = useMemo(() => {
    if (!data) return [];
    return data.columns.map((column) => ({
      ...column,
      // Stalled work first: the whole point of the board is that a problem is
      // visible without scrolling a column.
      cards: column.cards
        .filter((card) => !stalledOnly || card.stalled)
        .slice()
        .sort((a, b) => Number(b.stalled) - Number(a.stalled)),
    }));
  }, [data, stalledOnly]);

  return (
    <TeamDashboardShell
      title="Pipeline"
      subtitle={
        data
          ? `${data.total} project${data.total === 1 ? '' : 's'} · ${
              data.stalledCount
            } need attention`
          : 'Every project in the concierge flow, by state'
      }
      icon={<GitBranch className="h-5 w-5" aria-hidden />}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={stalledOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStalledOnly((v) => !v)}
          >
            <AlertTriangle className="h-4 w-4" />
            {stalledOnly ? 'Showing stalled' : 'Stalled only'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="text-sm text-red-500">
          {error instanceof Error
            ? error.message
            : 'Could not load the pipeline.'}
        </p>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {columns.map((column) => (
            <section
              key={column.state}
              className="rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)]/40 p-3"
            >
              <header className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ls-ink-dim)]">
                  {STATE_LABEL[column.state]}
                </h2>
                <span className="flex items-center gap-1.5">
                  {column.stalledCount > 0 && (
                    <Pill tone="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {column.stalledCount} stalled
                    </Pill>
                  )}
                  <Pill tone="bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]">
                    {column.cards.length}
                  </Pill>
                </span>
              </header>

              {column.cards.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--ls-ink-faint)]">
                  {stalledOnly ? 'Nothing stalled here' : 'Empty'}
                </p>
              ) : (
                <div className="space-y-2">
                  {column.cards.map((card) => (
                    <PipelineCard key={card.workspaceId} card={card} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </TeamDashboardShell>
  );
}
