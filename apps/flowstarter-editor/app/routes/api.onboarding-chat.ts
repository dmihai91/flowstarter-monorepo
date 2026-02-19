import { 
  getCategoryExamplesText, 
  getExampleGoalsText, 
  buildCategoryPromptContext,
  detectUnsupportedType,
  getCategoryListWithEmojis,
  getMVPScopeDescription,
} from '~/lib/config/supported-categories';
import { anonymizeQuery } from '~/lib/utils/anonymize';
import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { z } from 'zod';
import { generateCompletion, resetCostTracker, getTotalCost } from '~/lib/services/llm';
import { extractProjectSummary } from '~/lib/services/projectDescriptionAgent';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// ═══════════════════════════════════════════════════════════════════════════
// VARIED ACKNOWLEDGMENTS - Adds personality and avoids repetition
// ═══════════════════════════════════════════════════════════════════════════

/** Enthusiastic acknowledgments for positive moments */
const ENTHUSIASTIC_ACKS = [
  'Love it!', 'Awesome!', 'Perfect!', 'That\'s great!', 'Brilliant!',
  'Excellent choice!', 'Nice one!', 'Fantastic!', 'That works!', 'Beautiful!',
];

/** Approving acknowledgments for confirmations */
const APPROVING_ACKS = [
  'Great choice!', 'Solid pick!', 'Nice!', 'Good stuff!', 'That\'ll work great!',
  'Smart choice!', 'Sounds good!', 'I like it!', 'Works for me!', 'On point!',
];

/** Encouraging acknowledgments for progress */
const ENCOURAGING_ACKS = [
  'We\'re making progress!', 'Getting there!', 'Coming together nicely!',
  'Looking good!', 'This is shaping up!', 'On the right track!',
];

/** Get a random acknowledgment from a pool, optionally seeded for consistency */
function getRandomAck(pool: string[], seed?: string): string {
  // Use seed for deterministic selection within a session, or random
  const index = seed 
    ? Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length
    : Math.floor(Math.random() * pool.length);
  return pool[index];
}

/** Get an enthusiastic ack (for exciting moments) */
const enthusiasticAck = (seed?: string) => getRandomAck(ENTHUSIASTIC_ACKS, seed);

/** Get an approving ack (for good choices) */
const approvingAck = (seed?: string) => getRandomAck(APPROVING_ACKS, seed);

/** Get an encouraging ack (for progress) */  
const encouragingAck = (seed?: string) => getRandomAck(ENCOURAGING_ACKS, seed);

// Initialize Convex client for logging
function getConvexClient(): ConvexHttpClient | null {
  const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.warn('[onboarding-chat] No CONVEX_URL, costs will not be persisted');
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

// Keep this in sync with the client hook types
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
  | 'error'
  | 'step-transition'
  | 'unsupported'; // NEW: For unsupported business types

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
  username?: string;
  projectId?: string;
  sessionId?: string; // For tracking unsupported requests

  // Step transition context
  fromStep?: string;
  toStep?: string;
  fromStepLabel?: string;
  toStepLabel?: string;
}

// Zod Schemas for LLM Response Validation
const StepTransitionResponseSchema = z.object({
  acknowledgment: z.string().min(1, 'Acknowledgment is required'),
  projectName: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
});

type StepTransitionResponse = z.infer<typeof StepTransitionResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME MESSAGE - Emphasizing SERVICE-BASED entrepreneurs
// ═══════════════════════════════════════════════════════════════════════════

const WELCOME_MESSAGE = `Tell me about your **service business** — whether you're a ${getCategoryExamplesText()}, or another independent professional who works with clients.

I'll build you a site that helps you get booked and grow your practice.`;

const WELCOME_GREETING = '**Welcome to Flowstarter!** 🚀';
const WELCOME_GREETING_WITH_USERNAME = (username: string) => `**Hey ${username}, welcome back!** 🚀`;

// ═══════════════════════════════════════════════════════════════════════════
// UNSUPPORTED TYPE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function generateUnsupportedMessage(unsupportedType: string, customMessage: string): string {
  return `Thanks for your interest! 

${customMessage}

**Right now, Flowstarter is built for service providers** like coaches, therapists, trainers, freelancers, and other professionals who work directly with clients.

${getCategoryListWithEmojis()}

If you offer services in any of these areas, I'd love to help! Just tell me about your service business.`;
}

/**
 * Log an unsupported request to Convex for analytics
 */
