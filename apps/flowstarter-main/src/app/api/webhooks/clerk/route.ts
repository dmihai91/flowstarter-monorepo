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

/**
 * Clerk webhook event types we handle
 */
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

/**
 * Clerk user data structure
 */
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

/**
 * Clerk webhook event structure
 */
interface ClerkWebhookEvent {
  type: ClerkWebhookEventType;
  data: ClerkUserData;
  object: 'event';
}

/**
 * Handle user.created event
 * Log the event for audit purposes (no PII stored)
 */
async function handleUserCreated(data: ClerkUserData): Promise<void> {
  console.info('[Clerk Webhook] User created:', data.id);

  // Log to security audit (no PII)
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('security_audit_logs').insert({
    event: 'user.created',
    severity: 'info',
    user_hash: hashUserId(data.id),
    provider: 'clerk',
    success: true,
  });
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: ClerkUserData): Promise<void> {
  console.info('[Clerk Webhook] User updated:', data.id);

  // Log to security audit
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('security_audit_logs').insert({
    event: 'user.updated',
    severity: 'info',
    user_hash: hashUserId(data.id),
    provider: 'clerk',
    success: true,
  });
}

/**
 * Handle user.deleted event
 * Clean up user data from our database
 */
async function handleUserDeleted(data: ClerkUserData): Promise<void> {
  console.info('[Clerk Webhook] User deleted:', data.id);

  const supabase = createSupabaseServiceRoleClient();

  // Delete user's projects (cascade will handle related data)
  const { error: projectsError } = await supabase
    .from('projects')
    .delete()
    .eq('user_id', data.id);

  if (projectsError) {
    console.error(
      '[Clerk Webhook] Error deleting user projects:',
      projectsError
    );
  }

  // Delete user's integrations
  const { error: integrationsError } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', data.id);

  if (integrationsError) {
    console.error(
      '[Clerk Webhook] Error deleting user integrations:',
      integrationsError
    );
  }

  // Delete user's feedback
  const { error: feedbackError } = await supabase
    .from('user_feedback')
    .delete()
    .eq('user_id', data.id);

  if (feedbackError) {
    console.error(
      '[Clerk Webhook] Error deleting user feedback:',
      feedbackError
    );
  }

  // Log to security audit
  await supabase.from('security_audit_logs').insert({
    event: 'user.deleted',
    severity: 'info',
    user_hash: hashUserId(data.id),
    provider: 'clerk',
    success: true,
  });
}

/**
 * Hash user ID for privacy-compliant logging
 */
function hashUserId(userId: string): string {
  // Use a simple hash for correlation without PII
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex')
    .substring(0, 16);
}

/**
 * POST /api/webhooks/clerk
 *
 * Receives and processes Clerk webhook events.
 * Signature verification is mandatory - unsigned requests are rejected.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // Check if webhook secret is configured
  if (!webhookSecret) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    const headers = extractWebhookHeaders(request);

    // Log webhook received
    logWebhookEvent('clerk', 'received', {
      webhookId: headers['svix-id'],
    });

    // Verify the webhook signature
    const verification = verifySvixSignature(payload, headers, webhookSecret);

    if (!verification.valid) {
      logWebhookEvent('clerk', 'failed', {
        error: verification.error,
        webhookId: headers['svix-id'],
      });

      // Log security event for failed verification
      const supabase = createSupabaseServiceRoleClient();
      await supabase.from('security_audit_logs').insert({
        event: 'webhook.verification_failed',
        severity: 'warning',
        provider: 'clerk',
        error_code: 'INVALID_SIGNATURE',
        route: '/api/webhooks/clerk',
        method: 'POST',
        success: false,
      });

      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // Parse the verified payload
    const event = verification.payload as ClerkWebhookEvent;

    // Log successful verification
    logWebhookEvent('clerk', 'verified', {
      eventType: event.type,
      webhookId: headers['svix-id'],
    });

    // Handle the event based on type
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;

      case 'user.updated':
        await handleUserUpdated(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;

      case 'session.created':
      case 'session.ended':
      case 'session.removed':
        // Log session events for security monitoring
        console.info(`[Clerk Webhook] Session event: ${event.type}`);
        break;

      default:
        console.info(`[Clerk Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Clerk Webhook] Error processing webhook:', error);

    // Log the error
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
 *
 * Health check endpoint for webhook configuration verification.
 * Returns 405 Method Not Allowed as webhooks should only use POST.
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
