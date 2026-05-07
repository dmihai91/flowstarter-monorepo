import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  StripeBilling,
  StripeBillingError,
  ensureBillingCustomer,
} from '@/lib/billing/stripe';
import { mapBillingError } from '@/lib/billing/route-helpers';
import { getMainUrl } from '@flowstarter/platform-config';

/**
 * POST /api/team/projects/[id]/billing/portal-link
 *
 * Returns a one-time Stripe Billing Portal URL for the project's client.
 * The team copies the URL into an email/WhatsApp message; the client uses
 * it to update payment methods, download past invoices, or cancel.
 *
 * Body: { returnUrl?: string }  // where Stripe sends them after they're done
 *
 * Response: { url: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const body = (await req.json().catch(() => ({}))) as { returnUrl?: unknown };

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
  let customerId: string;
  try {
    const ensured = await ensureBillingCustomer(supabase, billing, workspaceId);
    customerId = ensured.customerId;
  } catch (e) {
    return mapBillingError(e);
  }

  const requestedReturn =
    typeof body.returnUrl === 'string' ? body.returnUrl.trim() : '';
  const safeReturnUrl = isSafePlatformUrl(requestedReturn)
    ? requestedReturn
    : `${getMainUrl()}/team/dashboard/projects/${workspaceId}`;

  try {
    const { url } = await billing.createBillingPortalSession({
      customerId,
      returnUrl: safeReturnUrl,
    });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Portal link failed' },
      { status: 502 }
    );
  }
}

function isSafePlatformUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    // Only accept URLs that share the platform's root domain so we never
    // hand Stripe a customer-supplied open redirect.
    const platformOrigin = new URL(getMainUrl()).hostname;
    const platformRoot = platformOrigin.split('.').slice(-2).join('.');
    const inputRoot = parsed.hostname.split('.').slice(-2).join('.');
    return platformRoot === inputRoot;
  } catch {
    return false;
  }
}
