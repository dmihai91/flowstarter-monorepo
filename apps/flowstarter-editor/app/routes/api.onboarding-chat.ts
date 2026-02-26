import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { detectUnsupportedType } from '~/lib/config/supported-categories';
import { generateCompletion, resetCostTracker } from '~/lib/services/llm';
import {
  type MessageType,
  type OnboardingChatRequestBody,
  getConvexClient,
  logCostsToConvex,
  logUnsupportedRequest,
  generateUnsupportedMessage,
  fallbackMessage,
  extractSellingMethod,
  detectUserIntent,
} from './onboarding-chat';

// Re-export types for external consumers
export type { MessageType } from './onboarding-chat';

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
    const body = (await request.json()) as OnboardingChatRequestBody;

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
      await logCostsToConvex(convex, 'chat', context?.projectId);
      
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
      await logCostsToConvex(convex, 'chat', context?.projectId);
      
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
    // CHECK FOR UNSUPPORTED BUSINESS TYPES
    // ═══════════════════════════════════════════════════════════════════════
    if (messageType === 'after-description' && context?.projectDescription) {
      const unsupported = detectUnsupportedType(context.projectDescription);
      
      if (unsupported) {
        console.log(`[onboarding-chat] Unsupported type detected: ${unsupported.type}`);
        
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

    // Handle supported message types with fallback
    if (messageType === 'after-description' || messageType === 'business-summary' || messageType === 'step-transition') {
      const msg = await fallbackMessage(messageType, context);
      await logCostsToConvex(convex, 'chat', context?.projectId);
      
      return new Response(JSON.stringify({ message: msg }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Try LLM for other message types
    try {
      if (process.env.GROQ_API_KEY) {
        const system = `You are a friendly website builder assistant for SERVICE-BASED entrepreneurs.
        
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

    // Final fallback
    const msg = await fallbackMessage(messageType as MessageType, context);
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
