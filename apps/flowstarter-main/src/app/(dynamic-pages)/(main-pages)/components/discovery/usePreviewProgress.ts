import { useEffect, useState } from 'react';

/**
 * Live progress for a /api/discovery/preview/live build, as seen by the
 * visitor's browser. SSE (/api/discovery/preview/live/stream) is the primary
 * transport: the build takes 3-6 minutes and the point of this hook is that
 * each phase should appear the moment the pipeline enters it, not whenever a
 * poll happens to land.
 *
 * EventSource can be dropped by a proxy or missing in an environment (older
 * browsers, some serverless edges, and this test suite's jsdom, which has no
 * EventSource at all). If it errs, or is unavailable to begin with, this
 * falls back — once — to polling the plain status endpoint
 * (GET /api/discovery/preview/live?demoId=…), and never runs both transports
 * at the same time.
 */

export type PreviewProgressStatus = 'idle' | 'building' | 'ready' | 'failed';

export interface PreviewPhaseEntry {
  phase: string;
  /** Seconds since the generation started. */
  at: number;
  index: number;
}

export interface PreviewProgressSnapshot {
  status: PreviewProgressStatus;
  phase: string | null;
  /** Every phase seen so far, in order — the running log the UI renders. */
  phases: PreviewPhaseEntry[];
  previewUrl?: string;
  personalized: boolean;
  error?: string;
  /** True once SSE has been abandoned for the polling fallback. */
  usingFallback: boolean;
}

const IDLE_SNAPSHOT: PreviewProgressSnapshot = {
  status: 'idle',
  phase: null,
  phases: [],
  personalized: false,
  usingFallback: false,
};

const FALLBACK_POLL_MS = 3500;
/** Matches the previous poll loop's own cap; the SSE route has its own
 * (longer) server-side timeout, so this only bounds the fallback path. */
const FALLBACK_MAX_MS = 18 * 60_000;

function streamUrl(demoId: string): string {
  return `/api/discovery/preview/live/stream?demoId=${encodeURIComponent(
    demoId
  )}`;
}

function statusUrl(demoId: string): string {
  return `/api/discovery/preview/live?demoId=${encodeURIComponent(demoId)}`;
}

export function usePreviewProgress(
  demoId: string | null
): PreviewProgressSnapshot {
  const [snapshot, setSnapshot] =
    useState<PreviewProgressSnapshot>(IDLE_SNAPSHOT);

  useEffect(() => {
    if (!demoId) {
      setSnapshot(IDLE_SNAPSHOT);
      return;
    }

    let cancelled = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let fallbackStarted = false;
    let lastPolledPhase: string | null = null;
    const startedAt = Date.now();

    setSnapshot({ ...IDLE_SNAPSHOT, status: 'building' });

    const stopPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
    const closeSource = () => {
      if (source) {
        source.close();
        source = null;
      }
    };
    const settle = () => {
      closeSource();
      stopPoll();
    };

    const appendPhase = (phase: string, at: number) => {
      setSnapshot((prev) => ({
        ...prev,
        phase,
        phases: [...prev.phases, { phase, at, index: prev.phases.length + 1 }],
      }));
    };

    const runFallbackPoll = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > FALLBACK_MAX_MS) {
        setSnapshot((prev) => ({
          ...prev,
          status: 'failed',
          error: 'Generation timed out',
        }));
        settle();
        return;
      }
      let json: {
        status?: string;
        phase?: string;
        previewUrl?: string;
        personalized?: boolean;
        error?: string;
      } = {};
      try {
        const res = await fetch(statusUrl(demoId));
        json = await res.json().catch(() => ({}));
      } catch {
        return; // try again next tick
      }
      if (cancelled) return;
      if (json.phase && json.phase !== lastPolledPhase) {
        lastPolledPhase = json.phase;
        appendPhase(json.phase, Math.round((Date.now() - startedAt) / 1000));
      }
      if (json.status === 'ready') {
        setSnapshot((prev) => ({
          ...prev,
          status: 'ready',
          previewUrl: json.previewUrl,
          personalized: json.personalized ?? false,
        }));
        settle();
      } else if (json.status === 'failed') {
        setSnapshot((prev) => ({
          ...prev,
          status: 'failed',
          error: json.error ?? 'Generation failed',
        }));
        settle();
      }
    };

    const startFallback = () => {
      if (fallbackStarted || cancelled) return;
      fallbackStarted = true;
      closeSource();
      setSnapshot((prev) => ({ ...prev, usingFallback: true }));
      pollTimer = setInterval(() => void runFallbackPoll(), FALLBACK_POLL_MS);
      void runFallbackPoll();
    };

    if (typeof EventSource === 'undefined') {
      startFallback();
    } else {
      try {
        source = new EventSource(streamUrl(demoId));
      } catch {
        source = null;
      }
      if (!source) {
        startFallback();
      } else {
        source.addEventListener('phase', (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse((event as MessageEvent).data) as {
              phase?: string;
              at?: number;
            };
            if (data.phase) appendPhase(data.phase, data.at ?? 0);
          } catch {
            /* malformed frame — skip it, the connection is still good */
          }
        });
        source.addEventListener('ready', (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse((event as MessageEvent).data) as {
              previewUrl?: string;
              personalized?: boolean;
            };
            setSnapshot((prev) => ({
              ...prev,
              status: 'ready',
              previewUrl: data.previewUrl,
              personalized: data.personalized ?? false,
            }));
          } catch {
            /* ignore */
          }
          settle();
        });
        source.addEventListener('failed', (event) => {
          if (cancelled) return;
          let error = 'Generation failed';
          try {
            const data = JSON.parse((event as MessageEvent).data) as {
              error?: string;
            };
            if (data.error) error = data.error;
          } catch {
            /* ignore */
          }
          setSnapshot((prev) => ({ ...prev, status: 'failed', error }));
          settle();
        });
        source.onerror = () => {
          if (cancelled) return;
          startFallback();
        };
      }
    }

    return () => {
      cancelled = true;
      settle();
    };
  }, [demoId]);

  return snapshot;
}
