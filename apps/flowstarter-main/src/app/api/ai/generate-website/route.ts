/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CODING_AGENT_URL =
  process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:8000';

// Helper to create a streaming response
function createStreamResponse(stream: ReadableStream) {
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

const GenerateWebsiteSchema = z.object({
  projectDetails: z.object({
    name: z.string(),
    description: z.string(),
    targetUsers: z.string().optional(),
    businessGoals: z.string().optional(),
    USP: z.string().optional(),
    brandTone: z.string().optional(),
    keyServices: z.string().optional(),
    designConfig: z
      .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        fontHeading: z.string().optional(),
        fontBody: z.string().optional(),
      })
      .optional(),
  }),
  templateInfo: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
  templateCode: z.string().optional(),
  useOrchestrator: z.boolean().optional(),
  stream: z.boolean().optional(),
  sessionId: z.string().optional(), // Convex session ID for real-time state sync
});

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get JWT token for backend authentication
    // Request a fresh token (not cached) to ensure it's valid for the duration of the request
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = GenerateWebsiteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      projectDetails,
      templateInfo,
      templateCode,
      useOrchestrator = true,
      stream = false,
      sessionId,
    } = parsed.data;

    // Use streaming endpoint if requested
    if (stream) {
      console.log('🌊 Streaming mode enabled, calling Python backend...');
      console.log(`📍 Session ID: ${sessionId || 'not provided'}`);
      const codingAgentResponse = await fetch(
        `${CODING_AGENT_URL}/agent/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agent: 'website-generator',
            action: 'generate',
            sessionId, // Convex session ID for real-time state sync
            context: {
              projectDetails,
              templateId: templateInfo.id,
              templateInfo,
              templateCode,
              useOrchestrator,
              userId, // Pass userId for workspace organization
            },
          }),
        }
      );

      if (!codingAgentResponse.ok) {
        const errorData = await codingAgentResponse.text();
        throw new Error(errorData || 'Coding agent service error');
      }

      // Forward the stream to the client
      if (!codingAgentResponse.body) {
        throw new Error('No response body');
      }

      console.log('✅ Got stream from Python backend, processing stream...');

      // Create a ReadableStream that manually reads and forwards each chunk
      const reader = codingAgentResponse.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          let eventCount = 0;

          try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log(
                  `🏁 Stream complete. Forwarded ${eventCount} chunks.`
                );
                controller.close();
                break;
              }

              // Log what we're forwarding
              const text = decoder.decode(value, { stream: true });
              if (text.trim()) {
                eventCount++;
                console.log(
                  `📤 Forwarding chunk #${eventCount}:`,
                  text.substring(0, 150)
                );
              }

              // Forward the chunk immediately
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('❌ Stream processing error:', error);
            controller.error(error);
          }
        },
        cancel() {
          console.log('⚠️ Stream cancelled by client');
          reader.cancel();
        },
      });

      return createStreamResponse(stream);
    }

    // Original non-streaming endpoint
    const codingAgentResponse = await fetch(`${CODING_AGENT_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        agent: 'website-generator',
        action: 'generate',
        sessionId, // Convex session ID for state sync
        context: {
          projectDetails,
          templateId: templateInfo.id,
          templateInfo,
          templateCode,
          useOrchestrator,
          userId, // Pass userId for workspace organization
        },
      }),
    });

    if (!codingAgentResponse.ok) {
      const errorData = await codingAgentResponse.json();
      throw new Error(errorData.detail || 'Coding agent service error');
    }

    const result = await codingAgentResponse.json();

    return NextResponse.json({
      success: true,
      siteId: result.response.siteId,
      generatedCode: result.response.generatedCode,
      files: result.response.files,
      architecture: result.response.architecture,
      tested: result.response.tested,
      orchestrated: result.response.orchestrated,
      qualityMetrics: result.response.quality_metrics,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
