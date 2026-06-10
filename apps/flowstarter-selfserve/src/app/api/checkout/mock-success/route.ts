// Mock checkout finalizer — only active when STRIPE_SECRET_KEY is unset.
// Simulates the webhook so the funnel is testable end-to-end without Stripe.
import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { isStripeLive } from '@/lib/stripe';
import { fulfillPaidSession } from '@/lib/fulfillment';

export async function GET(req: Request) {
  if (isStripeLive()) {
    return NextResponse.json({ error: 'Mock checkout disabled when Stripe is configured' }, { status: 403 });
  }
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId?.startsWith('mock_')) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
  const store = getStore();
  const payment = await store.getPaymentBySession(sessionId);
  if (!payment) return NextResponse.json({ error: 'Unknown session' }, { status: 404 });

  await fulfillPaidSession({
    sessionId,
    projectId: payment.project_id,
    kind: payment.kind,
    paymentIntentId: `mock_pi_${payment.id}`,
    subscriptionId: payment.kind === 'final_subscription' ? `mock_sub_${payment.id}` : null,
  });

  const dest =
    payment.kind === 'build_fee'
      ? `/p/${payment.project_id}/build`
      : `/p/${payment.project_id}/done?session_id=${encodeURIComponent(sessionId)}`;
  return NextResponse.redirect(new URL(dest, url.origin));
}
