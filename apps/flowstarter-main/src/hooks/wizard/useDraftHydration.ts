'use client';

import type { DraftShape } from '@/hooks/useDraft';
import { useWizardStore, type TemplatePath } from '@/store/wizard-store';
import type {
  ProjectConfig,
  ProjectWizardStep,
} from '@/types/project-config';
import { useEffect, useRef } from 'react';
import { toLocalTemplate, toSerializableConfig, createStateSnapshot } from './wizard-draft-utils';

interface DraftHydrationOptions {
  serverDraft: DraftShape | null | undefined;
  shouldLoadDraft: boolean;
  isDraftLoading: boolean;
  isDraftError: boolean;
  initialProjectConfig: ProjectConfig;
  isLoaded: boolean;
  didHydrateRef: React.MutableRefObject<boolean>;
  onHydrationStart?: () => void;
  onHydrationComplete?: (snapshot: string, savedAt: string | null) => void;
  onFreshReset?: (snapshot: string) => void;
}

/**
 * Hook to handle hydrating wizard state from a server draft.
 * Manages the complex logic of merging draft data with initial config
 * and restoring all wizard UI states.
 */
export function useDraftHydration({
  serverDraft,
  shouldLoadDraft,
  isDraftLoading,
  isDraftError,
  initialProjectConfig,
  isLoaded,
  didHydrateRef,
  onHydrationStart,
  onHydrationComplete,
  onFreshReset,
}: DraftHydrationOptions) {
  const suppressSaveRef = useRef(false);

  const {
    currentStep,
    setCurrentStep,
    setProjectConfig,
    setIsLoaded,
    reset,
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

  useEffect(() => {
    console.log('[useDraftHydration] Hydration effect running', {
      didHydrateRef: didHydrateRef.current,
      isLoaded,
      shouldLoadDraft,
      isDraftLoading,
      isDraftError,
      hasServerDraft: Boolean(serverDraft),
      serverDraftId: serverDraft?.id,
    });

    // Skip if already hydrated AND loaded to prevent re-running on refresh
    if (didHydrateRef.current && isLoaded) {
      console.log(
        '[useDraftHydration] Skipping hydration - already hydrated and loaded'
      );
      return;
    }

    // If we're loading a draft, wait for the query to complete
    if (shouldLoadDraft && isDraftLoading) {
      console.log('[useDraftHydration] Waiting for draft to load...');
      return;
    }

    // If draft fetch failed, log it but proceed with initialization
    if (shouldLoadDraft && isDraftError) {
      console.warn(
        '[useDraftHydration] Draft fetch failed, proceeding with fresh initialization'
      );
    }

    // Don't reset/hydrate while discarding to prevent flash of content
    const isDiscarding = useWizardStore.getState().isDiscarding;
    if (isDiscarding) {
      console.log('[useDraftHydration] Skipping hydration - currently discarding');
      return;
    }

    console.log('[useDraftHydration] 🔧 Starting hydration process...');
    suppressSaveRef.current = true;
    onHydrationStart?.();

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

    console.log('[useDraftHydration] Parsed draft:', {
      hasParsedDraft: Boolean(parsedDraft),
      parsedDraftName: (parsedDraft as Record<string, unknown>)?.name,
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

      console.log('[useDraftHydration] 📝 Setting project config from draft:', {
        name: mergedConfig.name,
        description: mergedConfig.description?.substring(0, 50),
        hasTemplate: Boolean(mergedConfig.template?.id),
        templateId: mergedConfig.template?.id,
      });

      setProjectConfig(mergedConfig);

      const draftStep =
        (parsedDraft as { currentStep?: ProjectWizardStep })?.currentStep ||
        (serverDraft?.current_step as ProjectWizardStep | undefined);

      // Validate step against project state
      const hasTemplate = Boolean(mergedConfig.template?.id);
      let validatedStep = draftStep;

      if (draftStep === 'review' && !hasTemplate) {
        console.log(
          '[useDraftHydration] ⚠️ Draft has review step but no template - redirecting to template step'
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
          '[useDraftHydration] Restoring industry to wizard store:',
          industry
        );
        setSelectedIndustry(industry);
      }

      // Restore review state if available
      const draftReviewState = (parsedDraft as { reviewState?: unknown })
        ?.reviewState;
      if (draftReviewState) {
        console.log('[useDraftHydration] Restoring review state from draft');
        useWizardStore.getState().setReviewState(
          draftReviewState as {
            generatedCode: string;
            generatedFiles: Array<{ path: string; content: string }>;
            previewHtml: string;
            qualityMetrics: unknown;
          }
        );
        useWizardStore.getState().setHasGeneratedSite(true);
      }

      // Create snapshot to prevent immediate autosave
      const initialSnapshot = createStateSnapshot(mergedConfig, {
        currentStep: (draftStep || 'details') as string,
        detailsPhase: draftDetailsPhase || 'collect',
        showSummary: draftShowSummary || false,
        templatePath: draftTemplatePath ?? null,
        showAssistantTransition: draftShowAssistantTransition || false,
        startedWithTemplate: draftStartedWithTemplate || false,
        reviewState: draftReviewState ?? null,
      });

      onHydrationComplete?.(
        initialSnapshot,
        serverDraft?.updated_at ?? new Date().toISOString()
      );

      // Dispatch loading end event after hydration is complete
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('draft-loading-end'));
      }
    } else {
      reset(initialProjectConfig);
      // Align snapshot to initial state
      const initialSnapshot = createStateSnapshot(initialProjectConfig, {
        currentStep,
        detailsPhase: 'collect',
        showSummary: false,
        templatePath: null,
        showAssistantTransition: false,
        startedWithTemplate: false,
      });
      onFreshReset?.(initialSnapshot);
    }

    console.log(
      '[useDraftHydration] ✅ Hydration complete, setting isLoaded=true'
    );

    // Mark as hydrated BEFORE setting isLoaded to prevent race conditions
    didHydrateRef.current = true;
    setIsLoaded(true);
    suppressSaveRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDraftLoading,
    isDraftError,
    serverDraft?.id,
    serverDraft,
    shouldLoadDraft,
  ]);

  return {
    suppressSaveRef,
  };
}