async function logUnsupportedRequest(
  convex: ConvexHttpClient | null,
  requestType: string,
  userDescription: string,
  sessionId?: string
): Promise<void> {
  if (!convex) return;
  
  try {
    await convex.mutation(api.feedback.logUnsupportedRequest, {
      requestType,
      userDescription,
      anonymizedDescription: anonymizeQuery(userDescription),
      sessionId,
    });
    console.log(`[onboarding-chat] Logged unsupported request: ${requestType}`);
  } catch (error) {
    console.error('[onboarding-chat] Failed to log unsupported request:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM-BASED SELLING METHOD EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

type SellingMethodCategory = 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other';

interface ExtractedSellingMethod {
  category: SellingMethodCategory;
  details: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Use LLM to intelligently extract the selling method from user input.
 * Works for any language (Romanian, English, etc.)
 */
async function extractSellingMethod(
  userInput: string,
  projectDescription?: string,
): Promise<ExtractedSellingMethod> {
  const systemPrompt = `You are an expert at understanding how service businesses work with clients.

Analyze the user's description of how they work with clients and classify it into ONE of these categories:

- **bookings**: Appointments, sessions, consultations, reservations, 1-on-1 meetings, therapy sessions, coaching calls, classes, lessons
- **ecommerce**: Selling physical/digital products, packages, courses with one-time purchase
- **leads**: Contact forms, free consultations, inquiry-based sales, quote requests
- **subscriptions**: Monthly memberships, recurring programs, retainer services
- **content**: Free content with monetization (courses, ebooks, paid newsletters)
- **other**: Doesn't fit above categories

IMPORTANT:
- Understand ANY language (Romanian, Spanish, French, etc.)
- "programare", "ședință", "consultație", "întâlnire", "rezervare" = bookings (Romanian)
- "cita", "sesión", "consulta", "reserva" = bookings (Spanish)
- Focus on HOW they deliver service, not what they sell

Return JSON only:
{
  "category": "bookings|ecommerce|leads|subscriptions|content|other",
  "details": "Brief summary of how they work with clients",
  "confidence": "high|medium|low"
}`;

  const userPrompt = `User describes their selling method:
"${userInput}"

${projectDescription ? `Context - their business: "${projectDescription}"` : ''}

Extract the selling method category. Return JSON only.`;

  try {
    const text = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: 'llama-3.3-70b-versatile', temperature: 0.1, maxTokens: 150 },
    );

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate category
      const validCategories: SellingMethodCategory[] = ['ecommerce', 'bookings', 'leads', 'subscriptions', 'content', 'other'];
      const category = validCategories.includes(parsed.category) ? parsed.category : 'other';
      
      return {
        category,
        details: parsed.details || userInput,
        confidence: parsed.confidence || 'medium',
      };
    }
  } catch (error) {
    console.warn('[extractSellingMethod] LLM extraction failed:', error);
  }

  // Fallback: return other with original input
  return {
    category: 'other',
    details: userInput,
    confidence: 'low',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM-BASED USER INTENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

type UserIntent = 'confirm' | 'edit' | 'skip' | 'unclear';

interface DetectedIntent {
  intent: UserIntent;
  editField?: string; // If intent is 'edit', which field they want to change
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Use LLM to detect user intent from their response.
 * Works for any language.
 */
async function detectUserIntent(
  userInput: string,
  intentContext: 'summary-confirmation' | 'skip-pricing' | 'general',
): Promise<DetectedIntent> {
  const contextPrompts: Record<string, string> = {
    'summary-confirmation': `User is reviewing a business summary and can either:
- CONFIRM: Accept it and continue (e.g., "looks good", "perfect", "yes", "da", "bine", "corect", "merge")
- EDIT: Request changes (e.g., "change X to Y", "modifică", "schimbă", "adjust")`,
    'skip-pricing': `User can either:
- SKIP: Skip this optional step (e.g., "skip", "no", "none", "nu", "sari", "treci")
- PROVIDE: Give actual pricing information`,
    'general': `Detect if user wants to confirm, edit, or skip something`,
  };

  const systemPrompt = `You detect user intent from their message. Understand ANY language.

${contextPrompts[intentContext] || contextPrompts.general}

Return JSON only:
{
  "intent": "confirm|edit|skip|unclear",
  "editField": "field name if intent is edit (optional)",
  "confidence": "high|medium|low"
}`;

  try {
    const text = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User said: "${userInput}"` },
      ],
      { model: 'llama-3.3-70b-versatile', temperature: 0.1, maxTokens: 100 },
    );

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validIntents: UserIntent[] = ['confirm', 'edit', 'skip', 'unclear'];
      
      return {
        intent: validIntents.includes(parsed.intent) ? parsed.intent : 'unclear',
        editField: parsed.editField,
        confidence: parsed.confidence || 'medium',
      };
    }
  } catch (error) {
    console.warn('[detectUserIntent] LLM detection failed:', error);
  }

  return { intent: 'unclear', confidence: 'low' };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

function generateBusinessSummary(
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
// STEP TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateStepTransitionMessage(context?: ChatContext): string {
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

async function generateStepTransitionWithValidation(context: ChatContext): Promise<string> {
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

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

async function fallbackMessage(type: MessageType, context?: ChatContext): Promise<string> {
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

// ═══════════════════════════════════════════════════════════════════════════
// COST LOGGING
// ═══════════════════════════════════════════════════════════════════════════

async function logCostsToConvex(
  convex: ConvexHttpClient | null,
  operation: 'chat',
  projectId?: string,
  metadata?: { template?: string; language?: string }
): Promise<void> {
  if (!convex) return;
  
  const { totalCostUSD, totalTokens, breakdown } = getTotalCost();
  
  if (breakdown.length === 0) {
    return;
  }
  
  try {
    for (const usage of breakdown) {
      await convex.mutation(api.costs.logCost, {
        projectId: projectId as any,
        operation: 'chat',
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUSD: usage.costUSD,
        metadata,
      });
    }
    
    console.log(`[onboarding-chat] Logged ${breakdown.length} LLM calls, total: $${totalCostUSD.toFixed(4)}`);
  } catch (error) {
    console.error('[onboarding-chat] Failed to log costs to Convex:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ACTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  resetCostTracker();
  const convex = getConvexClient();

  try {
    const body = (await request.json()) as {
      action: 'generate-message' | 'extract-selling-method' | 'detect-intent';
      messageType?: MessageType;
      context?: ChatContext;
      userInput?: string;
      intentContext?: 'summary-confirmation' | 'skip-pricing' | 'general';
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXTRACT SELLING METHOD ACTION (LLM-based)
    // ═══════════════════════════════════════════════════════════════════════
    if (body.action === 'extract-selling-method') {
      const { userInput, context } = body;
      
      if (!userInput) {
        return new Response(JSON.stringify({ error: 'userInput is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await extractSellingMethod(userInput, context?.projectDescription);
      await logCostsToConvex(convex, 'extract-selling', context?.projectId);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DETECT USER INTENT ACTION (LLM-based)
    // ═══════════════════════════════════════════════════════════════════════
    if (body.action === 'detect-intent') {
      const { userInput, intentContext, context } = body;
      
      if (!userInput) {
        return new Response(JSON.stringify({ error: 'userInput is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await detectUserIntent(userInput, intentContext || 'general');
      await logCostsToConvex(convex, 'detect-intent', context?.projectId);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action !== 'generate-message') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messageType, context } = body;

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK FOR UNSUPPORTED BUSINESS TYPES (after user describes their business)
    // ═══════════════════════════════════════════════════════════════════════
    if (messageType === 'after-description' && context?.projectDescription) {
      const unsupported = detectUnsupportedType(context.projectDescription);
      
      if (unsupported) {
        console.log(`[onboarding-chat] Unsupported type detected: ${unsupported.type}`);
        
        // Log the unsupported request for analytics
        await logUnsupportedRequest(
          convex,
          unsupported.type,
          context.projectDescription,
          context.sessionId
        );
        
        const message = generateUnsupportedMessage(unsupported.type, unsupported.message);
        
        return new Response(JSON.stringify({ 
          message,
          unsupported: true,
          unsupportedType: unsupported.type,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle supported message types
    if (messageType === 'after-description' || messageType === 'business-summary' || messageType === 'step-transition') {
      const msg = await fallbackMessage(messageType, context);
      await logCostsToConvex(convex, 'chat', context?.projectId);
      
      return new Response(JSON.stringify({ message: msg }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Try LLM if configured for other message types
    try {
      if (process.env.GROQ_API_KEY) {
        let system = `You are a friendly website builder assistant for SERVICE-BASED entrepreneurs.
        
Generate SHORT responses (2-3 sentences MAX).

STRICT RULES:
- Maximum 2-3 sentences total
- ONE question only at the end
- Use **bold** for project names when mentioned
- Never use heading syntax (# or ##)
- No emojis
- NEVER suggest or invent specific business names
- We help SERVICE PROVIDERS: coaches, therapists, trainers, freelancers, etc.`;

        const user = `Generate a message for: ${messageType}`;
        const text = await generateCompletion(
          [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          { model: 'llama-3.3-70b-versatile', temperature: 0.5, maxTokens: 150 },
        );

        if (text && text.trim().length > 0) {
          await logCostsToConvex(convex, 'chat', context?.projectId);
          
          return new Response(JSON.stringify({ message: text.trim() }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (err) {
      console.warn('[api.onboarding-chat] LLM failed, falling back:', err);
    }

    // Fallback
    const msg = await fallbackMessage(messageType, context);
    await logCostsToConvex(convex, 'chat', context?.projectId);
    
    return new Response(JSON.stringify({ message: msg }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[api.onboarding-chat] error:', error);
    
    try {
      await logCostsToConvex(convex, 'chat');
    } catch {}
    
    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
