import 'server-only';
import { requireAuth } from '@/lib/api-auth';
import { loadLibraryTemplateRegistry } from '@/lib/flowstarter-engine/library-template-registry';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHmac } from 'crypto';
import {
  createAssemblySpec,
  createContentMap,
  normalizeProjectBrief,
  selectTemplate,
  validateFlowstarterArtifacts,
} from '@flowstarter/editor-engine';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://editor.flowstarter.dev'
    : 'http://localhost:5173');

const HANDOFF_SECRET =
  process.env.HANDOFF_SECRET || process.env.NEXT_PUBLIC_HANDOFF_SECRET || '';

if (!HANDOFF_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('HANDOFF_SECRET env var is required in production');
}

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ||
  (process.env.NEXT_PUBLIC_CONVEX_URL || '').replace('.convex.cloud', '.convex.site');

// ─── Token helpers ────────────────────────────────────────────────────────────

export interface HandoffPayload {
  projectId: string;
  userId: string;
  conversationId?: string;
  iat: number;
  exp: number;
  project: {
    id: string;
    name: string;
    description: string;
    data: Record<string, unknown>;
  };
}

/**
 * Create a self-contained HMAC-signed handoff token.
 * Format: base64url(json) + "." + base64url(hmac_sha256)
 * No server-side storage needed — validated by signature + expiry.
 * TTL: 15 minutes.
 */
export function createHandoffToken(payload: Omit<HandoffPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const full: HandoffPayload = {
    ...payload,
    iat: now,
    exp: now + 900, // 15 minutes
  };
  const data = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = createHmac('sha256', HANDOFF_SECRET || 'dev-secret')
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Validate and decode a handoff token.
 * Returns the payload or null if invalid/expired.
 */
export function verifyHandoffToken(token: string): HandoffPayload | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;

    const expectedSig = createHmac('sha256', HANDOFF_SECRET || 'dev-secret')
      .update(data)
      .digest('base64url');

    // Constant-time comparison
    if (sig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as HandoffPayload;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Request schema ───────────────────────────────────────────────────────────

const handoffBodySchema = z
  .object({
    projectId: z.string().uuid().optional(),
    projectConfig: z
      .object({
        name: z.string().optional().default(''),
        projectName: z.string().optional(),
        description: z.string().optional().default(''),
        userDescription: z.string().optional(),
        industry: z.string().optional(),
        platformType: z.string().optional(),
        template: z
          .object({
            id: z.string(),
            name: z.string().optional(),
          })
          .optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientPhone: z.string().optional(),
        businessInfo: z
          .object({
            description: z.string().optional(),
            uvp: z.string().optional(),
            targetAudience: z.string().optional(),
            industry: z.string().optional(),
            goal: z.string().optional(),
            offerType: z.string().optional(),
            brandTone: z.string().optional(),
            offerings: z.string().optional(),
            contactEmail: z.string().optional(),
            contactPhone: z.string().optional(),
            contactAddress: z.string().optional(),
          })
          .optional(),
        flowstarterEngine: z
          .object({
            projectBrief: z.record(z.unknown()),
            templateSelection: z.record(z.unknown()),
            assemblySpec: z.record(z.unknown()),
            contentMap: z.record(z.unknown()),
            validationReport: z.record(z.unknown()),
          })
          .optional(),
        contactInfo: z
          .object({
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    mode: z.enum(['interactive', 'generate']).optional().default('interactive'),
  })
  .refine((d) => d.projectId || d.projectConfig, {
    message: 'Either projectId or projectConfig is required',
  });

// ─── GET /api/editor/handoff?token=xxx ───────────────────────────────────────
// Validates a handoff token and returns the embedded project data.
// Used by the editor's /api/handoff/validate proxy.

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 });
  }

  const payload = verifyHandoffToken(token);
  if (!payload) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    projectId: payload.projectId,
    userId: payload.userId,
    project: payload.project,
  });
}

