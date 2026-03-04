/**
 * useProjectNameSync — Bidirectional project name sync between Convex and Supabase.
 *
 * - On mount: reads handoff data from localStorage. If Supabase name differs from
 *   Convex conversation name, updates Convex (Supabase is source of truth on load).
 * - On editor rename: updates Convex conversation + project, then syncs to Supabase
 *   via the sync API (fire-and-forget).
 * - Skips the naming onboarding step if a name already exists.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { syncProjectName } from '~/lib/services/projectSyncService';

interface UseProjectNameSyncOptions {
  conversationId: Id<'conversations'> | null;
  projectId: Id<'projects'> | null;
  currentName: string | null;
}

interface UseProjectNameSyncReturn {
  /** Update the project name from the editor — syncs to both Convex and Supabase */
  updateName: (name: string) => Promise<void>;
  /** Whether a valid name exists (can skip naming step) */
  hasName: boolean;
}

export function useProjectNameSync({
  conversationId,
  projectId,
  currentName,
}: UseProjectNameSyncOptions): UseProjectNameSyncReturn {
  const updateConversationState = useMutation(api.conversations.updateState);
  const updateProject = useMutation(api.projects.update);
  const hasSyncedFromSupabase = useRef(false);

  // On mount: sync name FROM Supabase → Convex (if different)
  useEffect(() => {
    if (hasSyncedFromSupabase.current || !conversationId) return;
    hasSyncedFromSupabase.current = true;

    try {
      const handoffDataStr = localStorage.getItem('flowstarter_handoff_data');
      if (!handoffDataStr) return;

      const handoffData = JSON.parse(handoffDataStr);
      const supabaseName = handoffData?.name || handoffData?.projectName;

      if (supabaseName && supabaseName !== currentName && supabaseName !== 'Untitled Project') {
        console.log('[NameSync] Supabase name differs, updating Convex:', supabaseName);
        updateConversationState({
          id: conversationId,
          projectName: supabaseName,
        });
        if (projectId) {
          updateProject({
            projectId,
            name: supabaseName,
          });
        }
      }
    } catch (err) {
      console.warn('[NameSync] Failed to sync from Supabase:', err);
    }
  }, [conversationId, projectId, currentName, updateConversationState, updateProject]);

  // Update name FROM editor → Convex + Supabase
  const updateName = useCallback(
    async (name: string) => {
      if (!conversationId || !name.trim()) return;

      // 1. Update Convex conversation
      await updateConversationState({
        id: conversationId,
        projectName: name,
      });

      // 2. Update Convex project
      if (projectId) {
        await updateProject({
          projectId,
          name,
        });
      }

      // 3. Sync to Supabase (fire-and-forget)
      syncProjectName(name).catch((err) =>
        console.warn('[NameSync] Failed to sync to Supabase:', err)
      );
    },
    [conversationId, projectId, updateConversationState, updateProject]
  );

  const hasName = Boolean(currentName && currentName.trim() && currentName !== 'Untitled Project' && currentName !== 'New Project');

  return { updateName, hasName };
}
