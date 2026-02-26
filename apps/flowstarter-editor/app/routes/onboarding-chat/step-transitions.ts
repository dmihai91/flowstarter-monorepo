import { z } from 'zod';
import { generateCompletion } from '~/lib/services/llm';
import { getExampleGoalsText } from '~/lib/config/supported-categories';
import { enthusiasticAck, approvingAck, encouragingAck } from './acknowledgments';
import { StepTransitionResponseSchema, type ChatContext } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS SUMMARY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function generateBusinessSummary(
  projectName?: string,
  uvp?: string,
  targetAudience?: string,
  businessGoals?: string[],
  brandTone?: string,
  sellingMethod?: string,
  pricingOffers?: string,
): string {
  const sellingMethodLabels: Record<string, string> = {
    ecommerce: 'Selling products/packages online',
    bookings: '1-on-1 sessions & appointments',
    leads: 'Free consultations & inquiries',
    subscriptions: 'Memberships & recurring programs',
    content: 'Online courses & content',
    other: 'Other',
  };

  const goalsFormatted =
    businessGoals && businessGoals.length > 0 ? businessGoals.map((g) => `• ${g}`).join('\n') : '• Not specified';

  const pricingSection = pricingOffers ? `\n\n**Pricing/Offers:**\n${pricingOffers}` : '';

  return `Perfect! Here's a summary of **${projectName || 'your business'}**:

**What makes you stand out:**
${uvp || 'Not specified'}

**Target audience:**
${targetAudience || 'Not specified'}

**Goals:**
${goalsFormatted}

**Brand tone:**
${brandTone || 'Not specified'}

**How clients work with you:**
${sellingMethod ? sellingMethodLabels[sellingMethod] || sellingMethod : 'Not specified'}${pricingSection}

Does this look right?`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC STEP TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

export function generateStepTransitionMessage(context?: ChatContext): string {
  const { fromStep, toStep, projectName, uvp, targetAudience, businessGoals, brandTone, sellingMethod, pricingOffers } =
    context || {};

  // Use varied acknowledgments to avoid repetition like "Love it! ... Love it! ... Love it!"
  const nameAck = enthusiasticAck(projectName);
  const uvpAck = approvingAck(uvp);
  const audienceAck = approvingAck(targetAudience);
  const goalsAck = encouragingAck(businessGoals?.join(','));
  const toneAck = approvingAck(brandTone);
  const sellingAck = approvingAck(sellingMethod);

  const transitionMessages: Record<string, string> = {
    'describe-to-name': `Got it - I'll help you build that.\n\nWhat would you like to call it? Enter your business name, or let me suggest one.`,
    'name-to-quick-profile': `${nameAck} **${projectName || 'Your project'}** - great name!\n\nNow let's quickly understand your business. Select your options below:`,
    'name-to-business-uvp': `${nameAck} **${projectName || 'Your project'}** - great name!\n\nWhat makes you stand out? What do clients get from working with you that they can't get elsewhere?`,
    'business-uvp-to-template': `${uvpAck} "${uvp?.slice(0, 50) || 'That'}${uvp && uvp.length > 50 ? '...' : ''}" - that's compelling! This will make your site copy really stand out.\n\nNow let's pick the perfect template for you:`,
    'business-uvp-to-business-audience': `${uvpAck} "${uvp?.slice(0, 50) || 'That'}${uvp && uvp.length > 50 ? '...' : ''}" - that's a strong differentiator.\n\nWho's your ideal client? Describe the people you help.`,
    'business-audience-to-business-goals': `${targetAudience ? `${audienceAck} ${targetAudience.slice(0, 40)}${targetAudience.length > 40 ? '...' : ''} - solid target.` : approvingAck()}\n\nWhat do you want this website to do for you - ${getExampleGoalsText()}?`,
    'business-goals-to-business-tone': `${businessGoals && businessGoals.length > 0 ? `${goalsAck} Those goals will guide the design.` : approvingAck()}\n\nHow should your brand come across - professional, friendly, bold, or something else?`,
    'business-tone-to-business-selling': `${brandTone ? `${toneAck} A ${brandTone.toLowerCase()} vibe will work really well.` : approvingAck()}\n\nHow do clients work with you - book sessions, buy packages, sign up for programs, or something else?`,
    'business-selling-to-business-pricing': `${sellingMethod ? `${sellingAck} ${sellingMethod === 'ecommerce' ? 'E-commerce' : sellingMethod === 'bookings' ? 'Booking' : sellingMethod === 'leads' ? 'Lead gen' : sellingMethod} is a solid model.` : 'Makes sense.'}\n\n**Optional:** Any specific pricing or offers to highlight? Say "skip" if not applicable.`,
    'business-pricing-to-business-summary': generateBusinessSummary(projectName, uvp, targetAudience, businessGoals, brandTone, sellingMethod, pricingOffers),
    'business-summary-to-template': `${encouragingAck()} Now let's find the perfect look. Finding templates that match your style...`,
    'template-to-personalization': `${enthusiasticAck()} Now let's make it yours.\n\nYou can upload your **logo**, choose your **color palette**, and pick **fonts** that fit your brand.`,
    'personalization-to-integrations': `${encouragingAck()} Before we build, would you like to connect any services?\n\nYou can add **booking** (Calendly, Cal.com) or **newsletter** integrations, or skip this step.`,
    'integrations-to-creating': `${enthusiasticAck()} Let me put it all together...`,
    'personalization-to-building': `${encouragingAck()} Give me a moment to put it all together...`,
    'building-to-complete': `**Done!** Your site is live in the preview.\n\nTake a look and let me know if you want any changes - I can adjust anything.`,
  };

  const transitionKey = `${fromStep}-to-${toStep}`;
  return transitionMessages[transitionKey] || `Let's keep going...`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM-ENHANCED STEP TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function generateStepTransitionWithValidation(context: ChatContext): Promise<string> {
  const { fromStep, toStep, projectName } = context;
  const transitionKey = `${fromStep}-to-${toStep}`;
  const fallback = () => generateStepTransitionMessage(context);

  const llmTransitions = ['name-to-business-uvp', 'business-uvp-to-business-audience', 'business-audience-to-business-goals'];

  if (!llmTransitions.includes(transitionKey) || !process.env.GROQ_API_KEY) {
    return fallback();
  }

  const stepDescriptions: Record<string, string> = {
    'name': 'choosing a business name',
    'business-uvp': 'their unique value proposition (what makes them stand out as a service provider)',
    'business-audience': 'their ideal clients (who they help and serve)',
    'business-goals': `their goals (${getExampleGoalsText()})`,
    'business-tone': 'their brand tone/personality',
    'business-selling': 'how clients engage with them (bookings, packages, programs)',
    'business-pricing': 'their pricing or offers',
  };

  const fromDescription = fromStep ? stepDescriptions[fromStep] || fromStep : 'unknown step';
  const toDescription = toStep ? stepDescriptions[toStep] || toStep : 'unknown step';

  try {
    const systemPrompt = `You are a friendly, enthusiastic website builder assistant for SERVICE-BASED entrepreneurs.

Generate a step transition message as JSON.

CRITICAL: Return ONLY valid JSON matching this exact schema:
{
  "acknowledgment": "Warm, genuine compliment about what user just shared (short, no markdown)",
  "projectName": "EXACTLY '${projectName || ''}' if provided - DO NOT CHANGE THIS VALUE",
  "prompt": "Question for the next step (1 sentence)"
}

STEP CONTEXT:
- The user just answered about: ${fromDescription}
- The NEXT question MUST ask about: ${toDescription}
- Your "prompt" field MUST be a question about ${toDescription} — do NOT ask about anything else

TONE RULES:
- Be genuinely warm and encouraging - like a supportive friend
- Compliment their choices with VARIETY - never repeat the same phrase twice in a row. Mix it up: "Awesome!", "That's great!", "Solid choice!", "Nice one!", "I like it!", "Perfect!", "Brilliant!", "Sounds good!", "Smart!", "On point!"
- NEVER be bland or robotic
- Keep acknowledgments SHORT (3-8 words) but genuine
- NO markdown in JSON values`;

    const userPrompt = `Transition: "${fromStep}" → "${toStep}"\nUser just shared: ${fromDescription}\nNext question must ask about: ${toDescription}${projectName ? `\nProject name (use exactly): "${projectName}"` : ''}\n\nReturn JSON only.`;

    const text = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: 'llama-3.3-70b-versatile', temperature: 0.3, maxTokens: 200 }
    );

    if (!text) {
      console.warn('[step-transition] Empty LLM response, using fallback');
      return fallback();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[step-transition] No JSON in response, using fallback');
      return fallback();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = StepTransitionResponseSchema.parse(parsed);

    if (projectName && transitionKey === 'name-to-business-uvp') {
      if (!validated.projectName || validated.projectName !== projectName) {
        console.warn(`[step-transition] Project name mismatch! Using fallback.`);
        return fallback();
      }
    }

    let message = validated.acknowledgment;

    const shouldShowProjectName = transitionKey === 'name-to-business-uvp' && validated.projectName
      && validated.projectName !== 'undefined' && validated.projectName.trim().length > 0;

    if (shouldShowProjectName && message.includes(validated.projectName!)) {
      message = message.replace(validated.projectName!, `**${validated.projectName}**`);
    } else if (shouldShowProjectName) {
      message = `**${validated.projectName}** - ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
    }

    message += `\n\n${validated.prompt}`;
    return message;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[step-transition] Zod validation failed');
    }
    return fallback();
  }
}
