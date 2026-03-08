/**
 * AgentActivityPanel
 *
 * Displays real-time agent activity in a professional IDE-style log panel.
 * Integrates with the flow design system (GlassPanel, monospace font, CSS vars).
 *
 * Design: VS Code output panel aesthetic — verb labels left, values right,
 * indented sub-output with →. No emoji. Color-coded by type only.
 */

import { useState, useRef, useEffect } from 'react';

export type AgentActivityEvent =
  | { type: 'thinking'; text: string; duration_s?: number }
  | { type: 'tool_call'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; name: string; duration_s: number }
  | { type: 'file_write'; path: string; lines?: number; duration_s?: number }
  | { type: 'file_read'; path: string }
  | { type: 'file_delete'; path: string }
  | { type: 'command'; cmd: string }
  | { type: 'command_output'; text: string; success?: boolean }
  | { type: 'text'; content: string }
  | { type: 'error'; message: string }
  | { type: 'done'; duration_ms: number; turns: number; cost_usd: number; input_tokens: number; output_tokens: number }

interface AgentActivityPanelProps {
  events: AgentActivityEvent[];
  isActive?: boolean;
  className?: string;
}

// Verb label colors — using CSS vars from design system
const LABEL_STYLES: Record<string, string> = {
  thinking:       'text-[var(--purple,#4d5dd9)]',
  write:          'text-[#3B82F6]',    // blue
  read:           'text-[#71717a]',    // zinc-500 muted
  delete:         'text-[#EF4444]',    // red
  exec:           'text-[#10B981]',    // green
  output:         'text-[#a1a1aa]',    // muted
  error:          'text-[#EF4444]',    // red
  text:           'text-[#d4d4d8]',    // light prose
  done:           'text-[#a1a1aa]',    // muted
};

function formatDuration(s: number): string {
  if (s < 1) return `${Math.round(s * 1000)}ms`;
  return `${s.toFixed(1)}s`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `<$0.01`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function EventRow({ event }: { event: AgentActivityEvent }) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  switch (event.type) {
    case 'thinking': {
      const preview = event.text.slice(0, 120).replace(/\n/g, ' ');
      const truncated = event.text.length > 120;
      return (
        <div className="flex gap-3 items-start py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.thinking}`}>
            thinking
          </span>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setThinkingExpanded(e => !e)}
              className="text-left w-full text-xs font-mono text-[#a1a1aa] hover:text-[#d4d4d8] transition-colors"
            >
              {thinkingExpanded ? event.text : preview}
              {truncated && !thinkingExpanded && (
                <span className="text-[var(--purple,#4d5dd9)] ml-1">…show more</span>
              )}
              {thinkingExpanded && truncated && (
                <span className="text-[var(--purple,#4d5dd9)] ml-1">show less</span>
              )}
            </button>
            {event.duration_s !== undefined && (
              <span className="text-[10px] font-mono text-[#52525b] ml-0 block mt-0.5">
                {formatDuration(event.duration_s)}
              </span>
            )}
          </div>
        </div>
      );
    }

    case 'file_write':
      return (
        <div className="flex gap-3 items-baseline py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.write}`}>
            write
          </span>
          <span className="flex-1 text-xs font-mono text-[#d4d4d8] truncate">{event.path}</span>
          <span className="shrink-0 text-[10px] font-mono text-[#52525b]">
            {event.lines !== undefined ? `${event.lines} lines` : ''}
            {event.duration_s !== undefined ? `  ${formatDuration(event.duration_s)}` : ''}
          </span>
        </div>
      );

    case 'file_read':
      return (
        <div className="flex gap-3 items-baseline py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.read}`}>
            read
          </span>
          <span className="flex-1 text-xs font-mono text-[#71717a] truncate">{event.path}</span>
        </div>
      );

    case 'file_delete':
      return (
        <div className="flex gap-3 items-baseline py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.delete}`}>
            delete
          </span>
          <span className="flex-1 text-xs font-mono text-[#EF4444]/70 truncate">{event.path}</span>
        </div>
      );

    case 'command':
      return (
        <div className="flex gap-3 items-baseline py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.exec}`}>
            exec
          </span>
          <span className="flex-1 text-xs font-mono text-[#d4d4d8] truncate">{event.cmd}</span>
        </div>
      );

    case 'command_output':
      return (
        <div className="flex gap-3 items-baseline py-0.5">
          <span className="w-16 shrink-0" />
          <span className={`flex-1 text-[11px] font-mono truncate ${event.success === false ? 'text-[#EF4444]' : 'text-[#71717a]'}`}>
            → {event.text}
          </span>
        </div>
      );

    case 'error':
      return (
        <div className="flex gap-3 items-start py-0.5">
          <span className={`w-16 shrink-0 text-right text-xs font-mono font-medium ${LABEL_STYLES.error}`}>
            error
          </span>
          <span className="flex-1 text-xs font-mono text-[#EF4444] break-words">{event.message}</span>
        </div>
      );

    case 'text':
      return (
        <div className="flex gap-3 items-start py-0.5">
          <span className="w-16 shrink-0" />
          <span className="flex-1 text-xs font-mono text-[#71717a] break-words">{event.content}</span>
        </div>
      );

    default:
      return null;
  }
}

