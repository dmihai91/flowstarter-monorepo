import { type ActionFunctionArgs } from '@remix-run/node';
import { BusinessAgent } from '~/lib/services/businessAgent';

// Store active agent sessions (in production, use Redis or similar)
const agentSessions = new Map<string, BusinessAgent>();

/**
 * Business Agent Chat API
 *
 * Handles interactive business information gathering during onboarding.
 * Collects: business name, description, USP, target audience, goals, pricing, brand tone
 *
 * POST /api/businessAgent
 * Body: { action: 'start' | 'chat' | 'generate' | 'regenerate', sessionId?: string, message?: string }
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = (await request.json()) as {
      action: 'start' | 'chat' | 'generate' | 'regenerate';
      sessionId?: string;
      message?: string;
      feedback?: string;
    };

    const { action, sessionId, message, feedback } = body;

    // START: Initialize new agent session
    if (action === 'start') {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const agent = new BusinessAgent();

      const initialMessage = await agent.start();
      agentSessions.set(newSessionId, agent);

      console.log(`[BusinessAgent] Started new session: ${newSessionId}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId: newSessionId,
          message: initialMessage,
          isComplete: false,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Require sessionId for other actions
    if (!sessionId) {
      return new Response(JSON.stringify({ success: false, error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const agent = agentSessions.get(sessionId);

    if (!agent) {
      return new Response(JSON.stringify({ success: false, error: 'Session not found or expired' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CHAT: Process user message
    if (action === 'chat') {
      if (!message) {
        return new Response(JSON.stringify({ success: false, error: 'message required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const response = await agent.processResponse(message);

      console.log(`[BusinessAgent] Processed message in ${sessionId}, complete: ${response.isComplete}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          message: response.message,
          isComplete: response.isComplete,
          businessInfo: response.businessInfo || agent.getBusinessDetails(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // GENERATE: Generate project metadata
    if (action === 'generate') {
      const metadata = await agent.generateProjectMetadata();
      const businessInfo = agent.getBusinessDetails();

      console.log(`[BusinessAgent] Generated metadata for ${sessionId}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          metadata,
          businessInfo,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // REGENERATE: Regenerate project metadata with feedback
    if (action === 'regenerate') {
      const metadata = await agent.regenerateProjectMetadata(feedback);
      const businessInfo = agent.getBusinessDetails();

      console.log(`[BusinessAgent] Regenerated metadata for ${sessionId}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          metadata,
          businessInfo,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[BusinessAgent] Error:', error);

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cleanup old sessions periodically
setInterval(
  () => {
    const MAX_SESSIONS = 100;

    if (agentSessions.size > MAX_SESSIONS) {
      const keysToDelete = Array.from(agentSessions.keys()).slice(0, agentSessions.size - MAX_SESSIONS);
      keysToDelete.forEach((key) => agentSessions.delete(key));
      console.log(`[BusinessAgent] Cleaned up ${keysToDelete.length} old sessions`);
    }
  },
  5 * 60 * 1000,
); // Every 5 minutes

