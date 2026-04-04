/**
 * useSimpleBuildHandlers Hook
 *
 * Simplified build handler using Claude Agent SDK.
 * Uses React Query mutations for API calls with automatic retries.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import { workbenchStore } from '~/lib/stores/workbench';
import { generateProjectSlug } from '~/lib/utils/slug';
import { useGenerateSiteStream } from '~/lib/hooks/useApiQueries';
import type { ContactDetails, InitialChatState, IntegrationConfig } from '~/components/editor/editor-chat/types';
import type { Id } from '~/convex/_generated/dataModel';
import type { AgentActivityEvent } from '~/components/editor/AgentActivityPanel';
import { MESSAGE_KEYS, getMessage } from '~/components/editor/editor-chat/constants';

import { BUILD_PROGRESS } from './simple-build-types';
import { mapProgressMessage, buildSiteGenerationInput, toConvexContactDetails } from './build-helpers';
import type { UseSimpleBuildHandlersProps, UseSimpleBuildHandlersReturn } from './simple-build-types';

// Re-export types for backward compatibility
export type { UseSimpleBuildHandlersProps, UseSimpleBuildHandlersReturn } from './simple-build-types';

export function useSimpleBuildHandlers({
  messageHook,
  flowHook,
  templateHook,
  paletteHook,
  businessHook,
  selectedFont,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedLogo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSelectedFont,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSelectedLogo,
  setConvexProjectId,
  setCurrentUrlId,
  setBuildStep,
  setBuildProgress,
  setBuildPhase,
  onPreviewChange,
  onProjectReady,
  onStateChange,
  existingProjectId,
  convexConversationId,
  seededIntegrations = [],
  seededTemplate = null,
}: UseSimpleBuildHandlersProps): UseSimpleBuildHandlersReturn {
  const generateSiteMutation = useGenerateSiteStream();

  // Live agent events accumulator — drives the AgentStatusMessage in chat
  const agentEventsRef = useRef<AgentActivityEvent[]>([]);
  const chatMsgIdRef = useRef<string | null>(null);
  const updateContactDetails = useMutation(api.projects.updateContactDetails);

  const abortControllerRef = useRef<AbortController | null>(null);
  const onPreviewChangeRef = useRef(onPreviewChange);
  const onProjectReadyRef = useRef(onProjectReady);
  const onStateChangeRef = useRef(onStateChange);
  onPreviewChangeRef.current = onPreviewChange;
  onProjectReadyRef.current = onProjectReady;
  onStateChangeRef.current = onStateChange;

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const contactDetailsRef = useRef<ContactDetails | undefined>(undefined);

  const handleContactDetailsComplete = useCallback(
    async (contactDetails: ContactDetails) => {
      contactDetailsRef.current = contactDetails;

      let userMessage = `Contact info: ${contactDetails.email}`;

      if (contactDetails.phone) {
        userMessage += `, ${contactDetails.phone}`;
      }

      messageHook.addUserMessage(userMessage);

      if (existingProjectId) {
        try {
          console.log('[BROWSER] [DEBUG] Entering try block');
          await updateContactDetails({
            projectId: existingProjectId as Id<'projects'>,
            contactDetails: toConvexContactDetails(contactDetails),
          });
          console.log('[useSimpleBuildHandlers] ✅ Contact details saved to Convex');
        } catch (error) {
          console.error('[useSimpleBuildHandlers] ❌ Failed to save contact details:', error);
        }
      }

      onStateChangeRef.current?.({ contactDetails } as Partial<InitialChatState>);
      await messageHook.addStepTransitionMessage('ready', 'ready', { hasContactDetails: true });
      flowHook.setStep('ready');
      messageHook.setSuggestedReplies([
        { id: 'confirm', text: 'Looks good!' },
        { id: 'edit', text: 'Let me change something' },
      ]);
    },
    [flowHook, messageHook, existingProjectId, updateContactDetails],
  );

  const handleSkipContactDetails = useCallback(async () => {
    messageHook.addUserMessage('Skip contact details for now');
    await messageHook.addStepTransitionMessage('ready', 'ready', { hasContactDetails: false });
    flowHook.setStep('ready');
    messageHook.setSuggestedReplies([
      { id: 'confirm', text: 'Looks good!' },
      { id: 'edit', text: 'Let me change something' },
    ]);
  }, [flowHook, messageHook]);

  const startBuild = useCallback(
    async (integrations: IntegrationConfig[], contactDetails?: ContactDetails, generateImages?: boolean) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const signal = abortControllerRef.current.signal;

      console.log('[BROWSER] [DEBUG] startBuild called');
      flowHook.setStep('creating');
      setBuildStep('Generating your website...');
      setBuildProgress(BUILD_PROGRESS.INITIAL);

      const selectedTemplate = templateHook.selectedTemplate;
      const effectiveTemplate =
        selectedTemplate ||
        (seededTemplate
          ? {
              id: seededTemplate.id,
              name: seededTemplate.name,
            }
          : null);
      const selectedPalette = paletteHook.selectedPalette;

      console.log('[BROWSER] [DEBUG] Checking template:', !!effectiveTemplate);

      if (!effectiveTemplate) {
        flowHook.setStep('ready');
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_TEMPLATE_FIRST));

        return;
      }

      if (!selectedPalette) {
        flowHook.setStep('ready');
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_PALETTE_FIRST));

        return;
      }

      if (!selectedFont) {
        flowHook.setStep('ready');
        messageHook.addAssistantMessage('Please select a font first.');

        return;
      }

      let buildCompletedSuccessfully = false;

      try {
        console.log('[BROWSER] [DEBUG] Entering try block');

        const resolvedTemplateName = effectiveTemplate.name;
        const resolvedTemplateId = effectiveTemplate.id || 'default';
        const resolvedProjectName = flowHook.projectName || resolvedTemplateName || 'My Website';
        const projectId = existingProjectId || generateProjectSlug(resolvedProjectName);

        /*
         * Only set convexProjectId if we have a real Convex project ID from handoff
         * A generated slug (projectId from generateProjectSlug) is NOT a valid Convex ID
         * and will cause ArgumentValidationError in Convex updateState
         */

        setBuildPhase('generating');
        setBuildProgress(BUILD_PROGRESS.GENERATING_START);
        messageHook.addAssistantMessage(
          '**Building your site...**\nOur AI is creating a custom website based on your selections. This may take a moment.',
        );

        const siteInput = buildSiteGenerationInput({
          onAgentEvent: (event) => {
            agentEventsRef.current = [...agentEventsRef.current, event];

            if (chatMsgIdRef.current) {
              messageHook.updateMessage(chatMsgIdRef.current, {
                agentEvents: agentEventsRef.current,
                isAgentActive: true,
              } as any);
            }
          },
          projectId,
          convexConversationId: convexConversationId || undefined,
          projectName: resolvedProjectName,
          templateId: resolvedTemplateId,
          templateName: resolvedTemplateName,
          businessData: businessHook.businessInfo,
          projectDescription: flowHook.projectDescription || '',
          palette: selectedPalette,
          font: selectedFont,
          integrations,
          contactDetails,
          generateImages: generateImages || false,
          signal,
          onProgress: (msg: string) => mapProgressMessage(msg, setBuildPhase, setBuildProgress, setBuildStep),
        });

        setBuildProgress(BUILD_PROGRESS.GENERATING_PROGRESS);
        setBuildStep('Planning site architecture...');

        // Reset agent events and add a live status card to chat
        agentEventsRef.current = [];

        const statusMsg = messageHook.addAssistantMessage(
          'Building your site...',
          null, // component injected via updateMessage below
        );
        chatMsgIdRef.current = statusMsg?.id ?? null;

        const result = await generateSiteMutation.mutateAsync(
          siteInput as Parameters<typeof generateSiteMutation.mutateAsync>[0],
        );

        // Handle preview
        setBuildPhase('deploying');
        setBuildProgress(BUILD_PROGRESS.DEPLOYING_START);
        setBuildStep('Preparing your preview...');

        if (result.preview?.url) {
          workbenchStore.setShowWorkbench(true);
          workbenchStore.currentView.set('preview');
          workbenchStore.setDaytonaPreview({ url: result.preview.url, sandboxId: result.preview.sandboxId || '' });
          onPreviewChangeRef.current?.({ url: result.preview.url, status: 'ready' });

          if (result.files?.length) {
            for (const file of result.files) {
              await workbenchStore.createFile(file.path, file.content);
            }
          }

          setBuildProgress(BUILD_PROGRESS.DEPLOYING_PROGRESS);
        } else if (result.previewError) {
          console.warn('[SimpleBuildHandlers] Preview failed:', result.previewError);
          messageHook.addAssistantMessage(
            `Your site was generated, but we had trouble with the preview: ${result.previewError}`,
          );
        }

        // Complete
        setBuildProgress(BUILD_PROGRESS.COMPLETE);
        setBuildStep('');

        const selfHealAttempts = ((result as unknown as Record<string, unknown>).selfHealAttempts as number) || 0;
        setBuildPhase(selfHealAttempts > 0 ? 'complete-healed' : 'complete');

        buildCompletedSuccessfully = true;
        flowHook.setStep('ready');
        setCurrentUrlId(projectId);
        onProjectReadyRef.current?.(projectId);
        messageHook.setSuggestedReplies([
          { id: 'customize', text: 'Make some changes' },
          { id: 'different-style', text: 'Try different colors' },
          { id: 'add-features', text: 'Add more sections' },
        ]);

        const healNote =
          selfHealAttempts > 0
            ? `\n\n_Auto-fixed ${selfHealAttempts} build issue${selfHealAttempts > 1 ? 's' : ''} during preview setup._`
            : '';
        messageHook.addAssistantMessage(
          `**Your site is ready!**\n\nI've created ${result.files?.length || 0} files for your website.${healNote} You can preview it now, or ask me to make any changes.`,
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('[SimpleBuildHandlers] Failed to create project:', error);

        // Don't reset if the build already completed — only reset on pre-build failures
        if (!buildCompletedSuccessfully) {
          setBuildStep('');
          setBuildProgress(BUILD_PROGRESS.INITIAL);
          flowHook.setStep('ready');
        }

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        messageHook.addAssistantMessage(
          `Something went wrong while building your site: ${errorMessage}\n\nPlease review the project setup and try again.`,
        );
        messageHook.setSuggestedReplies([
          { id: 'retry', text: 'Try again' },
        ]);
      }
    },
    [
      flowHook,
      messageHook,
      seededTemplate,
      templateHook.selectedTemplate,
      paletteHook.selectedPalette,
      businessHook.businessInfo,
      selectedFont,
      existingProjectId,
      setConvexProjectId,
      setCurrentUrlId,
      setBuildStep,
      setBuildProgress,
      setBuildPhase,
      generateSiteMutation,
    ],
  );

  const startSeededBuild = useCallback(async () => {
    await startBuild(seededIntegrations);
  }, [seededIntegrations, startBuild]);

  return {
    handleContactDetailsComplete,
    handleSkipContactDetails,
    startSeededBuild,
  };
}
