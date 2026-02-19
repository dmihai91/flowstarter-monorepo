import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_slug?: string;
  git_url?: string;
  git_branch?: string;
  netlify_site_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data as ProjectRecord;
}

export async function getProjectsByUserId(userId: string): Promise<ProjectRecord[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data as ProjectRecord[];
}

export async function createProject(project: Omit<ProjectRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectRecord | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data as ProjectRecord;
}

export async function updateProject(projectId: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return data as ProjectRecord;
}
