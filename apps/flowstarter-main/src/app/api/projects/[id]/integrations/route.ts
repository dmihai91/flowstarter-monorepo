/**
 * GET  /api/projects/:id/integrations  — read integration status (no secrets)
 * POST /api/projects/:id/integrations  — save keys (encrypted via Vault)
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';

const CalendlySchema = z.object({
  integration: z.literal('calendly'),
  action: z.enum(['connect', 'disconnect']).optional(),
  calendlyUrl: z.string().url().optional(),
  calendlyApiKey: z.string().max(500).optional(),
});

const AnalyticsSchema = z.object({
  integration: z.literal('analytics'),
  action: z.enum(['connect', 'disconnect']).optional(),
  gaPropertyId: z.string().max(50).optional(),
});

const MailchimpSchema = z.object({
  integration: z.literal('mailchimp'),
  action: z.enum(['connect', 'disconnect']).optional(),
  apiKey: z.string().max(500).optional(),
  audienceId: z.string().max(100).optional(),
});

const StripeSchema = z.object({
  integration: z.literal('stripe'),
  action: z.enum(['connect', 'disconnect']).optional(),
  publishableKey: z.string().max(500).optional(),
  priceId: z.string().max(100).optional(),
});

const IntegrationBodySchema = z.discriminatedUnion('integration', [
  CalendlySchema,
  AnalyticsSchema,
  MailchimpSchema,
  StripeSchema,
]);
import {
  buildProjectIntegrationUpdate,
  readProjectIntegrationSnapshot,
} from '@/lib/project-integrations';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { storeSecret, deleteSecret } from '@/lib/vault';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  const { userId } = authResult;
  const { id } = await context.params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!project)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = readProjectIntegrationSnapshot(
    project as Record<string, unknown>
  );

  // Return status without exposing secrets
  return NextResponse.json({
    analytics: {
      connected: !!snapshot.analytics.refreshTokenSecretId,
      propertyId: snapshot.analytics.propertyId,
      connectedAt: snapshot.analytics.connectedAt,
    },
    calendly: {
      url: snapshot.calendly.url,
      hasApiKey: !!snapshot.calendly.apiKeySecretId,
    },
    domain: {
      publishedUrl: snapshot.domain.publishedUrl,
      customDomain: snapshot.domain.customDomain,
      status: snapshot.domain.status || 'none',
    },
    mailchimp: {
      connected: !!snapshot.mailchimp.apiKeySecretId,
      audienceId: snapshot.mailchimp.audienceId,
    },
    stripe: {
      connected: !!snapshot.stripe.publishableKeySecretId,
      priceId: snapshot.stripe.priceId,
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  const { userId } = authResult;
  const { id: projectId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = IntegrationBodySchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parseResult.data;
  const supabase = createSupabaseServiceRoleClient();

  // Verify project exists
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!project)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = readProjectIntegrationSnapshot(
    project as Record<string, unknown>
  );

  if (body.integration === 'calendly') {
    if (body.action === 'disconnect') {
      // Delete vault secret + clear columns
      if (snapshot.calendly.apiKeySecretId) {
        await deleteSecret(supabase, snapshot.calendly.apiKeySecretId);
      }
      await supabase
        .from('projects')
        .update(
          buildProjectIntegrationUpdate(project as Record<string, unknown>, {
            calendly: {
              url: null,
              apiKeySecretId: null,
            },
          })
        )
        .eq('id', projectId);

      return NextResponse.json({
        success: true,
        message: 'Calendly disconnected',
      });
    }

    const update: Record<string, unknown> = {};
    if (body.calendlyUrl) update.calendly_url = body.calendlyUrl;

    // Encrypt API key in Vault
    if (body.calendlyApiKey) {
      const secretId = await storeSecret(
        supabase,
        projectId,
        'calendly_api_key',
        body.calendlyApiKey,
        'Calendly Personal Access Token'
      );
      update.calendly_api_key_id = secretId;
    }

    if (Object.keys(update).length > 0) {
      await supabase
        .from('projects')
        .update(
          buildProjectIntegrationUpdate(project as Record<string, unknown>, {
            calendly: {
              url:
                body.calendlyUrl !== undefined
                  ? body.calendlyUrl
                  : snapshot.calendly.url,
              apiKeySecretId:
                update.calendly_api_key_id !== undefined
                  ? String(update.calendly_api_key_id)
                  : snapshot.calendly.apiKeySecretId,
            },
          })
        )
        .eq('id', projectId);
    }

    return NextResponse.json({
      success: true,
      message: 'Calendly settings saved',
    });
  }

  if (body.integration === 'analytics') {
    if (body.action === 'disconnect') {
      if (snapshot.analytics.refreshTokenSecretId) {
        await deleteSecret(supabase, snapshot.analytics.refreshTokenSecretId);
      }
      await supabase
        .from('projects')
        .update(
          buildProjectIntegrationUpdate(project as Record<string, unknown>, {
            analytics: {
              propertyId: null,
              refreshTokenSecretId: null,
              connectedAt: null,
            },
          })
        )
        .eq('id', projectId);

      return NextResponse.json({
        success: true,
        message: 'Analytics disconnected',
      });
    }

    if (body.gaPropertyId) {
      await supabase
        .from('projects')
        .update(
          buildProjectIntegrationUpdate(project as Record<string, unknown>, {
            analytics: {
              propertyId: body.gaPropertyId,
              refreshTokenSecretId: snapshot.analytics.refreshTokenSecretId,
              connectedAt: snapshot.analytics.connectedAt,
            },
          })
        )
        .eq('id', projectId);
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics settings saved',
    });
  }

  if (body.integration === 'mailchimp') {
    if (body.action === 'disconnect') {
      if (snapshot.mailchimp.apiKeySecretId) {
        await deleteSecret(supabase, snapshot.mailchimp.apiKeySecretId);
      }
      await supabase
        .from('projects')
        .update(buildProjectIntegrationUpdate(project as Record<string, unknown>, {
          mailchimp: { apiKeySecretId: null, audienceId: null },
        }))
        .eq('id', projectId);
      return NextResponse.json({ success: true, message: 'Mailchimp disconnected' });
    }

    let secretId = snapshot.mailchimp.apiKeySecretId;
    if (body.apiKey) {
      secretId = await storeSecret(supabase, projectId, 'mailchimp_api_key', body.apiKey, 'Mailchimp API key');
    }
    await supabase
      .from('projects')
      .update(buildProjectIntegrationUpdate(project as Record<string, unknown>, {
        mailchimp: {
          apiKeySecretId: secretId,
          audienceId: body.audienceId ?? snapshot.mailchimp.audienceId,
        },
      }))
      .eq('id', projectId);
    return NextResponse.json({ success: true, message: 'Mailchimp settings saved' });
  }

  if (body.integration === 'stripe') {
    if (body.action === 'disconnect') {
      if (snapshot.stripe.publishableKeySecretId) {
        await deleteSecret(supabase, snapshot.stripe.publishableKeySecretId);
      }
      await supabase
        .from('projects')
        .update(buildProjectIntegrationUpdate(project as Record<string, unknown>, {
          stripe: { publishableKeySecretId: null, priceId: null },
        }))
        .eq('id', projectId);
      return NextResponse.json({ success: true, message: 'Stripe disconnected' });
    }

    let pkSecretId = snapshot.stripe.publishableKeySecretId;
    if (body.publishableKey) {
      pkSecretId = await storeSecret(supabase, projectId, 'stripe_publishable_key', body.publishableKey, 'Stripe publishable key');
    }
    await supabase
      .from('projects')
      .update(buildProjectIntegrationUpdate(project as Record<string, unknown>, {
        stripe: {
          publishableKeySecretId: pkSecretId,
          priceId: body.priceId ?? snapshot.stripe.priceId,
        },
      }))
      .eq('id', projectId);
    return NextResponse.json({ success: true, message: 'Stripe settings saved' });
  }

  return NextResponse.json({ error: 'Unknown integration' }, { status: 400 });
}
