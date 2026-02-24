/**
 * Project Sync Service
 * 
 * Syncs project state to Supabase for persistence and dashboard visibility.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  status?: 'draft' | 'generating' | 'completed' | 'published';
  data?: Record<string, unknown>; // Project content/state
  convexSessionId?: string;
}

export interface SaveResult {
  success: boolean;
  error?: string;
  projectId?: string;
}

/**
 * Save or update a project in Supabase
 */
export async function saveProject(
  userId: string,
  project: ProjectData
): Promise<SaveResult> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[ProjectSync] Supabase not configured, skipping save');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const projectRecord = {
      id: project.id,
      user_id: userId,
      name: project.name,
      description: project.description || null,
      template_id: project.templateId || null,
      status: project.status || 'draft',
      data: project.data ? JSON.stringify(project.data) : null,
      convex_session_id: project.convexSessionId || null,
      is_draft: project.status !== 'published',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .upsert(projectRecord, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      console.error('[ProjectSync] Save error:', error);
      return { success: false, error: error.message };
    }

    console.log('[ProjectSync] Project saved:', data?.id);
    return { success: true, projectId: data?.id };
  } catch (err) {
    console.error('[ProjectSync] Unexpected error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Load a project from Supabase
 */
export async function loadProject(projectId: string): Promise<ProjectData | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[ProjectSync] Supabase not configured, skipping load');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('[ProjectSync] Load error:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      templateId: data.template_id || undefined,
      status: data.status || 'draft',
      data: data.data ? JSON.parse(data.data) : undefined,
      convexSessionId: data.convex_session_id || undefined,
    };
  } catch (err) {
    console.error('[ProjectSync] Unexpected error:', err);
    return null;
  }
}

/**
 * List projects for a user
 */
export async function listProjects(userId: string): Promise<ProjectData[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[ProjectSync] Supabase not configured, returning empty list');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ProjectSync] List error:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      templateId: row.template_id || undefined,
      status: row.status || 'draft',
      data: row.data ? JSON.parse(row.data) : undefined,
      convexSessionId: row.convex_session_id || undefined,
    }));
  } catch (err) {
    console.error('[ProjectSync] Unexpected error:', err);
    return [];
  }
}

/**
 * Delete a project from Supabase
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[ProjectSync] Supabase not configured, skipping delete');
    return false;
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('[ProjectSync] Delete error:', error);
      return false;
    }

    console.log('[ProjectSync] Project deleted:', projectId);
    return true;
  } catch (err) {
    console.error('[ProjectSync] Unexpected error:', err);
    return false;
  }
}

/**
 * Create auto-save hook for project changes
 * Debounces saves to avoid excessive writes
 */
export function createAutoSave(userId: string, debounceMs = 2000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSavedData: string | null = null;

  return {
    save: (project: ProjectData) => {
      // Clear pending save
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check if data actually changed
      const dataString = JSON.stringify(project);
      if (dataString === lastSavedData) {
        return; // No changes, skip save
      }

      // Schedule save
      timeoutId = setTimeout(async () => {
        const result = await saveProject(userId, project);
        if (result.success) {
          lastSavedData = dataString;
        }
      }, debounceMs);
    },

    saveNow: async (project: ProjectData) => {
      // Clear pending save
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const result = await saveProject(userId, project);
      if (result.success) {
        lastSavedData = JSON.stringify(project);
      }
      return result;
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
