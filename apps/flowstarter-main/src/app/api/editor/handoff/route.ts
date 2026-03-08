import { requireAuthWithSupabase } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://editor.flowstarter.dev'
    : 'http://localhost:5173');

const handoffBodySchema = z
  .object({
    /** Existing project to hand off to the editor */
    projectId: z.string().uuid().optional(),
    /** Config for a new draft project */
    projectConfig: z
      .object({
        name: z.string().optional().default(''),
        projectName: z.string().optional(),
        description: z.string().optional().default(''),
        userDescription: z.string().optional(),
        industry: z.string().optional(),
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

/**
 * POST /api/editor/handoff
 *
 * Creates or retrieves a project draft in Supabase, then returns an editor URL
 * with a handoff token so the editor app can load the project context.
 *
 * Two modes:
 * 1. New project: `projectConfig` provided — creates a draft row in `projects`.
 * 2. Existing project: `projectId` provided — verifies ownership and returns handoff.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuthWithSupabase();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { userId, supabase } = authResult;

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

    if (projectId) {
      // ── Existing project handoff ──
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      if (project.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      resolvedProjectId = project.id;
    } else if (projectConfig) {
      // ── New draft project ──
      const projectName =
        projectConfig.projectName ||
        projectConfig.name ||
        projectConfig.clientName ||
        'Untitled Project';

      const projectDescription =
        projectConfig.description ||
        projectConfig.businessInfo?.description ||
        '';

      // Store the full enriched config as JSON in the `data` column
      const enrichedData = JSON.stringify({
        userDescription: projectConfig.userDescription,
        industry: projectConfig.industry || projectConfig.businessInfo?.industry,
        businessInfo: projectConfig.businessInfo,
        contactInfo: projectConfig.contactInfo,
        clientName: projectConfig.clientName,
        clientEmail: projectConfig.clientEmail,
        clientPhone: projectConfig.clientPhone,
        mode,
      });

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.slice(0, 80),
          description: projectDescription.slice(0, 5000),
          data: enrichedData,
          user_id: userId,
          status: 'draft',
          is_draft: true,
          domain_type: 'hosted',
          domain_provider: 'platform',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Editor Handoff] Insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create project draft' },
          { status: 500 }
        );
      }

      resolvedProjectId = newProject.id;
    } else {
      return NextResponse.json(
        { error: 'Either projectId or projectConfig is required' },
        { status: 400 }
      );
    }

    // Generate a short-lived handoff token
    const token = randomBytes(32).toString('base64url');

    const editorUrl = `${EDITOR_URL}?handoff=${token}&projectId=${resolvedProjectId}`;

    console.info('[Editor Handoff] Success', {
      userId,
      projectId: resolvedProjectId,
      mode,
    });

    return NextResponse.json({
      success: true,
      projectId: resolvedProjectId,
      token,
      editorUrl,
    });
  } catch (error) {
    console.error('[Editor Handoff] Error:', error);
    return NextResponse.json(
      { error: 'Handoff failed' },
      { status: 500 }
    );
  }
}
