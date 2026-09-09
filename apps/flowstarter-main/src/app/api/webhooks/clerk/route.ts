/**
 * Clerk Webhook Handler
 *
 * Handles webhook events from Clerk for user lifecycle events.
 * All webhooks are verified using Svix signature verification.
 *
 * @see https://clerk.com/docs/integrations/webhooks
 *
 * Setup:
 * 1. Go to Clerk Dashboard > Webhooks
 * 2. Create a new endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Copy the signing secret to CLERK_WEBHOOK_SECRET env var
 * 4. Subscribe to events: user.created, user.updated, user.deleted
 */

import {
  extractWebhookHeaders,
  logWebhookEvent,
  verifySvixSignature,
} from '@/lib/webhook-verification';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { NextRequest, NextResponse } from 'next/server';

type ClerkWebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'session.created'
  | 'session.ended'
  | 'session.removed'
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  // Clerk Billing (B2C). Note: Clerk event names (dot/camelCase), not Stripe's.
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.active'
  | 'subscription.pastDue'
  | 'subscriptionItem.canceled'
  | 'subscriptionItem.ended';

// Canonical PlanKey values the editor enforces (planEntitlements.ts) and that
// the Clerk Billing plan slugs are configured to match (clerk-billing.json).
const CANONICAL_TIER_SLUGS = new Set(['starter', 'pro', 'max', 'ecommerce']);

interface ClerkBillingEventData {
  id: string;
  status?: string;
  payer?: { user_id?: string | null; organization_id?: string | null };
  items?: Array<{ plan?: { slug?: string | null } | null } | null>;
}

/**
 * Map a Clerk Billing subscription event to the workspace tier update we
 * mirror into Supabase. Pure + exported for tests.
 *
 * - active/created/updated → set tier_name from the plan slug, status active.
 * - pastDue → keep the tier (grace), mark status past_due.
 * - canceled/ended → downgrade tier_name to null (→ Starter floor via
 *   normalisePlanKey in the editor), status canceled.
 * Returns null when there's no B2C user payer (we mirror user subscriptions
 * only) or no usable plan slug.
 */
export function billingEventToTierUpdate(
  eventType: ClerkWebhookEventType,
  data: ClerkBillingEventData
): {
  clerkUserId: string;
  // omitted = leave tier_name unchanged; null = downgrade to floor;
  // string = set to this canonical slug.
  tierName?: string | null;
  subscriptionStatus: string;
} | null {
  const clerkUserId = data.payer?.user_id ?? null;
  if (!clerkUserId) return null; // org payers are out of scope (B2C only)

  const planSlug = data.items?.[0]?.plan?.slug ?? null;

  switch (eventType) {
    case 'subscriptionItem.canceled':
    case 'subscriptionItem.ended':
      return { clerkUserId, tierName: null, subscriptionStatus: 'canceled' };
    case 'subscription.pastDue':
      // Grace period: keep the current tier, only flag status (tierName omitted).
      return { clerkUserId, subscriptionStatus: 'past_due' };
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
      if (!planSlug || !CANONICAL_TIER_SLUGS.has(planSlug)) return null;
      return {
        clerkUserId,
        tierName: planSlug,
        subscriptionStatus: data.status ?? 'active',
      };
    default:
      return null;
  }
}

/**
 * Mirror a Clerk Billing subscription event into Supabase: resolve the payer's
 * workspace(s) via workspace_memberships and update tier_name (when the event
 * dictates) + subscription_status. The editor reads tier_name → PLAN_ENTITLEMENTS,
 * so this is the only wiring needed for enforcement to follow the subscription.
 */
async function handleBillingSubscription(
  eventType: ClerkWebhookEventType,
  data: ClerkBillingEventData
): Promise<void> {
  const update = billingEventToTierUpdate(eventType, data);
  if (!update) {
    console.info(
      `[Clerk Webhook] Billing event ${eventType} ignored (no user payer / unknown plan).`
    );
    return;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('clerk_user_id', update.clerkUserId);
  if (membershipError) {
    console.error(
      '[Clerk Webhook] membership lookup failed:',
      membershipError.message
    );
    return;
  }
  const workspaceIds = (memberships ?? [])
    .map((m) => m.workspace_id)
    .filter((id): id is string => typeof id === 'string');
  if (workspaceIds.length === 0) {
    console.warn(
      `[Clerk Webhook] No workspace for clerk user ${update.clerkUserId}; tier not mirrored.`
    );
    return;
  }

  const patch: { subscription_status: string; tier_name?: string | null } = {
    subscription_status: update.subscriptionStatus,
  };
  if ('tierName' in update) {
    patch.tier_name = update.tierName ?? null;
  }

  const { error: updateError } = await supabase
    .from('workspaces')
    .update(patch)
    .in('id', workspaceIds);
  if (updateError) {
    console.error(
      '[Clerk Webhook] workspace tier mirror failed:',
      updateError.message
    );
    return;
  }
  console.info(
    `[Clerk Webhook] ${eventType}: mirrored ${update.subscriptionStatus}` +
      (patch.tier_name !== undefined ? ` / tier=${patch.tier_name}` : '') +
      ` to ${workspaceIds.length} workspace(s).`
  );
}

interface ClerkUserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{
    id: string;
    email_address: string;
    verification: { status: string };
  }>;
  primary_email_address_id: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: ClerkWebhookEventType;
  data: ClerkUserData;
  object: 'event';
}

