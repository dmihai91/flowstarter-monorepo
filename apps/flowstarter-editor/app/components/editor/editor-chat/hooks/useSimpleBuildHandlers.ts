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
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import type { UsePaletteSelectionReturn } from './usePaletteSelection';
import type { UseBusinessInfoReturn } from './useBusinessInfo';
import type { SystemFont, LogoInfo, PreviewInfo, InitialChatState, IntegrationConfig, ContactDetails } from '../types';
import type { Id } from '~/convex/_generated/dataModel';
import { MESSAGE_KEYS, getMessage } from '../constants';
import { toConvexIntegrations, buildIntegrationsMessage } from './integrationHelpers';

// ─── Build Progress Constants ───────────────────────────────────────────────
const BUILD_PROGRESS = {
  INITIAL: 0,
  GENERATING_START: 10,
  GENERATING_PROGRESS: 50,
  DEPLOYING_START: 70,
  DEPLOYING_PROGRESS: 85,
  COMPLETE: 100,
} as const;

interface UseSimpleBuildHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;
  businessHook: UseBusinessInfoReturn;
  selectedFont: SystemFont | null;
  selectedLogo: LogoInfo | null;
  setSelectedFont: (font: SystemFont | null) => void;
  setSelectedLogo: (logo: LogoInfo | null) => void;
  setConvexProjectId: (id: string | null) => void;
  setCurrentUrlId: (id: string | null) => void;
  setBuildStep: (step: string) => void;
  setBuildProgress: (progress: number) => void;
  setBuildPhase: (phase: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  onProjectReady?: (urlId: string) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;

  /** Existing project ID if one was already created (e.g., in /new route) */
  existingProjectId?: string | null;
}

interface UseSimpleBuildHandlersReturn {
  handlePersonalizationComplete: (font: SystemFont, logo: LogoInfo, useAiImages?: boolean) => Promise<void>;
  handleContactDetailsComplete: (contactDetails: ContactDetails) => Promise<void>;
  handleSkipContactDetails: () => Promise<void>;
  handleIntegrationsComplete: (integrations: IntegrationConfig[]) => Promise<void>;
  handleSkipIntegrations: () => Promise<void>;
}

