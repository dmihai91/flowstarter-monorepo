/**
 * Session Restore Hook
 *
 * Restores editor state from Convex on mount.
 * Reconnects to existing workspace if recent, creates new one if expired.
 */

import { useQuery, useMutation } from 'convex/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';

const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface SessionState {
  isRestoring: boolean;
  hasExistingSession: boolean;
  workspaceId: string | null;
  previewUrl: string | null;
  conversationId: string | null;
}

export function useSessionRestore(projectId: string) {
  const [state, setState] = useState<SessionState>({
    isRestoring: true,
    hasExistingSession: false,
    workspaceId: null,
    previewUrl: null,
    conversationId: null,
  });

  const hasRestoredRef = useRef(false);

  const session = useQuery(api.editorSessions.getByProject, {
    projectId: projectId as Id<'projects'>,
  });

  const createOrUpdate = useMutation(api.editorSessions.createOrUpdate);
  const markActive = useMutation(api.editorSessions.markActive);

  // Restore session on mount
  useEffect(() => {
    if (hasRestoredRef.current || session === undefined) return;
    hasRestoredRef.current = true;

    if (session && session.status !== 'expired') {
      const age = Date.now() - session.lastActiveAt;
      const isRecent = age < SESSION_MAX_AGE_MS;

      if (isRecent && session.daytonaWorkspaceId) {
        // Session is recent, reconnect
        setState({
          isRestoring: false,
          hasExistingSession: true,
          workspaceId: session.daytonaWorkspaceId,
          previewUrl: session.previewUrl || null,
          conversationId: session.conversationId
            ? String(session.conversationId)
            : null,
        });

        // Mark as active
        markActive({ sessionId: session._id });
        return;
      }
    }

    // No valid session or expired
    setState({
      isRestoring: false,
      hasExistingSession: false,
      workspaceId: null,
      previewUrl: null,
      conversationId: null,
    });
  }, [session, markActive]);

  const saveSession = useCallback(
    async (data: {
      workspaceId?: string;
      sandboxId?: string;
      previewUrl?: string;
      status?: 'idle' | 'active' | 'generating' | 'paused' | 'expired';
      lastPrompt?: string;
    }) => {
      await createOrUpdate({
        projectId: projectId as Id<'projects'>,
        daytonaWorkspaceId: data.workspaceId,
        sandboxId: data.sandboxId,
        previewUrl: data.previewUrl,
        status: data.status || 'active',
        lastPrompt: data.lastPrompt,
      });
    },
    [projectId, createOrUpdate],
  );

  return {
    ...state,
    saveSession,
  };
}
