/**
 * AgentSummaryMessage
 *
 * Inline chat message showing a concise summary of agent activity.
 * Only shown in chat when there are errors or the job completes with notable info.
 * Normal activity (file writes, thinking) stays in the Terminal tab.
 */

import type { AgentActivityEvent } from './AgentActivityPanel';

interface AgentSummaryMessageProps {
  events: AgentActivityEvent[];
  onOpenTerminal?: () => void;
}

function formatCost(usd: number): string {
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`;
}

function formatDuration(ms: number): string {
  const s = ms / 1000;
  return s < 1 ? `${Math.round(ms)}ms` : `${s.toFixed(1)}s`;
}

export function AgentSummaryMessage({ events, onOpenTerminal }: AgentSummaryMessageProps) {
  const errors = events.filter(
    e => e.type === 'error' ||
    (e.type === 'sandbox_exit' && (e as any).code !== 0) ||
    (e.type === 'sandbox_output' && (e as any).stream === 'stderr' && (e as any).line?.includes('Error'))
  );
  const fileWrites = events.filter(e => e.type === 'file_write');
  const doneEvent = events.findLast(e => e.type === 'done') as Extract<AgentActivityEvent, { type: 'done' }> | undefined;

  const hasErrors = errors.length > 0;

  // Only render if there's something worth surfacing to chat
  if (!hasErrors && !doneEvent) return null;

  return (
    <div
      className={`rounded-lg border text-xs font-mono overflow-hidden ${
        hasErrors
          ? 'border-[#EF4444]/30 bg-[#EF4444]/5'
          : 'border-white/8 bg-white/4'
      }`}
    >
      {/* Header */}
      <div className={`px-3 py-2 flex items-center justify-between border-b ${
        hasErrors ? 'border-[#EF4444]/20' : 'border-white/6'
      }`}>
        <span className={`font-semibold tracking-wider uppercase text-[10px] ${
          hasErrors ? 'text-[#EF4444]' : 'text-[#71717a]'
        }`}>
          {hasErrors ? `${errors.length} error${errors.length !== 1 ? 's' : ''} during generation` : 'Generation complete'}
        </span>
        {doneEvent && (
          <span className="text-[10px] text-[#3f3f46]">
            {formatDuration(doneEvent.duration_ms)} · {formatCost(doneEvent.cost_usd)}
          </span>
        )}
      </div>

      {/* Error details — only show top 3 */}
      {hasErrors && (
        <div className="px-3 py-2 space-y-1">
          {errors.slice(0, 3).map((e, i) => (
            <p key={i} className="text-[11px] text-[#EF4444]/80 break-words">
              {e.type === 'error' ? (e as any).message :
               e.type === 'sandbox_exit' ? `Process exited with code ${(e as any).code}` :
               (e as any).line}
            </p>
          ))}
          {errors.length > 3 && (
            <p className="text-[10px] text-[#EF4444]/50">+{errors.length - 3} more</p>
          )}
        </div>
      )}

      {/* Success summary */}
      {!hasErrors && doneEvent && (
        <div className="px-3 py-2 text-[11px] text-[#71717a]">
          {fileWrites.length} file{fileWrites.length !== 1 ? 's' : ''} written
          {' · '}
          {doneEvent.turns} turn{doneEvent.turns !== 1 ? 's' : ''}
        </div>
      )}

      {/* Terminal link */}
      {onOpenTerminal && (
        <div className={`px-3 py-1.5 border-t ${hasErrors ? 'border-[#EF4444]/20' : 'border-white/6'}`}>
          <button
            onClick={onOpenTerminal}
            className="text-[10px] text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            View full output in Terminal →
          </button>
        </div>
      )}
    </div>
  );
}
