import { 
  getCategoryExamplesText, 
  getCategoryListWithEmojis,
} from '~/lib/config/supported-categories';
import { extractProjectSummary } from '~/lib/services/projectDescriptionAgent';
import { generateStepTransitionWithValidation } from './step-transitions';
import type { MessageType, ChatContext } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

export const WELCOME_MESSAGE = `Tell me about your **service business** — whether you're a ${getCategoryExamplesText()}, or another independent professional who works with clients.

I'll build you a site that helps you get booked and grow your practice.`;

export const WELCOME_GREETING = '**Welcome to Flowstarter!** 🚀';

export const WELCOME_GREETING_WITH_USERNAME = (username: string) => `**Hey ${username}, welcome back!** 🚀`;

// ═══════════════════════════════════════════════════════════════════════════
// UNSUPPORTED TYPE MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

export function generateUnsupportedMessage(unsupportedType: string, customMessage: string): string {
  return `Thanks for your interest! 

${customMessage}

**Right now, Flowstarter is built for service providers** like coaches, therapists, trainers, freelancers, and other professionals who work directly with clients.

${getCategoryListWithEmojis()}

If you offer services in any of these areas, I'd love to help! Just tell me about your service business.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

export async function fallbackMessage(type: MessageType, context?: ChatContext): Promise<string> {
  switch (type) {
    case 'step-transition':
      return generateStepTransitionWithValidation(context || {});
    case 'welcome': {
      const greeting = context?.username ? WELCOME_GREETING_WITH_USERNAME(context.username) : WELCOME_GREETING;
      return `${greeting}\n\n${WELCOME_MESSAGE}`;
    }
    case 'after-description': {
      let summary = 'your project';
      if (context?.projectDescription) {
        const result = await extractProjectSummary(context.projectDescription);
        summary = result.summary;
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
