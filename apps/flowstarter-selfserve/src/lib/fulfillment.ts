// Shared payment fulfillment — called by the Stripe webhook AND the mock
// checkout success route. Idempotent on the checkout session id.
import 'server-only';
import { getStore, type PaymentKind } from './store';
import { startBuildRun } from './runner';
import { trackServer } from './analytics-server';

export async function fulfillPaidSession(args: {
  sessionId: string;
  projectId: string;
  kind: PaymentKind;
  paymentIntentId?: string | null;
  subscriptionId?: string | null;
}): Promise<void> {
  const store = getStore();
  const payment = await store.getPaymentBySession(args.sessionId);
  if (!payment) {
    console.error(`[selfserve] paid session ${args.sessionId} has no payment row`);
    return;
  }
  if (payment.status === 'paid') return; // idempotent

  await store.updatePayment(payment.id, {
    status: 'paid',
    stripe_payment_intent_id: args.paymentIntentId ?? payment.stripe_payment_intent_id,
    stripe_subscription_id: args.subscriptionId ?? payment.stripe_subscription_id,
  });

  const project = await store.getProject(args.projectId);
  const distinctId = project?.clerk_user_id ?? args.projectId;

  if (args.kind === 'build_fee') {
    // Payment received → the full agent build starts.
    let build = await store.latestBuildForProject(args.projectId);
    if (!build || build.status === 'terminal_failed') {
      build = await store.createBuild(args.projectId);
    }
    startBuildRun(build.id);
    await trackServer(distinctId, 'paid_50', { projectId: args.projectId, buildId: build.id });
    return;
  }

  if (args.kind === 'final_code') {
    await store.updateProject(args.projectId, { outcome: 'code_only' });
    await trackServer(distinctId, 'paid_149_code_only', { projectId: args.projectId });
    return;
  }

  // final_subscription → Launch
  await store.updateProject(args.projectId, { outcome: 'launch' });
  await trackServer(distinctId, 'paid_149_subscription', { projectId: args.projectId });
  // TODO(launch-deploy): push the built artifact to the workspace's Hetzner host
  // via the existing deploy-agent (apps/deploy-agent). v1 serves the site from
  // /site/[buildId] until the deploy hook is wired.
}
