import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  StripeBilling,
  StripeBillingError,
  ensureBillingCustomer,
} from '@/lib/billing/stripe';
import {
  mapBillingError,
  resolveAmountMinor,
  sanitizeDaysUntilDue,
} from '@/lib/billing/route-helpers';

/**
 * POST /api/team/projects/[id]/billing/deposit-invoice
 *
 * Creates the 20% deposit invoice for a project's setup fee.
 *
 * Request body:
 *   { amount?: number, daysUntilDue?: number }
 *
 * Defaults:
 *   - amount → projects.setup_fee × 0.2 (in major units, e.g. 799 → 15980 minor)
 *   - daysUntilDue → 14
 *
 * Idempotent guard: refuses if deposit_status is already 'paid'.
 *
 * Response: { invoice: { id, hostedUrl, status } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    amount?: unknown;
    daysUntilDue?: unknown;
  };

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY is not configured' },
      { status: 500 }
    );
  }

  let billing: StripeBilling;
  try {
    billing = new StripeBilling();
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof StripeBillingError ? e.message : 'Stripe init failed',
      },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  let row;
  let customerId: string;
  try {
    const ensured = await ensureBillingCustomer(supabase, billing, workspaceId);
    row = ensured.row;
    customerId = ensured.customerId;
  } catch (e) {
    return mapBillingError(e);
  }

  if (row.deposit_status === 'paid') {
    return NextResponse.json(
      { error: 'Deposit is already paid for this workspace' },
      { status: 409 }
    );
  }

  const amountMinor = resolveAmountMinor(
    body.amount,
    row.setup_fee ?? 0,
    /* percentageOfSetup */ 20
  );
  if (amountMinor <= 0) {
    return NextResponse.json(
      {
        error:
          'Cannot derive amount. Set workspaces.setup_fee, or pass an explicit amount in major units (e.g. 159.8 for €159.80).',
      },
      { status: 400 }
    );
  }
  const daysUntilDue = sanitizeDaysUntilDue(body.daysUntilDue);

  let invoice;
  try {
    invoice = await billing.createDepositInvoice({
      project: row,
      customerId,
      amountMinor,
      daysUntilDue,
    });
  } catch (e) {
    return mapBillingError(e);
  }

  // Persist invoice IDs / URL on the workspace so the team UI can resurface
  // the hosted Stripe URL without re-calling Stripe.
  const { error: persistErr } = await supabase
    .from('workspaces')
    .update({
      deposit_invoice_id: invoice.invoiceId,
      deposit_invoice_url: invoice.hostedUrl,
      deposit_amount: Math.floor(amountMinor / 100),
      deposit_status: 'sent',
      outstanding_payment: true,
    })
    .eq('id', workspaceId);

  if (persistErr) {
    return NextResponse.json(
      {
        error: `Invoice ${invoice.invoiceId} created on Stripe but DB update failed: ${persistErr.message}`,
        invoice,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    invoice: {
      id: invoice.invoiceId,
      hostedUrl: invoice.hostedUrl,
      status: invoice.status,
      amountMinor,
      currency: billing.currency,
    },
  });
}
