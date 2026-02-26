'use client';

import { useEffect, useRef } from 'react';

interface DraftContextResetOptions {
  serverDraftId: string | null | undefined;
  shouldLoadDraft: boolean;
  isDraftLoading: boolean;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
  onContextChange?: () => void;
}

/**
 * Hook to detect and handle draft context changes.
 * 
 * Resets hydration state when navigating between different draft contexts:
 * 1. User clicks draft card (/wizard/project/{id}) → loads that draft
 * 2. User clicks "Create Project" (/dashboard/new?fresh=true) → starts fresh
 * 3. User navigates between different drafts → resets state each time
 */
export function useDraftContextReset({
  serverDraftId,
  shouldLoadDraft,
  isDraftLoading,
  isLoaded,
  setIsLoaded,
  onContextChange,
}: DraftContextResetOptions) {
  const didHydrateRef = useRef(false);
  const lastDraftIdRef = useRef<string | null | undefined>(undefined);
  const lastShouldLoadDraftRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const currentDraftId = serverDraftId ?? null;

    console.log('[useDraftContextReset] Draft context check:', {
      currentDraftId,
      lastDraftId: lastDraftIdRef.current,
      shouldLoadDraft,
      lastShouldLoadDraft: lastShouldLoadDraftRef.current,
      didHydrate: didHydrateRef.current,
      isLoaded,
    });

    // Only check for changes if we've already initialized once
    // This prevents treating the initial draft load as a "context change"
    if (lastDraftIdRef.current === undefined) {
      console.log('[useDraftContextReset] First initialization');
      lastDraftIdRef.current = currentDraftId;
      lastShouldLoadDraftRef.current = shouldLoadDraft;
      return;
    }

    // Detect context change:
    // 1. If shouldLoadDraft changed (e.g., from loading a draft to fresh start)
    // 2. If we're loading drafts and the draft ID changed
    const shouldLoadDraftChanged =
      lastShouldLoadDraftRef.current !== shouldLoadDraft;
    const draftIdChanged =
      shouldLoadDraft && lastDraftIdRef.current !== currentDraftId;
    const hasContextChanged = shouldLoadDraftChanged || draftIdChanged;

    // Only reset if context actually changed and we've already hydrated before
    // IMPORTANT: Don't reset if we're in the middle of loading the draft (isDraftLoading)
    // This prevents race conditions on page refresh where the draft is being loaded
    if (hasContextChanged && didHydrateRef.current && !isDraftLoading) {
      console.log(
        '[useDraftContextReset] Context changed! Resetting hydration state',
        { shouldLoadDraftChanged, draftIdChanged, shouldLoadDraft }
      );
      didHydrateRef.current = false;
      setIsLoaded(false);
      onContextChange?.();
    }

    lastDraftIdRef.current = currentDraftId;
    lastShouldLoadDraftRef.current = shouldLoadDraft;
  }, [serverDraftId, shouldLoadDraft, setIsLoaded, isDraftLoading, isLoaded, onContextChange]);

  return {
    didHydrateRef,
    markHydrated: () => {
      didHydrateRef.current = true;
    },
  };
}
