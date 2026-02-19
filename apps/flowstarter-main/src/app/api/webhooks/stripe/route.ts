/**
 * Stripe Webhook Handler
 *
 * Handles webhook events from Stripe for payment processing.
 * All webhooks are verified using Stripe's signature verification.
 *
 * @see https://stripe.com/docs/webhooks
 *
 * Setup:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/stripe
 * 3. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var
 * 4. Subscribe to events: checkout.session.completed, customer.subscription.*
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractWebhookHeaders,
  logWebhookEvent,
  verifyStripeSignature,
} from '@/lib/webhook-verification';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

/**
 * Stripe webhook event types we handle
 */
type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted';

/**
 * Stripe webhook event structure
 */
interface StripeWebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(
  data: Record<string, unknown>
): Promise<void> {
  console.info('[Stripe Webhook] Checkout completed:', data.id);

  // Example: Update user subscription status
  // const customerId = data.customer as string;
  // const userId = await getUserIdFromStripeCustomer(customerId);
  // await updateUserSubscription(userId, 'active');

  // Log to security audit
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('security_audit_logs').insert({
    event: 'payment.checkout_completed',
    severity: 'info',
    provider: 'stripe',
    resource_type: 'checkout',
    success: true,
  });
}

/**
 * Handle subscription events
 */
async function handleSubscriptionEvent(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  console.info(`[Stripe Webhook] Subscription event: ${eventType}`, data.id);

  // Log to security audit
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('security_audit_logs').insert({
    event: `payment.${eventType.replace('customer.', '')}`,
    severity: 'info',
    provider: 'stripe',
    resource_type: 'subscription',
    success: true,
  });
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(
  data: Record<string, unknown>
): Promise<void> {
  console.warn('[Stripe Webhook] Payment failed:', data.id);

  // Example: Notify user, update subscription status
  // const customerId = data.customer as string;
  // await sendPaymentFailedEmail(customerId);
  // await updateUserSubscription(userId, 'past_due');

  // Log to security audit
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('security_audit_logs').insert({
    event: 'payment.failed',
    severity: 'warning',
    provider: 'stripe',
    resource_type: 'invoice',
    success: false,
  });
}

/**
 * POST /api/webhooks/stripe
 *
 * Receives and processes Stripe webhook events.
 * Signature verification is mandatory - unsigned requests are rejected.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Check if webhook secret is configured
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    const headers = extractWebhookHeaders(request);
    const signatureHeader = headers['stripe-signature'] || '';

    // Log webhook received
    logWebhookEvent('stripe', 'received', {});

    // Verify the webhook signature
    const verification = verifyStripeSignature(
      payload,
      signatureHeader,
      webhookSecret
    );

    if (!verification.valid) {
      logWebhookEvent('stripe', 'failed', {
        error: verification.error,
      });

      // Log security event for failed verification
      const supabase = createSupabaseServiceRoleClient();
      await supabase.from('security_audit_logs').insert({
        event: 'webhook.verification_failed',
        severity: 'warning',
        provider: 'stripe',
        error_code: 'INVALID_SIGNATURE',
        route: '/api/webhooks/stripe',
        method: 'POST',
        success: false,
      });

      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // Parse the verified payload
    const event = verification.payload as StripeWebhookEvent;

    // Log successful verification
    logWebhookEvent('stripe', 'verified', {
      eventType: event.type,
      webhookId: event.id,
    });

    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.type, event.data.object);
        break;

      case 'invoice.paid':
        console.info('[Stripe Webhook] Invoice paid:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);

    // Log the error
    logWebhookEvent('stripe', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 *
 * Health check endpoint for webhook configuration verification.
 * Returns 405 Method Not Allowed as webhooks should only use POST.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Stripe webhooks only accept POST requests',
    },
    { status: 405 }
  );
}
