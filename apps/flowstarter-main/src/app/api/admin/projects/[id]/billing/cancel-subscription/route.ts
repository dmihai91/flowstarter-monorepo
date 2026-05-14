import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  StripeBilling,
  StripeBillingError,
  type WorkspaceBillingRow,
} from '@/lib/billing/stripe';
import { mapBillingError } from '@/lib/billing/route-helpers';

/**
 * POST /api/admin/projects/[id]/billing/cancel-subscription
 *
 * Cancels the workspace's active Stripe subscription. Default behavior:
 * cancel at period end (client keeps service through what they've already
 * paid for). Pass `?immediate=true` to cancel right now (refunds handled
 * separately via Stripe dashboard).
 *
 * Response: { subscription: { id, status, cancelAtPeriodEnd } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const url = new URL(req.url);
  const immediate = url.searchParams.get('immediate') === 'true';

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

  const { data: row, error } = await supabase
    .from('workspaces')
    .select(
      `id, client_email, client_name, client_business_name,
       setup_fee, monthly_fee, stripe_customer_id, stripe_subscription_id,
       subscription_status, subscription_trial_ends,
       deposit_status, deposit_invoice_id,
       final_status, final_invoice_id`
    )
    .eq('id', workspaceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  if (!row.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Workspace has no active subscription' },
      { status: 404 }
    );
  }

  let result;
  try {
    result = await billing.cancelSubscription({
      project: row as WorkspaceBillingRow,
      immediate,
    });
  } catch (e) {
    return mapBillingError(e);
  }

  // For immediate cancel: status becomes 'canceled', clear the sub ID so
  // a future re-activation doesn't trip the "subscription_exists" guard.
  // For end-of-period cancel: status stays 'active'/'trialing' but
  // cancel_at_period_end is true; we just record the intent.
  const update: Record<string, unknown> = {
    subscription_status: mapStripeStatus(result.status),
  };
  if (immediate) {
    update.stripe_subscription_id = null;
    update.subscription_next_billing = null;
    update.subscription_trial_ends = null;
  }

  const { error: persistErr } = await supabase
    .from('workspaces')
    .update(update)
    .eq('id', workspaceId);

  if (persistErr) {
    return NextResponse.json(
      {
        error: `Subscription cancelled on Stripe but DB update failed: ${persistErr.message}`,
        subscription: result,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    subscription: {
      id: result.subscriptionId,
      status: result.status,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    },
  });
}

function mapStripeStatus(s: string): string {
  if (s === 'trialing') return 'trial';
  if (s === 'canceled') return 'cancelled';
  return s;
}
