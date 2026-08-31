'use client';

/**
 * Pipeline tab — what happened to this project, and what an operator can do
 * about it.
 *
 * Three panels, in the order a stuck project gets diagnosed: where it is now
 * and where it may go; the job ledger, because the usual failure is a build
 * sitting `queued` that nothing ever picked up; and the append-only event
 * timeline underneath as the record of every intervention.
 *
 * The dropdown only offers the transitions the server allows, but the server
 * is the guard — this component reads `allowedTransitions` from the same map
 * the API enforces so the two cannot disagree, and a rejected move surfaces
 * the server's own message rather than a generic failure.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRightCircle,
  Ban,
  History,
  RefreshCw,
} from 'lucide-react';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { compactRelative } from '@/lib/format-utils';
import {
  useCancelPipelineJob,
  useOverrideProjectState,
  usePipelineDetail,
  useRedispatchBuild,
  type PipelineJobDetail,
} from '@/hooks/usePipeline';
import type { Project } from './form-helpers';

const STATE_LABEL: Record<ProjectState, string> = {
  [ProjectState.INTAKE]: 'Intake',
  [ProjectState.PREVIEW_READY]: 'Preview ready',
  [ProjectState.DEPOSIT_PAID]: 'Deposit paid',
  [ProjectState.AGENTS_WORKING]: 'Agents working',
  [ProjectState.HUMAN_QA]: 'Human QA',
  [ProjectState.LIVE_SUBSCRIPTION]: 'Live subscription',
};

const JOB_TONE: Record<string, string> = {
  queued: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  running: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  succeeded: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  canceled: 'bg-[var(--fs-glass-bg)] text-[var(--fs-ink-faint)]',
};

function humanDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function JobRow({
  job,
  projectId,
}: {
  job: PipelineJobDetail;
  projectId: string;
}) {
  const redispatch = useRedispatchBuild(projectId);
  const cancel = useCancelPipelineJob(projectId);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const busy = redispatch.isPending || cancel.isPending;

  const onRedispatch = async () => {
    try {
      const result = await redispatch.mutateAsync({ jobId: job.id });
      toast[result.dispatched ? 'success' : 'warning'](
        result.dispatched
          ? 'Build re-queued and handed to the worker'
          : `Build re-queued, but the worker could not be reached: ${
              result.dispatchError ?? 'unknown error'
            }`
      );
    } catch (e) {
      toast.error(errorMessage(e, 'Re-dispatch failed'));
    }
  };

  const onCancel = async () => {
    try {
      await cancel.mutateAsync({ jobId: job.id, reason: reason.trim() });
      toast.success('Job cancelled');
      setCancelling(false);
      setReason('');
    } catch (e) {
      toast.error(errorMessage(e, 'Cancel failed'));
    }
  };

  return (
    <li className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[var(--fs-ink)]">
            {job.kind}
          </span>
          <span
            className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              JOB_TONE[job.status] ??
              'bg-[var(--fs-glass-bg)] text-[var(--fs-ink-faint)]'
            }`}
          >
            {job.status}
          </span>
          <p className="mt-1 text-xs text-[var(--fs-ink-faint)]">
            attempt {job.attemptCount}/{job.maxAttempts} ·{' '}
            {humanDuration(job.ageMs)} since last change · created{' '}
            {compactRelative(job.createdAt)}
          </p>
          {job.errorCode && (
            <p className="mt-1 text-xs text-red-500">
              {job.errorCode}
              {job.errorDetail ? `: ${job.errorDetail}` : ''}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {job.canRedispatch && (
            <Button
              size="xs"
              variant="outline"
              onClick={onRedispatch}
              disabled={busy}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  redispatch.isPending ? 'animate-spin' : ''
                }`}
              />
              Re-dispatch
            </Button>
          )}
          {job.canCancel && !cancelling && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setCancelling(true)}
              disabled={busy}
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {cancelling && (
        <div className="mt-3 space-y-2 border-t border-[var(--fs-rule)] pt-3">
          <Label htmlFor={`cancel-reason-${job.id}`}>
            Why is this job being cancelled?
          </Label>
          <Textarea
            id={`cancel-reason-${job.id}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Worker died mid-build; restarting from a clean queue."
          />
          <div className="flex justify-end gap-2">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setCancelling(false);
                setReason('');
              }}
            >
              Never mind
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={onCancel}
              disabled={reason.trim().length < 3 || cancel.isPending}
            >
              {cancel.isPending ? 'Cancelling…' : 'Cancel job'}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function PipelineTab({ project }: { project: Project }) {
  const { data, isLoading, error, refetch, isFetching } = usePipelineDetail(
    project.id
  );
  const override = useOverrideProjectState(project.id);
  const [nextState, setNextState] = useState<string>('');
  const [reason, setReason] = useState('');

  const onOverride = async () => {
    try {
      const result = await override.mutateAsync({
        toState: nextState as ProjectState,
        reason: reason.trim(),
      });
      toast.success(
        `Moved to ${
          STATE_LABEL[result.project.projectState] ??
          result.project.projectState
        }`
      );
      setNextState('');
      setReason('');
    } catch (e) {
      // The server's message names the illegal move and lists what is allowed;
      // a generic "failed" would throw that away.
      toast.error(errorMessage(e, 'State change failed'));
    }
  };

  if (error) {
    return (
      <ShellCard>
        <p className="text-sm text-red-500">
          {errorMessage(error, 'Could not load the pipeline for this project.')}
        </p>
      </ShellCard>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)]"
          />
        ))}
      </div>
    );
  }

  const { project: card, allowedTransitions, jobs, events } = data;

  return (
    <div className="space-y-5">
      <ShellCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Current state
            </p>
            <p className="text-lg font-semibold text-[var(--fs-ink)]">
              {STATE_LABEL[card.projectState] ?? card.projectState}
            </p>
            <p className="mt-1 text-xs text-[var(--fs-ink-faint)]">
              Here for {humanDuration(card.timeInStateMs)} · deposit{' '}
              {card.depositStatus}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {card.stallReasons.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Needs attention
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {card.stallReasons.map((r) => (
                <li
                  key={r}
                  className="text-xs text-amber-600 dark:text-amber-400"
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-[var(--fs-rule)] pt-4">
          <div>
            <Label>Move to</Label>
            <p className="mb-2 text-xs text-[var(--fs-ink-faint)]">
              Only neighbouring states are offered, and the server enforces the
              same rule. Two steps take two moves, each with its own reason.
            </p>
            <Select value={nextState} onValueChange={setNextState}>
              <SelectTrigger
                className="mt-1"
                disabled={allowedTransitions.length === 0}
              >
                <SelectValue placeholder="Choose a state…" />
              </SelectTrigger>
              <SelectContent>
                {allowedTransitions.map((state) => (
                  <SelectItem key={state} value={state}>
                    {STATE_LABEL[state] ?? state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state-override-reason">Reason</Label>
            <Textarea
              id="state-override-reason"
              rows={2}
              className="mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Stripe webhook never arrived; deposit confirmed manually in the dashboard."
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={onOverride}
              disabled={
                !nextState || reason.trim().length < 3 || override.isPending
              }
            >
              <ArrowRightCircle className="h-4 w-4" />
              {override.isPending ? 'Moving…' : 'Move project'}
            </Button>
          </div>
        </div>
      </ShellCard>

      <ShellCard>
        <h3 className="mb-3 text-sm font-semibold text-[var(--fs-ink-dim)]">
          Jobs
        </h3>
        {jobs.length === 0 ? (
          <p className="text-xs text-[var(--fs-ink-faint)]">
            No jobs yet. A full-site build is enqueued when a deposit is
            recorded.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} projectId={project.id} />
            ))}
          </ul>
        )}
      </ShellCard>

      <ShellCard>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--fs-ink-dim)]">
          <History className="h-4 w-4" aria-hidden />
          Timeline
        </h3>
        {events.length === 0 ? (
          <p className="text-xs text-[var(--fs-ink-faint)]">
            Nothing recorded for this project yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--fs-ink)]">
                    {event.kind}
                  </span>
                  <span className="text-[11px] text-[var(--fs-ink-faint)]">
                    {event.actor} · {compactRelative(event.createdAt)}
                  </span>
                </div>
                {event.payload != null &&
                  typeof event.payload === 'object' &&
                  Object.keys(event.payload).length > 0 && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-[var(--fs-ink-faint)]">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
              </li>
            ))}
          </ol>
        )}
      </ShellCard>
    </div>
  );
}
