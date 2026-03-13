/**
 * useSupabaseSync — Syncs editor state changes to Supabase via the project sync API.
 *
 * Uses refs to avoid stale closures in the callback.
 * Includes an initial name sync effect for when the Supabase link is first established.
 * Retries failed syncs with exponential backoff.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Id } from '../../../../convex/_generated/dataModel';
import type { InitialChatState } from '~/components/editor/editor-chat/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SupabaseSync');

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // exponential-ish backoff

interface UseSupabaseSyncOptions {
  supabaseProjectId: string | null | undefined;
  convexProjectId: Id<'projects'> | null;
  conversationName: string | null | undefined;
}

interface SyncPayload {
  action: 'create' | 'update';
  projectData: Record<string, unknown>;
}

/**
 * Send a sync request with retry logic.
 * Returns the response JSON on success, or null after all retries exhausted.
 */
async function syncWithRetry(
  payload: SyncPayload,
  attempt = 0,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch('/api/project/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (attempt > 0) {
        logger.info(`Sync succeeded after ${attempt + 1} attempts`);
      }
      return data as Record<string, unknown>;
    }

    // Auth errors (401/403) won't resolve with retries
    if (res.status === 401 || res.status === 403) {
      logger.error(`Sync ${payload.action} failed: ${res.status} (auth error, not retrying)`);
      return null;
    }

    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] || 10000;
      logger.warn(`Sync ${payload.action} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms:`, e);
      await new Promise(resolve => setTimeout(resolve, delay));
      return syncWithRetry(payload, attempt + 1);
    }

    logger.error(`Sync ${payload.action} failed after ${MAX_RETRIES + 1} attempts:`, e);
    return null;
  }
}

/**
 * Sync a state change to Supabase (update existing project).
 */
function syncUpdate(supabaseId: string, state: Partial<InitialChatState>): void {
  syncWithRetry({
    action: 'update',
    projectData: {
      supabaseProjectId: supabaseId,
      name: state.projectName || undefined,
      description: state.projectDescription || undefined,
      templateId: state.selectedTemplateId || undefined,
      businessInfo: state.businessInfo || undefined,
    },
  });
}

/**
 * Sync a new project to Supabase (create).
 * Returns a promise that resolves with the new supabaseProjectId, or null on failure.
 */
async function syncCreate(
  convexId: string,
  name: string,
  state: Partial<InitialChatState>,
): Promise<string | null> {
  const result = await syncWithRetry({
    action: 'create',
    projectData: {
      convexProjectId: convexId,
      name,
      description: state.projectDescription || '',
      templateId: state.selectedTemplateId || undefined,
      businessInfo: state.businessInfo || undefined,
    },
  });

  if (result?.supabaseProjectId) {
    logger.info('Project created in Supabase:', result.supabaseProjectId);
    return result.supabaseProjectId as string;
  }

  return null;
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
  const createInFlightRef = useRef(false);

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
      // Guard against duplicate creates with createInFlightRef
      if (currentConvexId && !createInFlightRef.current) {
        const name = state.projectName || conversationNameRef.current;

        if (name) {
          createInFlightRef.current = true;
          syncCreate(String(currentConvexId), name, state)
            .then(newId => {
              if (newId) {
                supabaseIdRef.current = newId;
              }
            })
            .finally(() => {
              createInFlightRef.current = false;
            });
        }
      }
    },
    [], // Stable identity — uses refs internally
  );

  return { syncStateToSupabase };
}
