/**
 * CopilotKit Runtime API Route
 *
 * This route proxies requests to the Python backend's AG-UI endpoint.
 * CopilotKit connects here, and we forward to the coding agent.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Get the coding agent backend URL
const CODING_AGENT_URL =
  process.env.CODING_AGENT_URL || 'http://localhost:8000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Clerk token for backend auth
    const token = await getToken();

    // Parse the incoming request body
    const body = await request.json();
    console.log('🤖 CopilotKit request received:', {
      thread_id: body.thread_id,
      run_id: body.run_id,
      message_count: body.messages?.length,
    });

    // Forward to AG-UI endpoint on Python backend
    const response = await fetch(`${CODING_AGENT_URL}/ag-ui/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Backend error: ${response.status}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Stream the response back to CopilotKit
    console.log('✅ Streaming AG-UI events from backend');

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('❌ CopilotKit route error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle GET for info endpoint
export async function GET() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await getToken();

    // Get agent info from backend
    const response = await fetch(`${CODING_AGENT_URL}/ag-ui/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to get agent info' }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const info = await response.json();
    return new Response(JSON.stringify(info), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Agent info error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
