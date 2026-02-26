'use client';

import { draftKeys, type DraftShape } from '@/hooks/useDraft';
import { useDraftStore } from '@/store/draft-store';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toSerializableConfig } from './wizard-draft-utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface DraftAutosaveOptions {
  projectConfig: ProjectConfig;
  currentStep: string;
  detailsPhase: string;
  templatePath: string | null;
  showAssistantTransition: boolean;
  isOffline: boolean;
  currentDraftId: string | null | undefined;
  onDraftIdUpdate?: (newId: string) => void;
}

interface DraftAutosaveResult {
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  suppressDraftSave: boolean;
  setSuppressDraftSave: (suppress: boolean) => void;
  lastSavedSnapshotRef: React.MutableRefObject<string | null>;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (date: string | null) => void;
}

/**
 * Hook for debounced autosaving of wizard draft state.
 * Handles change detection, network status, and optimistic cache updates.
 */
export function useDraftAutosave({
  projectConfig,
  currentStep,
  detailsPhase,
  templatePath,
  showAssistantTransition,
  isOffline,
  currentDraftId,
  onDraftIdUpdate,
}: DraftAutosaveOptions): DraftAutosaveResult {
  const queryClient = useQueryClient();
  const { setDraft: setDraftInStore } = useDraftStore();

  const [suppressDraftSave, setSuppressDraftSave] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const draftIdRef = useRef<string | null | undefined>(currentDraftId);
  const pendingSaveRef = useRef<boolean>(false);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);

  // Keep draftIdRef in sync
  useEffect(() => {
    draftIdRef.current = currentDraftId;
  }, [currentDraftId]);

  // Debounced autosave with change guard
  useEffect(() => {
    console.log('[useDraftAutosave] Autosave effect triggered', {
      suppressDraftSave,
      isOffline,
      projectName: projectConfig.name,
    });

    if (suppressDraftSave) {
      console.log('[useDraftAutosave] Skipping save - suppressed');
      return;
    }

    if (isOffline) {
      console.log('[useDraftAutosave] Offline - setting status');
      setSaveStatus('offline');
      return;
    }

    // Don't autosave during template browsing to prevent creating multiple drafts
    const isBrowsingTemplates =
      currentStep === 'template' &&
      (!projectConfig.name || projectConfig.name === 'Untitled Project');

    if (isBrowsingTemplates && !currentDraftId) {
      console.log(
        '[useDraftAutosave] Skipping save - browsing templates without draft'
      );
      return;
    }

    const currentStartedWithTemplate =
      useWizardStore.getState().startedWithTemplate;
    const currentShowSummary = useWizardStore.getState().showSummary;
    const currentReviewState = useWizardStore.getState().reviewState;
    const snapshot = JSON.stringify({
      ...toSerializableConfig(projectConfig),
      currentStep,
      detailsPhase,
      showSummary: currentShowSummary,
      templatePath,
      showAssistantTransition,
      startedWithTemplate: currentStartedWithTemplate,
      reviewState: currentReviewState,
    });

    const hasChanged = lastSavedSnapshotRef.current !== snapshot;
    console.log('[useDraftAutosave] Snapshot comparison', {
      hasChanged,
      lastSavedExists: Boolean(lastSavedSnapshotRef.current),
      snapshotLength: snapshot.length,
    });

    if (!hasChanged) {
      console.log('[useDraftAutosave] Skipping save - no changes detected');
      return;
    }

    console.log('[useDraftAutosave] ✅ Changes detected, will save in 600ms...', {
      hasTemplate: Boolean(projectConfig.template?.id),
      hasName: Boolean(projectConfig.name),
      currentStep,
      detailsPhase,
    });

    // Cancel any pending save timeout
    if (pendingTimeoutRef.current) {
      console.log('[useDraftAutosave] ⏹️ Canceling previous save timeout');
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const timeoutId = setTimeout(async () => {
      console.log('[useDraftAutosave] 🚀 Executing save now...');

      // If a save is already in progress, skip this one
      if (pendingSaveRef.current) {
        console.log(
          '[useDraftAutosave] ⏭️ Skipping save - another save in progress'
        );
        return;
      }

      pendingSaveRef.current = true;
      setSaveStatus('saving');

      const serializableConfig = toSerializableConfig(projectConfig);
      const currentShowSummary = useWizardStore.getState().showSummary;
      const currentReviewState = useWizardStore.getState().reviewState;

      const payload = {
        ...serializableConfig,
        currentStep,
        detailsPhase,
        showSummary: currentShowSummary,
        templatePath,
        showAssistantTransition,
        startedWithTemplate: currentStartedWithTemplate,
        reviewState: currentReviewState,
        entry_mode: useDraftStore.getState().draft?.entry_mode ?? undefined,
      } as unknown & {
        entry_mode?: 'ai' | 'manual';
        currentStep?: 'details' | 'template' | 'design' | 'review';
      };

      console.log('[useDraftAutosave] Payload to save:', {
        name: (payload as { name?: string }).name,
        currentStep: payload.currentStep,
        hasTemplate: Boolean(
          (payload as { template?: { id?: string } }).template?.id
        ),
      });

      const latestDraftId = draftIdRef.current;
      console.log('[useDraftAutosave] Using draft ID for save:', latestDraftId);

      fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: payload,
          projectId: latestDraftId,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to save draft');
          }
          return res.json();
        })
        .then((json) => {
          const returnedDraftId = json.projectId;
          console.log('[useDraftAutosave] ✅ Save successful!', {
            returnedDraftId,
          });

          // Update currentDraftId with the returned ID for subsequent saves
          if (returnedDraftId && returnedDraftId !== latestDraftId) {
            draftIdRef.current = returnedDraftId;
            onDraftIdUpdate?.(returnedDraftId);
            console.log('[useDraftAutosave] Updated draft ID:', returnedDraftId);
          }

          // Update the React Query cache
          const optimistic = {
            id: returnedDraftId || latestDraftId,
            data: JSON.stringify(payload),
            template_id:
              (payload as { template?: { id?: string } }).template?.id ?? null,
            updated_at: new Date().toISOString(),
            entry_mode: payload.entry_mode ?? null,
            current_step: payload.currentStep ?? null,
          } as DraftShape;

          queryClient.setQueryData(
            draftKeys.byProject(returnedDraftId || latestDraftId),
            optimistic
          );

          setDraftInStore(optimistic);

          lastSavedSnapshotRef.current = snapshot;
          setLastSavedAt(new Date().toISOString());
          setSaveStatus('saved');
          pendingSaveRef.current = false;
        })
        .catch((error) => {
          console.error('[useDraftAutosave] ❌ Failed to save draft:', error);
          setSaveStatus('error');
          lastSavedSnapshotRef.current = snapshot;
          pendingSaveRef.current = false;
        });
    }, 600);

    pendingTimeoutRef.current = timeoutId;

    return () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectConfig,
    currentStep,
    detailsPhase,
    templatePath,
    showAssistantTransition,
    suppressDraftSave,
    isOffline,
  ]);

  return {
    saveStatus,
    lastSavedAt,
    suppressDraftSave,
    setSuppressDraftSave,
    lastSavedSnapshotRef,
    setSaveStatus,
    setLastSavedAt,
  };
}
