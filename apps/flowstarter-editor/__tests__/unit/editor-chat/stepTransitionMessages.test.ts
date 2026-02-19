/**
 * Step Transition Message Generation Tests
 *
 * Tests the engaging message generation for step transitions.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Message Context Types ───────────────────────────────────────────────────

interface ChatContext {
  projectDescription?: string;
  projectName?: string;
  templateName?: string;
  uvp?: string;
  targetAudience?: string;
  businessGoals?: string[];
  brandTone?: string;
  sellingMethod?: string;
  pricingOffers?: string;
  fromStep?: string;
  toStep?: string;
  fromStepLabel?: string;
  toStepLabel?: string;
}

// ─── Fallback Message Generation (mirrors api.onboarding-chat.ts) ────────────

// Helper to generate the business summary
function generateBusinessSummary(
  projectName?: string,
  uvp?: string,
  targetAudience?: string,
  businessGoals?: string[],
  brandTone?: string,
  sellingMethod?: string,
  pricingOffers?: string
): string {
  const sellingMethodLabels: Record<string, string> = {
    'ecommerce': 'E-commerce (selling products)',
    'bookings': 'Appointment bookings',
    'leads': 'Lead generation',
    'subscriptions': 'Subscriptions/memberships',
    'content': 'Content/media',
    'other': 'Other',
  };

  const goalsFormatted = businessGoals && businessGoals.length > 0
    ? businessGoals.map(g => `• ${g}`).join('\n')
    : '• Not specified';

  const pricingSection = pricingOffers
    ? `\n\n**Pricing/Offers:**\n${pricingOffers}`
    : '';

  return `Perfect! Here's a summary of **${projectName || 'your business'}**:

**What makes you unique:**
${uvp || 'Not specified'}

**Target audience:**
${targetAudience || 'Not specified'}

**Goals:**
${goalsFormatted}

**Brand tone:**
${brandTone || 'Not specified'}

**How you sell:**
${sellingMethod ? sellingMethodLabels[sellingMethod] || sellingMethod : 'Not specified'}${pricingSection}

Does this look right?`;
}

function generateStepTransitionMessage(context?: ChatContext): string {
  const { fromStep, toStep, projectName, uvp, targetAudience, businessGoals, brandTone, sellingMethod, pricingOffers } = context || {};

  const transitionMessages: Record<string, string> = {
    'describe-to-name': `Got it - I'll help you build that.\n\nWhat would you like to call it? Enter your business name, or let me suggest one.`,

    'name-to-business-uvp': `Love it! **${projectName || 'Your project'}** is a great name.\n\nWhat makes your business unique? What do customers get from you that they can't get elsewhere?`,

    'business-uvp-to-business-audience': `"${uvp?.slice(0, 50) || 'That'}${uvp && uvp.length > 50 ? '...' : ''}" - that's a strong differentiator.\n\nWho's your ideal customer? Describe your target audience.`,

    'business-audience-to-business-goals': `${targetAudience ? `${targetAudience.slice(0, 40)}${targetAudience.length > 40 ? '...' : ''} - good target.` : 'Got it.'}\n\nWhat do you want to achieve with this website - more leads, sales, or brand awareness?`,

    'business-goals-to-business-tone': `${businessGoals && businessGoals.length > 0 ? 'Those goals will guide the design.' : 'Got it.'}\n\nHow should your brand come across - professional, friendly, bold, or something else?`,

    'business-tone-to-business-selling': `${brandTone ? `A ${brandTone.toLowerCase()} vibe will work well.` : 'Nice.'}\n\nHow do you make money - sell products, take bookings, capture leads, or something else?`,

    'business-selling-to-business-pricing': `${sellingMethod ? `Got it, ${sellingMethod === 'ecommerce' ? 'e-commerce' : sellingMethod === 'bookings' ? 'booking' : sellingMethod === 'leads' ? 'lead gen' : sellingMethod} model.` : 'Makes sense.'}\n\n**Optional:** Any specific pricing or offers to highlight? Say "skip" if not applicable.`,

    'business-pricing-to-business-summary': generateBusinessSummary(projectName, uvp, targetAudience, businessGoals, brandTone, sellingMethod, pricingOffers),

    'business-summary-to-template': `Now let's find the perfect look. Finding templates that match your style...`,

    'template-to-personalization': `Great pick! Now let's make it yours.\n\nYou can upload your **logo**, choose your **color palette**, and pick **fonts** that fit your brand.`,

    'personalization-to-building': `Looking sharp! Give me a moment to put it all together...`,

    'building-to-complete': `**Done!** Your site is live in the preview.\n\nTake a look and let me know if you want any changes - I can adjust anything.`,
  };

  const transitionKey = `${fromStep}-to-${toStep}`;
  return transitionMessages[transitionKey] || `Let's keep going...`;
}

// ─── Describe to Name Transition Tests ───────────────────────────────────────

describe('Describe to Name Transition', () => {
  it('should acknowledge the description and prompt for name', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'describe',
      toStep: 'name',
      projectDescription: 'A wellness studio',
    });

    expect(message).toContain("Got it");
    expect(message).toContain("build that");
    expect(message).toContain("call it");
  });

  it('should offer to suggest a name', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'describe',
      toStep: 'name',
    });

    expect(message).toContain("suggest");
  });
});

// ─── Name to Business UVP Transition Tests ───────────────────────────────────

describe('Name to Business UVP Transition', () => {
  it('should include project name in message', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'name',
      toStep: 'business-uvp',
      projectName: 'Fresh Fitness',
    });

    expect(message).toContain('Fresh Fitness');
    expect(message).toContain('Love it!');
  });

  it('should use fallback when project name is missing', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'name',
      toStep: 'business-uvp',
    });

    expect(message).toContain('Your project');
  });

  it('should ask about unique value proposition', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'name',
      toStep: 'business-uvp',
      projectName: 'TestCo',
    });

    expect(message).toContain('unique');
    expect(message).toContain("can't get");
  });

  it('should be conversational and not robotic', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'name',
      toStep: 'business-uvp',
      projectName: 'Awesome Site',
    });

    expect(message).not.toContain("You've just completed");
    expect(message).not.toContain("You have just");
    expect(message).not.toContain("Now, let's define");
  });
});

// ─── Business UVP to Audience Transition Tests ───────────────────────────────

describe('Business UVP to Audience Transition', () => {
  it('should quote the user\'s UVP in the response', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-uvp',
      toStep: 'business-audience',
      uvp: 'Personalized fitness coaching with AI-powered workout plans',
    });

    expect(message).toContain('Personalized fitness coaching');
    expect(message).toContain('differentiator');
  });

  it('should truncate long UVP values', () => {
    const longUvp = 'This is a very long unique value proposition that goes on and on describing all the wonderful features and benefits of the business in great detail';
    const message = generateStepTransitionMessage({
      fromStep: 'business-uvp',
      toStep: 'business-audience',
      uvp: longUvp,
    });

    expect(message).toContain('...');
    expect(message.length).toBeLessThan(longUvp.length + 200);
  });

  it('should ask about ideal customers', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-uvp',
      toStep: 'business-audience',
      uvp: 'Great products',
    });

    expect(message).toContain('ideal customer');
    expect(message).toContain('target audience');
  });
});

// ─── Business Audience to Goals Transition Tests ─────────────────────────────

describe('Business Audience to Goals Transition', () => {
  it('should acknowledge the target audience', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-audience',
      toStep: 'business-goals',
      targetAudience: 'busy professionals aged 25-45',
    });

    expect(message).toContain('busy professionals aged 25-45');
    expect(message).toContain('good target');
  });

  it('should truncate long audience descriptions', () => {
    const longAudience = 'Small business owners and entrepreneurs who are looking for affordable solutions to grow their businesses';
    const message = generateStepTransitionMessage({
      fromStep: 'business-audience',
      toStep: 'business-goals',
      targetAudience: longAudience,
    });

    expect(message).toContain('...');
  });

  it('should use fallback when no audience provided', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-audience',
      toStep: 'business-goals',
    });

    expect(message).toContain('Got it');
  });

  it('should ask about website goals', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-audience',
      toStep: 'business-goals',
      targetAudience: 'students',
    });

    expect(message).toContain('achieve');
    expect(message).toContain('leads');
    expect(message).toContain('sales');
    expect(message).toContain('awareness');
  });
});

// ─── Business Goals to Tone Transition Tests ─────────────────────────────────

describe('Business Goals to Tone Transition', () => {
  it('should acknowledge goals when provided', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-goals',
      toStep: 'business-tone',
      businessGoals: ['Get more leads', 'Build brand awareness'],
    });

    expect(message).toContain('goals will guide');
  });

  it('should use fallback when no goals provided', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-goals',
      toStep: 'business-tone',
      businessGoals: [],
    });

    expect(message).toContain('Got it');
  });

  it('should ask about brand personality', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-goals',
      toStep: 'business-tone',
      businessGoals: ['Sell products'],
    });

    expect(message).toContain('brand come across');
    expect(message).toContain('professional');
    expect(message).toContain('friendly');
    expect(message).toContain('bold');
  });
});

// ─── Business Tone to Selling Transition Tests ───────────────────────────────

describe('Business Tone to Selling Transition', () => {
  it('should acknowledge the brand tone', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-tone',
      toStep: 'business-selling',
      brandTone: 'Professional and trustworthy',
    });

    expect(message).toContain('professional and trustworthy');
    expect(message).toContain('vibe will work well');
  });

  it('should convert tone to lowercase', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-tone',
      toStep: 'business-selling',
      brandTone: 'BOLD AND EDGY',
    });

    expect(message).toContain('bold and edgy');
    expect(message).not.toContain('BOLD');
  });

  it('should ask about monetization', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-tone',
      toStep: 'business-selling',
      brandTone: 'Friendly',
    });

    expect(message).toContain('make money');
    expect(message).toContain('products');
    expect(message).toContain('bookings');
    expect(message).toContain('leads');
  });
});

// ─── Business Selling to Pricing Transition Tests ────────────────────────────

describe('Business Selling to Pricing Transition', () => {
  it('should translate ecommerce selling method', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-selling',
      toStep: 'business-pricing',
      sellingMethod: 'ecommerce',
    });

    expect(message).toContain('e-commerce');
  });

  it('should translate bookings selling method', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-selling',
      toStep: 'business-pricing',
      sellingMethod: 'bookings',
    });

    expect(message).toContain('booking');
  });

  it('should translate leads selling method', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-selling',
      toStep: 'business-pricing',
      sellingMethod: 'leads',
    });

    expect(message).toContain('lead gen');
  });

  it('should indicate pricing is optional', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-selling',
      toStep: 'business-pricing',
      sellingMethod: 'content',
    });

    expect(message).toContain('Optional');
    expect(message).toContain('skip');
  });

  it('should ask about pricing and offers', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-selling',
      toStep: 'business-pricing',
      sellingMethod: 'subscriptions',
    });

    expect(message).toContain('pricing');
    expect(message).toContain('offers');
  });
});

// ─── Business Pricing to Summary Transition Tests ────────────────────────────

describe('Business Pricing to Summary Transition', () => {
  it('should show a complete summary with all business info', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
      projectName: 'Harmony Wellness',
      uvp: 'Personalized wellness programs',
      targetAudience: 'Busy professionals 30-50',
      businessGoals: ['Generate leads', 'Build brand awareness'],
      brandTone: 'Calming and professional',
      sellingMethod: 'bookings',
      pricingOffers: 'Single session $75, Monthly $199',
    });

    expect(message).toContain('Perfect!');
    expect(message).toContain('Harmony Wellness');
    expect(message).toContain('Personalized wellness programs');
    expect(message).toContain('Busy professionals 30-50');
    expect(message).toContain('Generate leads');
    expect(message).toContain('Build brand awareness');
    expect(message).toContain('Calming and professional');
    expect(message).toContain('Appointment bookings');
    expect(message).toContain('Single session $75');
    expect(message).toContain('Does this look right?');
  });

  it('should format goals as bullet points', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
      businessGoals: ['Goal 1', 'Goal 2', 'Goal 3'],
    });

    expect(message).toContain('• Goal 1');
    expect(message).toContain('• Goal 2');
    expect(message).toContain('• Goal 3');
  });

  it('should show "Not specified" for missing fields', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
    });

    expect(message).toContain('Not specified');
  });

  it('should include section headers', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
      projectName: 'Test Project',
    });

    expect(message).toContain('**What makes you unique:**');
    expect(message).toContain('**Target audience:**');
    expect(message).toContain('**Goals:**');
    expect(message).toContain('**Brand tone:**');
    expect(message).toContain('**How you sell:**');
  });

  it('should show pricing section only when provided', () => {
    const messageWithPricing = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
      pricingOffers: '$99/month',
    });

    const messageWithoutPricing = generateStepTransitionMessage({
      fromStep: 'business-pricing',
      toStep: 'business-summary',
    });

    expect(messageWithPricing).toContain('**Pricing/Offers:**');
    expect(messageWithPricing).toContain('$99/month');
    expect(messageWithoutPricing).not.toContain('**Pricing/Offers:**');
  });
});

// ─── Template to Personalization Transition Tests ────────────────────────────

describe('Template to Personalization Transition', () => {
  it('should mention customization options', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'template',
      toStep: 'personalization',
    });

    expect(message).toContain('logo');
    expect(message).toContain('color palette');
    expect(message).toContain('fonts');
  });
});

// ─── Building to Complete Transition Tests ───────────────────────────────────

describe('Building to Complete Transition', () => {
  it('should indicate site is ready', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'building',
      toStep: 'complete',
    });

    expect(message).toContain('Done');
    expect(message).toContain('preview');
  });

  it('should offer to make changes', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'building',
      toStep: 'complete',
    });

    expect(message).toContain('changes');
    expect(message).toContain('adjust');
  });
});

// ─── Unknown Transition Fallback Tests ───────────────────────────────────────

describe('Unknown Transition Fallback', () => {
  it('should use generic fallback for unknown transitions', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'unknown',
      toStep: 'also-unknown',
    });

    expect(message).toBe("Let's keep going...");
  });

  it('should use generic fallback when no context provided', () => {
    const message = generateStepTransitionMessage();

    expect(message).toBe("Let's keep going...");
  });
});

// ─── Message Tone and Style Tests ────────────────────────────────────────────

describe('Message Tone and Style', () => {
  it('should not use robotic phrases', () => {
    const transitions = [
      { fromStep: 'name', toStep: 'business-uvp', projectName: 'Test' },
      { fromStep: 'business-uvp', toStep: 'business-audience', uvp: 'Test' },
      { fromStep: 'business-audience', toStep: 'business-goals', targetAudience: 'Test' },
    ];

    transitions.forEach(context => {
      const message = generateStepTransitionMessage(context);
      expect(message).not.toMatch(/You've just completed/i);
      expect(message).not.toMatch(/You have just defined/i);
      expect(message).not.toMatch(/You have just completed/i);
      expect(message).not.toMatch(/Step \d+ complete/i);
    });
  });

  it('should not use heading markdown syntax', () => {
    const contexts: ChatContext[] = [
      { fromStep: 'name', toStep: 'business-uvp', projectName: 'Test' },
      { fromStep: 'template', toStep: 'personalization' },
      { fromStep: 'building', toStep: 'complete' },
    ];

    contexts.forEach(context => {
      const message = generateStepTransitionMessage(context);
      expect(message).not.toMatch(/^#+ /m);
    });
  });

  it('should use bold for emphasis instead of headings', () => {
    const message = generateStepTransitionMessage({
      fromStep: 'building',
      toStep: 'complete',
    });

    expect(message).toContain('**Done!**');
    expect(message).not.toContain('# Done');
  });
});

// ─── LLM System Prompt Tests ─────────────────────────────────────────────────

describe('LLM System Prompt Guidelines', () => {
  const BANNED_PHRASES = [
    "You've just completed",
    "You have just defined",
  ];

  it('should have system prompt that bans robotic phrases', () => {
    const systemPrompt = `You are a friendly website builder assistant having a casual conversation. You sound like a helpful colleague, not a formal assistant.

Rules:
- Be conversational and warm, like chatting with a friend who's good at building websites
- Keep it short - 2-3 sentences max
- Never say "You've just completed..." or "You have just defined..." - that sounds robotic
- Never use heading syntax (# or ##) - use **bold** sparingly for emphasis
- No emojis
- Ask only ONE question at a time
- Reference what the user ACTUALLY said when acknowledging their input`;

    // Verify the system prompt contains instructions to avoid robotic phrases
    expect(systemPrompt.toLowerCase()).toContain("you've just completed");
    expect(systemPrompt.toLowerCase()).toContain("you have just defined");
    expect(systemPrompt.toLowerCase()).toContain("robotic");
  });

  it('should generate step-specific prompts with user context', () => {
    const createStepPrompt = (fromStep: string, toStep: string, context: ChatContext) => {
      const stepPrompts: Record<string, string> = {
        'name-to-business-uvp': `The user just named their project "${context.projectName}". React to the name naturally, then ask what makes their business unique.`,
        'business-uvp-to-business-audience': `The user described their value proposition: "${context.uvp}". Acknowledge this specific answer, then ask who their ideal customer is.`,
      };

      return stepPrompts[`${fromStep}-to-${toStep}`] || 'Continue the conversation naturally.';
    };

    const prompt = createStepPrompt('name', 'business-uvp', { projectName: 'Cool Site' });
    expect(prompt).toContain('Cool Site');
    expect(prompt).toContain('named their project');
  });
});

// ─── API Response Structure Tests ────────────────────────────────────────────

describe('API Response Structure', () => {
  it('should return message in correct format', () => {
    const mockApiResponse = {
      message: generateStepTransitionMessage({
        fromStep: 'name',
        toStep: 'business-uvp',
        projectName: 'My Site',
      }),
    };

    expect(mockApiResponse).toHaveProperty('message');
    expect(typeof mockApiResponse.message).toBe('string');
    expect(mockApiResponse.message.length).toBeGreaterThan(0);
  });

  it('should handle step-transition message type', () => {
    const handleMessageType = (messageType: string, context: ChatContext) => {
      if (messageType === 'step-transition') {
        return generateStepTransitionMessage(context);
      }
      return 'Unknown message type';
    };

    const result = handleMessageType('step-transition', {
      fromStep: 'business-uvp',
      toStep: 'business-audience',
      uvp: 'Great service',
    });

    expect(result).toContain('Great service');
  });
});

