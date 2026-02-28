/**
 * Workspace Status Badge
 *
 * Shows workspace connection status using StatusDot from the design system.
 */

import type { useWorkspaceHealth } from '~/lib/hooks/useWorkspaceHealth';

type WorkspaceStatusType = ReturnType<typeof useWorkspaceHealth>['status'];

const STATUS_CONFIG: Record<
  WorkspaceStatusType,
  { color: string; label: string; animate: boolean }
> = {
  connected: { color: 'bg-emerald-500', label: 'Connected', animate: false },
  disconnected: { color: 'bg-gray-400', label: 'Disconnected', animate: false },
  reconnecting: { color: 'bg-yellow-400', label: 'Reconnecting...', animate: true },
  error: { color: 'bg-red-500', label: 'Error', animate: false },
};

interface WorkspaceStatusProps {
  status: WorkspaceStatusType;
  onReconnect?: () => void;
}

export function WorkspaceStatus({ status, onReconnect }: WorkspaceStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${
          config.animate ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-xs text-gray-500 dark:text-zinc-400">
        {config.label}
      </span>
      {status === 'error' && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
