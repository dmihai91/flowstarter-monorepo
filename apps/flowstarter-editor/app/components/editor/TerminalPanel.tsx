/**
 * TerminalPanel
 *
 * Dedicated terminal view — shows full agent activity + Daytona sandbox output.
 * Used as the content for viewMode === 'terminal'.
 * Design: dark terminal aesthetic using flow design system CSS vars.
 */

import { useRef, useEffect, useState } from 'react';
import type { AgentActivityEvent } from './AgentActivityPanel';

interface TerminalPanelProps {
  events: AgentActivityEvent[];
  isActive?: boolean;
}

function formatDuration(s: number): string {
  if (s < 1) return `${Math.round(s * 1000)}ms`;
  return `${s.toFixed(1)}s`;
}

function formatCost(usd: number): string {
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`;
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

type FilterMode = 'all' | 'errors' | 'files' | 'sandbox';

function filterEvents(events: AgentActivityEvent[], mode: FilterMode): AgentActivityEvent[] {
  if (mode === 'all') return events;
  if (mode === 'errors') return events.filter(e => e.type === 'error' || (e.type === 'sandbox_exit' && e.code !== 0) || (e.type === 'sandbox_output' && e.stream === 'stderr'));
  if (mode === 'files') return events.filter(e => e.type === 'file_write' || e.type === 'file_read' || e.type === 'file_delete');
  if (mode === 'sandbox') return events.filter(e => e.type === 'sandbox_status' || e.type === 'sandbox_output' || e.type === 'sandbox_exit' || e.type === 'command' || e.type === 'command_output');
  return events;
}

function EventLine({ event }: { event: AgentActivityEvent }) {
  const [expanded, setExpanded] = useState(false);

  switch (event.type) {
    case 'thinking':
      return (
        <div className="flex gap-3 py-0.5 group">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[var(--purple,#4d5dd9)] opacity-80">
            thinking
          </span>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-left w-full text-[11px] font-mono text-[#71717a] hover:text-[#a1a1aa] transition-colors"
            >
              {expanded ? event.text : event.text.slice(0, 200).replace(/\n/g, ' ')}
              {!expanded && event.text.length > 200 && (
                <span className="text-[var(--purple,#4d5dd9)] ml-1">…</span>
              )}
            </button>
            {event.duration_s !== undefined && (
              <span className="text-[10px] font-mono text-[#3f3f46]"> ({formatDuration(event.duration_s)})</span>
            )}
          </div>
        </div>
      );

    case 'file_write':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#3B82F6]">write</span>
          <span className="flex-1 text-[11px] font-mono text-[#d4d4d8] truncate">{event.path}</span>
          {event.lines !== undefined && (
            <span className="shrink-0 text-[10px] font-mono text-[#3f3f46]">{event.lines}L</span>
          )}
        </div>
      );

    case 'file_read':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#52525b]">read</span>
          <span className="flex-1 text-[11px] font-mono text-[#52525b] truncate">{event.path}</span>
        </div>
      );

    case 'file_delete':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#EF4444]">delete</span>
          <span className="flex-1 text-[11px] font-mono text-[#EF4444]/70 truncate">{event.path}</span>
        </div>
      );

    case 'command':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#10B981]">exec</span>
          <span className="flex-1 text-[11px] font-mono text-[#d4d4d8]">{event.cmd}</span>
        </div>
      );

    case 'command_output':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0" />
          <span className={`flex-1 text-[11px] font-mono break-all ${event.success === false ? 'text-[#EF4444]' : 'text-[#52525b]'}`}>
            → {event.text}
          </span>
        </div>
      );

    case 'sandbox_status':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#3f3f46]">sandbox</span>
          <span className="flex-1 text-[11px] font-mono text-[#52525b]">{event.message}</span>
        </div>
      );

    case 'sandbox_output':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0" />
          <span className={`flex-1 text-[11px] font-mono break-all whitespace-pre-wrap ${
            event.stream === 'stderr' ? 'text-[#EF4444]/80' : 'text-[#52525b]'
          }`}>
            {event.line}
          </span>
        </div>
      );

    case 'sandbox_exit':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0" />
          <span className={`text-[11px] font-mono ${event.code === 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            → exited {event.code === 0 ? 'ok' : `with code ${event.code}`}
          </span>
        </div>
      );

    case 'tool_call':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono text-[#71717a]">tool</span>
          <span className="flex-1 text-[11px] font-mono text-[#71717a]">{event.name}</span>
        </div>
      );

    case 'tool_result':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0" />
          <span className="flex-1 text-[10px] font-mono text-[#3f3f46]">
            {event.name} completed in {formatDuration(event.duration_s)}
          </span>
        </div>
      );

    case 'text':
      return (
        <div className="flex gap-3 py-0.5">
          <span className="w-[88px] shrink-0" />
          <span className="flex-1 text-[11px] font-mono text-[#52525b] italic break-words">{event.content}</span>
        </div>
      );

    case 'error':
      return (
        <div className="flex gap-3 py-1 bg-[#EF4444]/8 -mx-4 px-4 rounded">
          <span className="w-[88px] shrink-0 text-right text-[11px] font-mono font-semibold text-[#EF4444]">error</span>
          <span className="flex-1 text-[11px] font-mono text-[#EF4444] break-words">{event.message}</span>
        </div>
      );

    default:
      return null;
  }
}

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'errors', label: 'Errors' },
  { key: 'files', label: 'Files' },
  { key: 'sandbox', label: 'Sandbox' },
];

