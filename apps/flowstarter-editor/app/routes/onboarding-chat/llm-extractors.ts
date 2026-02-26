import { generateCompletion } from '~/lib/services/llm';
import type { 
  ExtractedSellingMethod, 
  SellingMethodCategory, 
  DetectedIntent, 
  UserIntent,
  IntentContext 
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// LLM-BASED SELLING METHOD EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Use LLM to intelligently extract the selling method from user input.
 * Works for any language (Romanian, English, etc.)
 */
export async function extractSellingMethod(
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

/**
 * Use LLM to detect user intent from their response.
 * Works for any language.
 */
export async function detectUserIntent(
  userInput: string,
  intentContext: IntentContext,
): Promise<DetectedIntent> {
  const contextPrompts: Record<IntentContext, string> = {
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
