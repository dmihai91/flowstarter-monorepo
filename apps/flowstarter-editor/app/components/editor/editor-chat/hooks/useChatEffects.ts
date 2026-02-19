/**
 * useChatEffects Hook
 *
 * Manages side effects for state synchronization, customization progress,
 * and completion handling.
 */

import { useEffect, useRef } from 'react';
import { getDefaultReadySuggestions } from '../constants';
import type { InitialChatState, SystemFont } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import type { UsePaletteSelectionReturn } from './usePaletteSelection';
import type { Id } from '~/convex/_generated/dataModel';

// ─── Progress Mapping Constants ───────────────────────────────────────────────
/** Base progress percentage when customization starts */
const CUSTOMIZATION_PROGRESS_BASE = 55;

/** Range of progress percentage allocated to customization */
const CUSTOMIZATION_PROGRESS_RANGE = 40;

/** Debounce delay for state persistence (ms) */
const STATE_PERSISTENCE_DEBOUNCE_MS = 500;

interface UseChatEffectsProps {
  // Hooks
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;

  // State
  selectedFont: SystemFont | null;
  currentUrlId: string | null;
  convexProjectId: string | null;
  buildPhase: string;
  hasRestoredState: React.MutableRefObject<boolean>;

  // External state
  isCustomizing: boolean;
  customizeProgress: { phase: string; progress: number; currentFile?: string };
  agentPhase: string;
  orchestratorState: string;
  orchestratorOrchestrationId: string | null;

  // Callbacks
  initialState?: InitialChatState;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  onProjectReady?: (urlId: string) => void;
  setBuildProgress: (progress: number) => void;
  setBuildStep: (step: string) => void;
  createSnapshot: (projectId: Id<'projects'>, label?: string) => Promise<Id<'snapshots'>>;
}

