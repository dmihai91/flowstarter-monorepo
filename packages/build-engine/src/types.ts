// ============================================================
// Build engine contract — the clean API boundary between the
// self-serve app and whatever produces sites (mock or the real
// agent orchestrator). The app only ever talks to `BuildEngine`.
// ============================================================

export type AgentId = 'research' | 'brand' | 'copy' | 'dev';

/** Shared shape of generated site content (demo preview + full build). */
export interface SiteSpec {
  brand: {
    name: string;
    tagline: string;
    /** 4 hex colors: primary, secondary, ink, paper */
    palette: [string, string, string, string];
    voice: string[];
  };
  copy: {
    hero: string;
    sub: string;
    cta: string;
    sections: Array<{ h: string; p: string }>;
  };
  positioning: string;
}

export type BuildStatus =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'failed' // attempt failed, may retry
  | 'terminal_failed' // gave up: refund + apology path
  | 'completed';

/** One line of the live build feed (the "theater"). */
export interface BuildFeedEvent {
  type: 'feed';
  ts: number;
  agent: AgentId;
  text: string;
  /** When set, this line unlocked a deliverable. */
  artifact?: string;
}

export interface BuildProgressEvent {
  type: 'progress';
  ts: number;
  /** 0-100 */
  progress: number;
}

export interface BuildStatusEvent {
  type: 'status';
  ts: number;
  status: BuildStatus;
  error?: string;
}

export interface BuildCompletedEvent {
  type: 'completed';
  ts: number;
  outputs: BuildOutputs;
}

export type BuildEvent =
  | BuildFeedEvent
  | BuildProgressEvent
  | BuildStatusEvent
  | BuildCompletedEvent;

/** What a finished build hands back to the app. */
export interface BuildOutputs {
  spec: SiteSpec;
  /** Self-contained static site (single-page HTML bundle, inlined CSS). */
  siteHtml: string;
  /** Where the user can view the full result (app preview route or sandbox URL). */
  previewUrl: string;
  /** Optional richer artifact bundle (multi-file export) produced by the real engine. */
  files?: Array<{ path: string; content: string }>;
}

export interface BuildRequest {
  buildId: string;
  projectId: string;
  businessDescription: string;
  /** The (max 3) demo refinement prompts the user already used. */
  refinements: string[];
  /** Demo spec approved by the user — the build must stay consistent with it. */
  demoSpec?: SiteSpec | null;
  /** Attempt counter (0 = first run). */
  attempt: number;
}

export type EmitFn = (event: BuildEvent) => void | Promise<void>;

export interface BuildEngine {
  readonly kind: 'mock' | 'orchestrator';
  /**
   * Run a build to completion. Emits feed/progress events along the way.
   * Resolves with outputs on success; throws on failure (caller owns retries).
   */
  run(req: BuildRequest, emit: EmitFn): Promise<BuildOutputs>;
}