function primaryEmail(user: ClerkUserData): string | null {
  if (!user.primary_email_address_id) return null;
  const match = user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id
  );
  return match?.email_address ?? null;
}

function fullName(user: ClerkUserData): string | null {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

const ANTHROPIC_INVITE_ROLES = new Set([
  'user',
  'developer',
  'billing',
  'claude_code_user',
]);

function shouldAutoInviteAnthropicUser(): boolean {
  return process.env.ANTHROPIC_ORG_AUTO_INVITE === '1';
}

function anthropicInviteRole(): string {
  const role =
    process.env.ANTHROPIC_ORG_INVITE_ROLE?.trim() || 'claude_code_user';
  return ANTHROPIC_INVITE_ROLES.has(role) ? role : 'claude_code_user';
}

/**
 * Optional Anthropic org invite. This is intentionally best-effort so Clerk
 * profile sync never fails because Anthropic is unavailable or out of seats.
 */
async function maybeInviteAnthropicUser(data: ClerkUserData): Promise<void> {
  if (!shouldAutoInviteAnthropicUser()) return;

  const email = primaryEmail(data);
  if (!email) {
    console.warn(
      `[Clerk Webhook] Anthropic invite skipped for ${data.id}: no primary email.`
    );
    return;
  }

  const adminApiKey =
    process.env.ANTHROPIC_ADMIN_API_KEY?.trim() ||
    process.env.ANTHROPIC_ADMIN_KEY?.trim();
  if (!adminApiKey) {
    console.warn(
      '[Clerk Webhook] Anthropic invite skipped: ANTHROPIC_ADMIN_API_KEY is not configured.'
    );
    return;
  }

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/organizations/invites',
      {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': adminApiKey,
        },
        body: JSON.stringify({
          email,
          role: anthropicInviteRole(),
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.warn(
        `[Clerk Webhook] Anthropic invite failed for ${email} (${response.status}): ${detail}`
      );
      return;
    }

    console.info(`[Clerk Webhook] Anthropic invite sent to ${email}.`);
  } catch (error) {
    console.warn(
      `[Clerk Webhook] Anthropic invite failed for ${email}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Mirror the Clerk user into our profiles table so SQL joins resolve.
 * Workspace ownership is tracked separately via workspace_memberships.
 */
async function upsertProfile(data: ClerkUserData): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from('profiles').upsert(
    {
      clerk_user_id: data.id,
      email: primaryEmail(data),
      full_name: fullName(data),
      avatar_url: data.image_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clerk_user_id' }
  );
  if (error) {
    console.error('[Clerk Webhook] profile upsert failed:', error.message);
  }
}

/**
 * On user.deleted, remove the Clerk user's profile row + workspace memberships.
 * Workspaces themselves are preserved — the team manages those, not the user.
 */
async function handleUserDeleted(data: ClerkUserData): Promise<void> {
  console.info('[Clerk Webhook] User deleted:', data.id);
  const supabase = createSupabaseServiceRoleClient();

  const { error: membershipsError } = await supabase
    .from('workspace_memberships')
    .delete()
    .eq('clerk_user_id', data.id);
  if (membershipsError) {
    console.error(
      '[Clerk Webhook] Error deleting workspace memberships:',
      membershipsError.message
    );
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('clerk_user_id', data.id);
  if (profileError) {
    console.error(
      '[Clerk Webhook] Error deleting profile:',
      profileError.message
    );
  }
}

/**
 * POST /api/webhooks/clerk
 * Receives and processes Clerk webhook events. Svix signature is mandatory.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  try {
    const payload = await request.text();
    const headers = extractWebhookHeaders(request);

    logWebhookEvent('clerk', 'received', {
      webhookId: headers['svix-id'],
    });

    const verification = verifySvixSignature(payload, headers, webhookSecret);
    if (!verification.valid) {
      logWebhookEvent('clerk', 'failed', {
        error: verification.error,
        webhookId: headers['svix-id'],
      });
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    const event = verification.payload as ClerkWebhookEvent;
    logWebhookEvent('clerk', 'verified', {
      eventType: event.type,
      webhookId: headers['svix-id'],
    });

    switch (event.type) {
      case 'user.created':
        await upsertProfile(event.data);
        await maybeInviteAnthropicUser(event.data);
        break;
      case 'user.updated':
        await upsertProfile(event.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;
      case 'session.created':
      case 'session.ended':
      case 'session.removed':
        console.info(`[Clerk Webhook] Session event: ${event.type}`);
        break;
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.pastDue':
      case 'subscriptionItem.canceled':
      case 'subscriptionItem.ended':
        await handleBillingSubscription(
          event.type,
          event.data as unknown as ClerkBillingEventData
        );
        break;
      default:
        console.info(`[Clerk Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Clerk Webhook] Error processing webhook:', error);
    logWebhookEvent('clerk', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/clerk
 * Health check endpoint. Webhooks only accept POST.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Clerk webhooks only accept POST requests',
    },
    { status: 405 }
  );
}
