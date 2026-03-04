/**
 * useSupabaseSync — Syncs editor state changes to Supabase via the project sync API.
 *
 * Uses refs to avoid stale closures in the callback.
 * Includes an initial name sync effect for when the Supabase link is first established.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Id } from '../../../../convex/_generated/dataModel';
import type { InitialChatState } from '~/components/editor/editor-chat/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SupabaseSync');

interface UseSupabaseSyncOptions {
  supabaseProjectId: string | null | undefined;
  convexProjectId: Id<'projects'> | null;
  conversationName: string | null | undefined;
}

/**
 * Sync a state change to Supabase (update existing or create new project).
 */
function syncUpdate(supabaseId: string, state: Partial<InitialChatState>): void {
  fetch('/api/project/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      projectData: {
        supabaseProjectId: supabaseId,
        name: state.projectName || undefined,
        description: state.projectDescription || undefined,
        templateId: state.selectedTemplateId || undefined,
        businessInfo: state.businessInfo || undefined,
      },
    }),
  }).catch(e => logger.warn('Update failed:', e));
}

function syncCreate(convexId: string, name: string, state: Partial<InitialChatState>): void {
  fetch('/api/project/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      projectData: {
        convexProjectId: convexId,
        name,
        description: state.projectDescription || '',
        templateId: state.selectedTemplateId || undefined,
        businessInfo: state.businessInfo || undefined,
      },
    }),
  }).catch(e => logger.warn('Create failed:', e));
}

export function useSupabaseSync({
  supabaseProjectId,
  convexProjectId,
  conversationName,
}: UseSupabaseSyncOptions) {
  // Refs to avoid stale closures in the callback
  const supabaseIdRef = useRef(supabaseProjectId ?? null);
  const convexProjectIdRef = useRef(convexProjectId);
  const conversationNameRef = useRef(conversationName ?? null);

  useEffect(() => { supabaseIdRef.current = supabaseProjectId ?? null; }, [supabaseProjectId]);
  useEffect(() => { convexProjectIdRef.current = convexProjectId; }, [convexProjectId]);
  useEffect(() => { conversationNameRef.current = conversationName ?? null; }, [conversationName]);

  // Sync name to Supabase when the link is first established
  const hasSyncedInitialName = useRef(false);

  useEffect(() => {
    if (!supabaseProjectId || !conversationName || hasSyncedInitialName.current) {
      return;
    }

    hasSyncedInitialName.current = true;
    syncUpdate(supabaseProjectId, { projectName: conversationName });
  }, [supabaseProjectId, conversationName]);

  /** Push a state change delta to Supabase */
  const syncStateToSupabase = useCallback(
    (state: Partial<InitialChatState>) => {
      const supabaseId = supabaseIdRef.current;
      const currentConvexId = convexProjectIdRef.current;

      if (supabaseId) {
        syncUpdate(supabaseId, state);
        return;
      }

      // No Supabase project yet — create one (use conversation name as fallback)
      if (currentConvexId) {
        const name = state.projectName || conversationNameRef.current;

        if (name) {
          syncCreate(String(currentConvexId), name, state);
        }
      }
    },
    [], // Stable identity — uses refs internally
  );

  return { syncStateToSupabase };
}
