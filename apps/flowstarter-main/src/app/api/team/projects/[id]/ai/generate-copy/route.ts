import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  generateSiteCopy,
  type SiteCopyInput,
} from '@/lib/ai/generate-site-copy';

/**
 * POST /api/team/projects/[id]/ai/generate-copy
 *
 * Admin-only AI helper. Takes a workspace's identity + the brief the team
 * captured during the discovery call (description, audience, USP, etc.) and
 * returns first-pass site copy: hero, services, about, final CTA.
 *
 * Body (most optional — but `description` is required if the team hasn't
 * stored a brief elsewhere):
 *   {
 *     businessName?, description, industry?, targetAudience?, uvp?,
 *     goal?, brandTone?, offerings?, locale?
 *   }
 *
 * The team reviews + edits before deploying — AI here is a copy starting
 * point, NOT auto-publishing.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<SiteCopyInput>;

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(
      `id, name, client_business_name, client_name,
       commerce_mode, commerce_product_type, commerce_provider, commerce_notes`
    )
    .eq('id', workspaceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Resolve inputs: caller's body > workspace columns.
  const businessName =
    sanitize(body.businessName) ??
    workspace.client_business_name ??
    workspace.name ??
    '';
  // Workspaces don't have a free-form description column; the team passes the
  // brief in the request body. commerce_notes is a usable fallback for ecom
  // workspaces where the brief is short.
  const description =
    sanitize(body.description) ?? sanitize(workspace.commerce_notes) ?? '';

  if (!businessName || !description) {
    return NextResponse.json(
      {
        error:
          'businessName and description are required (set client_business_name on the workspace and pass description in the body)',
      },
      { status: 400 }
    );
  }

  const input: SiteCopyInput = {
    businessName,
    description,
    industry: sanitize(body.industry),
    targetAudience: sanitize(body.targetAudience),
    uvp: sanitize(body.uvp),
    goal: enumOr(body.goal, ['leads', 'sales', 'bookings'] as const, 'leads'),
    brandTone: enumOr(
      body.brandTone,
      ['professional', 'bold', 'friendly'] as const,
      'professional'
    ),
    offerings: sanitize(body.offerings),
    locale: enumOr(body.locale, ['en', 'ro'] as const, 'en'),
  };

  try {
    const copy = await generateSiteCopy(input);
    return NextResponse.json({ copy, input });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI generation failed' },
      { status: 502 }
    );
  }
}

function sanitize(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function enumOr<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string') return fallback;
  return allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}
