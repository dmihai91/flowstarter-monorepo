'use server';
import {
  useServerSupabase,
  useServerSupabaseWithAuth,
} from '@/hooks/useServerSupabase';
import {
  fetchReviewArtifacts,
  upsertReviewArtifacts,
} from '@/lib/convex-review-artifacts';
import { authActionClient } from '@/lib/safe-action';
import { Table } from '@/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PROJECT_LIST_SELECT } from '@/lib/projects/project-list-columns';

const insertProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be at most 80 characters')
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 .&'-]*[A-Za-z0-9]$/,
      'Name can include letters, numbers, spaces, hyphens, apostrophes, periods, and &'
    ),
  description: z.string(),
  chat: z.string(),
  domain_type: z.enum(['custom', 'hosted']).optional(),
  domain_name: z.string().optional(),
  domain_provider: z.string().optional(),
  generated_code: z.string().optional(),
  generated_files: z
    .array(z.object({ path: z.string(), content: z.string() }))
    .optional(),
  preview_html: z.string().optional(),
  quality_metrics: z.unknown().optional(),
  data: z.string().optional(),
});

function hasGenerationArtifactFields(input: {
  generated_code?: string | null;
  generated_files?: Array<{ path: string; content: string }> | null;
  preview_html?: string | null;
  quality_metrics?: unknown;
}): boolean {
  return Boolean(
    (input.generated_code && input.generated_code.length > 0) ||
      (input.preview_html && input.preview_html.length > 0) ||
      (input.generated_files && input.generated_files.length > 0) ||
      input.quality_metrics !== undefined
  );
}

export const insertProjectAction = authActionClient
  .schema(insertProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabaseClient = useServerSupabase();
    const {
      generated_code,
      generated_files,
      preview_html,
      quality_metrics,
      ...rowRest
    } = parsedInput;

    const completed = hasGenerationArtifactFields({
      generated_code,
      generated_files,
      preview_html,
      quality_metrics,
    });

    const { data, error } = await supabaseClient
      .from('projects')
      .insert({
        ...rowRest,
        user_id: ctx.userId,
        status: 'active',
        is_draft: false,
        domain_type: parsedInput.domain_type || 'hosted',
        domain_provider: parsedInput.domain_provider || 'platform',
        generation_completed_at: completed ? new Date().toISOString() : null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await upsertReviewArtifacts(
      data.id,
      {
        generated_code: generated_code ?? undefined,
        generated_files: generated_files ?? undefined,
        preview_html: preview_html ?? undefined,
        quality_metrics,
      },
      completed ? data.generation_completed_at : null
    ).catch((err) => {
      console.error(
        '[insertProjectAction] Convex review artifacts failed:',
        err
      );
    });

    revalidatePath('/');
    return data.id;
  });

const deleteProjectSchema = z.object({
  id: z.string().uuid(),
});

export const deleteProjectAction = authActionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput }) => {
    const supabaseClient = await useServerSupabaseWithAuth();
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    return { success: true };
  });

export const getAllProjects = async (): Promise<Array<Table<'projects'>>> => {
  try {
    const supabaseClient = useServerSupabase();
    const { data, error } = await supabaseClient
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if it's a connection error
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed') ||
        error.message?.includes('Connection refused') ||
        error.code === 'NETWORK_ERROR'
      ) {
        console.error('Database connection failed:', error);
        throw new Error('DATABASE_OFFLINE');
      }
      throw error;
    }

    return (data ?? []) as unknown as Array<Table<'projects'>>;
  } catch (error) {
    // If it's our custom database offline error, re-throw it
    if (error instanceof Error && error.message === 'DATABASE_OFFLINE') {
      throw error;
    }

    // For network/connection errors, throw custom error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error when connecting to database:', error);
      throw new Error('DATABASE_OFFLINE');
    }

    // Re-throw other errors as-is
    throw error;
  }
};

export const getProject = async (
  id: string
): Promise<Table<'projects'> | null> => {
  const supabaseClient = useServerSupabase();
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  const artifacts = await fetchReviewArtifacts(id);
  const merged = {
    ...data,
    generated_code: artifacts.generated_code,
    preview_html: artifacts.preview_html,
    generated_files: artifacts.generated_files,
    quality_metrics: artifacts.quality_metrics,
    generation_completed_at:
      data.generation_completed_at ?? artifacts.generation_completed_at,
  } as Table<'projects'>;

  return merged;
};

export const insertProject = async (project: {
  name: string;
  description: string;
  data: string;
  user_id: string;
  domain_type?: 'custom' | 'hosted';
  domain_name?: string;
  domain_provider?: string;
  generated_code?: string;
  generated_files?: Array<{ path: string; content: string }>;
  preview_html?: string;
  quality_metrics?: unknown;
}) => {
  const supabaseClient = useServerSupabase();
  const {
    generated_code,
    generated_files,
    preview_html,
    quality_metrics,
    ...rowRest
  } = project;

  const completed = hasGenerationArtifactFields({
    generated_code,
    generated_files,
    preview_html,
    quality_metrics,
  });

  const { data, error } = await supabaseClient
    .from('projects')
    .insert({
      ...rowRest,
      status: 'active',
      is_draft: false,
      domain_type: project.domain_type || 'hosted',
      domain_provider: project.domain_provider || 'platform',
      generation_completed_at: completed ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await upsertReviewArtifacts(
    data.id,
    {
      generated_code: generated_code ?? undefined,
      generated_files: generated_files ?? undefined,
      preview_html: preview_html ?? undefined,
      quality_metrics,
    },
    completed ? data.generation_completed_at : null
  ).catch((err) => {
    console.error('[insertProject] Convex review artifacts failed:', err);
  });

  const artifacts = await fetchReviewArtifacts(data.id);
  return {
    ...data,
    generated_code: artifacts.generated_code,
    preview_html: artifacts.preview_html,
    generated_files: artifacts.generated_files,
    quality_metrics: artifacts.quality_metrics,
    generation_completed_at:
      data.generation_completed_at ?? artifacts.generation_completed_at,
  } as typeof data;
};
