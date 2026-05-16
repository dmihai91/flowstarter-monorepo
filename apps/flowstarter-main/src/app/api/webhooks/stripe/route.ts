import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { sendEmail } from '@/lib/email';

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
  console.warn(
    `[Stripe] overdue -- ${invoiceType} for workspace ${workspaceId}`
  );
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

/**
 * Booking deposit paid by a prospect at the end of the discovery wizard
 * (Checkout Session, metadata.kind === 'booking_deposit'). No prospect table
 * exists — Stripe is the record of truth; we just notify the team so the
 * call can be confirmed and the deposit tracked manually.
 */
async function handleBookingDepositPaid(
  session: Stripe.Checkout.Session
): Promise<void> {
  const m = session.metadata ?? {};
  if (m['kind'] !== 'booking_deposit') return;

  // Mark the persisted lead paid (best-effort; lead table is service-role).
  const leadId = m['leadId'];
  if (leadId) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const amountEur =
        typeof session.amount_total === 'number'
          ? Math.round(session.amount_total / 100)
          : m['amountEur']
          ? Number(m['amountEur'])
          : null;
      // discovery_leads isn't in generated types yet — cast through unknown.
      // discovery_leads isn't in generated types yet — loose accessor.
      const leads = (
        supabase as unknown as {
          from: (t: string) => {
            update: (v: Record<string, unknown>) => {
              eq: (c: string, v: string) => Promise<unknown>;
            };
            select: (c: string) => {
              eq: (c: string, v: string) => {
                maybeSingle: () => Promise<{
                  data: { project_id: string | null } | null;
                }>;
              };
            };
          };
        }
      ).from('discovery_leads');

      await leads
        .update({
          deposit_status: 'paid',
          deposit_amount_eur: amountEur,
          stripe_session_id: session.id,
          deposit_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      // Auto-create the project on deposit paid — idempotent: only if this
      // lead has no linked workspace yet (Stripe redelivers events). Lands
      // at concierge_stage 'intake' (pre-discovery), same as the manual
      // team draft flow; the team advances it after the call.
      const existing = await leads
        .select('project_id')
        .eq('id', leadId)
        .maybeSingle();
      if (!existing.data?.project_id) {
        const tier = m['tier'] || '';
        const businessName = m['businessName'] || '';
        const name =
          businessName ||
          (m['name'] ? `${m['name']}'s Project` : 'Untitled Project');
        const slug =
          (name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) || 'workspace') +
          '-' +
          Math.random().toString(36).slice(2, 8);

        const { data: ws, error: wsErr } = await supabase
          .from('workspaces')
          .insert({
            slug,
            name,
            site_kind: tier === 'commerce' ? 'shopify_liquid' : 'astro',
            client_name: m['name'] || null,
            client_email: m['email'] || null,
            client_business_name: businessName || null,
            concierge_stage: 'intake',
          })
          .select('id')
          .single();

        if (wsErr) {
          console.error('[Stripe] auto-create workspace failed', wsErr);
        } else if (ws?.id) {
          await leads
            .update({ project_id: ws.id, updated_at: new Date().toISOString() })
            .eq('id', leadId);
          console.info(
            `[Stripe] deposit lead ${leadId} → workspace ${ws.id} (intake)`
          );
        }
      }
    } catch (err) {
      console.error('[Stripe] mark lead paid / auto-create failed', err);
    }
  }

  const notifyTo =
    process.env.DISCOVERY_LEAD_NOTIFY_EMAIL || 'hello@flowstarter.net';
  const amount =
    typeof session.amount_total === 'number'
      ? `€${(session.amount_total / 100).toFixed(0)}`
      : m['amountEur']
      ? `€${m['amountEur']}`
      : 'unknown';

  try {
    await sendEmail({
      to: notifyTo,
      subject: `Deposit paid — ${m['name'] || 'prospect'} (${
        m['tier']
      }) ${amount}`,
      replyTo: m['email'] || undefined,
      html: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
  <h2 style="font-size:17px;margin:0 0 12px;">Booking deposit paid</h2>
  <p style="font-size:14px;color:#374151;margin:0 0 4px;">
    <strong>${
      m['name'] || ''
    }</strong> paid <strong>${amount}</strong> to hold a discovery call.
  </p>
  <table style="border-collapse:collapse;font-size:13px;color:#111827;margin-top:12px;">
    <tr><td style="padding:3px 10px;color:#6b7280;">Email</td><td style="padding:3px 10px;">${
      m['email'] || ''
    }</td></tr>
    <tr><td style="padding:3px 10px;color:#6b7280;">Business</td><td style="padding:3px 10px;">${
      m['businessName'] || ''
    }</td></tr>
    <tr><td style="padding:3px 10px;color:#6b7280;">Build tier</td><td style="padding:3px 10px;">${
      m['tier'] || ''
    }</td></tr>
    <tr><td style="padding:3px 10px;color:#6b7280;">Monthly plan</td><td style="padding:3px 10px;">${
      m['subscription'] || '—'
    }</td></tr>
    <tr><td style="padding:3px 10px;color:#6b7280;">Source</td><td style="padding:3px 10px;">${
      m['source'] || ''
    }</td></tr>
    <tr><td style="padding:3px 10px;color:#6b7280;">Stripe session</td><td style="padding:3px 10px;">${
      session.id
    }</td></tr>
  </table>
  <p style="font-size:12px;color:#6b7280;margin-top:14px;">
    Refundable after the call, before any build work starts. Refund from the Stripe dashboard if they don't proceed.
  </p>
</div>`,
    });
  } catch (err) {
    console.error('[Stripe] booking-deposit notify failed', err);
  }

  console.info(
    `[Stripe] booking deposit paid: ${m['email']} ${m['tier']} ${amount} (${session.id})`
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
      case 'checkout.session.completed':
        await handleBookingDepositPaid(
          event.data.object as Stripe.Checkout.Session
        );
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
