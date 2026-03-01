/**
 * useBusinessDiscoveryHandlers Hook
 *
 * Manages the interactive business discovery flow:
 * - UVP, audience, goals, tone, selling method, pricing
 * - Collects answers into BusinessInfo object
 * - Handles summary confirmation and edits
 * 
 * Uses React Query mutations for API calls with automatic retries.
 */

import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SUGGESTED_REPLIES } from '../constants';
import type { BusinessInfo, OnboardingStep, InitialChatState } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';

interface UseBusinessDiscoveryHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  projectDescription?: string;
  onBusinessInfoComplete: (businessInfo: BusinessInfo) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

interface UseBusinessDiscoveryHandlersReturn {
  startBusinessDiscovery: () => Promise<void>;
  handleBusinessAnswer: (step: OnboardingStep, answer: string) => Promise<void>;
  handleSummaryConfirmation: (confirmed: boolean, feedback?: string) => Promise<void>;
  currentBusinessInfo: Partial<BusinessInfo>;
}

// ─── Extract Business Info API ──────────────────────────────────────────────

async function extractBusinessInfoApi(projectDescription: string): Promise<Partial<BusinessInfo>> {
  const response = await fetch('/api/extract-business-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectDescription }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract business info: ${response.status}`);
  }

  return response.json();
}

