// Stripe wiring. All amounts come from env-configured PRICING constants.
// When STRIPE_SECRET_KEY is unset the checkout endpoints fall back to an
// explicit mock-payment flow so the funnel stays testable end-to-end.
import 'server-only';
import Stripe from 'stripe';
import { PRICING } from './config';
import type { PaymentKind } from './store';

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  stripe = key ? new Stripe(key) : null;
  if (!stripe) {
    console.warn('[selfserve] STRIPE_SECRET_KEY unset — using mock payment flow (dev only)');
  }
  return stripe;
}

export function isStripeLive(): boolean {
  return getStripe() !== null;
}

const PRODUCT_NAMES: Record<PaymentKind, string> = {
  build_fee: 'Flowstarter — build fee (starts your build)',
  final_code: 'Flowstarter — delivery payment (code export)',
  final_subscription: 'Flowstarter — delivery payment (launch)',
};

export async function createBuildFeeCheckout(args: {
  projectId: string;
  email: string;
  origin: string;
  waiverAcceptedAt: string;
}): Promise<{ url: string; sessionId: string }> {
  const s = getStripe();
  if (!s) {
    // Mock payment: skip Stripe entirely; the success route finalizes it.
    const sessionId = `mock_${args.projectId}_build_fee_${Date.now()}`;
    return {
      sessionId,
      url: `${args.origin}/api/checkout/mock-success?session_id=${encodeURIComponent(sessionId)}`,
    };
  }
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PRICING.currency,
          unit_amount: PRICING.buildFeeCents,
          product_data: {
            name: PRODUCT_NAMES.build_fee,
            description:
              'Non-refundable build fee. You agreed that work begins immediately and waived the 14-day right of withdrawal.',
          },
        },
      },
    ],
    metadata: {
      projectId: args.projectId,
      kind: 'build_fee',
      waiverAcceptedAt: args.waiverAcceptedAt,
    },
    success_url: `${args.origin}/p/${args.projectId}/build?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${args.origin}/p/${args.projectId}/demo?checkout=cancelled`,
  });
  return { url: session.url!, sessionId: session.id };
}

export async function createFinalCheckout(args: {
  projectId: string;
  email: string;
  origin: string;
  kind: 'final_code' | 'final_subscription';
}): Promise<{ url: string; sessionId: string }> {
  const s = getStripe();
  if (!s) {
    const sessionId = `mock_${args.projectId}_${args.kind}_${Date.now()}`;
    return {
      sessionId,
      url: `${args.origin}/api/checkout/mock-success?session_id=${encodeURIComponent(sessionId)}`,
    };
  }
  const successUrl = `${args.origin}/p/${args.projectId}/done?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.origin}/p/${args.projectId}/preview?checkout=cancelled`;

  // Both delivery paths are one-time Stripe payments. The €39/mo hosting
  // subscription is handled by Clerk Billing AFTER the launch payment
  // (Stripe keeps one-time fees; Clerk owns recurring — platform convention).
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PRICING.currency,
          unit_amount: PRICING.finalFeeCents,
          product_data: { name: PRODUCT_NAMES[args.kind] },
        },
      },
    ],
    metadata: { projectId: args.projectId, kind: args.kind },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return { url: session.url!, sessionId: session.id };
}

/** Automatic €50 refund on terminal build failure. */
export async function refundPaymentIntent(paymentIntentId: string): Promise<boolean> {
  const s = getStripe();
  if (!s) {
    console.warn(`[selfserve] mock refund for ${paymentIntentId}`);
    return true;
  }
  await s.refunds.create({ payment_intent: paymentIntentId });
  return true;
}
