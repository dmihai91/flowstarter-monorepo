import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalPanel } from './TerminalPanel';
import type { AgentActivityEvent } from './AgentActivityPanel';

const allEvents: AgentActivityEvent[] = [
  { type: 'thinking', text: 'Planning the layout...' },
  { type: 'file_write', path: 'src/index.html', lines: 100 },
  { type: 'file_read', path: 'package.json' },
  { type: 'file_delete', path: 'old.css' },
  { type: 'command', cmd: 'npm install' },
  { type: 'command_output', text: 'installed 42 packages', success: true },
  { type: 'sandbox_status', message: 'Uploading files...' },
  { type: 'sandbox_output', line: 'build started', stream: 'stdout' },
  { type: 'sandbox_exit', code: 0, cmd: 'npm run build' },
  { type: 'error', message: 'Build failed: missing module' },
  { type: 'done', duration_ms: 15000, turns: 4, cost_usd: 0.31, input_tokens: 4000, output_tokens: 1200 },
];

describe('TerminalPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Waiting for agent…" when no events and filter is all', () => {
    render(<TerminalPanel events={[]} />);
    expect(screen.getByText('Waiting for agent…')).toBeTruthy();
  });

  describe('filter: All', () => {
    it('renders all non-done events', () => {
      render(<TerminalPanel events={allEvents} />);
      expect(screen.getByText('write')).toBeTruthy();
      expect(screen.getByText('read')).toBeTruthy();
      expect(screen.getByText('exec')).toBeTruthy();
      expect(screen.getByText('sandbox')).toBeTruthy();
      expect(screen.getByText('error')).toBeTruthy();
    });
  });

  describe('filter: Errors', () => {
    it('shows only error events', () => {
      render(<TerminalPanel events={allEvents} />);
      fireEvent.click(screen.getByText('Errors'));
      expect(screen.getByText('Build failed: missing module')).toBeTruthy();
      expect(screen.queryByText('write')).toBeNull();
    });

    it('shows error badge count', () => {
      render(<TerminalPanel events={allEvents} />);
      // Error badge appears on the Errors filter button
      const badge = screen.getByText('1'); // 1 error event
      expect(badge).toBeTruthy();
    });
  });

  describe('filter: Files', () => {
    it('shows only file events', () => {
      render(<TerminalPanel events={allEvents} />);
      fireEvent.click(screen.getByText('Files'));
      expect(screen.getByText('src/index.html')).toBeTruthy();
      expect(screen.getByText('package.json')).toBeTruthy();
      expect(screen.queryByText('sandbox')).toBeNull();
    });
  });

  describe('filter: Sandbox', () => {
    it('shows only sandbox events', () => {
      render(<TerminalPanel events={allEvents} />);
      fireEvent.click(screen.getByText('Sandbox'));
      expect(screen.getByText('Uploading files...')).toBeTruthy();
      expect(screen.queryByText('write')).toBeNull();
    });
  });

  describe('stats footer', () => {
    it('shows stats when done event present', () => {
      render(<TerminalPanel events={allEvents} />);
      expect(screen.getByText(/15\.0s/)).toBeTruthy();
      expect(screen.getByText(/\$0\.31/)).toBeTruthy();
    });

    it('does not show stats footer without done event', () => {
      render(<TerminalPanel events={allEvents.filter(e => e.type !== 'done')} />);
      expect(screen.queryByText(/15\.0s/)).toBeNull();
    });
  });

  describe('active indicator', () => {
    it('shows "running" when isActive', () => {
      render(<TerminalPanel events={[]} isActive={true} />);
      expect(screen.getByText('running')).toBeTruthy();
    });

    it('shows "done" when not active and done event present', () => {
      render(<TerminalPanel events={[{ type: 'done', duration_ms: 1000, turns: 1, cost_usd: 0.1, input_tokens: 100, output_tokens: 50 }]} isActive={false} />);
      expect(screen.getByText('done')).toBeTruthy();
    });
  });

  describe('sandbox_exit rendering', () => {
    it('shows "exited ok" for code 0', () => {
      render(<TerminalPanel events={[{ type: 'sandbox_exit', code: 0, cmd: 'npm build' }]} />);
      expect(screen.getByText('→ exited ok')).toBeTruthy();
    });

    it('shows exit code for non-zero', () => {
      render(<TerminalPanel events={[{ type: 'sandbox_exit', code: 1, cmd: 'npm build' }]} />);
      expect(screen.getByText('→ exited with code 1')).toBeTruthy();
    });
  });
});
