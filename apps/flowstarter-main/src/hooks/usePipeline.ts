'use client';

/**
 * Client access to the operator pipeline API.
 *
 * Reads point at `/api/admin/*` for the same reason every other operator hook
 * does — that is the tree the `/admin/dashboard` pages are served from. The
 * `/api/team/*` mirror is the same handler, so switching base paths is a
 * one-line change if the pages ever move.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';

export interface PipelineJobSummary {
  id: string;
  kind: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorCode: string | null;
  ageMs: number;
}

export interface PipelineCard {
  workspaceId: string;
  name: string;
  businessName: string;
  clientEmail: string | null;
  projectState: ProjectState;
  quoteMinor: number;
  currency: string;
  depositStatus: string;
  depositPaidAt: string | null;
  stateSince: string;
  timeInStateMs: number;
  latestJob: PipelineJobSummary | null;
  stalled: boolean;
  stallReasons: string[];
  createdAt: string;
}

export interface PipelineBoard {
  columns: Array<{
    state: ProjectState;
    cards: PipelineCard[];
    stalledCount: number;
  }>;
  total: number;
  stalledCount: number;
  generatedAt: string;
}

export interface PipelineJobDetail extends PipelineJobSummary {
  errorDetail: string | null;
  runAfter: string;
  canRedispatch: boolean;
  canCancel: boolean;
}

export interface PipelineEvent {
  id: string;
  kind: string;
  actor: string;
  payload: unknown;
  createdAt: string;
}

export interface PipelineDetail {
  project: PipelineCard;
  allowedTransitions: ProjectState[];
  jobs: PipelineJobDetail[];
  events: PipelineEvent[];
}

export const pipelineBoardQueryKey = ['pipeline-board'] as const;
export const pipelineDetailQueryKey = (id: string | undefined) =>
  ['pipeline-detail', id] as const;

async function readError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(body?.error || fallback);
}

export function usePipelineBoard() {
  return useQuery({
    queryKey: pipelineBoardQueryKey,
    queryFn: async (): Promise<PipelineBoard> => {
      const res = await fetch('/api/admin/projects/pipeline', {
        cache: 'no-store',
      });
      if (!res.ok) await readError(res, 'Failed to load the pipeline');
      return res.json();
    },
    // A stalled job is a time-sensitive fact; a board that is a minute stale is
    // worse than one extra query.
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function usePipelineDetail(id: string | undefined) {
  return useQuery({
    queryKey: pipelineDetailQueryKey(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<PipelineDetail> => {
      const res = await fetch(`/api/admin/projects/${id}/pipeline`, {
        cache: 'no-store',
      });
      if (!res.ok) await readError(res, 'Failed to load the project pipeline');
      return res.json();
    },
    staleTime: 10_000,
    retry: 1,
  });
}

function usePipelineAction<TBody, TResult>(
  id: string | undefined,
  path: string,
  fallbackError: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TBody): Promise<TResult> => {
      if (!id) throw new Error('Missing project id');
      const res = await fetch(`/api/admin/projects/${id}/pipeline/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) await readError(res, fallbackError);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineDetailQueryKey(id) });
      qc.invalidateQueries({ queryKey: pipelineBoardQueryKey });
      // The state override writes `project_state`, which the project detail
      // header and the projects list both render.
      qc.invalidateQueries({ queryKey: ['team-project', id] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
    },
  });
}

export function useRedispatchBuild(id: string | undefined) {
  return usePipelineAction<
    { jobId?: string; reason?: string },
    {
      job: { id: string; status: string };
      dispatched: boolean;
      dispatchError: string | null;
    }
  >(id, 'redispatch', 'Failed to re-dispatch the build');
}

export function useOverrideProjectState(id: string | undefined) {
  return usePipelineAction<
    { toState: ProjectState; reason: string },
    { project: { projectState: ProjectState; previousState: ProjectState } }
  >(id, 'state', 'Failed to change the project state');
}

export function useCancelPipelineJob(id: string | undefined) {
  return usePipelineAction<
    { jobId: string; reason: string },
    { job: { id: string; status: string } }
  >(id, 'cancel-job', 'Failed to cancel the job');
}
