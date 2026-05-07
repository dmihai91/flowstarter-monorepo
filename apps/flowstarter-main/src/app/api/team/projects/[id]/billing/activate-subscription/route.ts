import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  StripeBilling,
  StripeBillingError,
  ensureBillingCustomer,
} from '@/lib/billing/stripe';
import { mapBillingError } from '@/lib/billing/route-helpers';

/**
 * POST /api/team/projects/[id]/billing/activate-subscription
 *
 * Creates the recurring monthly subscription with a 30-day trial (first
 * month free). Refuses if both setup invoices haven't been paid (we want
 * the client fully onboarded financially before the recurring clock starts).
 *
 * Body: { monthlyAmount?: number, trialPeriodDays?: number }
 *   - monthlyAmount defaults to projects.monthly_fee (in major units)
 *   - trialPeriodDays defaults to 30
 *
 * Response: { subscription: { id, status, trialEnd, currentPeriodEnd } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    monthlyAmount?: unknown;
    trialPeriodDays?: unknown;
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

  if (row.stripe_subscription_id) {
    return NextResponse.json(
      {
        error: `Workspace already has subscription ${row.stripe_subscription_id}. Cancel it before activating a new one.`,
      },
      { status: 409 }
    );
  }
  // Soft guard: warn (but don't block) if the deposit/final aren't paid.
  // Team can override by passing the explicit force=true query param in case
  // they ran billing outside Stripe (e.g. bank transfer). Otherwise refuse.
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === 'true';
  if (!force) {
    if (row.deposit_status !== 'paid' || row.final_status !== 'paid') {
      return NextResponse.json(
        {
          error:
            'Both deposit and final must be paid before activating subscription. Pass ?force=true if collecting setup outside Stripe.',
          deposit_status: row.deposit_status,
          final_status: row.final_status,
        },
        { status: 409 }
      );
    }
  }

  // Resolve monthly amount.
  const monthlyAmountMinor = resolveMonthlyAmount(
    body.monthlyAmount,
    row.monthly_fee ?? 0
  );
  if (monthlyAmountMinor <= 0) {
    return NextResponse.json(
      {
        error:
          'Cannot derive monthly amount. Set workspaces.monthly_fee or pass monthlyAmount in major units.',
      },
      { status: 400 }
    );
  }
  const trialPeriodDays = sanitizeTrialDays(body.trialPeriodDays);

  let result;
  try {
    result = await billing.activateSubscription({
      project: row,
      customerId,
      monthlyAmountMinor,
      trialPeriodDays,
    });
  } catch (e) {
    return mapBillingError(e);
  }

  const { error: persistErr } = await supabase
    .from('workspaces')
    .update({
      stripe_subscription_id: result.subscriptionId,
      subscription_status: mapStripeStatus(result.status),
      subscription_trial_ends: result.trialEnd?.toISOString() ?? null,
      subscription_next_billing: result.currentPeriodEnd?.toISOString() ?? null,
    })
    .eq('id', workspaceId);

  if (persistErr) {
    return NextResponse.json(
      {
        error: `Subscription ${result.subscriptionId} created on Stripe but DB update failed: ${persistErr.message}`,
        subscription: result,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    subscription: {
      id: result.subscriptionId,
      status: result.status,
      trialEnd: result.trialEnd?.toISOString() ?? null,
      currentPeriodEnd: result.currentPeriodEnd?.toISOString() ?? null,
    },
  });
}

function resolveMonthlyAmount(raw: unknown, monthlyFeeMajor: number): number {
  if (raw !== undefined && raw !== null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
    return 0;
  }
  if (!Number.isFinite(monthlyFeeMajor) || monthlyFeeMajor <= 0) return 0;
  return Math.round(monthlyFeeMajor * 100);
}

function sanitizeTrialDays(raw: unknown): number {
  if (raw === undefined || raw === null) return 30;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 365) return 30;
  return Math.floor(n);
}

function mapStripeStatus(s: string): string {
  if (s === 'trialing') return 'trial';
  if (s === 'canceled') return 'cancelled';
  return s;
}
