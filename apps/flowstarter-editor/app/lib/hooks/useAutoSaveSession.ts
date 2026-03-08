/**
 * Auto-Save Session Hook
 *
 * Debounced auto-saving of editor state to Convex after each interaction.
 */

import { useMutation } from 'convex/react';
import { useEffect, useRef, useCallback } from 'react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';

interface AutoSaveOptions {
  projectId: string;
  workspaceId: string | null;
  previewUrl: string | null;
  lastPrompt: string | null;
  isGenerating: boolean;
  debounceMs?: number;
}

export function useAutoSaveSession({
  projectId,
  workspaceId,
  previewUrl,
  lastPrompt,
  isGenerating,
  debounceMs = 2000,
}: AutoSaveOptions) {
  const createOrUpdate = useMutation(api.editorSessions.createOrUpdate);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const save = useCallback(() => {
    const stateKey = `${workspaceId}:${previewUrl}:${lastPrompt}:${isGenerating}`;
    if (stateKey === lastSavedRef.current) return;

    lastSavedRef.current = stateKey;

    createOrUpdate({
      projectId: projectId as Id<'projects'>,
      daytonaWorkspaceId: workspaceId || undefined,
      previewUrl: previewUrl || undefined,
      status: isGenerating ? 'generating' : 'active',
      lastPrompt: lastPrompt || undefined,
    }).catch(() => {
      // Silent fail on auto-save
    });
  }, [projectId, workspaceId, previewUrl, lastPrompt, isGenerating, createOrUpdate]);

  // Debounced save on state changes
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [save, debounceMs]);

  // Save immediately on unmount
  useEffect(() => {
    return () => {
      save();
    };
  }, [save]);
}
