/**
 * Modification Router API
 *
 * Uses a small, fast LLM to classify modification requests:
 * - Simple → Single agent (fast, cheap)
 * - Complex → Full Gretly pipeline (multi-agent orchestration)
 *
 * Model: Llama 3.3 70B on Groq (fast inference, good reasoning)
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

/** Router model - Llama 3.3 70B on Groq for fast classification */
const ROUTER_MODEL = 'llama-3.3-70b-versatile';

/** Get Groq client for fast inference */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  return createOpenAI({
    apiKey,
    baseURL: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
  });
}

export interface ModificationRequest {
  projectId: string;
  instruction: string;
  currentFiles?: string[];
}

export type ModificationRoute = 'simple' | 'gretly';

export interface RouteDecision {
  route: ModificationRoute;
  confidence: number;
  reason: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

/**
 * System prompt for the router - focused and concise
 */
const ROUTER_SYSTEM_PROMPT = `You are a modification router. Classify user requests into two categories:

SIMPLE - Use when:
• Changing text, titles, headlines, button labels
• Updating colors, fonts, sizes, spacing
• Replacing images or icons
• Fixing typos or wording
• Showing/hiding existing elements
• Single file changes

GRETLY - Use when:
• Adding new pages or sections
• Creating new features or functionality  
• Structural/layout changes
• Multi-file refactoring
• Adding integrations (forms, payments, booking)
• "Redesign" or "overhaul" requests

Respond with ONLY valid JSON:
{"route":"simple"|"gretly","confidence":0.0-1.0,"reason":"brief reason","complexity":"low"|"medium"|"high"}`;

/**
 * Quick heuristic for obvious cases (saves LLM call)
 */
function quickCheck(instruction: string): RouteDecision | null {
  const lower = instruction.toLowerCase();
  const words = lower.split(/\s+/).length;
  
  // Very short + simple keywords = simple
  if (words <= 10) {
    const simplePatterns = [
      /^change .{1,30} to /i,
      /^update .{1,20}$/i,
      /^fix .{1,20}$/i,
      /^replace .{1,30}$/i,
      /^make .{1,20} (bigger|smaller|bold|italic)/i,
      /^(hide|show|remove) .{1,20}$/i,
    ];
    
    for (const pattern of simplePatterns) {
      if (pattern.test(instruction)) {
        return {
          route: 'simple',
          confidence: 0.9,
          reason: 'Simple edit pattern',
          estimatedComplexity: 'low',
        };
      }
    }
  }
  
  // Complex keywords = gretly
  const complexKeywords = [
    'add new page', 'create page', 'new section',
    'redesign', 'overhaul', 'restructure',
    'add booking', 'add payment', 'add form',
    'e-commerce', 'shopping cart', 'checkout',
    'blog section', 'portfolio gallery',
    'completely change', 'entire site',
  ];
  
  for (const keyword of complexKeywords) {
    if (lower.includes(keyword)) {
      return {
        route: 'gretly',
        confidence: 0.9,
        reason: `Contains "${keyword}"`,
        estimatedComplexity: 'high',
      };
    }
  }
  
  return null; // Need LLM
}

/**
 * Route using small fast LLM
 */
async function routeWithLLM(instruction: string): Promise<RouteDecision> {
  try {
    const groq = getGroqClient();
    
    const result = await generateText({
      model: groq(ROUTER_MODEL),
      messages: [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: instruction },
      ],
      temperature: 0.1, // Low temp for consistent classification
      maxTokens: 100,   // Short response
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        route: parsed.route === 'gretly' ? 'gretly' : 'simple',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
        reason: parsed.reason || 'LLM classification',
        estimatedComplexity: parsed.complexity || 'medium',
      };
    }
  } catch (error) {
    console.error('[ModificationRouter] LLM error:', error);
  }

  // Default to simple on error
  return {
    route: 'simple',
    confidence: 0.5,
    reason: 'Fallback default',
    estimatedComplexity: 'medium',
  };
}

/**
 * Main routing function
 */
export async function routeModification(instruction: string): Promise<RouteDecision> {
  // Try quick heuristic first (instant, no LLM cost)
  const quick = quickCheck(instruction);
  if (quick) {
    console.log(`[ModificationRouter] Quick route: ${quick.route} (${quick.reason})`);
    return quick;
  }
  
  // Use fast LLM for classification
  console.log(`[ModificationRouter] Using LLM for: "${instruction.slice(0, 50)}..."`);
  return routeWithLLM(instruction);
}

/**
 * API Handler
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as ModificationRequest;

    if (!body.instruction) {
      return json({ error: 'instruction is required' }, { status: 400 });
    }

    const startTime = Date.now();
    const decision = await routeModification(body.instruction);
    const latency = Date.now() - startTime;

    console.log(`[ModificationRouter] Decision: ${decision.route} in ${latency}ms`);

    return json({
      success: true,
      decision,
      latencyMs: latency,
    });
  } catch (error) {
    console.error('[ModificationRouter] Error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      // Default to simple on error
      decision: {
        route: 'simple',
        confidence: 0.5,
        reason: 'Error fallback',
        estimatedComplexity: 'medium',
      },
    }, { status: 500 });
  }
}