export function useSimpleBuildHandlers({
  messageHook,
  flowHook,
  templateHook,
  paletteHook,
  businessHook,
  selectedFont,
  selectedLogo,
  setSelectedFont,
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
}: UseSimpleBuildHandlersProps): UseSimpleBuildHandlersReturn {
  // ─── React Query Mutations ────────────────────────────────────────────────
  const generateSiteMutation = useGenerateSiteStream();
  const updateIntegrations = useMutation(api.projects.updateIntegrations);
  const updateContactDetails = useMutation(api.projects.updateContactDetails);

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

  // Store useAiImages preference in a ref for access during build
  const useAiImagesRef = useRef<boolean>(false);
  
  // Store contact details in a ref for access during build
  const contactDetailsRef = useRef<ContactDetails | undefined>(undefined);

  /**
   * Called when personalization (font/logo selection) is complete.
   * Saves selections and transitions to the integrations step.
   */
  const handlePersonalizationComplete = useCallback(
    async (font: SystemFont, logo: LogoInfo, useAiImages?: boolean) => {
      setSelectedFont(font);
      setSelectedLogo(logo);
      useAiImagesRef.current = useAiImages || false;

      // Build user message based on selections
      let userMessage = `Perfect! I'll use the "${font.name}" font`;

      if (logo.type === 'uploaded') {
        userMessage += ' and my uploaded logo';
      } else if (logo.type === 'generated') {
        userMessage += ' and the AI-generated logo';
      }

      if (useAiImages) {
        userMessage += '. Generate AI images for my site.';
      }

      messageHook.addUserMessage(userMessage);
      
      // Sync useAiImages to state
      onStateChangeRef.current?.({ useAiImages } as Partial<InitialChatState>);
      
      // Transition to integrations step
      await messageHook.addStepTransitionMessage('personalization', 'integrations', {
        fontName: font.name,
        logoType: logo.type,
        useAiImages,
      });
      
      flowHook.setStep('integrations');
    },
    [flowHook, messageHook, setSelectedFont, setSelectedLogo],
  );

  /**
   * Called when contact details are submitted during onboarding.
   * Saves to Convex and transitions to business-summary.
   */
  const handleContactDetailsComplete = useCallback(
    async (contactDetails: ContactDetails) => {
      contactDetailsRef.current = contactDetails;
      
      // Build user message
      let userMessage = `Contact info: ${contactDetails.email}`;
      if (contactDetails.phone) userMessage += `, ${contactDetails.phone}`;
      messageHook.addUserMessage(userMessage);

      // Save to Convex if we have a project ID
      if (existingProjectId) {
        try { console.log("[BROWSER] [DEBUG] Entering try block");
          await updateContactDetails({
            projectId: existingProjectId as Id<'projects'>,
            contactDetails: {
              email: contactDetails.email || undefined,
              phone: contactDetails.phone || undefined,
              address: contactDetails.address || undefined,
              website: contactDetails.website || undefined,
              facebook: contactDetails.facebook || undefined,
              instagram: contactDetails.instagram || undefined,
              twitter: contactDetails.twitter || undefined,
              linkedin: contactDetails.linkedin || undefined,
              youtube: contactDetails.youtube || undefined,
              tiktok: contactDetails.tiktok || undefined,
            },
          });
          console.log('[useSimpleBuildHandlers] ✅ Contact details saved to Convex');
        } catch (error) {
          console.error('[useSimpleBuildHandlers] ❌ Failed to save contact details:', error);
        }
      }

      // Sync to state
      onStateChangeRef.current?.({ contactDetails } as Partial<InitialChatState>);

      // Transition to business summary
      await messageHook.addStepTransitionMessage('business-contact', 'business-summary', {
        hasContactDetails: true,
      });
      flowHook.setStep('business-summary');
      messageHook.setSuggestedReplies([
        { id: 'confirm', text: 'Looks good!' },
        { id: 'edit', text: 'Let me change something' },
      ]);
    },
    [flowHook, messageHook, existingProjectId, updateContactDetails],
  );

  /**
   * Called when user skips contact details step.
   */
  const handleSkipContactDetails = useCallback(async () => {
    messageHook.addUserMessage("Skip contact details for now");
    
    // Transition to business summary
    await messageHook.addStepTransitionMessage('business-contact', 'business-summary', {
      hasContactDetails: false,
    });
    flowHook.setStep('business-summary');
    messageHook.setSuggestedReplies([
      { id: 'confirm', text: 'Looks good!' },
      { id: 'edit', text: 'Let me change something' },
    ]);
  }, [flowHook, messageHook]);

  /**
   * Internal function that performs the actual build using React Query mutation
   */
  const startBuild = useCallback(
    async (integrations: IntegrationConfig[], contactDetails?: ContactDetails, generateImages?: boolean) => {
      // Cancel any in-flight build requests
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const signal = abortControllerRef.current.signal;

      console.log("[BROWSER] [DEBUG] startBuild called"); flowHook.setStep('creating');
      setBuildStep('Generating your website...');
      setBuildProgress(BUILD_PROGRESS.INITIAL);

      const selectedTemplate = templateHook.selectedTemplate;
      const selectedPalette = paletteHook.selectedPalette;

      console.log("[BROWSER] [DEBUG] Checking template:", !!selectedTemplate); if (!selectedTemplate) {
        flowHook.setStep('template');
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_TEMPLATE_FIRST));
        return;
      }

      if (!selectedPalette) {
        flowHook.setStep('personalization');
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.BUILD_SELECT_PALETTE_FIRST));
        return;
      }

      if (!selectedFont) {
        flowHook.setStep('personalization');
        messageHook.addAssistantMessage('Please select a font first.');
        return;
      }

      try { console.log("[BROWSER] [DEBUG] Entering try block");
        /*
         * Use existing project ID if available, otherwise generate a slug from the project name
         * Format: project-name-abc123 (readable URL-friendly slug)
         */
        console.log("[BROWSER] [DEBUG] Getting project name..."); const projectName = flowHook.projectName || selectedTemplate.name || 'My Website';
        const projectId = existingProjectId || generateProjectSlug(projectName); console.log("[BROWSER] [DEBUG] Project ID:", projectId);

        if (!existingProjectId) {
          // Only update state if we created a new project ID
          setConvexProjectId(projectId);
          onStateChangeRef.current?.({ convexProjectId: projectId } as Partial<InitialChatState>);
        }

        // Phase 1: Generate the site using React Query mutation with SSE streaming
        console.log("[BROWSER] [DEBUG] Setting buildPhase to generating"); setBuildPhase('generating');
        setBuildProgress(BUILD_PROGRESS.GENERATING_START);
        messageHook.addAssistantMessage(
          '**Building your site...**\nOur AI is creating a custom website based on your selections. This may take a moment.',
        );

        // Build the request for the Claude Agent service
        const siteGenerationInput = {
          projectId,
          siteName: flowHook.projectName || selectedTemplate.name || 'My Website',
          businessInfo: {
            name: businessHook.businessInfo?.uvp || flowHook.projectName || 'My Business',
            tagline: businessHook.businessInfo?.targetAudience || undefined,
            description: flowHook.projectDescription || undefined,
            services: businessHook.businessInfo?.businessGoals || undefined,
          },
          template: {
            slug: selectedTemplate.id || 'default',
            name: selectedTemplate.name,
          },
          design: {
            primaryColor: selectedPalette.colors[0] || '#3B82F6',
            secondaryColor: selectedPalette.colors[1] || '#1E40AF',
            accentColor: selectedPalette.colors[2] || '#60A5FA',
            fontFamily: selectedFont.body,
            headingFont: selectedFont.heading,
          },
          integrations: integrations.map(i => ({
            id: i.id,
            name: i.name,
            config: i.config || {},
          })),
          // Pass contact details to the build agent
          contactDetails: contactDetails ? {
            email: contactDetails.email || undefined,
            phone: contactDetails.phone || undefined,
            address: contactDetails.address || undefined,
          } : undefined,
          deployToPreview: true,
          generateImages: generateImages || false, // Only generate AI images if explicitly requested
          signal,
          onProgress: (message: string) => {
            setBuildStep(message);

            // Map infrastructure progress messages to granular build phases
            if (message.includes('Provisioning cloud sandbox')) {
              setBuildPhase('deploying');
              setBuildProgress(BUILD_PROGRESS.DEPLOYING_START);
            } else if (message.includes('Uploading') && message.includes('files')) {
              setBuildPhase('deploying-upload');
              setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 3);
            } else if (message.includes('Installing dependencies')) {
              setBuildPhase('deploying-install');
              setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 8);
            } else if (message.includes('Starting') && message.includes('dev server')) {
              setBuildPhase('deploying-server');
              setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 15);
            } else if (message.includes('Waiting for') && message.includes('respond')) {
              setBuildPhase('deploying-waiting');
              setBuildProgress(BUILD_PROGRESS.DEPLOYING_START + 20);
            } else if (message.includes('Preview server is live')) {
              setBuildProgress(95);
            // Self-healing phases
            } else if (
              message.includes('Fixing automatically') ||
              message.includes('Quick fix:') ||
              message.includes('Analyzing error') ||
              message.includes('Fixed:') ||
              message.includes('Removed broken import')
            ) {
              setBuildPhase('fixing');
              setBuildProgress(Math.min(BUILD_PROGRESS.DEPLOYING_START + 25, 88));
            } else if (message.includes('Retrying preview')) {
              setBuildPhase('fixing-retry');
              setBuildProgress(Math.min(BUILD_PROGRESS.DEPLOYING_START + 28, 90));
            } else if (message.includes('Preview ready after')) {
              setBuildPhase('complete-healed');
            // File generation progress (during AI phase)
            } else if (
              message.includes('Generating files') ||
              message.includes('Creating ') ||
              message.includes('Customizing ') ||
              message.includes('Completed ') ||
              message.includes('Planning strategic')
            ) {
              // Keep current phase but update the step message to show file activity
              setBuildProgress(Math.min(BUILD_PROGRESS.GENERATING_PROGRESS + 10, 90));
            } else {
              setBuildProgress(Math.min(BUILD_PROGRESS.GENERATING_PROGRESS + 10, 90));
            }
          },
        };

        setBuildProgress(BUILD_PROGRESS.GENERATING_PROGRESS);
        setBuildStep('Planning site architecture...');

        // Use React Query mutation for streaming site generation
        const result = await generateSiteMutation.mutateAsync(siteGenerationInput);

        // Phase 2: Handle preview
        setBuildPhase('deploying');
        setBuildProgress(BUILD_PROGRESS.DEPLOYING_START);
        setBuildStep('Preparing your preview...');

        if (result.preview?.url) {
          workbenchStore.setShowWorkbench(true);
          workbenchStore.currentView.set('preview');
          workbenchStore.setDaytonaPreview({
            url: result.preview.url,
            sandboxId: result.preview.sandboxId || '',
          });
          onPreviewChangeRef.current?.({ url: result.preview.url, status: 'ready' });

          // Sync generated files to workbench editor
          if (result.files && result.files.length > 0) {
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

        // Phase 3: Complete
        setBuildProgress(BUILD_PROGRESS.COMPLETE);
        setBuildStep('');

        // Show healed state if self-healing occurred
        const selfHealAttempts = ((result as unknown) as Record<string, unknown>).selfHealAttempts as number || 0;
        if (selfHealAttempts > 0) {
          setBuildPhase('complete-healed');
        } else {
          setBuildPhase('complete');
        }

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
        // Don't show error for aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('[SimpleBuildHandlers] Failed to create project:', error);
        setBuildStep('');
        setBuildProgress(BUILD_PROGRESS.INITIAL);
        flowHook.setStep('template');

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        messageHook.addAssistantMessage(
          `Something went wrong while building your site: ${errorMessage}\n\nPlease try again or select a different template.`,
        );
        messageHook.setSuggestedReplies([
          { id: 'retry', text: 'Try again' },
          { id: 'different-template', text: 'Choose different template' },
        ]);
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

  /**
   * Called when integrations are configured and user clicks Build.
   * Starts the actual site generation process.
   * Contact details and AI images preference are read from refs (set during earlier steps).
   */
  const handleIntegrationsComplete = useCallback(
    async (integrations: IntegrationConfig[]) => { console.log("[BROWSER] [DEBUG] handleIntegrationsComplete called", integrations);
      // Build user message showing what integrations were selected
      messageHook.addUserMessage(buildIntegrationsMessage(integrations));

      // Persist integrations to Convex
      const projectId = existingProjectId;
      if (projectId) {
        try { console.log("[BROWSER] [DEBUG] Entering try block");
          await updateIntegrations({
            projectId: projectId as Id<'projects'>,
            integrations: toConvexIntegrations(integrations),
          });
          console.log('[useSimpleBuildHandlers] ✅ Integrations saved to Convex');
        } catch (error) {
          console.error('[useSimpleBuildHandlers] ❌ Failed to save integrations to Convex:', error);
          // Don't block the build — integrations are also passed directly to the build agent
        }
      }

      // Get contact details and AI images preference from refs (set during earlier steps)
      const contactDetails = contactDetailsRef.current;
      const generateImages = useAiImagesRef.current;

      // Also sync via onStateChange for local state persistence
      onStateChangeRef.current?.({
        integrations: integrations.map(i => ({
          id: i.id,
          name: i.name,
          enabled: i.enabled,
          config: i.config,
        })),
      } as Partial<InitialChatState>);

      // Start the build with the configured integrations and contact details
      await startBuild(integrations, contactDetails, generateImages);
    },
    [messageHook, startBuild, existingProjectId, updateIntegrations],
  );

  /**
   * Called when user skips the integrations step.
   * Starts the build without any integrations.
   */
  const handleSkipIntegrations = useCallback(async () => {
    messageHook.addUserMessage("Skip integrations for now - let's build!");
    await startBuild([]);
  }, [messageHook, startBuild]);

  return {
    handlePersonalizationComplete,
    handleContactDetailsComplete,
    handleSkipContactDetails,
    handleIntegrationsComplete,
    handleSkipIntegrations,
  };
}

export type { UseSimpleBuildHandlersProps, UseSimpleBuildHandlersReturn };







