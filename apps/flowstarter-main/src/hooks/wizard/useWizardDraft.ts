'use client';

import {
  useDeleteDraft,
  useDraft,
} from '@/hooks/useDraft';
import { useWizardStore } from '@/store/wizard-store';
import type {
  ProjectConfig,
  ProjectWizardStep,
} from '@/types/project-config';
import { useCallback, useEffect, useState } from 'react';
import { useDraftAutosave } from './useDraftAutosave';
import { useDraftContextReset } from './useDraftContextReset';
import { useDraftHydration } from './useDraftHydration';
import { useOnlineStatus } from './useOnlineStatus';
import { toSerializableConfig } from './wizard-draft-utils';

export function useWizardDraft(
  initialProjectConfig: ProjectConfig,
  shouldLoadDraft: boolean = true,
  projectId?: string | null
) {
  // Store the current draft ID (may be updated after first save)
  const [currentDraftId, setCurrentDraftId] = useState<
    string | null | undefined
  >(projectId);

  // Update currentDraftId when projectId prop changes
  useEffect(() => {
    setCurrentDraftId(projectId);
  }, [projectId]);

  // Get wizard store state and actions
  const {
    currentStep,
    setCurrentStep,
    projectConfig,
    setProjectConfig,
    isLoaded,
    setIsLoaded,
    reset,
    detailsPhase,
    templatePath,
    showAssistantTransition,
  } = useWizardStore();

  // Fetch draft data
  const {
    data: serverDraft,
    isLoading: isDraftLoading,
    isError: isDraftError,
  } = useDraft(currentDraftId);

  const deleteDraft = useDeleteDraft(currentDraftId);

  // Online/offline status
  const { isOffline } = useOnlineStatus();

  // Context reset detection (handles navigation between drafts)
  const { didHydrateRef, markHydrated } = useDraftContextReset({
    serverDraftId: serverDraft?.id,
    shouldLoadDraft,
    isDraftLoading,
    isLoaded,
    setIsLoaded,
    onContextChange: () => {
      // Clear the saved snapshot when context changes
      autosaveState.lastSavedSnapshotRef.current = null;
    },
  });

  // Autosave with debouncing and change detection
  const autosaveState = useDraftAutosave({
    projectConfig,
    currentStep,
    detailsPhase,
    templatePath,
    showAssistantTransition,
    isOffline,
    currentDraftId,
    onDraftIdUpdate: setCurrentDraftId,
  });

  // Hydration from server draft
  useDraftHydration({
    serverDraft,
    shouldLoadDraft,
    isDraftLoading,
    isDraftError,
    initialProjectConfig,
    isLoaded,
    didHydrateRef,
    onHydrationStart: () => {
      autosaveState.setSuppressDraftSave(true);
    },
    onHydrationComplete: (snapshot, savedAt) => {
      autosaveState.lastSavedSnapshotRef.current = snapshot;
      autosaveState.setLastSavedAt(savedAt);
      autosaveState.setSaveStatus('saved');
      autosaveState.setSuppressDraftSave(false);
      markHydrated();
    },
    onFreshReset: (snapshot) => {
      autosaveState.lastSavedSnapshotRef.current = snapshot;
      autosaveState.setSaveStatus('idle');
      autosaveState.setSuppressDraftSave(false);
      markHydrated();
    },
  });

  // Delete draft and reset to initial state
  const deleteDraftAndReset = useCallback(async () => {
    autosaveState.setSuppressDraftSave(true);
    try {
      await deleteDraft.mutateAsync();
    } catch {
      // ignore
    }
    reset(initialProjectConfig);
    // After deletion, align snapshot to reset state so autosave does not immediately re-create
    const snapshot = JSON.stringify({
      ...toSerializableConfig(initialProjectConfig),
      currentStep: 'details' as ProjectWizardStep,
      detailsPhase: 'collect',
      showSummary: false,
      templatePath: null,
      showAssistantTransition: false,
      startedWithTemplate: false,
    });
    autosaveState.lastSavedSnapshotRef.current = snapshot;
    autosaveState.setSuppressDraftSave(false);
  }, [deleteDraft, reset, initialProjectConfig, autosaveState]);

  return {
    // state
    isLoaded,
    currentStep,
    projectConfig,
    saveStatus: autosaveState.saveStatus,
    lastSavedAt: autosaveState.lastSavedAt,
    isOffline,
    draftError: null, // No longer tracking upsertDraft.error since we use fetch directly
    loadedDraftId: currentDraftId,

    // setters
    setCurrentStep,
    setProjectConfig,

    // actions
    deleteDraftAndReset,
  };
}
