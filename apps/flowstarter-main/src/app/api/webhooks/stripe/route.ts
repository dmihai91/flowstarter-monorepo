import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

/**
 * Stripe writes to `invoice.metadata.workspaceId` (and historically projectId).
 * Read both so older invoices in flight on cutover still resolve.
 */
function workspaceIdFromMetadata(
  meta: Stripe.Metadata | null | undefined
): string | undefined {
  if (!meta) return undefined;
  const ws = meta['workspaceId'];
  if (typeof ws === 'string' && ws.length > 0) return ws;
  const pj = meta['projectId'];
  if (typeof pj === 'string' && pj.length > 0) return pj;
  return undefined;
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const workspaceId = workspaceIdFromMetadata(invoice.metadata);
  const invoiceType = invoice.metadata?.invoiceType;
  if (!workspaceId || !invoiceType) return;
  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  if (invoiceType === 'deposit') {
    await supabase
      .from('workspaces')
      .update({
        deposit_status: 'paid',
        deposit_paid_at: now,
        outstanding_payment: false,
      })
      .eq('id', workspaceId);
  }
  if (invoiceType === 'final') {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    await supabase
      .from('workspaces')
      .update({
        final_status: 'paid',
        final_paid_at: now,
        outstanding_payment: false,
        setup_go_live_at: now,
        subscription_status: 'trial',
        subscription_trial_ends: trialEnd.toISOString(),
      })
      .eq('id', workspaceId);
  }
  console.info(
    `[Stripe] payment_succeeded -- ${invoiceType} for workspace ${workspaceId}`
  );
}

async function handleInvoiceOverdue(invoice: Stripe.Invoice) {
  const workspaceId = workspaceIdFromMetadata(invoice.metadata);
  const invoiceType = invoice.metadata?.invoiceType;
  if (!workspaceId || !invoiceType) return;
  const supabase = createSupabaseServiceRoleClient();
  if (invoiceType === 'deposit') {
    await supabase
      .from('workspaces')
      .update({ deposit_status: 'overdue', outstanding_payment: true })
      .eq('id', workspaceId);
  } else {
    await supabase
      .from('workspaces')
      .update({ final_status: 'overdue', outstanding_payment: true })
      .eq('id', workspaceId);
  }
  console.warn(`[Stripe] overdue -- ${invoiceType} for workspace ${workspaceId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const workspaceId = workspaceIdFromMetadata(invoice.metadata);
  if (!workspaceId) return;
  await createSupabaseServiceRoleClient()
    .from('workspaces')
    .update({ outstanding_payment: true })
    .eq('id', workspaceId);
  console.warn(`[Stripe] payment_failed for workspace ${workspaceId}`);
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const workspaceId = workspaceIdFromMetadata(subscription.metadata);
  if (!workspaceId) return;
  const supabase = createSupabaseServiceRoleClient();

  const statusMap: Partial<Record<Stripe.Subscription.Status, string>> = {
    trialing: 'trial',
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
  };
  const status = statusMap[subscription.status] ?? subscription.status;
  const periodEnd = subscription.items?.data?.[0]?.current_period_end ?? null;
  const nextBilling = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : null;

  await supabase
    .from('workspaces')
    .update({
      subscription_status: status,
      stripe_subscription_id: subscription.id,
      subscription_next_billing: nextBilling,
      outstanding_payment: subscription.status === 'past_due',
    })
    .eq('id', workspaceId);

  console.info(
    `[Stripe] subscription ${subscription.id} -> ${status} for workspace ${workspaceId}`
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.overdue':
        await handleInvoiceOverdue(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
