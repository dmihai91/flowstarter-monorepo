import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { anonymizeQuery } from '~/lib/utils/anonymize';
import { getTotalCost } from '~/lib/services/llm';

// ═══════════════════════════════════════════════════════════════════════════
// CONVEX CLIENT
// ═══════════════════════════════════════════════════════════════════════════

export function getConvexClient(): ConvexHttpClient | null {
  const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.warn('[onboarding-chat] No CONVEX_URL, costs will not be persisted');
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

// ═══════════════════════════════════════════════════════════════════════════
// UNSUPPORTED REQUEST LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log an unsupported request to Convex for analytics
 */
export async function logUnsupportedRequest(
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
// COST LOGGING
// ═══════════════════════════════════════════════════════════════════════════

type CostOperation = 'router' | 'other' | 'planning' | 'chat' | 'site_generation' | 'site_modification' | 'self_healing' | 'asset_generation';

export async function logCostsToConvex(
  convex: ConvexHttpClient | null,
  operation: CostOperation,
  projectId?: string,
  metadata?: { template?: string; language?: string }
): Promise<void> {
  if (!convex) return;
  
  const { totalCostUSD, breakdown } = getTotalCost();
  
  if (breakdown.length === 0) {
    return;
  }
  
  try {
    for (const usage of breakdown) {
      await convex.mutation(api.costs.logCost, {
        projectId: projectId as any,
        operation,
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
