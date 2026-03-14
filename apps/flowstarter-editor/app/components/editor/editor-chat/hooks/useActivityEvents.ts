/**
 * useActivityEvents — Adapter hook
 *
 * Converts AgentActivityEvent[] (from the agent SDK / AgentActivityPanel)
 * into ActivityEvent[] (consumed by AgentActivityLog).
 */

import { useMemo } from 'react';
import type { AgentActivityEvent } from '~/lib/services/claude-agent/types';
import type { ActivityEvent } from '../components/AgentActivityLog';

let _counter = 0;
function uid(): string {
  return `ae-${Date.now()}-${++_counter}`;
}

function mapEvent(e: AgentActivityEvent): ActivityEvent | null {
  const ts = Date.now();

  switch (e.type) {
    case 'thinking':
      return { type: 'thinking', id: uid(), text: e.text, timestamp: ts };

    case 'tool_call':
      return {
        type: 'tool_call',
        id: uid(),
        action: 'command',
        path: e.name,
        detail: JSON.stringify(e.input).slice(0, 120),
        timestamp: ts,
      };

    case 'file_write':
      return {
        type: 'tool_call',
        id: uid(),
        action: e.path.endsWith('/') ? 'create' : 'edit',
        path: e.path,
        detail: e.lines != null ? `${e.lines} lines` : undefined,
        timestamp: ts,
      };

    case 'file_read':
      return {
        type: 'tool_call',
        id: uid(),
        action: 'command',
        path: e.path,
        detail: 'read',
        timestamp: ts,
      };

    case 'file_delete':
      return {
        type: 'tool_call',
        id: uid(),
        action: 'delete',
        path: e.path,
        timestamp: ts,
      };

    case 'command':
      return {
        type: 'tool_call',
        id: uid(),
        action: 'command',
        path: e.cmd,
        timestamp: ts,
      };

    case 'error':
      return { type: 'error', id: uid(), message: e.message, timestamp: ts };

    case 'auto_fix':
      return {
        type: 'fix',
        id: uid(),
        reasoning: e.error,
        action: `Auto-fix attempt ${e.attempt}/${e.max}: ${e.strategy}`,
        timestamp: ts,
      };

    // Types we intentionally skip (no meaningful mapping):
    // tool_result, command_output, text, auto_fix_result, sandbox_status, done
    default:
      return null;
  }
}

/**
 * Converts an array of AgentActivityEvent into ActivityEvent[]
 * suitable for the AgentActivityLog component.
 */
export function useActivityEvents(agentEvents: AgentActivityEvent[]): ActivityEvent[] {
  return useMemo(
    () => agentEvents.map(mapEvent).filter((e): e is ActivityEvent => e !== null),
    [agentEvents],
  );
}
