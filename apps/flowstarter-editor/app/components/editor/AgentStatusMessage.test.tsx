import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentStatusMessage } from './AgentStatusMessage';
import type { AgentActivityEvent } from '~/lib/services/claude-agent/types';

describe('AgentStatusMessage', () => {
  it('shows thinking phase with excerpt', () => {
    const events: AgentActivityEvent[] = [
      { type: 'thinking', text: 'Planning the website structure for this dental clinic' },
    ];
    render(<AgentStatusMessage events={events} isActive={true} />);
    expect(screen.getByText(/ANALYZING/i)).toBeTruthy();
    expect(screen.getByText(/Planning the website/)).toBeTruthy();
  });

  it('shows writing phase with current file', () => {
    const events: AgentActivityEvent[] = [
      { type: 'file_write', path: 'src/pages/index.astro', lines: 45 },
    ];
    render(<AgentStatusMessage events={events} isActive={true} />);
    expect(screen.getByText(/WRITING FILES/i)).toBeTruthy();
    expect(screen.getByText('src/pages/index.astro')).toBeTruthy();
    expect(screen.getByText('45L')).toBeTruthy();
  });

  it('shows tool call details', () => {
    const events: AgentActivityEvent[] = [
      { type: 'tool_call', name: 'write_file', input: { path: 'tailwind.config.mjs' } },
    ];
    render(<AgentStatusMessage events={events} isActive={true} />);
    expect(screen.getByText(/write_file\(tailwind\.config\.mjs\)/)).toBeTruthy();
  });

  it('counts files and tool calls in header', () => {
    const events: AgentActivityEvent[] = [
      { type: 'tool_call', name: 'write_file', input: { path: 'a.astro' } },
      { type: 'file_write', path: 'a.astro', lines: 10 },
      { type: 'tool_call', name: 'write_file', input: { path: 'b.astro' } },
      { type: 'file_write', path: 'b.astro', lines: 20 },
      { type: 'tool_call', name: 'read_file', input: { path: 'c.astro' } },
    ];
    render(<AgentStatusMessage events={events} isActive={true} />);
    expect(screen.getByText(/3 calls/)).toBeTruthy();
    expect(screen.getByText(/2 files/)).toBeTruthy();
  });

  it('shows errors with red badge', () => {
    const events: AgentActivityEvent[] = [
      { type: 'error', message: 'Build failed: missing import' },
    ];
    render(<AgentStatusMessage events={events} isActive={false} />);
    expect(screen.getByText(/ERROR/i)).toBeTruthy();
    expect(screen.getByText(/Build failed: missing import/)).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // error count badge
  });

  it('shows auto-fix attempts with strategy', () => {
    const events: AgentActivityEvent[] = [
      { type: 'auto_fix', attempt: 1, max: 10, error: 'index.astro: missing tag', strategy: 'deterministic' },
      { type: 'auto_fix_result', attempt: 1, success: true, message: 'Deterministic fix: closed tag' },
    ];
    render(<AgentStatusMessage events={events} isActive={true} />);
    expect(screen.getByText(/VALIDATING/i)).toBeTruthy();
    expect(screen.getByText('FIXED')).toBeTruthy();
    expect(screen.getAllByText(/Deterministic fix/).length).toBeGreaterThan(0);
  });

  it('shows failed auto-fix', () => {
    const events: AgentActivityEvent[] = [
      { type: 'auto_fix', attempt: 1, max: 10, error: 'complex error', strategy: 'ai-healing' },
      { type: 'auto_fix_result', attempt: 1, success: false, message: 'AI healing failed' },
    ];
    render(<AgentStatusMessage events={events} isActive={false} />);
    expect(screen.getByText('FAILED')).toBeTruthy();
  });

  it('shows completion summary with cost', () => {
    const events: AgentActivityEvent[] = [
      { type: 'file_write', path: 'a.astro', lines: 10 },
      { type: 'file_write', path: 'b.astro', lines: 20 },
      { type: 'file_write', path: 'c.astro', lines: 30 },
      { type: 'done', duration_ms: 45000, turns: 8, cost_usd: 0.35, input_tokens: 50000, output_tokens: 20000 },
    ];
    render(<AgentStatusMessage events={events} isActive={false} />);
    expect(screen.getByText(/COMPLETE/i)).toBeTruthy();
    expect(screen.getAllByText(/45\.0s/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$0\.35/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Generated 3 files/)).toBeTruthy();
    expect(screen.getByText(/8 turns/)).toBeTruthy();
  });

  it('shows auto-fix count in completion summary', () => {
    const events: AgentActivityEvent[] = [
      { type: 'auto_fix', attempt: 1, max: 10, error: 'err', strategy: 'rule-based' },
      { type: 'auto_fix_result', attempt: 1, success: true, message: 'fixed' },
      { type: 'auto_fix', attempt: 2, max: 10, error: 'err2', strategy: 'ai-healing' },
      { type: 'auto_fix_result', attempt: 2, success: false, message: 'failed' },
      { type: 'done', duration_ms: 60000, turns: 5, cost_usd: 0.12, input_tokens: 30000, output_tokens: 10000 },
    ];
    render(<AgentStatusMessage events={events} isActive={false} />);
    expect(screen.getByText(/1\/2 auto-fixes/)).toBeTruthy();
  });

  it('shows terminal link', () => {
    const onOpenTerminal = vi.fn();
    render(<AgentStatusMessage events={[]} isActive={true} onOpenTerminal={onOpenTerminal} />);
    const link = screen.getByText(/View full activity in terminal/);
    expect(link).toBeTruthy();
  });
});
