import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getAuth } from '@clerk/remix/ssr.server';
import { createClient } from '@supabase/supabase-js';
import { PREDEFINED_PALETTES } from '~/lib/config/palettes';
import { PREDEFINED_FONT_PAIRINGS } from '~/lib/config/fonts';

interface CreateFromTemplateBody {
  template_slug?: string;
  template_name?: string;
  palette_id?: string;
  font_pairing_id?: string;
  project_name?: string;
  client_name?: string;
  business_description?: string;
  email?: string;
  phone?: string;
  website?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { userId } = await getAuth({ request } as any);
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateFromTemplateBody | null;
  if (!body) {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const templateSlug = body.template_slug?.trim();
  const paletteId = body.palette_id?.trim();
  const fontPairingId = body.font_pairing_id?.trim();
  const projectName = body.project_name?.trim();
  const businessDescription = body.business_description?.trim();
  const email = body.email?.trim();

  if (!templateSlug || !paletteId || !fontPairingId || !projectName || !businessDescription || !email) {
    return json(
      {
        error:
          'Missing required fields: template_slug, palette_id, font_pairing_id, project_name, business_description, email',
      },
      { status: 400 },
    );
  }

  const palette = PREDEFINED_PALETTES.find((entry) => entry.id === paletteId);
  if (!palette) {
    return json({ error: 'Invalid palette_id' }, { status: 400 });
  }

  const fontPairing = PREDEFINED_FONT_PAIRINGS.find((entry) => entry.id === fontPairingId);
  if (!fontPairing) {
    return json({ error: 'Invalid font_pairing_id' }, { status: 400 });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    const handoffSecret = getRequiredEnv('HANDOFF_SECRET');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase is not configured');
    }
    if (!convexUrl) {
      throw new Error('Convex is not configured');
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL || convexUrl.replace('.convex.cloud', '.convex.site');

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const templateName = body.template_name?.trim() || templateSlug;

    const seededBusinessInfo = {
      description: businessDescription,
      businessType: projectName,
      contactEmail: email,
      contactPhone: body.phone?.trim() || undefined,
      website: body.website?.trim() || undefined,
    };

    const seededData = {
      source: 'use-template',
      client: {
        name: body.client_name?.trim() || undefined,
        email,
        phone: body.phone?.trim() || undefined,
      },
      contactInfo: {
        email,
        phone: body.phone?.trim() || undefined,
        website: body.website?.trim() || undefined,
      },
      businessInfo: seededBusinessInfo,
      templateSeed: {
        templateSlug,
        templateName,
        paletteId,
        fontPairingId,
      },
    };

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: projectName,
        description: businessDescription,
        status: 'draft',
        template_id: templateSlug,
        data: JSON.stringify({
          ...seededData,
          template_slug: templateSlug,
          palette_id: paletteId,
          font_pairing_id: fontPairingId,
        }),
      })
      .select('id')
      .single();

    if (projectError || !project?.id) {
      throw new Error(projectError?.message || 'Failed to create Supabase project');
    }

    const handoffResponse = await fetch(`${convexSiteUrl}/handoff/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-handoff-secret': handoffSecret,
      },
      body: JSON.stringify({
        supabaseProjectId: project.id,
        projectName,
        projectDescription: businessDescription,
        businessInfo: seededBusinessInfo,
        step: 'creating',
        selectedTemplateId: templateSlug,
        selectedTemplateName: templateName,
        selectedPalette: {
          id: palette.id,
          name: palette.name,
          colors: [
            palette.colors.primary,
            palette.colors.secondary,
            palette.colors.accent,
            palette.colors.background,
            palette.colors.text,
          ],
        },
        selectedFont: {
          id: fontPairing.id,
          name: fontPairing.name,
          heading: fontPairing.heading.family,
          body: fontPairing.body.family,
        },
      }),
    });

    const handoffPayload = (await handoffResponse.json().catch(() => ({}))) as {
      conversationId?: string;
      error?: string;
    };

    if (!handoffResponse.ok || !handoffPayload.conversationId) {
      throw new Error(handoffPayload.error || 'Failed to initialize editor handoff');
    }

    return json({
      success: true,
      projectId: project.id,
      conversationId: handoffPayload.conversationId,
    });
  } catch (error) {
    console.error('[api.project.create-from-template] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
