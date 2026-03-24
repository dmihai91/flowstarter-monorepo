/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { ProjectPaymentUpdate } from '@/lib/stripe/invoices';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const { projectId, invoiceType } = invoice.metadata ?? {};
  if (!projectId || !invoiceType) return;
  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  if (invoiceType === 'deposit') {
    const u: ProjectPaymentUpdate = { deposit_status: 'paid', deposit_paid_at: now, outstanding_payment: false };
    await supabase.from('projects').update(u as any).eq('id', projectId);
  }
  if (invoiceType === 'final') {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    const u: ProjectPaymentUpdate = {
      final_status: 'paid', final_paid_at: now, outstanding_payment: false,
      launched_at: now, subscription_status: 'trial', subscription_trial_ends: trialEnd.toISOString(),
    };
    await supabase.from('projects').update(u as any).eq('id', projectId);
  }
  console.info(`[Stripe] Invoice payment_succeeded -- ${invoiceType} for project ${projectId}`);
}

async function handleInvoiceOverdue(invoice: Stripe.Invoice) {
  const { projectId, invoiceType } = invoice.metadata ?? {};
  if (!projectId || !invoiceType) return;
  const supabase = createSupabaseServiceRoleClient();
  const u: ProjectPaymentUpdate =
    invoiceType === 'deposit'
      ? { deposit_status: 'overdue', outstanding_payment: true }
      : { final_status: 'overdue', outstanding_payment: true };
  await supabase.from('projects').update(u as any).eq('id', projectId);
  console.warn(`[Stripe] Invoice overdue -- ${invoiceType} for project ${projectId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const { projectId } = invoice.metadata ?? {};
  if (!projectId) return;
  const supabase = createSupabaseServiceRoleClient();
  const u: ProjectPaymentUpdate = { outstanding_payment: true };
  await supabase.from('projects').update(u as any).eq('id', projectId);
  console.warn(`[Stripe] Payment failed for project ${projectId}`);
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const { projectId } = subscription.metadata ?? {};
  if (!projectId) return;
  const supabase = createSupabaseServiceRoleClient();

  const statusMap: Partial<Record<Stripe.Subscription.Status, string>> = {
    trialing: 'trial', active: 'active', past_due: 'past_due', canceled: 'cancelled',
  };
  const status = statusMap[subscription.status] ?? subscription.status;
  const periodEnd = subscription.items?.data?.[0]?.current_period_end ?? null;
  const nextBilling = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const u: ProjectPaymentUpdate = {
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    subscription_next_billing: nextBilling,
    outstanding_payment: subscription.status === 'past_due',
  };
  await supabase.from('projects').update(u as any).eq('id', projectId);
  console.info(`[Stripe] Subscription ${subscription.id} -> ${status} for project ${projectId}`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
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
