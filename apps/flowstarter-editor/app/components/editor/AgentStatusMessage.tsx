/**
 * AgentStatusMessage — live agent activity feed in the chat panel.
 *
 * Shows a single updating card while the agent is running:
 *   • Current phase (thinking / writing / running / fixing)
 *   • Last file being written (with line count)
 *   • Latest thinking excerpt (truncated)
 *   • Error count (red badge)
 *   • On completion: summary (files written, duration, cost)
 *
 * Rules:
 *   - One card per build; updates in place (no spam)
 *   - No emoji — professional IDE aesthetic
 *   - Errors shown inline; "View in terminal" link for full detail
 */

import { useEffect, useRef, useState } from 'react';
import type { AgentActivityEvent } from './AgentActivityPanel';

interface AgentStatusMessageProps {
  /** Live stream of agent events from SSE */
  events: AgentActivityEvent[];
  /** Whether the agent is still running */
  isActive: boolean;
  /** Open the terminal panel */
  onOpenTerminal?: () => void;
}

type Phase = 'thinking' | 'writing' | 'running' | 'validating' | 'fixing' | 'deploying' | 'done' | 'error';

interface State {
  phase: Phase;
  currentFile?: string;
  currentLines?: number;
  thinkingExcerpt?: string;
  lastCommand?: string;
  errors: string[];
  filesWritten: number;
  toolCalls: number;
  doneEvent?: Extract<AgentActivityEvent, { type: 'done' }>;
}

function deriveState(events: AgentActivityEvent[]): State {
  const state: State = {
    phase: 'thinking',
    errors: [],
    filesWritten: 0,
    toolCalls: 0,
  };

  for (const e of events) {
    switch (e.type) {
      case 'thinking':
        state.phase = 'thinking';
        state.thinkingExcerpt = e.text.slice(0, 120).trimEnd() + (e.text.length > 120 ? '...' : '');
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
      case 'command':
        state.phase = 'running';
        state.lastCommand = e.cmd?.slice(0, 80);
        break;
      case 'command_output':
        if (!e.success && e.text) state.errors.push(e.text.slice(0, 120));
        break;
      case 'tool_call':
        state.toolCalls++;
        if (e.name === 'spawn_coder_agent') state.phase = 'writing';
        else if (e.name === 'validate_file') state.phase = 'validating';
        else if (e.name === 'scaffold_template') state.phase = 'thinking';
        break;
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
  thinking:   'Analyzing',
  writing:    'Writing files',
  running:    'Running command',
  validating: 'Validating',
  fixing:     'Fixing errors',
  deploying:  'Deploying',
  done:       'Complete',
  error:      'Error',
};

const PHASE_COLOR: Record<Phase, string> = {
  thinking:   'var(--purple, #4D5DD9)',
  writing:    '#22c55e',
  running:    '#f59e0b',
  validating: '#06b6d4',
  fixing:     '#f97316',
  deploying:  '#8b5cf6',
  done:       '#22c55e',
  error:      '#ef4444',
};

function fmt(ms: number) {
  const s = ms / 1000;
  return s < 1 ? `${Math.round(ms)}ms` : s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
function cost(usd: number) {
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`;
}

export function AgentStatusMessage({ events, isActive, onOpenTerminal }: AgentStatusMessageProps) {
  const state = deriveState(events);
  const hasErrors = state.errors.length > 0;
  const isDone = state.phase === 'done';
  const borderColor = hasErrors ? '#ef4444' : isDone ? '#22c55e' : 'rgba(255,255,255,0.08)';

  // Animated dot for active state
  const [dot, setDot] = useState<number>(0);
  const dotRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => {
    if (!isActive) { if (dotRef.current) clearInterval(dotRef.current); return; }
    dotRef.current = setInterval(() => setDot(d => (d + 1) % 3), 500);
    return () => { if (dotRef.current) clearInterval(dotRef.current); };
  }, [isActive]);
  const dots = '.'.repeat(dot + 1).padEnd(3, '\u00a0');

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
      background: hasErrors ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: 11,
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {/* Phase indicator dot */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: PHASE_COLOR[state.phase],
          flexShrink: 0,
          boxShadow: isActive ? `0 0 6px ${PHASE_COLOR[state.phase]}` : 'none',
        }} />
        <span style={{ color: PHASE_COLOR[state.phase], fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
          {PHASE_LABEL[state.phase]}{isActive ? dots : ''}
        </span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
          {state.filesWritten > 0 && `${state.filesWritten} file${state.filesWritten !== 1 ? 's' : ''}`}
          {state.doneEvent && ` · ${fmt(state.doneEvent.duration_ms)} · ${cost(state.doneEvent.cost_usd)}`}
        </span>
        {hasErrors && (
          <span style={{
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600,
          }}>
            {state.errors.length} error{state.errors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Current file */}
        {state.currentFile && (
          <div style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Writing</span>
            <span style={{ color: '#a5f3fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.currentFile}
            </span>
            {state.currentLines != null && (
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{state.currentLines}L</span>
            )}
          </div>
        )}

        {/* Thinking excerpt */}
        {state.thinkingExcerpt && state.phase === 'thinking' && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {state.thinkingExcerpt}
          </div>
        )}

        {/* Last command */}
        {state.lastCommand && state.phase === 'running' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>$</span>
            <span style={{ color: '#fde68a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.lastCommand}
            </span>
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
            {state.doneEvent.turns > 0 && ` ${state.doneEvent.turns} agent turns.`}
          </div>
        )}
      </div>

      {/* Footer link */}
      {onOpenTerminal && (
        <div style={{
          padding: '4px 12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button
            onClick={onOpenTerminal}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 10,
              textDecoration: 'underline', textUnderlineOffset: 2,
            }}
          >
            View full activity in terminal
          </button>
        </div>
      )}
    </div>
  );
}
