/**
 * useOnboardingChat Hook
 *
 * Generates dynamic chat messages using LLM for natural conversation.
 * Falls back to static messages if LLM is unavailable.
 */

import { getCategoryExamplesText } from '~/lib/config/supported-categories';
import { useCallback, useState } from 'react';

export type MessageType =
  | 'welcome'
  | 'after-description'
  | 'name-prompt'
  | 'after-name'
  | 'business-uvp-prompt'
  | 'business-audience-prompt'
  | 'business-goals-prompt'
  | 'business-tone-prompt'
  | 'business-selling-prompt'
  | 'business-pricing-prompt'
  | 'business-summary'
  | 'template-prompt'
  | 'personalization-prompt'
  | 'building'
  | 'complete'
  | 'error';

interface ChatContext {
  projectDescription?: string;
  projectName?: string;
  templateName?: string;
  paletteName?: string;
  fontName?: string;

  // Business info fields
  uvp?: string;
  targetAudience?: string;
  businessGoals?: string[];
  brandTone?: string;
  sellingMethod?: string;
  pricingOffers?: string;
  username?: string;
}

interface UseOnboardingChatResult {
  generateMessage: (type: MessageType, context?: ChatContext) => Promise<string>;
  isGenerating: boolean;
}

// Set to true to enable LLM-generated messages (requires GROQ_API_KEY or OPENROUTER_API_KEY)
const USE_LLM_MESSAGES = true;

// Welcome message constants - easily customizable
const WELCOME_MESSAGE =
  `Tell me about your service business - whether you're a ${getCategoryExamplesText()}, or another independent professional. I'll build you a site that gets you clients.`;
const WELCOME_GREETING = '### Welcome to Flowstarter!';
const WELCOME_GREETING_WITH_USERNAME = (username: string) => `### Welcome back, ${username}!`;

export function useOnboardingChat(): UseOnboardingChatResult {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMessage = useCallback(async (type: MessageType, context?: ChatContext): Promise<string> => {
    // Use fallback messages directly for scripted messages (faster and more reliable)
    if (!USE_LLM_MESSAGES || type === 'welcome') {
      return getFallbackMessage(type, context);
    }

    setIsGenerating(true);

    // Create abort controller with 3 second timeout for faster fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch('/api/onboarding-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-message',
          messageType: type,
          context,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { message: string };

      return data.message;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('[useOnboardingChat] LLM failed, using fallback:', error);

      return getFallbackMessage(type, context);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateMessage,
    isGenerating,
  };
}

// Fallback messages - simple truncation for client-side
function getFallbackMessage(type: MessageType, context?: ChatContext): string {
  switch (type) {
    case 'welcome': {
      const greeting = context?.username ? WELCOME_GREETING_WITH_USERNAME(context.username) : WELCOME_GREETING;
      return `${greeting}\n\n${WELCOME_MESSAGE}`;
    }

    case 'after-description': {
      /*
       * Client-side fallback uses simple truncation
       * Server-side will use LLM extraction
       */
      let summary = 'your project';

      if (context?.projectDescription) {
        const firstSentence = context.projectDescription.split(/[.!?]/)[0].trim();
        summary = firstSentence.length <= 60 ? firstSentence : firstSentence.substring(0, 60) + '...';
      }

      return `Got it - I'll help you build ${summary}.\n\nWhat would you like to call it? Enter your business name, or let me suggest one.`;
    }

    case 'name-prompt':
      return 'What would you like to name your project? This could be your business name, brand name, or any title you prefer.';

    case 'after-name':
      return `**${context?.projectName}** - great name!\n\nNow let's learn about what makes your business special.`;

    case 'business-uvp-prompt':
      return `**What makes your business unique?**\n\nTell me your unique value proposition - what do you offer that sets you apart?`;

    case 'business-audience-prompt':
      return `**Who are your ideal customers?**\n\nDescribe your target audience - who are you trying to reach?`;

    case 'business-goals-prompt':
      return `**What are your main goals?**\n\nWhat do you want this site to do? (e.g., get more bookings, attract clients, build your reputation)`;

    case 'business-tone-prompt':
      return `**What's your brand personality?**\n\nHow would you describe your brand tone? (e.g., professional, friendly, bold, playful)`;

    case 'business-selling-prompt':
      return `**How do you convert visitors?**\n\nAre you selling products, taking bookings, generating leads, or something else?`;

    case 'business-pricing-prompt':
      return `**Any pricing or offers to highlight?** (Optional)\n\nDo you have specific pricing tiers or special offers? Type "skip" if not applicable.`;

    case 'business-summary': {
      const goals = context?.businessGoals?.map((g, i) => `${i + 1}. ${g}`).join('\n') || 'Not specified';
      const pricingSection = context?.pricingOffers ? `\n\n**Pricing/Offers:**\n${context.pricingOffers}` : '';

      return `**Here's what I know about your business:**\n\n**Unique Value:**\n${context?.uvp || 'Not specified'}\n\n**Target Audience:**\n${context?.targetAudience || 'Not specified'}\n\n**Goals:**\n${goals}\n\n**Brand Tone:**\n${context?.brandTone || 'Not specified'}\n\n**Selling Method:**\n${context?.sellingMethod || 'Not specified'}${pricingSection}\n\nDoes this look good? Reply "looks good" to continue, or tell me what to adjust.`;
    }

    case 'template-prompt':
      return `**Perfect! Now let's find the right template.**\n\nBased on your business, I'll recommend templates that match your needs.`;

    case 'personalization-prompt':
      return `**Time to personalize your site!**\n\n1. **Logo** - Upload or generate with AI\n2. **Colors** - Choose your palette\n3. **Fonts** - Select your typography`;

    case 'building':
      return 'Building your website...';

    case 'complete':
      return '**Your site is ready!**\n\nThe preview is loading on the right. Ask me to make any changes.';

    case 'error':
      return 'Something went wrong while setting up your project. Please try again.';

    default:
      return 'How can I help?';
  }
}

