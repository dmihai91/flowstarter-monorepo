/**
 * useBuildHandlers Hook
 *
 * Handles the main project build flow including font selection,
 * template cloning, and orchestration.
 * 
 * Uses React Query mutations for API calls with automatic retries.
 */

import { useCallback, useRef, useEffect } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { hasHandoffConnection, syncOnboardingComplete } from '~/lib/services/projectSyncService';
import { useFetchTemplateFiles, useSyncFilesToConvex, useStartDaytonaPreview } from '~/lib/hooks/useApiQueries';
import type { ColorPalette } from '~/lib/config/palettes';
import { PREDEFINED_FONT_PAIRINGS, type FontPairing } from '~/lib/config/fonts';
import type { CloneOptions, CloneResult } from '~/lib/hooks/templateClone/types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import type { UsePaletteSelectionReturn } from './usePaletteSelection';
import type { UseBusinessInfoReturn } from './useBusinessInfo';
import type { SystemFont, PreviewInfo, InitialChatState } from '../types';
import type { Id } from '~/convex/_generated/dataModel';
import { normalizePath, getEssentialConfigFiles } from '../utils';
import { SUGGESTED_REPLIES } from '../constants';
import { BUILD_ERRORS, formatErrorForUser, getUserFriendlyError, getErrorSuggestions } from '../errors';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

// ─── Build Progress Constants ───────────────────────────────────────────────
const BUILD_PROGRESS = {
  INITIAL: 0,
  CLONING_START: 5,
  CLONING_COMPLETE: 25,
  CUSTOMIZING_START: 30,
  SYNCING: 75,
  PREVIEW_START: 80,
  COMPLETE: 100,
} as const;

// ─── Font Weight Constants ──────────────────────────────────────────────────
const FONT_WEIGHTS = {
  HEADING: 700,
  BODY: 400,
} as const;

