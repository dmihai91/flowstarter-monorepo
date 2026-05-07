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
  | 'organization.deleted';

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
