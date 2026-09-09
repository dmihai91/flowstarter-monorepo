'use client';

// Live build state hook. Subscribes via Convex when configured (instant,
// reactive); otherwise polls the status endpoint. Shape is identical either way.
import React from 'react';
import { useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { BuildEvent, BuildFeedEvent, BuildStatus } from '@flowstarter/build-engine';

export interface LiveBuild {
  status: BuildStatus | 'loading';
  progress: number;
  feed: BuildFeedEvent[];
  error: string | null;
  previewUrl: string | null;
  startedAt: number | null;
}

const HAS_CONVEX = !!process.env.NEXT_PUBLIC_CONVEX_URL;
const buildGet = makeFunctionReference<'query'>('builds:get');
const buildEvents = makeFunctionReference<'query'>('builds:events');

function onlyFeed(events: BuildEvent[]): BuildFeedEvent[] {
  return events.filter((e): e is BuildFeedEvent => e.type === 'feed');
}

function usePolledBuild(buildId: string): LiveBuild {
  const [state, setState] = React.useState<LiveBuild>({
    status: 'loading',
    progress: 0,
    feed: [],
    error: null,
    previewUrl: null,
    startedAt: null,
  });
  React.useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/builds/${buildId}`, { cache: 'no-store' });
        if (res.ok) {
          const b = (await res.json()) as {
            status: BuildStatus;
            progress: number;
            feed: BuildEvent[];
            error: string | null;
            previewUrl: string | null;
            startedAt: number | null;
          };
          if (!stop) {
            setState({
              status: b.status,
              progress: b.progress,
              feed: onlyFeed(b.feed),
              error: b.error,
              previewUrl: b.previewUrl,
              startedAt: b.startedAt,
            });
            if (b.status === 'completed' || b.status === 'terminal_failed') return;
          }
        }
      } catch {}
      if (!stop) timer = setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [buildId]);
  return state;
}

function useConvexBuild(buildId: string): LiveBuild {
  const meta = useQuery(buildGet, { buildId }) as
    | { status: BuildStatus; progress: number; error?: string }
    | null
    | undefined;
  const events = useQuery(buildEvents, { buildId }) as BuildEvent[] | undefined;
  const completed = events?.find((e) => e.type === 'completed');
  return {
    status: meta?.status ?? 'loading',
    progress: meta?.progress ?? 0,
    feed: onlyFeed(events ?? []),
    error: meta?.error ?? null,
    previewUrl: completed && completed.type === 'completed' ? completed.outputs.previewUrl : null,
    startedAt: null,
  };
}

// Branch is stable for the lifetime of the bundle (env is baked at build time),
// so conditional hook selection is safe here.
export const useBuildLive: (buildId: string) => LiveBuild = HAS_CONVEX ? useConvexBuild : usePolledBuild;