interface UseBuildHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;
  businessHook: UseBusinessInfoReturn;
  cloneTemplate: (options: CloneOptions) => Promise<CloneResult>;
  createSnapshotFromFiles: (
    projectId: Id<'projects'>,
    files: Record<string, string>,
    label?: string,
  ) => Promise<Id<'snapshots'>>;
  setSelectedFont: (font: SystemFont | null) => void;
  setConvexProjectId: (id: string | null) => void;
  setCurrentUrlId: (id: string | null) => void;
  setBuildStep: (step: string) => void;
  setBuildProgress: (progress: number) => void;
  setBuildPhase: (phase: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  onProjectReady?: (urlId: string) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

interface UseBuildHandlersReturn {
  handleFontSelect: (font: SystemFont) => Promise<void>;
}

export function useBuildHandlers({
  messageHook,
  flowHook,
  templateHook,
  paletteHook,
  businessHook,
  cloneTemplate,
  createSnapshotFromFiles,
  setSelectedFont,
  setConvexProjectId,
  setCurrentUrlId,
  setBuildStep,
  setBuildProgress,
  setBuildPhase,
  onPreviewChange,
  onProjectReady,
  onStateChange,
}: UseBuildHandlersProps): UseBuildHandlersReturn {
  // ─── React Query Mutations ────────────────────────────────────────────────
  const fetchTemplateFilesMutation = useFetchTemplateFiles();
  const syncFilesToConvexMutation = useSyncFilesToConvex();
  const startPreviewMutation = useStartDaytonaPreview();

  // ─── Request Cancellation ─────────────────────────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  /*
   * Store callback references in refs to avoid infinite loops from prop changes
   * These are inline functions from parent that change identity every render
   */
  const onPreviewChangeRef = useRef(onPreviewChange);
  const onProjectReadyRef = useRef(onProjectReady);
  const onStateChangeRef = useRef(onStateChange);
  onPreviewChangeRef.current = onPreviewChange;
  onProjectReadyRef.current = onProjectReady;
  onStateChangeRef.current = onStateChange;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFontSelect = useCallback(
    async (font: SystemFont) => {
      // Cancel any in-flight build requests
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const signal = abortControllerRef.current.signal;

      setSelectedFont(font);
      messageHook.addUserMessage(`Let's go with "${font.name}"`);
      flowHook.setStep('creating');
      setBuildStep(t(EDITOR_LABEL_KEYS.BUILD_GETTING_READY));
      setBuildProgress(BUILD_PROGRESS.INITIAL);

      const selectedTemplate = templateHook.selectedTemplate;
      const selectedPalette = paletteHook.selectedPalette;

      if (!selectedTemplate) {
        flowHook.setStep('template');
        messageHook.addAssistantMessage(formatErrorForUser(BUILD_ERRORS.MISSING_TEMPLATE));
        messageHook.setSuggestedReplies(getErrorSuggestions('template'));

        return;
      }

      if (!selectedPalette) {
        flowHook.setStep('personalization');
        messageHook.addAssistantMessage(formatErrorForUser(BUILD_ERRORS.MISSING_PALETTE));
        messageHook.setSuggestedReplies(getErrorSuggestions('build'));

        return;
      }

      try {
        const paletteForClone: ColorPalette = {
          id: selectedPalette.id,
          name: selectedPalette.name,
          colors: {
            primary: selectedPalette.colors[0],
            secondary: selectedPalette.colors[1],
            accent: selectedPalette.colors[2],
            background: selectedPalette.colors[3],
            text: selectedPalette.colors[4],
          },
        };

        const fontForClone: FontPairing = PREDEFINED_FONT_PAIRINGS.find(f => f.id === font.id) || PREDEFINED_FONT_PAIRINGS[0];

        // Phase 1: Clone template
        setBuildStep(t(EDITOR_LABEL_KEYS.BUILD_GETTING_READY));
        setBuildProgress(BUILD_PROGRESS.CLONING_START);
        setBuildPhase('cloning');

        const cloneProjectName =
          flowHook.projectName ||
          businessHook.businessInfo?.uvp?.split(' ').slice(0, 3).join(' ') ||
          selectedTemplate.name ||
          'My Website';

        const cloneResult = await cloneTemplate({
          template: selectedTemplate,
          projectName: cloneProjectName,
          palette: paletteForClone,
          fonts: fontForClone,
        });

        const urlId = cloneResult.urlId;
        const clonedProjectId = cloneResult.projectId;
        setConvexProjectId(clonedProjectId);
        setCurrentUrlId(urlId);
        onStateChangeRef.current?.({ convexProjectId: clonedProjectId } as Partial<InitialChatState>);

        setBuildProgress(BUILD_PROGRESS.CLONING_COMPLETE);

        // Phase 2: Fetch and customize template
        setBuildStep(t(EDITOR_LABEL_KEYS.BUILD_CREATING_WEBSITE));
        setBuildProgress(BUILD_PROGRESS.CUSTOMIZING_START);
        setBuildPhase('customizing');

        messageHook.addAssistantMessage(
          `${t(EDITOR_LABEL_KEYS.BUILD_BUILDING_SITE)}\n${t(EDITOR_LABEL_KEYS.BUILD_BUILDING_SITE_DESC)}`,
        );

        let customizedFiles: Record<string, string> = {};

        // Fetch template files using React Query mutation
        try {
          const filesResult = await fetchTemplateFilesMutation.mutateAsync({ 
            urlId, 
            signal 
          });
          
          for (const [path, content] of Object.entries(filesResult.files)) {
            customizedFiles[normalizePath(path)] = content;
          }

          messageHook.addAssistantMessage(t(EDITOR_LABEL_KEYS.BUILD_TEMPLATE_LOADED));
        } catch (fetchError) {
          console.warn('Failed to fetch template files:', fetchError);
          messageHook.addAssistantMessage(t(EDITOR_LABEL_KEYS.BUILD_SETTING_UP));
        }

        // Phase 3: Prepare files and start preview
        setBuildProgress(BUILD_PROGRESS.SYNCING);
        setBuildStep(t(EDITOR_LABEL_KEYS.BUILD_PREVIEW_READY_MSG));
        setBuildPhase('syncing');

        const essentialFiles = getEssentialConfigFiles(selectedTemplate.id, paletteForClone.colors, {
          heading: font.heading,
          body: font.body,
        });

        for (const [filePath, content] of Object.entries(essentialFiles)) {
          const normalizedPath = normalizePath(filePath);

          if (!customizedFiles[filePath] && !customizedFiles[normalizedPath]) {
            customizedFiles[normalizedPath] = content;
          }
        }

        // Daytona preview
        workbenchStore.setShowWorkbench(true);
        workbenchStore.currentView.set('preview');
        onPreviewChangeRef.current?.({ url: '', status: 'starting' });

        // Sync files to workbench editor
        for (const [filePath, content] of Object.entries(customizedFiles)) {
          await workbenchStore.createFile(filePath, content);
        }

        // Sync to Convex using React Query mutation
        if (clonedProjectId) {
          const convexFiles = Object.entries(customizedFiles).map(([path, content]) => ({
            path: normalizePath(path),
            content,
            type: 'file',
            isBinary: false,
          }));

          await syncFilesToConvexMutation.mutateAsync({ 
            projectId: clonedProjectId, 
            files: convexFiles, 
            signal 
          });
        }

        // Start Daytona preview using React Query mutation
        setBuildProgress(BUILD_PROGRESS.PREVIEW_START);
        setBuildStep(t(EDITOR_LABEL_KEYS.BUILD_STARTING_SERVER));
        setBuildPhase('starting');

        const previewData = await startPreviewMutation.mutateAsync({
          projectId: clonedProjectId,
          files: customizedFiles,
          signal,
        });

        if (previewData.success && previewData.previewUrl) {
          const proxyUrl = `/preview/${clonedProjectId}/`;
          workbenchStore.setDaytonaPreview({
            url: proxyUrl,
            sandboxId: previewData.sandboxId || '',
          });
          onPreviewChangeRef.current?.({ url: proxyUrl, status: 'ready' });
        }

        // Phase 4: Finalize
        setBuildProgress(BUILD_PROGRESS.COMPLETE);
        setBuildStep('');
        setBuildPhase('complete');

        // Sync onboarding complete
        if (hasHandoffConnection()) {
          syncOnboardingComplete();
        }

        // Create snapshot
        if (clonedProjectId && Object.keys(customizedFiles).length > 0) {
          try {
            await createSnapshotFromFiles(clonedProjectId as Id<'projects'>, customizedFiles, 'Initial build');
          } catch (snapshotError) {
            console.error('[handleFontSelect] Failed to create snapshot:', snapshotError);
          }
        }

        flowHook.setStep('ready');
        messageHook.setSuggestedReplies(SUGGESTED_REPLIES.buildReady());
        onPreviewChangeRef.current?.({ url: '', status: 'ready' });
        onProjectReadyRef.current?.(urlId);

        messageHook.addAssistantMessage(
          `${t(EDITOR_LABEL_KEYS.BUILD_SITE_READY)}\n\n${t(EDITOR_LABEL_KEYS.BUILD_SITE_READY_DESC)}`,
        );
      } catch (error) {
        // Don't show error for aborted requests (user navigated away or started new build)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('Failed to create project:', error);
        setBuildStep('');
        setBuildProgress(BUILD_PROGRESS.INITIAL);
        flowHook.setStep('template');

        const userError = getUserFriendlyError(error);
        messageHook.addAssistantMessage(formatErrorForUser(userError));
        messageHook.setSuggestedReplies(getErrorSuggestions('build'));
      }
    },

    /*
     * Note: onPreviewChange, onProjectReady, onStateChange are accessed via refs
     * to avoid infinite loops from unstable callback identity
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      flowHook,
      messageHook,
      templateHook.selectedTemplate,
      paletteHook.selectedPalette,
      businessHook.businessInfo,
      cloneTemplate,
      createSnapshotFromFiles,
      setSelectedFont,
      setConvexProjectId,
      setCurrentUrlId,
      setBuildStep,
      setBuildProgress,
      setBuildPhase,
      fetchTemplateFilesMutation,
      syncFilesToConvexMutation,
      startPreviewMutation,
    ],
  );

  return {
    handleFontSelect,
  };
}

export type { UseBuildHandlersProps, UseBuildHandlersReturn };

