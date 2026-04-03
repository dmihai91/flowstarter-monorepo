'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function IntegrationStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      variant="outline"
      className="text-emerald-600 border-emerald-400/50 bg-emerald-50 dark:bg-emerald-900/20 text-xs"
    >
      <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="text-amber-600 border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 text-xs"
    >
      <AlertCircle className="w-3 h-3 mr-1" /> Inactive
    </Badge>
  );
}
