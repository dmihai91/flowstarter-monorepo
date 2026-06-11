// Build runner: owns retries, persistence (Supabase + Convex live state),
// failure paths (auto-refund + apology + admin alert), and engine selection.
import 'server-only';
import {
  MockEngine,
  type BuildEngine,
  type BuildEvent,
  type BuildRequest,
} from '@flowstarter/build-engine';
import { ENGINE } from './config';
import { getStore, type BuildRow } from './store';
import { convexAppendEvent, convexUpsertBuild, convexUpsertTask } from './convex-server';
import { alertAdmin } from './alerts';
import { sendEmail, apologyEmail } from './emails';
import { refundPaymentIntent } from './stripe';
import { trackServer } from './analytics-server';
import { renderPremiumTemplate, parseFillFromHtml } from './site-template';

// One runner per process — prevents double-running a build across HMR reloads.
function activeRuns(): Set<string> {
  const g = globalThis as { __selfserveRuns?: Set<string> };
  g.__selfserveRuns ??= new Set();
  return g.__selfserveRuns;
}

async function getEngine(): Promise<BuildEngine> {
  if (ENGINE.mode === 'orchestrator') {
    // Real engine: agent orchestrator (Cursor SDK agents, Daytona sandboxes).
    const { createOrchestratorEngine } = await import('@flowstarter/build-orchestrator');
    return createOrchestratorEngine({
      onTaskUpdate: (t) => void convexUpsertTask(t),
    });
  }
  return new MockEngine({ previewUrl: (buildId) => `/site/${buildId}` });
}

async function persistEvent(buildId: string, projectId: string, seq: number, event: BuildEvent) {
  const store = getStore();
  await store.appendBuildFeed(buildId, event);
  await convexAppendEvent(buildId, seq, event);
  if (event.type === 'progress') {
    await store.updateBuild(buildId, { progress: event.progress });
  }
}

async function syncConvexStatus(build: BuildRow | null) {
  if (!build) return;
  await convexUpsertBuild({
    buildId: build.id,
    projectId: build.project_id,
    status: build.status,
    progress: build.progress,
    error: build.error ?? undefined,
  });
}

/**
 * Kick off (or resume) a build run. Fire-and-forget from route handlers —
 * resolves immediately, runs in the background of this Node process.
 */
export function startBuildRun(buildId: string): void {
  if (activeRuns().has(buildId)) return;
  activeRuns().add(buildId);
  void runToCompletion(buildId)
    .catch((e) => console.error('[selfserve runner] fatal', e))
    .finally(() => activeRuns().delete(buildId));
}

async function runToCompletion(buildId: string): Promise<void> {
  const store = getStore();
  const build = await store.getBuild(buildId);
  if (!build) return;
  if (build.status === 'completed' || build.status === 'terminal_failed') return;
  const project = await store.getProject(build.project_id);
  if (!project) return;

  const engine = await getEngine();
  let seq = build.feed.length;
  const emit = (event: BuildEvent) => persistEvent(buildId, project.id, seq++, event);

  let attempt = build.attempt;
  const maxAttempts = ENGINE.maxRetries + 1;

  while (attempt < maxAttempts) {
    const running = await store.updateBuild(buildId, {
      status: attempt === 0 ? 'running' : 'retrying',
      attempt,
      started_at: build.started_at ?? new Date().toISOString(),
      error: null,
    });
    await syncConvexStatus(running);

    const req: BuildRequest = {
      buildId,
      projectId: project.id,
      businessDescription: project.business_description,
      refinements: [],
      demoSpec: project.demo_spec,
      demoHtml: project.demo_html,
      attempt,
    };

    try {
      const outputs = await engine.run(req, emit);
      // Paid tier: upgrade the approved demo into the premium render (richer
      // sections, motion, packages/FAQ) so the delivery visibly outclasses the
      // free demo. The real orchestrator ships its own site untouched.
      if (engine.kind === 'mock' && project.demo_html) {
        const fill = parseFillFromHtml(project.demo_html);
        if (fill) outputs.siteHtml = renderPremiumTemplate(fill);
      }
      const done = await store.updateBuild(buildId, {
        status: 'completed',
        progress: 100,
        outputs,
        completed_at: new Date().toISOString(),
      });
      await syncConvexStatus(done);
      await emit({ type: 'completed', ts: Date.now(), outputs });
      await trackServer(project.clerk_user_id, 'build_completed', { projectId: project.id, buildId });
      return;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      attempt += 1;
      console.error(`[selfserve runner] build ${buildId} attempt ${attempt} failed: ${message}`);
      const failed = await store.updateBuild(buildId, {
        status: attempt >= maxAttempts ? 'failed' : 'retrying',
        attempt,
        error: message,
      });
      await syncConvexStatus(failed);
    }
  }

  await handleTerminalFailure(buildId);
}

/** Terminal failure: mark, alert, auto-refund the build fee, send apology. */
export async function handleTerminalFailure(buildId: string): Promise<void> {
  const store = getStore();
  const build = await store.getBuild(buildId);
  if (!build || build.status === 'terminal_failed' || build.status === 'completed') return;
  const project = await store.getProject(build.project_id);

  const terminal = await store.updateBuild(buildId, { status: 'terminal_failed' });
  await syncConvexStatus(terminal);

  await alertAdmin('Build terminally failed', {
    buildId,
    projectId: build.project_id,
    email: project?.email,
    error: build.error,
    attempts: build.attempt,
  });

  // Auto-refund the €50 build fee.
  let refunded = false;
  if (project) {
    const payments = await store.listPaymentsForProject(project.id);
    const fee = payments.find((p) => p.kind === 'build_fee' && p.status === 'paid');
    if (fee?.stripe_payment_intent_id) {
      try {
        refunded = await refundPaymentIntent(fee.stripe_payment_intent_id);
        await store.updatePayment(fee.id, { status: 'refunded' });
      } catch (e) {
        await alertAdmin('AUTO-REFUND FAILED — manual refund needed', {
          buildId,
          paymentId: fee.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    const mail = apologyEmail(project.demo_spec?.brand.name, refunded);
    await sendEmail({ to: project.email, subject: mail.subject, text: mail.text });
    await trackServer(project.clerk_user_id, 'build_failed_terminal', { projectId: project.id, buildId });
    if (refunded) {
      await trackServer(project.clerk_user_id, 'build_refunded', { projectId: project.id, buildId });
    }
  }
}

/**
 * Watchdog: builds running longer than the threshold notify the user-facing
 * "taking longer than expected" state and raise one internal alert.
 * Called opportunistically from status reads + the internal cron endpoint.
 */
export async function watchdogSweep(): Promise<number> {
  const store = getStore();
  const stuck = await store.listStuckBuilds(ENGINE.stuckAfterMs);
  for (const b of stuck) {
    if (!b.admin_alerted_at) {
      const project = await store.getProject(b.project_id);
      await alertAdmin('Build exceeded 2h — investigate', {
        buildId: b.id,
        projectId: b.project_id,
        email: project?.email,
        status: b.status,
        createdAt: b.created_at,
      });
      await store.updateBuild(b.id, { admin_alerted_at: new Date().toISOString() });
    }
  }
  return stuck.length;
}

/** Admin retry: reset attempts and re-run. */
export function retryBuild(buildId: string): void {
  void (async () => {
    const store = getStore();
    const fresh = await store.updateBuild(buildId, {
      status: 'queued',
      attempt: 0,
      error: null,
      admin_alerted_at: null,
    });
    await syncConvexStatus(fresh);
    startBuildRun(buildId);
  })();
}
