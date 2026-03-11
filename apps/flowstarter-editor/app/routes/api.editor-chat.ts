import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToCoreMessages } from 'ai';
import { trackLLMUsage } from '~/lib/.server/llm/cost-tracker';
import { createScopedLogger } from '~/utils/logger';
import { FLOWSTARTER_SYSTEM_PROMPT } from '~/lib/config/systemPrompt';

const logger = createScopedLogger('api.editor-chat');

/**
 * Simplified chat API for the Flowstarter editor
 * Uses OpenRouter exclusively for LLM access
 */
export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const body = await request.json<{
      messages: Array<{ role: string; content: string }>;
      projectId?: string;
      systemPrompt?: string;
    }>();

    const { messages, systemPrompt } = body;

    // Get OpenRouter API key from environment
    const apiKey =
      context.cloudflare?.env?.OPEN_ROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      process.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      logger.error('OpenRouter API key not configured');
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get model from environment or use default
    const env = context.cloudflare?.env as unknown as Record<string, string> | undefined;
    const model =
      env?.OPENROUTER_MODEL ||
      process.env.OPENROUTER_MODEL ||
      process.env.VITE_OPENROUTER_MODEL ||
      'anthropic/claude-sonnet-4';

    // Initialize OpenRouter
    const openRouter = createOpenRouter({
      apiKey,
    });

    // Use custom system prompt or default Flowstarter prompt
    const effectiveSystemPrompt = systemPrompt || FLOWSTARTER_SYSTEM_PROMPT;

    logger.info(`Sending request to OpenRouter with model: ${model}`);

    // Stream the response
    const result = await streamText({
      model: openRouter.chat(model) as any,
      system: effectiveSystemPrompt,
      messages: convertToCoreMessages(
        messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ),
      maxTokens: 4096,
    });

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          logger.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    logger.error('Chat error:', error);

    if (error.message?.includes('API key')) {
      return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