export function useChatEffects({
  messageHook,
  flowHook,
  templateHook,
  paletteHook,
  selectedFont,
  currentUrlId,
  convexProjectId,
  buildPhase,
  hasRestoredState,
  isCustomizing,
  customizeProgress,
  agentPhase,
  orchestratorState,
  orchestratorOrchestrationId,
  initialState,
  onStateChange,
  onProjectReady,
  setBuildProgress,
  setBuildStep,
  createSnapshot,
}: UseChatEffectsProps): void {
  const stateChangeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether we've done initial state sync to prevent infinite loops on mount
  const hasCompletedInitialSyncRef = useRef(false);

  // Store hook references in refs to avoid infinite loops from unstable object references
  const messageHookRef = useRef(messageHook);
  const flowHookRef = useRef(flowHook);
  const paletteHookRef = useRef(paletteHook);
  const templateHookRef = useRef(templateHook);
  messageHookRef.current = messageHook;
  flowHookRef.current = flowHook;
  paletteHookRef.current = paletteHook;
  templateHookRef.current = templateHook;

  // Store callback references in refs to avoid infinite loops from prop changes
  const onProjectReadyRef = useRef(onProjectReady);
  const createSnapshotRef = useRef(createSnapshot);
  onProjectReadyRef.current = onProjectReady;
  createSnapshotRef.current = createSnapshot;

  // Sync customization progress to build progress
  useEffect(() => {
    if (isCustomizing && customizeProgress.phase !== 'idle') {
      const mappedProgress =
        CUSTOMIZATION_PROGRESS_BASE + Math.round((customizeProgress.progress / 100) * CUSTOMIZATION_PROGRESS_RANGE);
      setBuildProgress(mappedProgress);

      if (customizeProgress.currentFile) {
        const fileName = customizeProgress.currentFile.split('/').pop() || '';
        const friendlyName = fileName
          .replace(/\.(tsx?|jsx?|astro|css|scss)$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .toLowerCase();
        setBuildStep(`Working on ${friendlyName}...`);
      }
    }
  }, [isCustomizing, customizeProgress, setBuildProgress, setBuildStep]);

  /*
   * State persistence - uses refs to access current hook values without triggering re-runs
   * Store onStateChange in a ref to prevent effect from re-running when callback identity changes
   */
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    // Skip if state hasn't been restored yet
    if (!hasRestoredState.current) {
      return;
    }

    /*
     * Skip the initial sync to prevent loop on mount
     * The first call should be skipped since it would just sync the initial state back
     */
    if (!hasCompletedInitialSyncRef.current) {
      hasCompletedInitialSyncRef.current = true;
      return;
    }

    if (stateChangeRef.current) {
      clearTimeout(stateChangeRef.current);
    }

    const flow = flowHookRef.current;
    const template = templateHookRef.current;
    const palette = paletteHookRef.current;

    stateChangeRef.current = setTimeout(() => {
      /*
       * Note: Messages are NOT included here - they are synced separately via EditorChatPanel's
       * syncMessages effect to prevent infinite loops (messages change → onStateChange → Convex update →
       * initialState changes → messages change again)
       */
      onStateChangeRef.current?.({
        step: flow.step,
        projectDescription: flow.projectDescription,
        selectedTemplateId: template.selectedTemplate?.id || null,
        selectedTemplateName: template.selectedTemplate?.name || null,
        selectedPalette: palette.selectedPalette,
        selectedFont: selectedFont || null,
        projectUrlId: currentUrlId,
        convexProjectId,
        buildPhase: buildPhase as 'idle' | 'cloning' | 'customizing' | 'syncing' | 'starting' | 'complete',
        orchestrationState: orchestratorState as 'idle' | 'running' | 'completed' | 'failed',
        orchestrationId: orchestratorOrchestrationId,
      });
    }, STATE_PERSISTENCE_DEBOUNCE_MS);

    return () => {
      if (stateChangeRef.current) {
        clearTimeout(stateChangeRef.current);
      }
    };

    /*
     * Note: We use refs for hook dependencies to avoid infinite loops
     * Only primitive values that actually change should trigger persistence
     * onStateChange and initialState are accessed via refs, not included in deps
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFont, currentUrlId, convexProjectId, buildPhase, orchestratorState, orchestratorOrchestrationId]);

  /*
   * Update palette from template selection
   * Note: Uses refs to avoid infinite loops from unstable object references
   */
  useEffect(() => {
    paletteHookRef.current.updateFromTemplate(
      templateHookRef.current.selectedTemplate,
      templateHookRef.current.selectedRecommendation,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateHook.selectedTemplate, templateHook.selectedRecommendation]);

  /*
   * Lazy load templates when entering template step
   * This defers the API call until templates are actually needed
   */
  useEffect(() => {
    const template = templateHookRef.current;
    const flow = flowHookRef.current;

    if (flow.step === 'template' && !template.templatesLoading && template.templates.length === 0) {
      template.refetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowHook.step, templateHook.templatesLoading, templateHook.templates.length]);

  // Handle agent/orchestrator completion
  useEffect(() => {
    const flow = flowHookRef.current;
    const msg = messageHookRef.current;

    if (agentPhase === 'complete' && flow.step === 'ready') {
      msg.setSuggestedReplies([
        { id: 'more-changes', text: 'Make another change' },
        { id: 'different-style', text: 'Try a different style' },
        { id: 'add-feature', text: 'Add more features' },
        { id: 'done', text: "That's perfect!" },
      ]);

      if (convexProjectId) {
        createSnapshotRef
          .current(convexProjectId as Id<'projects'>, 'Auto-save after modifications')
          .catch(console.warn);
      }
    }

    if (orchestratorState === 'completed' && currentUrlId) {
      flow.setStep('ready');
      msg.setSuggestedReplies(getDefaultReadySuggestions());
      onProjectReadyRef.current?.(currentUrlId);
    } else if (orchestratorState === 'failed') {
      flow.setStep('ready');
    }

    // Note: onProjectReady and createSnapshot are accessed via refs, not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentPhase, orchestratorState, currentUrlId, convexProjectId]);
}

export type { UseChatEffectsProps };

