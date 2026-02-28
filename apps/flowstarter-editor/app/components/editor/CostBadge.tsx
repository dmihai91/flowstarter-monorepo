/**
 * Cost Badge
 *
 * Displays session cost in the editor header.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface CostBadgeProps {
  projectId: string;
}

export function CostBadge({ projectId }: CostBadgeProps) {
  const data = useQuery(api.costs.getProjectCosts, {
    projectId: projectId as Id<'projects'>,
  });

  if (!data || data.summary.totalCostUSD === 0) {
    return null;
  }

  const formatted = data.summary.totalCostUSD < 0.01
    ? '<$0.01'
    : `$${data.summary.totalCostUSD.toFixed(2)}`;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800 text-xs text-gray-500 dark:text-zinc-400"
      title={`Session cost: ${formatted} (${data.summary.totalTokens.toLocaleString()} tokens)`}
    >
      <span>{formatted}</span>
    </div>
  );
}