export function AgentActivityPanel({ events, isActive = false, className = '' }: AgentActivityPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (!collapsed && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events, collapsed]);

  const doneEvent = events.findLast(e => e.type === 'done') as Extract<AgentActivityEvent, { type: 'done' }> | undefined;
  const fileCount = events.filter(e => e.type === 'file_write').length;
  const hasError = events.some(e => e.type === 'error');

  // Summary for collapsed state
  const summary = doneEvent
    ? `${formatDuration(doneEvent.duration_ms / 1000)} · ${doneEvent.turns} turns · ${formatCost(doneEvent.cost_usd)} · ${formatTokens(doneEvent.input_tokens + doneEvent.output_tokens)} tok`
    : isActive
    ? `${fileCount} file${fileCount !== 1 ? 's' : ''} written…`
    : 'Idle';

  return (
    <div
      className={`
        flex flex-col rounded-xl overflow-hidden
        border border-transparent
        backdrop-blur-xl backdrop-saturate-150
        ${className}
      `}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--glass-surface) 70%, transparent)',
        borderTopColor: 'var(--glass-border-highlight)',
        borderLeftColor: 'var(--glass-border-highlight)',
        borderBottomColor: 'var(--glass-border-shadow)',
        borderRightColor: 'var(--glass-border-shadow)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#71717a]">
            Agent Activity
          </span>
          {isActive && !collapsed && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple,#4d5dd9)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--purple,#4d5dd9)]">running</span>
            </span>
          )}
          {hasError && !collapsed && (
            <span className="text-[10px] font-mono text-[#EF4444]">error</span>
          )}
          {collapsed && (
            <span className="text-[11px] font-mono text-[#52525b] truncate">{summary}</span>
          )}
        </div>
        <span className="text-[11px] font-mono text-[#52525b] ml-3 shrink-0">
          {collapsed ? 'expand' : 'collapse'}
        </span>
      </button>

      {/* Log area */}
      {!collapsed && (
        <>
          <div className="h-px bg-[var(--glass-border-shadow)] mx-0" />
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 min-h-0 max-h-64"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
          >
            {events.length === 0 ? (
              <p className="text-[11px] font-mono text-[#52525b]">Waiting for agent…</p>
            ) : (
              events.map((event, i) =>
                event.type !== 'done' ? <EventRow key={i} event={event} /> : null
              )
            )}
          </div>

          {/* Stats footer */}
          {(doneEvent || isActive) && (
            <>
              <div className="h-px bg-[var(--glass-border-shadow)]" />
              <div className="px-4 py-2 flex items-center gap-4">
                {doneEvent ? (
                  <span className="text-[10px] font-mono text-[#52525b]">{summary}</span>
                ) : (
                  <span className="text-[10px] font-mono text-[#52525b]">
                    {fileCount} file{fileCount !== 1 ? 's' : ''} written
                    {isActive ? '…' : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