export function useBusinessDiscoveryHandlers({
  messageHook,
  flowHook,
  projectDescription,
  onBusinessInfoComplete,
  onStateChange,
}: UseBusinessDiscoveryHandlersProps): UseBusinessDiscoveryHandlersReturn {
  // Track business info being collected - use ref to persist across renders
  const businessInfoRef = useRef<Partial<BusinessInfo>>({
    uvp: '',
    targetAudience: '',
    businessGoals: [],
    brandTone: '',
    sellingMethod: undefined,
    pricingOffers: undefined,
  });

  // Extract initial info from project description if available
  const extractedInfoRef = useRef<Partial<BusinessInfo> | null>(null);

  // ─── React Query Mutation ─────────────────────────────────────────────────
  const extractMutation = useMutation({
    mutationFn: extractBusinessInfoApi,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  /**
   * Determine the first missing business info field
   */
  const getFirstMissingField = useCallback((info: Partial<BusinessInfo>): OnboardingStep | null => {
    if (!info.uvp || info.uvp.trim() === '') {
      return 'business-uvp';
    }

    if (!info.targetAudience || info.targetAudience.trim() === '') {
      return 'business-audience';
    }

    if (!info.businessGoals || info.businessGoals.length === 0) {
      return 'business-goals';
    }

    if (!info.brandTone || info.brandTone.trim() === '') {
      return 'business-tone';
    }

    if (!info.sellingMethod) {
      return 'business-selling';
    }

    // Pricing is optional, so we go to summary if everything else is filled
    return null; // All required fields filled
  }, []);

  /**
   * Start the business discovery flow
   * If the project description is detailed enough, extract business info automatically
   * and only ask for what's missing
   */
  const startBusinessDiscovery = useCallback(async () => {
    // Try to extract business info from project description
    if (projectDescription && !extractedInfoRef.current) {
      messageHook.setIsTyping(true);

      try {
        const extracted = await extractMutation.mutateAsync(projectDescription);
        extractedInfoRef.current = extracted;

        // Pre-fill what we can extract
        if (extracted.uvp) {
          businessInfoRef.current.uvp = extracted.uvp;
        }

        if (extracted.targetAudience) {
          businessInfoRef.current.targetAudience = extracted.targetAudience;
        }

        if (extracted.businessGoals && extracted.businessGoals.length > 0) {
          businessInfoRef.current.businessGoals = extracted.businessGoals;
        }

        if (extracted.brandTone) {
          businessInfoRef.current.brandTone = extracted.brandTone;
        }

        if (extracted.sellingMethod) {
          businessInfoRef.current.sellingMethod = extracted.sellingMethod;
        }

        if (extracted.pricingOffers) {
          businessInfoRef.current.pricingOffers = extracted.pricingOffers;
        }

        if (extracted.industry) {
          businessInfoRef.current.industry = extracted.industry;
        }

        // Sync extracted info to Convex
        onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

        // Check what's missing
        const firstMissing = getFirstMissingField(businessInfoRef.current);

        if (!firstMissing) {
          // All required fields extracted! Show summary for confirmation
          messageHook.setIsTyping(false);
          messageHook.addAssistantMessage(
            "I've gathered all the key details about your business from your description. Let me confirm I got everything right:",
          );
          flowHook.setStep('business-summary');
          await messageHook.addLLMMessage('business-summary', businessInfoRef.current);
          messageHook.setSuggestedReplies(SUGGESTED_REPLIES.businessSummary());

          return;
        }

        // Some fields extracted, tell the user and ask for what's missing
        const extractedCount = [
          businessInfoRef.current.uvp,
          businessInfoRef.current.targetAudience,
          businessInfoRef.current.businessGoals?.length,
          businessInfoRef.current.brandTone,
          businessInfoRef.current.sellingMethod,
        ].filter(Boolean).length;

        messageHook.setIsTyping(false);

        if (extractedCount > 0) {
          messageHook.addAssistantMessage(
            `Great description! I've already picked up some details. Let me ask a few quick questions to complete the picture.`,
          );
        } else {
          messageHook.addAssistantMessage(
            "Let's learn about what makes your business special. I'll ask you a few quick questions.",
          );
        }

        // Jump to the first missing field
        flowHook.setStep(firstMissing);

        // Map step to the corresponding prompt message type
        const promptMap: Record<
          string,
          | 'business-uvp-prompt'
          | 'business-audience-prompt'
          | 'business-goals-prompt'
          | 'business-tone-prompt'
          | 'business-selling-prompt'
          | 'business-pricing-prompt'
        > = {
          'business-uvp': 'business-uvp-prompt',
          'business-audience': 'business-audience-prompt',
          'business-goals': 'business-goals-prompt',
          'business-tone': 'business-tone-prompt',
          'business-selling': 'business-selling-prompt',
          'business-pricing': 'business-pricing-prompt',
        };
        const promptType = promptMap[firstMissing];

        if (promptType) {
          await messageHook.addLLMMessage(promptType);
        }

        return;
      } catch (error) {
        console.warn('Failed to extract business info:', error);
        messageHook.setIsTyping(false);
      }
    }

    // Fallback: No extraction or extraction failed - start from beginning
    messageHook.addAssistantMessage(
      "Let's learn about what makes your business special. I'll ask you a few quick questions.",
    );

    // Start with UVP question
    flowHook.setStep('business-uvp');
    await messageHook.addLLMMessage('business-uvp-prompt');
  }, [messageHook, flowHook, projectDescription, onStateChange, getFirstMissingField, extractMutation]);

  /**
   * Handle answer for a specific business question
   */
  const handleBusinessAnswer = useCallback(
    async (step: OnboardingStep, answer: string) => {
      // Store the answer
      messageHook.addUserMessage(answer);

      switch (step) {
        case 'business-uvp':
          businessInfoRef.current.uvp = answer;
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          // UVP → offering details
          await messageHook.addAssistantMessage(
            'Great UVP! Now tell me about your offering.\n\n**What packages or services do you offer?** 📦\n\nInclude pricing if you\'d like it on the site. For example:\n"1-hour session (€120), 3-session package (€300)"'
          );
          flowHook.setStep('business-offering');
          break;

        case 'business-offering':
          businessInfoRef.current.offerings = answer;
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          await messageHook.addAssistantMessage(
            'Got it! I\'ll highlight your offering on the site.\n\n**How can clients reach you?** 📬\n\nShare your business contact info:\n- Email\n- Phone\n- Address (optional)\n- Website (optional)'
          );
          flowHook.setStep('business-contact');
          break;

        case 'business-contact': {
          // Parse contact info from free text
          const lines = answer.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
          const emailMatch = answer.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
          const phoneMatch = answer.match(/(?:\+?\d[\d\s\-().]{6,})/);
          const websiteMatch = answer.match(/(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/\S*)?/i);
          
          businessInfoRef.current.contactEmail = emailMatch?.[0] || '';
          businessInfoRef.current.contactPhone = phoneMatch?.[0]?.trim() || '';
          // Address: anything that's not email/phone/website
          const addressParts = lines.filter(l => 
            !l.match(/[@]/) && !l.match(/^\+?\d[\d\s\-().]{6,}$/) && !l.match(/(?:www\.|https?:)/)
          );
          businessInfoRef.current.contactAddress = addressParts.join(', ') || '';
          businessInfoRef.current.website = websiteMatch?.[0] || '';
          
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          await messageHook.addAssistantMessage(
            'Perfect! I have all your details. Let\'s pick the right template for your site.'
          );
          flowHook.setStep('template');
          break;
        }

        case 'business-audience':
          businessInfoRef.current.targetAudience = answer;
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          // Use unified step transition message
          await messageHook.addStepTransitionMessage('business-audience', 'business-goals', { targetAudience: answer });
          flowHook.setStep('business-goals');
          break;

        case 'business-goals':
          // Parse goals from answer (split by sentence-level delimiters only)
          const goals = answer
            .split(/(?:\s*,\s+|\n|\s*•\s*|\s*-\s+|\d+\.\s+|\d+\)\s+)/)
            .map((g) => g.trim())
            .filter((g) => g.length > 2);
          businessInfoRef.current.businessGoals = goals.slice(0, 5); // Max 5 goals
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          // Use unified step transition message
          await messageHook.addStepTransitionMessage('business-goals', 'business-tone', {
            businessGoals: goals.slice(0, 5),
          });
          flowHook.setStep('business-tone');
          break;

        case 'business-tone':
          businessInfoRef.current.brandTone = answer;
          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          // Use unified step transition message
          await messageHook.addStepTransitionMessage('business-tone', 'business-selling', { brandTone: answer });
          flowHook.setStep('business-selling');
          break;

        case 'business-selling':
          // Use LLM to intelligently extract selling method (supports any language)
          messageHook.setIsTyping(true);
          
          let extractedMethod: 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other' = 'other';
          let extractedDetails = answer;
          
          try {
            const response = await fetch('/api/onboarding-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'extract-selling-method',
                userInput: answer,
                context: { projectDescription },
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              extractedMethod = result.category || 'other';
              extractedDetails = result.details || answer;
              console.log(`[business-selling] LLM extracted: ${extractedMethod} (confidence: ${result.confidence})`);
            }
          } catch (error) {
            console.warn('[business-selling] LLM extraction failed, using fallback:', error);
          }
          
          messageHook.setIsTyping(false);

          /*
           * Store the raw answer as the detailed selling method description
           * This is what the user actually said, which is much richer than just the category
           * The category is used for template filtering, but this text is used for content generation
           */
          businessInfoRef.current.sellingMethod = extractedMethod;
          businessInfoRef.current.sellingMethodDetails = answer; // Keep original answer for content generation

          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          // Use unified step transition message
          await messageHook.addStepTransitionMessage('business-selling', 'business-pricing', {
            sellingMethod: extractedMethod,
            sellingMethodDetails: answer,
          });
          flowHook.setStep('business-pricing');
          messageHook.setSuggestedReplies(SUGGESTED_REPLIES.skipOption());
          break;

        case 'business-pricing':
          // Use LLM to detect if user wants to skip (supports any language)
          messageHook.setIsTyping(true);
          
          let isSkip = false;
          try {
            const response = await fetch('/api/onboarding-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'detect-intent',
                userInput: answer,
                intentContext: 'skip-pricing',
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              isSkip = result.intent === 'skip';
              console.log(`[business-pricing] LLM detected intent: ${result.intent} (confidence: ${result.confidence})`);
            }
          } catch (error) {
            console.warn('[business-pricing] LLM intent detection failed, using fallback:', error);
            const lower = answer.toLowerCase();
            isSkip = lower.includes('skip') || lower.includes('no') || lower.includes('none') || lower.includes('nu') || lower.includes('sari');
          }
          
          messageHook.setIsTyping(false);

          if (isSkip) {
            businessInfoRef.current.pricingOffers = undefined;
          } else {
            businessInfoRef.current.pricingOffers = answer;
          }

          onStateChange?.({ businessInfo: { ...businessInfoRef.current } as BusinessInfo });

          /*
           * Transition to contact details step (UI component, not chat-based)
           * Contact details will be collected via ContactDetailsPanel
           */
          await messageHook.addStepTransitionMessage('business-pricing', 'business-contact', {
            pricingOffers: businessInfoRef.current.pricingOffers,
            skipped: isSkip,
          });
          flowHook.setStep('business-contact');
          // No suggested replies - ContactDetailsPanel will handle this
          messageHook.setSuggestedReplies([]);
          break;
      }
    },
    [messageHook, flowHook, onStateChange],
  );

  /**
   * Handle summary confirmation
   */
  const handleSummaryConfirmation = useCallback(
    async (confirmed: boolean, feedback?: string) => {
      if (confirmed) {
        messageHook.addUserMessage('Looks good!');

        // Complete business info collection
        const completeInfo: BusinessInfo = {
          uvp: businessInfoRef.current.uvp || '',
          targetAudience: businessInfoRef.current.targetAudience || '',
          businessGoals: businessInfoRef.current.businessGoals || [],
          brandTone: businessInfoRef.current.brandTone || '',
          sellingMethod: businessInfoRef.current.sellingMethod,
          pricingOffers: businessInfoRef.current.pricingOffers,
        };

        onBusinessInfoComplete(completeInfo);
      } else {
        // User wants to make changes
        messageHook.addUserMessage(feedback || 'Let me adjust something');
        messageHook.addAssistantMessage(
          'No problem! Tell me what you\'d like to change. You can say things like:\n- "My target audience is actually..."\n- "Change my brand tone to..."\n- "Update my goals to include..."',
        );

        // Stay on summary step to allow edits
        messageHook.setSuggestedReplies(SUGGESTED_REPLIES.businessSummaryAfterEdit());
      }
    },
    [messageHook, onBusinessInfoComplete],
  );

  return {
    startBusinessDiscovery,
    handleBusinessAnswer,
    handleSummaryConfirmation,
    currentBusinessInfo: businessInfoRef.current,
  };
}

export type { UseBusinessDiscoveryHandlersProps, UseBusinessDiscoveryHandlersReturn };

