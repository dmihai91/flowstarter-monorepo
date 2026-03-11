/**
 * Centralized LLM cost tracker.
 * Accumulates costs per project and persists to Convex + Supabase.
 *
 * Usage:
 *   trackLLMUsage(projectId, model, { promptTokens, completionTokens })
 *   const costs = getProjectCosts(projectId)
 *   await flushProjectCosts(projectId) // persist to DB
 */
import { calculateCost } from '~/lib/utils/model-pricing';

interface UsageEntry {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  timestamp: number;
}

interface ProjectCosts {
  entries: UsageEntry[];
  totalCostUSD: number;
  totalTokens: number;
  totalCredits: number; // 1 credit = $0.01
}

// In-memory accumulator per project
const projectCosts = new Map<string, ProjectCosts>();

export function trackLLMUsage(
  projectId: string | undefined,
  model: string,
  usage: { promptTokens: number; completionTokens: number },
): void {
  if (!projectId) return;

  const costUSD = calculateCost(model, usage.promptTokens, usage.completionTokens);
  const entry: UsageEntry = {
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    costUSD,
    timestamp: Date.now(),
  };

  const existing = projectCosts.get(projectId) ?? {
    entries: [],
    totalCostUSD: 0,
    totalTokens: 0,
    totalCredits: 0,
  };

  existing.entries.push(entry);
  existing.totalCostUSD += costUSD;
  existing.totalTokens += usage.promptTokens + usage.completionTokens;
  existing.totalCredits = Math.ceil(existing.totalCostUSD / 0.01);

  projectCosts.set(projectId, existing);

  console.log(
    `[CostTracker] ${model}: ${usage.promptTokens}+${usage.completionTokens} tok = $${costUSD.toFixed(4)} | Project ${projectId} total: $${existing.totalCostUSD.toFixed(4)} (${existing.totalCredits} credits)`,
  );
}

export function getProjectCosts(projectId: string): ProjectCosts | null {
  return projectCosts.get(projectId) ?? null;
}

export function resetProjectCosts(projectId: string): void {
  projectCosts.delete(projectId);
}

/**
 * Flush accumulated costs to Convex + Supabase.
 * Called after build completes or periodically.
 */
export async function flushProjectCosts(
  projectId: string,
  supabaseProjectId?: string,
): Promise<{ costUSD: number; credits: number } | null> {
  const costs = projectCosts.get(projectId);
  if (!costs || costs.totalCostUSD === 0) return null;

  const result = { costUSD: costs.totalCostUSD, credits: costs.totalCredits };

  // Persist to Supabase if we have the project ID
  if (supabaseProjectId) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${supabaseProjectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            generation_cost_usd: costs.totalCostUSD,
            ai_credits_used: costs.totalCredits,
          }),
        });
        console.log(`[CostTracker] Flushed to Supabase: $${costs.totalCostUSD.toFixed(4)}`);
      }
    } catch (err) {
      console.error('[CostTracker] Supabase flush failed:', err);
    }
  }

  // Persist to Convex
  try {
    const convexSiteUrl = process.env.CONVEX_SITE_URL || (process.env.VITE_CONVEX_URL || '').replace('.convex.cloud', '.convex.site');
    const secret = process.env.HANDOFF_SECRET || process.env.VITE_HANDOFF_SECRET;
    if (convexSiteUrl && secret && supabaseProjectId) {
      await fetch(`${convexSiteUrl}/costs/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-handoff-secret': secret },
        body: JSON.stringify({
          projectId: supabaseProjectId,
          costUSD: costs.totalCostUSD,
          credits: costs.totalCredits,
          breakdown: costs.entries.map((e) => ({
            model: e.model,
            promptTokens: e.promptTokens,
            completionTokens: e.completionTokens,
            costUSD: e.costUSD,
          })),
        }),
      });
    }
  } catch (err) {
    console.error('[CostTracker] Convex flush failed:', err);
  }

  projectCosts.delete(projectId);
  return result;
}