export function TerminalPanel({ events, isActive = false }: TerminalPanelProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const visible = filterEvents(events.filter(e => e.type !== 'done'), filter);
  const doneEvent = events.findLast(e => e.type === 'done') as Extract<AgentActivityEvent, { type: 'done' }> | undefined;
  const errorCount = events.filter(e => e.type === 'error' || (e.type === 'sandbox_exit' && (e as any).code !== 0)).length;

  return (
    <div
      className="flex flex-col h-full font-mono"
      style={{ background: 'var(--color-bg-primary, #0a0a0c)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--glass-border-shadow, rgba(255,255,255,0.06))' }}
      >
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-[11px] font-mono rounded transition-colors ${
                filter === f.key
                  ? 'bg-white/10 text-[#d4d4d8]'
                  : 'text-[#3f3f46] hover:text-[#71717a]'
              } ${f.key === 'errors' && errorCount > 0 ? 'text-[#EF4444]' : ''}`}
            >
              {f.label}
              {f.key === 'errors' && errorCount > 0 && (
                <span className="ml-1.5 bg-[#EF4444] text-white text-[9px] px-1 py-0.5 rounded">
                  {errorCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--purple,#4d5dd9)]">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              running
            </span>
          )}
          {doneEvent && !isActive && (
            <span className="text-[10px] text-[#3f3f46]">done</span>
          )}
        </div>
      </div>

      {/* Log */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
      >
        {visible.length === 0 ? (
          <p className="text-[11px] text-[#3f3f46]">
            {filter === 'all' ? 'Waiting for agent…' : `No ${filter} events yet.`}
          </p>
        ) : (
          visible.map((event, i) => <EventLine key={i} event={event} />)
        )}
      </div>

      {/* Stats footer */}
      {doneEvent && (
        <div
          className="px-4 py-2 shrink-0 border-t flex items-center gap-4"
          style={{ borderColor: 'var(--glass-border-shadow, rgba(255,255,255,0.06))' }}
        >
          <span className="text-[10px] font-mono text-[#3f3f46]">
            {formatDuration(doneEvent.duration_ms / 1000)}
            {' · '}
            {doneEvent.turns} turn{doneEvent.turns !== 1 ? 's' : ''}
            {' · '}
            {formatCost(doneEvent.cost_usd)}
            {' · '}
            {formatTokens(doneEvent.input_tokens + doneEvent.output_tokens)} tok
          </span>
        </div>
      )}
    </div>
  );
}
