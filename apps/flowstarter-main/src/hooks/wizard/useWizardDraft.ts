'use client';

import { projectTemplates } from '@/data/project-templates';
import {
  draftKeys,
  useDeleteDraft,
  useDraft,
  useUpsertDraft,
  type DraftShape,
} from '@/hooks/useDraft';
import { useDraftStore } from '@/store/draft-store';
import { useWizardStore, type TemplatePath } from '@/store/wizard-store';
import type {
  ProjectConfig,
  ProjectTemplate,
  ProjectWizardStep,
} from '@/types/project-config';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

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

  const setShowAssistantTransition = useWizardStore(
    (s) => s.setShowAssistantTransition
  );
  const setDetailsPhase = useWizardStore((s) => s.setDetailsPhase);
  const setShowSummary = useWizardStore((s) => s.setShowSummary);
  const setTemplatePath = useWizardStore((s) => s.setTemplatePath);
  const setStartedWithTemplate = useWizardStore(
    (s) => s.setStartedWithTemplate
  );
  const setSelectedIndustry = useWizardStore((s) => s.setSelectedIndustry);

  const queryClient = useQueryClient();
  const { setDraft: setDraftInStore } = useDraftStore();
  const {
    data: serverDraft,
    isLoading: isDraftLoading,
    isError: isDraftError,
  } = useDraft(currentDraftId);
  const upsertDraft = useUpsertDraft(currentDraftId);
  const deleteDraft = useDeleteDraft(currentDraftId);

  // Track the draft ID for autosave to use the latest value
  const draftIdRef = useRef<string | null | undefined>(currentDraftId);
  const pendingSaveRef = useRef<boolean>(false); // Track if a save is in progress
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track pending timeout

  useEffect(() => {
    draftIdRef.current = currentDraftId;
  }, [currentDraftId]);

  const [suppressDraftSave, setSuppressDraftSave] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error' | 'offline'
  >('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof window !== 'undefined' ? !navigator.onLine : false
  );
  const didHydrateRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const lastDraftIdRef = useRef<string | null | undefined>(undefined);
  const lastShouldLoadDraftRef = useRef<boolean | undefined>(undefined);

  // Reset hydration state when draft context changes
  // This fixes the issue where navigating between different draft contexts
  // (e.g., from continuing a draft to starting a new project) would preserve
  // the old state in the Zustand store instead of resetting it.
  //
  // Scenarios handled:
  // 1. User clicks draft card (/wizard/project/{id}) → loads that draft
  // 2. User clicks "Create Project" (/dashboard/new?fresh=true) → starts fresh
  // 3. User navigates between different drafts → resets state each time
  useEffect(() => {
    const currentDraftId = serverDraft?.id ?? null;

    console.log('[useWizardDraft] Draft context check:', {
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
      console.log('[useWizardDraft] First initialization');
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
        '[useWizardDraft] Context changed! Resetting hydration state',
        { shouldLoadDraftChanged, draftIdChanged, shouldLoadDraft }
      );
      didHydrateRef.current = false;
      setIsLoaded(false);
      // Also clear the saved snapshot to ensure fresh state is saved
      lastSavedSnapshotRef.current = null;
    }

    lastDraftIdRef.current = currentDraftId;
    lastShouldLoadDraftRef.current = shouldLoadDraft;
  }, [serverDraft?.id, shouldLoadDraft, setIsLoaded, isDraftLoading, isLoaded]);

  // Helper to map template id to local template shape when needed
  const toLocalTemplate = (templateId: string): ProjectTemplate | null => {
    const t = projectTemplates.find((pt) => pt.id === templateId);
    if (!t) return null;

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      category: typeof t.category === 'string' ? t.category : t.category.name,
      features: t.features.map((f) =>
        typeof (f as { name?: string }) === 'object' &&
        (f as { name?: string }).name
          ? (f as { name: string }).name
          : (f as unknown as string)
      ),
      complexity: t.complexity,
    } as ProjectTemplate;
  };

  // Helper to create a serializable version of projectConfig (removes circular refs)
  const toSerializableConfig = (config: ProjectConfig) => {
    const { template, ...rest } = config;

    // Create a clean template object without circular references
    const cleanTemplate = template
      ? {
          id: template.id,
          name: template.name,
          description: template.description,
          category:
            typeof template.category === 'string'
              ? template.category
              : template.category?.name || '',
          features: Array.isArray(template.features)
            ? template.features.map((f) =>
                typeof f === 'object' && f !== null && 'name' in f
                  ? (f as { name: string }).name
                  : String(f)
              )
            : [],
          complexity: template.complexity,
        }
      : null;

    return {
      ...rest,
      template: cleanTemplate,
    };
  };

  // Hydrate once from server draft if present; otherwise, ensure initial state
  useEffect(() => {
    console.log('[useWizardDraft] Hydration effect running', {
      didHydrateRef: didHydrateRef.current,
      isLoaded,
      shouldLoadDraft,
      isDraftLoading,
      isDraftError,
      hasServerDraft: Boolean(serverDraft),
      serverDraftId: serverDraft?.id,
      serverDraftDataLength:
        serverDraft &&
        'data' in serverDraft &&
        typeof serverDraft.data === 'string'
          ? serverDraft.data.length
          : 0,
      serverDraftDataType:
        serverDraft && 'data' in serverDraft
          ? typeof serverDraft.data
          : undefined,
      serverDraftDataPreview:
        serverDraft &&
        'data' in serverDraft &&
        typeof serverDraft.data === 'string'
          ? serverDraft.data.substring(0, 100)
          : undefined,
      fullServerDraft: serverDraft,
    });

    // Skip if already hydrated AND loaded to prevent re-running on refresh
    // IMPORTANT: Check both didHydrateRef and isLoaded to avoid skipping on resume from dashboard
    // where isLoaded might be false but we haven't hydrated yet
    if (didHydrateRef.current && isLoaded) {
      console.log(
        '[useWizardDraft] Skipping hydration - already hydrated and loaded'
      );
      return;
    }

    // If we're loading a draft, wait for the query to complete (success or error)
    // If we're not loading a draft, proceed immediately
    if (shouldLoadDraft && isDraftLoading) {
      console.log('[useWizardDraft] Waiting for draft to load...');
      return;
    }

    // If draft fetch failed, log it but proceed with initialization
    if (shouldLoadDraft && isDraftError) {
      console.warn(
        '[useWizardDraft] Draft fetch failed, proceeding with fresh initialization'
      );
    }

    // Don't reset/hydrate while discarding to prevent flash of content
    const isDiscarding = useWizardStore.getState().isDiscarding;
    if (isDiscarding) {
      console.log('[useWizardDraft] Skipping hydration - currently discarding');
      return;
    }

    console.log('[useWizardDraft] 🔧 Starting hydration process...');
    setSuppressDraftSave(true);

    const parsedDraft =
      serverDraft && 'data' in serverDraft && serverDraft.data
        ? (() => {
            try {
              return JSON.parse(serverDraft.data as string) as Record<
                string,
                unknown
              >;
            } catch {
              return null;
            }
          })()
        : null;

    console.log('[useWizardDraft] Parsed draft:', {
      hasParsedDraft: Boolean(parsedDraft),
      parsedDraftName: (parsedDraft as Record<string, unknown>)?.name,
      parsedDraftDescription:
        typeof (parsedDraft as Record<string, unknown>)?.description ===
        'string'
          ? String(
              (parsedDraft as Record<string, unknown>)?.description
            ).substring(0, 50)
          : undefined,
      shouldLoadDraft,
    });

    // Only load draft if shouldLoadDraft is true
    if (parsedDraft && shouldLoadDraft) {
      // Dispatch loading start event for draft hydration
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('draft-loading-start'));
      }
      let hydratedTemplate = (
        parsedDraft as { template?: { id?: string } | null }
      )?.template;
      if (!hydratedTemplate?.id && serverDraft?.template_id) {
        hydratedTemplate =
          toLocalTemplate(serverDraft.template_id) || hydratedTemplate;
      } else if (
        hydratedTemplate?.id &&
        !(hydratedTemplate as { name?: string }).name
      ) {
        hydratedTemplate =
          toLocalTemplate(hydratedTemplate.id) || hydratedTemplate;
      }

      const mergedConfig = {
        ...initialProjectConfig,
        ...(parsedDraft as object),
        template:
          hydratedTemplate ||
          (parsedDraft as { template?: unknown })?.template ||
          initialProjectConfig.template,
      } as ProjectConfig;

      console.log('[useWizardDraft] 📝 Setting project config from draft:', {
        name: mergedConfig.name,
        description: mergedConfig.description?.substring(0, 50),
        hasTemplate: Boolean(mergedConfig.template?.id),
        templateId: mergedConfig.template?.id,
      });

      setProjectConfig(mergedConfig);

      const draftStep =
        (parsedDraft as { currentStep?: ProjectWizardStep })?.currentStep ||
        (serverDraft?.current_step as ProjectWizardStep | undefined);

      // Validate step against project state - don't allow review step without a template
      const hasTemplate = Boolean(mergedConfig.template?.id);
      let validatedStep = draftStep;

      if (draftStep === 'review' && !hasTemplate) {
        console.log(
          '[useWizardDraft] ⚠️ Draft has review step but no template selected - redirecting to template step'
        );
        validatedStep = 'template';
      }

      if (
        validatedStep &&
        ['template', 'details', 'design', 'review'].includes(validatedStep)
      ) {
        setCurrentStep(validatedStep);
      }

      // Restore wizard UI states
      const draftDetailsPhase = (
        parsedDraft as { detailsPhase?: 'collect' | 'refine' }
      )?.detailsPhase;
      if (
        draftDetailsPhase &&
        ['collect', 'refine'].includes(draftDetailsPhase)
      ) {
        setDetailsPhase(draftDetailsPhase);
      }

      const draftShowSummary = (parsedDraft as { showSummary?: boolean })
        ?.showSummary;
      if (draftShowSummary !== undefined) {
        setShowSummary(draftShowSummary);
      }

      const draftTemplatePath = (parsedDraft as { templatePath?: TemplatePath })
        ?.templatePath;
      if (draftTemplatePath !== undefined) {
        setTemplatePath(draftTemplatePath);
      }

      const draftShowAssistantTransition = (
        parsedDraft as { showAssistantTransition?: boolean }
      )?.showAssistantTransition;
      if (draftShowAssistantTransition !== undefined) {
        setShowAssistantTransition(draftShowAssistantTransition);
      }

      const draftStartedWithTemplate = (
        parsedDraft as { startedWithTemplate?: boolean }
      )?.startedWithTemplate;
      if (draftStartedWithTemplate !== undefined) {
        setStartedWithTemplate(draftStartedWithTemplate);
      }

      // Restore industry to wizard store
      const industry = mergedConfig?.designConfig?.businessInfo?.industry;
      if (industry) {
        console.log(
          '[useWizardDraft] Restoring industry to wizard store:',
          industry
        );
        setSelectedIndustry(industry);
      }

      // Restore review state if available
      const draftReviewState = (parsedDraft as { reviewState?: unknown })
        ?.reviewState;
      if (draftReviewState) {
        console.log('[useWizardDraft] Restoring review state from draft');
        useWizardStore.getState().setReviewState(
          draftReviewState as {
            generatedCode: string;
            generatedFiles: Array<{ path: string; content: string }>;
            previewHtml: string;
            qualityMetrics: unknown;
          }
        );
        // Set hasGeneratedSite flag if review state exists
        useWizardStore.getState().setHasGeneratedSite(true);
      }

      // Prevent immediate autosave by syncing the snapshot with hydrated state
      const initialSnapshot = JSON.stringify({
        ...toSerializableConfig(mergedConfig),
        currentStep: (draftStep || 'details') as ProjectWizardStep,
        detailsPhase: draftDetailsPhase || 'collect',
        showSummary: draftShowSummary || false,
        templatePath: draftTemplatePath ?? null,
        showAssistantTransition: draftShowAssistantTransition || false,
        startedWithTemplate: draftStartedWithTemplate || false,
        reviewState: draftReviewState ?? null,
      });
      lastSavedSnapshotRef.current = initialSnapshot;
      setLastSavedAt(serverDraft?.updated_at ?? new Date().toISOString());
      setSaveStatus('saved');
    } else {
      reset(initialProjectConfig);
      // Align snapshot to initial state to avoid autosaving a no-op immediately
      const initialSnapshot = JSON.stringify({
        ...toSerializableConfig(initialProjectConfig),
        currentStep,
        detailsPhase: 'collect',
        showSummary: false,
        templatePath: null,
        showAssistantTransition: false,
        startedWithTemplate: false,
      });
      lastSavedSnapshotRef.current = initialSnapshot;
      setSaveStatus('idle');
    }

    console.log(
      '[useWizardDraft] ✅ Hydration complete, setting isLoaded=true'
    );

    // Mark as hydrated BEFORE setting isLoaded to prevent race conditions
    didHydrateRef.current = true;
    setIsLoaded(true);
    setSuppressDraftSave(false);

    // Dispatch loading end event after hydration is complete
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('draft-loading-end'));
    }
  }, [
    // NOTE: We deliberately exclude isLoaded from deps because we check it with early return
    // Including it would cause infinite loops since we call setIsLoaded(true) inside
    isDraftLoading,
    isDraftError,
    serverDraft?.id,
    serverDraft,
    shouldLoadDraft,
    // Deliberately excluding setIsLoaded, reset, setCurrentStep, setDetailsPhase, etc.
    // These are stable setter functions from Zustand store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // Debounced autosave with change guard, to avoid posting identical payloads
  useEffect(() => {
    console.log('[useWizardDraft] Autosave effect triggered', {
      suppressDraftSave,
      isOffline,
      projectName: projectConfig.name,
      projectDescription: projectConfig.description?.substring(0, 50),
    });

    if (suppressDraftSave) {
      console.log('[useWizardDraft] Skipping save - suppressed');
      return;
    }

    if (isOffline) {
      console.log('[useWizardDraft] Offline - setting status');
      setSaveStatus('offline');
      return;
    }

    // Don't autosave during template browsing to prevent creating multiple drafts
    // Only save once user has customized the project or progressed past template selection
    const isBrowsingTemplates =
      currentStep === 'template' &&
      (!projectConfig.name || projectConfig.name === 'Untitled Project');

    if (isBrowsingTemplates && !currentDraftId) {
      console.log(
        '[useWizardDraft] Skipping save - browsing templates without draft'
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
    console.log('[useWizardDraft] Snapshot comparison', {
      hasChanged,
      lastSavedExists: Boolean(lastSavedSnapshotRef.current),
      snapshotLength: snapshot.length,
    });

    if (!hasChanged) {
      console.log('[useWizardDraft] Skipping save - no changes detected');
      return; // nothing changed in persisted payload
    }

    console.log('[useWizardDraft] ✅ Changes detected, will save in 600ms...', {
      hasTemplate: Boolean(projectConfig.template?.id),
      hasName: Boolean(projectConfig.name),
      hasDescription: Boolean(projectConfig.description),
      currentStep,
      detailsPhase,
      templatePath,
      showAssistantTransition,
      startedWithTemplate: currentStartedWithTemplate,
    });

    // Cancel any pending save timeout
    if (pendingTimeoutRef.current) {
      console.log('[useWizardDraft] ⏹️ Canceling previous save timeout');
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const timeoutId = setTimeout(async () => {
      console.log('[useWizardDraft] 🚀 Executing save now...');

      // If a save is already in progress, skip this one
      if (pendingSaveRef.current) {
        console.log(
          '[useWizardDraft] ⏭️ Skipping save - another save in progress'
        );
        return;
      }

      pendingSaveRef.current = true;
      setSaveStatus('saving');

      // Use serializable config to avoid circular references
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

      console.log('[useWizardDraft] Payload to save:', {
        name: (payload as { name?: string }).name,
        description: (
          payload as { description?: string }
        ).description?.substring(0, 50),
        currentStep: payload.currentStep,
        hasTemplate: Boolean(
          (payload as { template?: { id?: string } }).template?.id
        ),
      });

      // Use the latest draft ID from ref for this save operation
      const latestDraftId = draftIdRef.current;
      console.log('[useWizardDraft] Using draft ID for save:', latestDraftId);

      // Perform the save using fetch but also update the cache
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
          console.log('[useWizardDraft] ✅ Save successful!', {
            returnedDraftId,
          });

          // Update currentDraftId with the returned ID for subsequent saves
          if (returnedDraftId && returnedDraftId !== latestDraftId) {
            setCurrentDraftId(returnedDraftId);
            draftIdRef.current = returnedDraftId;
            console.log('[useWizardDraft] Updated draft ID:', returnedDraftId);
          }

          // Update the React Query cache to prevent stale data
          const optimistic = {
            id: returnedDraftId || latestDraftId,
            data: JSON.stringify(payload),
            template_id:
              (payload as { template?: { id?: string } }).template?.id ?? null,
            updated_at: new Date().toISOString(),
            entry_mode: payload.entry_mode ?? null,
            current_step: payload.currentStep ?? null,
          } as DraftShape;

          // Use the correct query key format from draftKeys
          queryClient.setQueryData(
            draftKeys.byProject(returnedDraftId || latestDraftId),
            optimistic
          );

          // Also update the draft store to keep it in sync
          setDraftInStore(optimistic);

          lastSavedSnapshotRef.current = snapshot;
          setLastSavedAt(new Date().toISOString());
          setSaveStatus('saved');
          pendingSaveRef.current = false; // Mark save as complete
        })
        .catch((error) => {
          console.error('[useWizardDraft] ❌ Failed to save draft:', error);
          setSaveStatus('error');
          // Update snapshot even on failure to prevent infinite retry loop
          lastSavedSnapshotRef.current = snapshot;
          pendingSaveRef.current = false; // Mark save as complete even on error
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

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!navigator.onLine);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const deleteDraftAndReset = async () => {
    setSuppressDraftSave(true);
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
    lastSavedSnapshotRef.current = snapshot;
    setSuppressDraftSave(false);
  };

  return {
    // state
    isLoaded,
    currentStep,
    projectConfig,
    saveStatus,
    lastSavedAt,
    isOffline,
    draftError: upsertDraft.error,
    loadedDraftId: currentDraftId, // Expose the current draft ID

    // setters
    setCurrentStep,
    setProjectConfig,

    // actions
    deleteDraftAndReset,
  };
}
