/**
 * AgentActivityLog Component
 *
 * Streaming log of agent activity during build, like a Cursor/Claude Code session.
 * Replaces BuildTimeline.tsx with thinking, tool calls, and error/fix display.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Terminal, FilePlus, FileEdit, Trash2, AlertTriangle, Wrench,
  ChevronDown, Filter,
} from 'lucide-react';
import type { BuildPhase } from '../types';

// ─── Event types ──────────────────────────────────────────────────────

export type ActivityEventType = 'thinking' | 'tool_call' | 'error' | 'fix';

export interface ThinkingEvent {
  type: 'thinking';
  id: string;
  text: string;
  timestamp: number;
}

export interface ToolCallEvent {
  type: 'tool_call';
  id: string;
  action: 'create' | 'edit' | 'delete' | 'command';
  path: string;
  detail?: string;
  timestamp: number;
}

export interface ErrorEvent {
  type: 'error';
  id: string;
  message: string;
  timestamp: number;
}

export interface FixEvent {
  type: 'fix';
  id: string;
  reasoning: string;
  action: string;
  timestamp: number;
}

export type ActivityEvent = ThinkingEvent | ToolCallEvent | ErrorEvent | FixEvent;

// ─── Filter types ─────────────────────────────────────────────────────

type FilterType = 'all' | 'thinking' | 'actions' | 'errors';

// ─── Props ────────────────────────────────────────────────────────────

interface AgentActivityLogProps {
  events: ActivityEvent[];
  isDark: boolean;
  isActive: boolean;
  progress?: number; // 0-100
  buildPhase?: BuildPhase;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function matchesFilter(event: ActivityEvent, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'thinking') return event.type === 'thinking';
  if (filter === 'actions') return event.type === 'tool_call' || event.type === 'fix';
  if (filter === 'errors') return event.type === 'error' || event.type === 'fix';
  return true;
}

// ─── Component ────────────────────────────────────────────────────────

export function AgentActivityLog({
  events,
  isDark,
  isActive,
  progress = 0,
  buildPhase,
}: AgentActivityLogProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const toggleThinking = useCallback((id: string) => {
    setExpandedThinking(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredEvents = events.filter(e => matchesFilter(e, filter));

  const c = {
    text: isDark ? '#fafafa' : '#111827',
    textSec: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    textTer: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
    bg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    // Thinking
    thinkBg: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)',
    thinkBorder: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
    thinkText: isDark ? 'rgba(165,180,252,0.9)' : '#4338ca',
    // Tool call colors
    createColor: isDark ? '#4ade80' : '#16a34a',
    editColor: isDark ? '#60a5fa' : '#2563eb',
    deleteColor: isDark ? '#f87171' : '#dc2626',
    commandColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    // Error / Fix
    errorBg: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
    errorBorder: '#ef4444',
    fixBg: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)',
    fixBorder: '#f59e0b',
    // Filter
    filterBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    filterActive: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)',
    filterActiveText: isDark ? '#a5b4fc' : '#4338ca',
    // Progress
    progressBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    progressFill: isDark ? 'rgba(99,102,241,0.7)' : '#4D5DD9',
  };

  if (events.length === 0 && !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="agent-activity-log"
      style={{
        background: c.bg,
        borderRadius: '14px',
        border: `1px solid ${c.border}`,
        overflow: 'hidden',
        marginTop: '16px',
      }}
    >
      {/* Progress bar */}
      {isActive && (
        <div style={{ height: '3px', background: c.progressBg, width: '100%' }}>
          <motion.div
            style={{ height: '100%', background: c.progressFill, borderRadius: '0 2px 2px 0' }}
            animate={{ width: `${Math.max(progress, 2)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 14px', borderBottom: `1px solid ${c.border}`,
      }}>
        <Filter size={12} style={{ color: c.textTer }} />
        {(['all', 'thinking', 'actions', 'errors'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
              fontWeight: 500, textTransform: 'capitalize',
              background: filter === f ? c.filterActive : 'transparent',
              color: filter === f ? c.filterActiveText : c.textTer,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
        {isActive && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: c.progressFill, display: 'inline-block',
              }}
              className="animate-pulse"
            />
            <span style={{ fontSize: '11px', fontWeight: 500, color: c.filterActiveText }}>
              Building...
            </span>
          </div>
        )}
      </div>

      {/* Log entries */}
      <div
        ref={logRef}
        style={{
          maxHeight: '360px',
          overflowY: 'auto',
          padding: '8px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? '#3f3f46 transparent' : '#d4d4d8 transparent',
        }}
      >
        {filteredEvents.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: c.textTer, fontSize: '13px' }}>
            {isActive ? 'Waiting for agent activity...' : 'No events to display'}
          </div>
        )}

        <AnimatePresence initial={false}>
          {filteredEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ padding: '6px 14px' }}
            >
              {event.type === 'thinking' && (
                <ThinkingRow
                  event={event}
                  c={c}
                  expanded={expandedThinking.has(event.id)}
                  onToggle={() => toggleThinking(event.id)}
                />
              )}
              {event.type === 'tool_call' && <ToolCallRow event={event} c={c} />}
              {event.type === 'error' && <ErrorRow event={event} c={c} />}
              {event.type === 'fix' && <FixRow event={event} c={c} />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Row sub-components ───────────────────────────────────────────────

function ThinkingRow({
  event, c, expanded, onToggle,
}: { event: ThinkingEvent; c: Record<string, string>; expanded: boolean; onToggle: () => void }) {
  const lines = event.text.split('\n');
  const preview = lines.slice(0, 2).join(' ').slice(0, 120);
  const truncated = event.text.length > 120;

  return (
    <div
      style={{
        padding: '8px 10px', borderRadius: '8px',
        background: c.thinkBg, borderLeft: `3px solid ${c.thinkBorder}`,
        cursor: truncated ? 'pointer' : 'default',
      }}
      onClick={truncated ? onToggle : undefined}
      role={truncated ? 'button' : undefined}
      tabIndex={truncated ? 0 : undefined}
      aria-expanded={truncated ? expanded : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Brain size={14} style={{ color: c.thinkText, flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '12px', fontStyle: 'italic', color: c.thinkText,
            margin: 0, lineHeight: 1.5, whiteSpace: expanded ? 'pre-wrap' : 'normal',
          }}>
            {expanded ? event.text : preview}
            {truncated && !expanded && '...'}
          </p>
          {truncated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <ChevronDown
                size={12}
                style={{
                  color: c.thinkText,
                  transform: expanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
              <span style={{ fontSize: '10px', color: c.thinkText }}>
                {expanded ? 'show less' : 'show more'}
              </span>
            </div>
          )}
        </div>
        <span style={{ fontSize: '10px', color: c.textTer, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {relativeTime(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ToolCallRow({ event, c }: { event: ToolCallEvent; c: Record<string, string> }) {
  const actionConfig = {
    create: { icon: <FilePlus size={14} />, color: c.createColor, label: 'Creating' },
    edit: { icon: <FileEdit size={14} />, color: c.editColor, label: 'Editing' },
    delete: { icon: <Trash2 size={14} />, color: c.deleteColor, label: 'Deleting' },
    command: { icon: <Terminal size={14} />, color: c.commandColor, label: 'Running' },
  };
  const cfg = actionConfig[event.action];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ fontSize: '12px', color: cfg.color, fontWeight: 500, flexShrink: 0 }}>
        {cfg.label}
      </span>
      <span style={{
        fontSize: '12px', fontFamily: 'monospace', color: c.textSec,
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {event.path}
      </span>
      <span style={{ fontSize: '10px', color: c.textTer, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {relativeTime(event.timestamp)}
      </span>
    </div>
  );
}

function ErrorRow({ event, c }: { event: ErrorEvent; c: Record<string, string> }) {
  return (
    <div
      style={{
        padding: '8px 10px', borderRadius: '8px',
        background: c.errorBg, borderLeft: `3px solid ${c.errorBorder}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <AlertTriangle size={14} style={{ color: c.errorBorder, flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '12px', color: c.errorBorder, margin: 0, flex: 1, lineHeight: 1.5 }}>
          {event.message}
        </p>
        <span style={{ fontSize: '10px', color: c.textTer, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {relativeTime(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

function FixRow({ event, c }: { event: FixEvent; c: Record<string, string> }) {
  return (
    <div
      style={{
        padding: '8px 10px', borderRadius: '8px',
        background: c.fixBg, borderLeft: `3px solid ${c.fixBorder}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Wrench size={14} style={{ color: c.fixBorder, flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '11px', fontStyle: 'italic', color: c.textSec, margin: '0 0 4px' }}>
            {event.reasoning}
          </p>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: c.fixBorder, margin: 0 }}>
            {event.action}
          </p>
        </div>
        <span style={{ fontSize: '10px', color: c.textTer, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {relativeTime(event.timestamp)}
        </span>
      </div>
    </div>
  );
}
