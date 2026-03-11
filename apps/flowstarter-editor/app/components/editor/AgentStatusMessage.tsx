/**
 * AgentStatusMessage — live agent activity card in chat panel.
 *
 * Shows: thinking excerpts, tool calls, file writes, errors,
 * auto-fix attempts with strategy, and completion summary.
 * One card per build; updates in place. No emoji.
 */

import { useEffect, useRef, useState } from 'react';
import type { AgentActivityEvent } from '~/lib/services/claude-agent/types';

interface Props {
  events: AgentActivityEvent[];
  isActive: boolean;
  onOpenTerminal?: () => void;
}

type Phase = 'thinking' | 'writing' | 'running' | 'validating' | 'fixing' | 'deploying' | 'done' | 'error';

interface AutoFixEntry { attempt: number; strategy: string; error: string; result?: { success: boolean; message: string } }

interface State {
  phase: Phase;
  currentFile?: string;
  currentLines?: number;
  thinkingExcerpt?: string;
  lastToolCall?: { name: string; input: Record<string, unknown> };
  errors: string[];
  filesWritten: number;
  toolCalls: number;
  autoFixes: AutoFixEntry[];
  doneEvent?: Extract<AgentActivityEvent, { type: 'done' }>;
}

function deriveState(events: AgentActivityEvent[]): State {
  const state: State = { phase: 'thinking', errors: [], filesWritten: 0, toolCalls: 0, autoFixes: [] };

  for (const e of events) {
    switch (e.type) {
      case 'thinking':
        state.phase = 'thinking';
        state.thinkingExcerpt = e.text.slice(0, 160).trimEnd() + (e.text.length > 160 ? '...' : '');
        break;
      case 'file_write':
        state.phase = 'writing';
        state.currentFile = e.path;
        state.currentLines = e.lines;
        state.filesWritten++;
        break;
      case 'file_read':
        if (state.phase !== 'writing') state.phase = 'thinking';
        break;
      case 'tool_call':
        state.toolCalls++;
        state.lastToolCall = { name: e.name, input: e.input };
        break;
      case 'auto_fix':
        state.phase = 'fixing';
        state.autoFixes.push({ attempt: e.attempt, strategy: e.strategy, error: e.error });
        break;
      case 'auto_fix_result': {
        const fix = state.autoFixes.find(f => f.attempt === e.attempt);
        if (fix) fix.result = { success: e.success, message: e.message };
        if (e.success) state.phase = 'validating';
        break;
      }
      case 'error':
        state.phase = 'error';
        state.errors.push(e.message.slice(0, 200));
        break;
      case 'done':
        state.phase = 'done';
        state.doneEvent = e as Extract<AgentActivityEvent, { type: 'done' }>;
        break;
    }
  }
  return state;
}

const PHASE_LABEL: Record<Phase, string> = {
  thinking: 'Analyzing', writing: 'Writing files', running: 'Running',
  validating: 'Validating', fixing: 'Auto-fixing', deploying: 'Deploying',
  done: 'Complete', error: 'Error',
};

const PHASE_COLOR: Record<Phase, string> = {
  thinking: 'var(--purple, #4D5DD9)', writing: '#22c55e', running: '#f59e0b',
  validating: '#06b6d4', fixing: '#f97316', deploying: '#8b5cf6',
  done: '#22c55e', error: '#ef4444',
};

const STRATEGY_LABEL: Record<string, string> = {
  analyzing: 'Analyzing error', 'deterministic': 'Deterministic fix',
  'ai-healing': 'AI healing (GLM)', 'rule-based': 'Rule-based fix',
};

