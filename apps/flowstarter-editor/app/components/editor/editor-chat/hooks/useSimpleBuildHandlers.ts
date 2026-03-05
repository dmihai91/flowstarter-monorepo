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
import type { ContactDetails, InitialChatState, IntegrationConfig } from '../types';
import type { Id } from '~/convex/_generated/dataModel';
import { MESSAGE_KEYS, getMessage } from '../constants';
import { toConvexIntegrations, buildIntegrationsMessage } from './integrationHelpers';
import { BUILD_PROGRESS } from './simple-build-types';
import { mapProgressMessage, buildSiteGenerationInput, toConvexContactDetails } from './build-helpers';
import type { UseSimpleBuildHandlersProps, UseSimpleBuildHandlersReturn } from './simple-build-types';

// Re-export types for backward compatibility
export type { UseSimpleBuildHandlersProps, UseSimpleBuildHandlersReturn } from './simple-build-types';

export function useSimpleBuildHandlers({
  messageHook, flowHook, templateHook, paletteHook, businessHook,
  selectedFont, selectedLogo, setSelectedFont, setSelectedLogo,
  setConvexProjectId, setCurrentUrlId, setBuildStep, setBuildProgress, setBuildPhase,
  onPreviewChange, onProjectReady, onStateChange, existingProjectId,
}: UseSimpleBuildHandlersProps): UseSimpleBuildHandlersReturn {
  const generateSiteMutation = useGenerateSiteStream();
  const updateIntegrations = useMutation(api.projects.updateIntegrations);
  const updateContactDetails = useMutation(api.projects.updateContactDetails);

  const abortControllerRef = useRef<AbortController | null>(null);
  const onPreviewChangeRef = useRef(onPreviewChange);
  const onProjectReadyRef = useRef(onProjectReady);
  const onStateChangeRef = useRef(onStateChange);
  onPreviewChangeRef.current = onPreviewChange;
  onProjectReadyRef.current = onProjectReady;
  onStateChangeRef.current = onStateChange;

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const useAiImagesRef = useRef<boolean>(false);
  const contactDetailsRef = useRef<ContactDetails | undefined>(undefined);

  const handlePersonalizationComplete = useCallback(
    async (font: Parameters<UseSimpleBuildHandlersReturn['handlePersonalizationComplete']>[0], logo: Parameters<UseSimpleBuildHandlersReturn['handlePersonalizationComplete']>[1], useAiImages?: boolean) => {
      setSelectedFont(font);
      setSelectedLogo(logo);
      useAiImagesRef.current = useAiImages || false;

      let userMessage = `Perfect! I'll use the "${font.name}" font`;
      if (logo.type === 'uploaded') userMessage += ' and my uploaded logo';
      else if (logo.type === 'generated') userMessage += ' and the AI-generated logo';
      if (useAiImages) userMessage += '. Generate AI images for my site.';

      messageHook.addUserMessage(userMessage);
      onStateChangeRef.current?.({ useAiImages } as Partial<InitialChatState>);
      await messageHook.addStepTransitionMessage('personalization', 'integrations', {
        fontName: font.name, logoType: logo.type, useAiImages,
      });
      flowHook.setStep('integrations');
    },
    [flowHook, messageHook, setSelectedFont, setSelectedLogo],
  );

  const handleContactDetailsComplete = useCallback(
    async (contactDetails: ContactDetails) => {
      contactDetailsRef.current = contactDetails;
      let userMessage = `Contact info: ${contactDetails.email}`;
      if (contactDetails.phone) userMessage += `, ${contactDetails.phone}`;
      messageHook.addUserMessage(userMessage);

      if (existingProjectId) {
        try { console.log("[BROWSER] [DEBUG] Entering try block");
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
      await messageHook.addStepTransitionMessage('business-contact', 'business-summary', { hasContactDetails: true });
      flowHook.setStep('business-summary');
      messageHook.setSuggestedReplies([
        { id: 'confirm', text: 'Looks good!' },
        { id: 'edit', text: 'Let me change something' },
      ]);
    },
    [flowHook, messageHook, existingProjectId, updateContactDetails],
  );

  const handleSkipContactDetails = useCallback(async () => {
    messageHook.addUserMessage("Skip contact details for now");
    await messageHook.addStepTransitionMessage('business-contact', 'business-summary', { hasContactDetails: false });
    flowHook.setStep('business-summary');
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

      console.log("[BROWSER] [DEBUG] startBuild called"); flowHook.setStep('creating');
      setBuildStep('Generating your website...');
      setBuildProgress(BUILD_PROGRESS.INITIAL);

      const selectedTemplate = templateHook.selectedTemplate;
      const selectedPalette = paletteHook.selectedPalette;

      console.log("[BROWSER] [DEBUG] Checking template:", !!selectedTemplate);
      if (!selectedTemplate) { flowHook.setStep('template'); messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_TEMPLATE_FIRST)); return; }
      if (!selectedPalette) { flowHook.setStep('personalization'); messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_PALETTE_FIRST)); return; }
      if (!selectedFont) { flowHook.setStep('personalization'); messageHook.addAssistantMessage('Please select a font first.'); return; }

      try { console.log("[BROWSER] [DEBUG] Entering try block");
        const projectName = flowHook.projectName || selectedTemplate.name || 'My Website';
        const projectId = existingProjectId || generateProjectSlug(projectName);

        if (!existingProjectId) {
          setConvexProjectId(projectId);
          onStateChangeRef.current?.({ convexProjectId: projectId } as Partial<InitialChatState>);
        }

        setBuildPhase('generating');
        setBuildProgress(BUILD_PROGRESS.GENERATING_START);
        messageHook.addAssistantMessage(
          '**Building your site...**\nOur AI is creating a custom website based on your selections. This may take a moment.',
        );

        const siteInput = buildSiteGenerationInput({
          projectId, projectName,
          templateId: selectedTemplate.id || 'default', templateName: selectedTemplate.name,
          businessData: businessHook.businessInfo, projectDescription: flowHook.projectDescription || '',
          palette: selectedPalette, font: selectedFont,
          integrations, contactDetails, generateImages: generateImages || false, signal,
          onProgress: (msg: string) => mapProgressMessage(msg, setBuildPhase, setBuildProgress, setBuildStep),
        });

        setBuildProgress(BUILD_PROGRESS.GENERATING_PROGRESS);
        setBuildStep('Planning site architecture...');
        const result = await generateSiteMutation.mutateAsync(siteInput as Parameters<typeof generateSiteMutation.mutateAsync>[0]);

        // Handle preview
        setBuildPhase('deploying'); setBuildProgress(BUILD_PROGRESS.DEPLOYING_START); setBuildStep('Preparing your preview...');
        if (result.preview?.url) {
          workbenchStore.setShowWorkbench(true);
          workbenchStore.currentView.set('preview');
          workbenchStore.setDaytonaPreview({ url: result.preview.url, sandboxId: result.preview.sandboxId || '' });
          onPreviewChangeRef.current?.({ url: result.preview.url, status: 'ready' });
          if (result.files?.length) { for (const file of result.files) await workbenchStore.createFile(file.path, file.content); }
          setBuildProgress(BUILD_PROGRESS.DEPLOYING_PROGRESS);
        } else if (result.previewError) {
          console.warn('[SimpleBuildHandlers] Preview failed:', result.previewError);
          messageHook.addAssistantMessage(`Your site was generated, but we had trouble with the preview: ${result.previewError}`);
        }

        // Complete
        setBuildProgress(BUILD_PROGRESS.COMPLETE); setBuildStep('');
        const selfHealAttempts = ((result as unknown) as Record<string, unknown>).selfHealAttempts as number || 0;
        setBuildPhase(selfHealAttempts > 0 ? 'complete-healed' : 'complete');

        flowHook.setStep('ready');
        setCurrentUrlId(projectId);
        onProjectReadyRef.current?.(projectId);
        messageHook.setSuggestedReplies([
          { id: 'customize', text: 'Make some changes' },
          { id: 'different-style', text: 'Try different colors' },
          { id: 'add-features', text: 'Add more sections' },
        ]);

        const healNote = selfHealAttempts > 0
          ? `\n\n_Auto-fixed ${selfHealAttempts} build issue${selfHealAttempts > 1 ? 's' : ''} during preview setup._`
          : '';
        messageHook.addAssistantMessage(
          `**Your site is ready!**\n\nI've created ${result.files?.length || 0} files for your website.${healNote} You can preview it now, or ask me to make any changes.`,
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('[SimpleBuildHandlers] Failed to create project:', error);
        setBuildStep(''); setBuildProgress(BUILD_PROGRESS.INITIAL); flowHook.setStep('template');
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        messageHook.addAssistantMessage(`Something went wrong while building your site: ${errorMessage}\n\nPlease try again or select a different template.`);
        messageHook.setSuggestedReplies([{ id: 'retry', text: 'Try again' }, { id: 'different-template', text: 'Choose different template' }]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flowHook, messageHook, templateHook.selectedTemplate, paletteHook.selectedPalette, businessHook.businessInfo,
      selectedFont, existingProjectId, setConvexProjectId, setCurrentUrlId, setBuildStep, setBuildProgress, setBuildPhase, generateSiteMutation],
  );

  const handleIntegrationsComplete = useCallback(
    async (integrations: IntegrationConfig[]) => {
      console.log("[BROWSER] [DEBUG] handleIntegrationsComplete called", integrations);
      messageHook.addUserMessage(buildIntegrationsMessage(integrations));

      if (existingProjectId) {
        try { console.log("[BROWSER] [DEBUG] Entering try block");
          await updateIntegrations({ projectId: existingProjectId as Id<'projects'>, integrations: toConvexIntegrations(integrations) });
          console.log('[useSimpleBuildHandlers] ✅ Integrations saved to Convex');
        } catch (error) {
          console.error('[useSimpleBuildHandlers] ❌ Failed to save integrations to Convex:', error);
        }
      }

      onStateChangeRef.current?.({
        integrations: integrations.map(i => ({ id: i.id, name: i.name, enabled: i.enabled, config: i.config })),
      } as Partial<InitialChatState>);
      await startBuild(integrations, contactDetailsRef.current, useAiImagesRef.current);
    },
    [messageHook, startBuild, existingProjectId, updateIntegrations],
  );

  const handleSkipIntegrations = useCallback(async () => {
    messageHook.addUserMessage("Skip integrations for now - let's build!");
    await startBuild([]);
  }, [messageHook, startBuild]);

  return { handlePersonalizationComplete, handleContactDetailsComplete, handleSkipContactDetails, handleIntegrationsComplete, handleSkipIntegrations };
}