// ─── POST /api/editor/handoff ─────────────────────────────────────────────────
// Creates or retrieves a project draft in Supabase, then issues a signed
// handoff token that embeds the project data for self-contained validation.

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { userId } = authResult;
  const supabase = createSupabaseServiceRoleClient();

  try {
    const body = await request.json();
    const parsed = handoffBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, projectConfig, mode } = parsed.data;
    let resolvedProjectId: string;
    let projectName: string;
    let projectDescription: string;
    let projectData: Record<string, unknown>;
    let selectedTemplateSlug: string | null = null;

    if (projectId) {
      // ── Existing project handoff ──
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, name, description, data')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      resolvedProjectId = project.id;
      projectName = project.name;
      projectDescription = project.description ?? '';
      try {
        projectData = typeof project.data === 'string'
          ? JSON.parse(project.data)
          : (project.data as unknown as Record<string, unknown>) ?? {};
      } catch {
        projectData = {};
      }
    } else if (projectConfig) {
      // ── New draft project ──
      projectName =
        projectConfig.projectName ||
        projectConfig.name ||
        projectConfig.clientName ||
        'New Project';

      projectDescription =
        projectConfig.description ||
        projectConfig.businessInfo?.description ||
        '';

      projectData = {
        userDescription: projectConfig.userDescription,
        industry: projectConfig.industry || projectConfig.businessInfo?.industry,
        businessInfo: projectConfig.businessInfo,
        template: projectConfig.template,
        flowstarterEngine: projectConfig.flowstarterEngine,
        contactInfo: projectConfig.contactInfo,
        client: {
          name: projectConfig.clientName,
          email: projectConfig.clientEmail,
          phone: projectConfig.clientPhone,
        },
        mode,
      };

      const projectBrief = normalizeProjectBrief({
        source: 'concierge',
        projectName,
        summary: projectDescription,
        industry:
          projectConfig.industry || projectConfig.businessInfo?.industry || 'other',
        targetAudience: projectConfig.businessInfo?.targetAudience,
        valueProposition: projectConfig.businessInfo?.uvp,
        brandTone: projectConfig.businessInfo?.brandTone,
        offerType: projectConfig.businessInfo?.offerType,
        offerings: projectConfig.businessInfo?.offerings,
        goals: projectConfig.businessInfo?.goal,
        platformType: projectConfig.platformType,
        preferredTemplateSlug: projectConfig.template?.id,
        contact: {
          email:
            projectConfig.contactInfo?.email ||
            projectConfig.businessInfo?.contactEmail,
          phone:
            projectConfig.contactInfo?.phone ||
            projectConfig.businessInfo?.contactPhone,
          address:
            projectConfig.contactInfo?.address ||
            projectConfig.businessInfo?.contactAddress,
        },
        client: {
          name: projectConfig.clientName,
          email: projectConfig.clientEmail,
          phone: projectConfig.clientPhone,
        },
        raw: projectData,
      });
      const templateRegistry = await loadLibraryTemplateRegistry();
      const templateSelection = selectTemplate(
        projectBrief,
        templateRegistry,
        projectConfig.template?.id
      );
      const assemblySpec = createAssemblySpec(
        projectBrief,
        templateSelection,
        templateRegistry
      );
      const contentMap = createContentMap(projectBrief, assemblySpec);
      const validationReport = validateFlowstarterArtifacts({
        projectBrief,
        templateSelection,
        assemblySpec,
        contentMap,
        registry: templateRegistry,
      });

      selectedTemplateSlug = templateSelection.templateSlug;
      projectData = {
        ...projectData,
        projectBrief,
        templateSelection,
        assemblySpec,
        contentMap,
        validationReport,
      };

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.slice(0, 80),
          description: projectDescription.slice(0, 5000),
          data: JSON.stringify(projectData),
          template_id:
            selectedTemplateSlug ||
            projectConfig.template?.id ||
            ((projectConfig.flowstarterEngine?.templateSelection as { selectedTemplateId?: string } | undefined)
              ?.selectedTemplateId ?? null),
          user_id: userId,
          status: 'draft',
          is_draft: true,
          template_slug: selectedTemplateSlug,
          domain_type: 'hosted',
          domain_provider: 'platform',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Editor Handoff] Insert error:', error);
        return NextResponse.json({ error: 'Failed to create project draft' }, { status: 500 });
      }

      resolvedProjectId = newProject.id;
    } else {
      return NextResponse.json(
        { error: 'Either projectId or projectConfig is required' },
        { status: 400 }
      );
    }

    // Pre-initialize Convex project + conversation so the editor can navigate instantly
    let conversationId: string | undefined;
    if (CONVEX_SITE_URL) {
      try {
        const bi = (projectData?.businessInfo ?? {}) as Record<string, unknown>;
        const client = (projectData?.client ?? {}) as Record<string, unknown>;
        const ci = (projectData?.contactInfo ?? {}) as Record<string, unknown>;
        const hasBusinessData = !!(bi?.uvp || bi?.industry || bi?.pricingOffers);
        const convexRes = await fetch(`${CONVEX_SITE_URL}/handoff/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-handoff-secret': HANDOFF_SECRET || 'dev-secret' },
          body: JSON.stringify({
            supabaseProjectId: resolvedProjectId,
            projectName: projectName!,
            projectDescription: projectDescription!,
            businessInfo: {
              description: bi.description,
              uvp: bi.uvp,
              targetAudience: bi.targetAudience,
              industry: bi.industry,
              brandTone: bi.brandTone,
              businessType: bi.offerType,
              businessGoals: bi.goal ? [bi.goal] : undefined,
              sellingMethod: bi.sellingMethod,
              pricingOffers: bi.offerings,
              contactEmail: (bi.contactEmail as string) || (client.email as string) || (ci.email as string),
              contactPhone: (bi.contactPhone as string) || (client.phone as string) || (ci.phone as string),
              contactAddress: (bi.contactAddress as string) || (ci.address as string),
              website: (bi.website as string) || (ci.website as string),
            },
            step: hasBusinessData ? 'template' : (projectName && projectName !== 'Untitled Project' ? 'describe' : 'welcome'),
          }),
        });
        if (convexRes.ok) {
          const convexData = await convexRes.json() as { conversationId?: string };
          conversationId = convexData.conversationId;
        }
      } catch (e) {
        // Non-fatal — editor will initialize itself as fallback
        console.warn('[Editor Handoff] Convex pre-init failed:', e);
      }
    }

    // Issue a self-contained signed token — no server-side storage needed
    const token = createHandoffToken({
      projectId: resolvedProjectId,
      userId,
      conversationId,
      project: {
        id: resolvedProjectId,
        name: projectName!,
        description: projectDescription!,
        data: projectData!,
      },
    });

    const editorUrl = conversationId
      ? `${EDITOR_URL}/project/${conversationId}`
      : `${EDITOR_URL}?handoff=${encodeURIComponent(token)}`;

    console.info('[Editor Handoff] Token issued', { userId, projectId: resolvedProjectId, mode, conversationId });

    return NextResponse.json({
      success: true,
      projectId: resolvedProjectId,
      conversationId,
      token,
      editorUrl,
    });
  } catch (error) {
    console.error('[Editor Handoff] Error:', error);
    return NextResponse.json({ error: 'Handoff failed' }, { status: 500 });
  }
}
