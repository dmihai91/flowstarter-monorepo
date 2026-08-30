import 'server-only';

/**
 * In-memory live-demo job store. A demo = one generated, sandbox-hosted site
 * the visitor can see and edit up to 15 times. Keyed by demoId.
 *
 * NOTE: process-local and ephemeral by design — fine for a single Node
 * worker / local dev. Production (multi-instance) must back this with a
 * durable store (Supabase) + the existing demo_edit_counters cap; the route
 * shapes here are written so that swap is mechanical.
 */
export const LIVE_EDIT_CAP = 15;

export interface LiveJob {
  demoId: string;
  status: 'building' | 'ready' | 'failed';
  /**
   * What the wizard's iframe points at: the sandbox (Daytona) or local dev
   * server. Stays the iframe source even after the hosted copy goes live —
   * it is the one we know is serving, and swapping the frame under a visitor
   * mid-look to prove a point about our infrastructure is not an improvement.
   */
  previewUrl?: string;
  /**
   * The durable copy on the previews host, e.g.
   * `https://p-<16 hex>.preview.flowstarter.net`. Present only once the
   * previews deploy-agent reports the site live; both URLs are exposed so the
   * funnel can offer a shareable link without pretending the sandbox one is
   * one.
   */
  hostedPreviewUrl?: string;
  /** 'pending' | 'live' | 'failed' | 'removed', straight off funnel_previews. */
  hostedPreviewStatus?: string;
  sandboxId?: string;
  /** Absolute path to the site's single content file (for edits). */
  contentFile?: string;
  /** Relative path of that file inside the sandbox workspace. */
  contentRel: string;
  editsUsed: number;
  error?: string;
  /** Latest streamed progress phase. */
  phase?: string;
  /**
   * Every phase this run has entered, with the second it started at. The SSE
   * stream replays this on connect, so a client that subscribes late (or
   * reconnects) still sees the whole story rather than only what happens next.
   */
  phases?: Array<{ phase: string; at: number }>;
  /** Base template live? then personalization hot-swapped in (progressive). */
  personalized?: boolean;
  /** 15-prompt edit loop state. */
  editStatus?: 'idle' | 'editing' | 'done' | 'failed';
  editPhase?: string;
  editError?: string;
  createdAt: number;
  teardown?: () => Promise<void>;
}

const jobs = new Map<string, LiveJob>();

export function createJob(demoId: string): LiveJob {
  const job: LiveJob = {
    demoId,
    status: 'building',
    contentRel: 'src/content/site-labels.md',
    editsUsed: 0,
    createdAt: Date.now(),
  };
  jobs.set(demoId, job);
  return job;
}

export function getJob(demoId: string): LiveJob | undefined {
  return jobs.get(demoId);
}

export function updateJob(demoId: string, patch: Partial<LiveJob>): void {
  const j = jobs.get(demoId);
  if (!j) return;
  const next = { ...j, ...patch };
  if (patch.phase && patch.phase !== j.phase) {
    next.phases = [
      ...(j.phases ?? []),
      { phase: patch.phase, at: Math.round((Date.now() - j.createdAt) / 1000) },
    ];
  }
  jobs.set(demoId, next);
}

/** Best-effort GC: tear down + drop demos older than the TTL. */
export async function reapStaleJobs(ttlMs = 45 * 60_000): Promise<void> {
  const now = Date.now();
  for (const [id, j] of Array.from(jobs.entries())) {
    if (now - j.createdAt > ttlMs) {
      try {
        await j.teardown?.();
      } catch {
        /* autoStopInterval is the backstop */
      }
      jobs.delete(id);
    }
  }
}