function fmt(ms: number) {
  const s = ms / 1000;
  return s < 1 ? `${Math.round(ms)}ms` : s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
function cost(usd: number) { return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`; }

function toolCallSummary(tc: { name: string; input: Record<string, unknown> }): string {
  if (tc.name === 'write_file') return `write_file(${tc.input.path || '?'})`;
  if (tc.name === 'read_file') return `read_file(${tc.input.path || '?'})`;
  return tc.name;
}

export function AgentStatusMessage({ events, isActive, onOpenTerminal }: Props) {
  const state = deriveState(events);
  const hasErrors = state.errors.length > 0;
  const isDone = state.phase === 'done';
  const isFixing = state.autoFixes.length > 0;
  const borderColor = hasErrors ? '#ef4444' : isDone ? '#22c55e' : isFixing ? '#f97316' : 'rgba(255,255,255,0.08)';

  const [dot, setDot] = useState(0);
  const dotRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!isActive) { if (dotRef.current) clearInterval(dotRef.current); return; }
    dotRef.current = setInterval(() => setDot(d => (d + 1) % 3), 500);
    return () => { if (dotRef.current) clearInterval(dotRef.current); };
  }, [isActive]);
  const dots = '.'.repeat(dot + 1).padEnd(3, '\u00a0');

  return (
    <div style={{
      borderRadius: 8, border: `1px solid ${borderColor}`,
      background: hasErrors ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
      fontFamily: 'var(--font-mono, monospace)', fontSize: 11, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: PHASE_COLOR[state.phase],
          flexShrink: 0, boxShadow: isActive ? `0 0 6px ${PHASE_COLOR[state.phase]}` : 'none',
        }} />
        <span style={{ color: PHASE_COLOR[state.phase], fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
          {PHASE_LABEL[state.phase]}{isActive ? dots : ''}
        </span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
          {state.toolCalls > 0 && `${state.toolCalls} calls`}
          {state.filesWritten > 0 && ` · ${state.filesWritten} files`}
          {state.doneEvent && ` · ${fmt(state.doneEvent.duration_ms)} · ${cost(state.doneEvent.cost_usd)}`}
        </span>
        {hasErrors && (
          <span style={{
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600,
          }}>
            {state.errors.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Thinking */}
        {state.thinkingExcerpt && state.phase === 'thinking' && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {state.thinkingExcerpt}
          </div>
        )}

        {/* Last tool call */}
        {state.lastToolCall && state.phase !== 'done' && (
          <div style={{ display: 'flex', gap: 6, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{'>'}</span>
            <span style={{ color: '#93c5fd' }}>{toolCallSummary(state.lastToolCall)}</span>
          </div>
        )}

        {/* Current file */}
        {state.currentFile && state.phase === 'writing' && (
          <div style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Writing</span>
            <span style={{ color: '#a5f3fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.currentFile}
            </span>
            {state.currentLines != null && (
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{state.currentLines}L</span>
            )}
          </div>
        )}

        {/* Auto-fix attempts */}
        {state.autoFixes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
            {state.autoFixes.slice(-3).map((fix, i) => (
              <div key={i} style={{
                display: 'flex', gap: 6, alignItems: 'baseline',
                background: 'rgba(249,115,22,0.06)', borderRadius: 4, padding: '3px 8px',
              }}>
                <span style={{
                  color: fix.result?.success ? '#22c55e' : fix.result ? '#ef4444' : '#f97316',
                  fontWeight: 600, fontSize: 10, flexShrink: 0,
                }}>
                  {fix.result?.success ? 'FIXED' : fix.result ? 'FAILED' : `FIX ${fix.attempt}`}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                  {STRATEGY_LABEL[fix.strategy] || fix.strategy}
                </span>
                {fix.result && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 'auto' }}>
                    {fix.result.message.slice(0, 60)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {state.errors.slice(-2).map((err, i) => (
          <div key={i} style={{
            color: '#fca5a5', background: 'rgba(239,68,68,0.08)',
            borderRadius: 4, padding: '4px 8px', lineHeight: 1.5,
          }}>
            {err}
          </div>
        ))}

        {/* Done summary */}
        {isDone && state.doneEvent && (
          <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Generated {state.filesWritten} files in {fmt(state.doneEvent.duration_ms)}.
            {state.doneEvent.turns > 0 && ` ${state.doneEvent.turns} turns.`}
            {state.autoFixes.length > 0 && ` ${state.autoFixes.filter(f => f.result?.success).length}/${state.autoFixes.length} auto-fixes.`}
          </div>
        )}
      </div>

      {/* Footer */}
      {onOpenTerminal && (
        <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={onOpenTerminal} style={{
            background: 'none', border: 'none', padding: 0,
            color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 10,
            textDecoration: 'underline', textUnderlineOffset: 2,
          }}>
            View full activity in terminal
          </button>
        </div>
      )}
    </div>
  );
}
