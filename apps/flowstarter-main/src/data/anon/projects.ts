'use server';
import { useServerSupabase } from '@/hooks/useServerSupabase';
import { authActionClient } from '@/lib/safe-action';
import { Table } from '@/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const getAllProjects = async (): Promise<Array<Table<'projects'>>> => {
  const supabase = useServerSupabase();
  const { data, error } = await supabase.from('projects').select('*');

  if (error) {
    throw error;
  }

  return data;
};

export const getProject = async (id: string): Promise<Table<'projects'>> => {
  const supabase = useServerSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const deleteProjectSchema = z.object({
  id: z.string().uuid(),
});

export const deleteProjectAction = authActionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput: { id } }) => {
    const supabaseClient = useServerSupabase();
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .match({ id });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
  });

const insertProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  data: z.string(),
  user_id: z.string(),
});

export const insertProjectAction = authActionClient
  .schema(insertProjectSchema)
  .action(async ({ parsedInput }) => {
    const supabaseClient = useServerSupabase();
    const { data, error } = await supabaseClient
      .from('projects')
      .insert(parsedInput)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/');
    return data.id;
  });
