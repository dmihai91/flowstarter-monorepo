// Stripe webhook — fulfillment source of truth for paid sessions.
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { fulfillPaidSession } from '@/lib/fulfillment';
import type { PaymentKind } from '@/lib/store';

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (e) {
    console.error('[selfserve webhook] signature verification failed', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const projectId = session.metadata?.projectId;
    const kind = session.metadata?.kind as PaymentKind | undefined;
    if (projectId && kind) {
      await fulfillPaidSession({
        sessionId: session.id,
        projectId,
        kind,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        subscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
      });
    }
  }

  return NextResponse.json({ received: true });
}
