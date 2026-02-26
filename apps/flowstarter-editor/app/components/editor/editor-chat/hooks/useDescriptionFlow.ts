/**
 * useDescriptionFlow Hook - Handles description, quick profile, and UVP submission flows
 */
import { useCallback } from 'react';
import { SUGGESTED_REPLIES } from '../constants';
import { getQuickProfileAckMessage, getDescribeAckMessage } from './streamlined-onboarding';
import { inferBusinessInfo } from '~/lib/inference/auto-inference';

import type { BusinessInfo, QuickProfile, InitialChatState } from '../types';
import type { useOnboardingMessages } from './useOnboardingMessages';
import type { useOnboardingFlow } from './useOnboardingFlow';
import type { useBusinessInfo } from './useBusinessInfo';
import type { useTemplateSelection } from './useTemplateSelection';

interface UseDescriptionFlowProps {
  messageHook: ReturnType<typeof useOnboardingMessages>;
  flowHook: ReturnType<typeof useOnboardingFlow>;
  businessHook: ReturnType<typeof useBusinessInfo>;
  templateHook: ReturnType<typeof useTemplateSelection>;
  setQuickProfile: (profile: QuickProfile | null) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function useDescriptionFlow({
  messageHook,
  flowHook,
  businessHook,
  templateHook,
  setQuickProfile,
  onStateChange,
}: UseDescriptionFlowProps) {
  /** Description submission - goes to name step */
  const handleDescriptionSubmit = useCallback(
    async (description: string) => {
      flowHook.setProjectDescription(description);
      messageHook.addUserMessage(description);
      messageHook.setSuggestedReplies([]);

      // Auto-infer business info from description
      const inference = inferBusinessInfo(description);

      // Generate acknowledgment with quick profile prompt
      const ackMessage = getDescribeAckMessage(description, inference);
      await messageHook.addAssistantMessage(ackMessage.content);

      // Suggest a project name from description
      const suggestedName = inference.businessType
        ? inference.businessType.type
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : '';

      if (suggestedName) {
        flowHook.setLastSuggestedName(suggestedName);
      }

      // Notify parent with ALL messages so project can be created
      const allMessages = messageHook.getMessagesSync().map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.timestamp,
      }));
      onStateChange?.({
        projectDescription: description,
        step: 'name',
        messages: allMessages as unknown as InitialChatState['messages'],
      });

      // Ask for project name with refinement options
      await messageHook.addAssistantMessage(
        `**What would you like to call your project?**\n\n` +
          (suggestedName ? `I suggest: **${suggestedName}**\n\n` : '') +
          `This will be used as your site title.`,
      );

      // Show refinement cards if we have a suggestion
      messageHook.setSuggestedReplies(
        suggestedName
          ? SUGGESTED_REPLIES.nameRefinementWithName(suggestedName)
          : SUGGESTED_REPLIES.nameChoice(),
      );

      // Move to name step
      flowHook.setStep('name');
    },
    [flowHook, messageHook, onStateChange],
  );

  /** Quick Profile completion - transitions to UVP step */
  const handleQuickProfileComplete = useCallback(
    async (profile: QuickProfile) => {
      setQuickProfile(profile);

      // Add user message with formatted choices
      const labels: Record<string, string> = {
        leads: 'Get Leads',
        sales: 'Make Sales',
        bookings: 'Get Bookings',
        'high-ticket': 'Premium',
        'low-ticket': 'Accessible',
        free: 'Free First',
        professional: 'Professional',
        bold: 'Bold',
        friendly: 'Friendly',
      };
      const choiceSummary = `${labels[profile.goal]} • ${labels[profile.offerType]} • ${labels[profile.tone]}`;
      messageHook.addUserMessage(choiceSummary);

      // Generate acknowledgment
      const ackMessage = getQuickProfileAckMessage(profile);
      await messageHook.addAssistantMessage(ackMessage.content);

      // Build business info from quick profile + auto-inference
      const description = flowHook.projectDescription || '';
      const inference = inferBusinessInfo(description);
      const businessInfo: BusinessInfo = {
        description,
        quickProfile: profile,
        businessType: inference.businessType?.type,
        targetAudience: inference.targetAudience?.audience,
        uvp: inference.uvp || undefined,
        industry: inference.businessType?.category,
      };

      // Update state - transition to UVP step
      businessHook.setBusinessInfo(businessInfo);
      onStateChange?.({
        quickProfile: profile,
        businessInfo,
        step: 'business-uvp',
      });

      // Show UVP prompt
      await messageHook.addAssistantMessage(
        '**What makes you different?**\n\n' +
          'Tell me your unique approach or what sets you apart from others.\n\n' +
          '*Example: "I use a holistic 3-step method that combines mindfulness with practical action plans."*',
      );
      messageHook.setSuggestedReplies([
        { id: 'uvp-method', text: 'I have a unique method' },
        { id: 'uvp-experience', text: 'Years of experience' },
        { id: 'uvp-results', text: 'Proven results' },
        { id: 'uvp-skip', text: 'Skip for now' },
      ]);
      flowHook.setStep('business-uvp');
    },
    [messageHook, flowHook, businessHook, setQuickProfile, onStateChange],
  );

  /** UVP submission - transitions to template selection */
  const handleUvpSubmit = useCallback(
    async (uvp: string, skipped: boolean = false) => {
      // Add user message
      if (skipped) {
        messageHook.addUserMessage('Skip for now');
      } else {
        messageHook.addUserMessage(uvp);
      }
      messageHook.setSuggestedReplies([]);

      // Update business info with UVP
      const currentBusinessInfo = businessHook.businessInfo || ({} as BusinessInfo);
      const updatedBusinessInfo: BusinessInfo = {
        ...currentBusinessInfo,
        uvp: skipped ? undefined : uvp,
      };
      businessHook.setBusinessInfo(updatedBusinessInfo);

      // Generate acknowledgment
      const ackContent = skipped
        ? "No problem! We can always add this later.\n\nNow let's pick your template. I've selected **3 that match your profile**:"
        : `Love it! "${uvp}" - that's a great differentiator.\n\nNow let's pick your template. I've selected **3 that match your profile**:`;
      await messageHook.addAssistantMessage(ackContent);

      // Fetch template recommendations
      const description = flowHook.projectDescription || '';
      const projectName = flowHook.projectName || 'My Site';
      templateHook.fetchRecommendations(updatedBusinessInfo, projectName, description);

      // Update state and move to template step
      onStateChange?.({
        businessInfo: updatedBusinessInfo,
        step: 'template',
      });
      flowHook.setStep('template');
    },
    [messageHook, flowHook, templateHook, businessHook, onStateChange],
  );

  return {
    handleDescriptionSubmit,
    handleQuickProfileComplete,
    handleUvpSubmit,
  };
}
