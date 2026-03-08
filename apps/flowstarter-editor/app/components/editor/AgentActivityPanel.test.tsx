import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentActivityPanel, type AgentActivityEvent } from './AgentActivityPanel';

// Panel starts EXPANDED (collapsed=false by default)

const fileWriteEvent: AgentActivityEvent = { type: 'file_write', path: 'src/index.html', lines: 142 };
const doneEvent: AgentActivityEvent = {
  type: 'done', duration_ms: 12400, turns: 3,
  cost_usd: 0.23, input_tokens: 3200, output_tokens: 1000,
};

describe('AgentActivityPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('expanded state (default)', () => {
    it('shows "collapse" label by default', () => {
      render(<AgentActivityPanel events={[]} />);
      expect(screen.getByText('collapse')).toBeTruthy();
    });

    it('shows "Waiting for agent…" when no events', () => {
      render(<AgentActivityPanel events={[]} />);
      expect(screen.getByText('Waiting for agent…')).toBeTruthy();
    });

    it('renders file_write with verb "write"', () => {
      render(<AgentActivityPanel events={[fileWriteEvent]} />);
      expect(screen.getByText('write')).toBeTruthy();
      expect(screen.getByText('src/index.html')).toBeTruthy();
    });

    it('renders file_read with verb "read"', () => {
      render(<AgentActivityPanel events={[{ type: 'file_read', path: 'package.json' }]} />);
      expect(screen.getByText('read')).toBeTruthy();
    });

    it('renders command with verb "exec"', () => {
      render(<AgentActivityPanel events={[{ type: 'command', cmd: 'npm install' }]} />);
      expect(screen.getByText('exec')).toBeTruthy();
      expect(screen.getByText('npm install')).toBeTruthy();
    });

    it('renders error event with verb "error" label', () => {
      render(<AgentActivityPanel events={[{ type: 'error', message: 'Build failed' }]} />);
      // Multiple 'error' texts exist (verb label + header indicator)
      const errors = screen.getAllByText('error');
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Build failed')).toBeTruthy();
    });

    it('truncates thinking text to 120 chars', () => {
      const longThought = 'a'.repeat(200);
      render(<AgentActivityPanel events={[{ type: 'thinking', text: longThought }]} />);
      expect(screen.getByText('…show more')).toBeTruthy();
    });

    it('expands thinking text on click', () => {
      const longThought = 'a'.repeat(200);
      render(<AgentActivityPanel events={[{ type: 'thinking', text: longThought }]} />);
      fireEvent.click(screen.getByText('…show more').closest('button')!);
      expect(screen.getByText('show less')).toBeTruthy();
    });
  });

  describe('collapsed state', () => {
    it('shows "expand" after collapsing', () => {
      render(<AgentActivityPanel events={[]} />);
      fireEvent.click(screen.getByText('collapse').closest('button')!);
      expect(screen.getByText('expand')).toBeTruthy();
    });

    it('shows stats summary when done event present', () => {
      render(<AgentActivityPanel events={[fileWriteEvent, doneEvent]} />);
      fireEvent.click(screen.getByText('collapse').closest('button')!);
      expect(screen.getByText(/12\.4s/)).toBeTruthy();
    });
  });

  describe('stats footer', () => {
    it('shows stats when done event present', () => {
      render(<AgentActivityPanel events={[fileWriteEvent, doneEvent]} />);
      expect(screen.getByText(/12\.4s/)).toBeTruthy();
      expect(screen.getByText(/\$0\.23/)).toBeTruthy();
    });

    it('shows file count when active and no done event', () => {
      render(<AgentActivityPanel events={[fileWriteEvent]} isActive={true} />);
      expect(screen.getByText(/1 file written/)).toBeTruthy();
    });
  });

  describe('active indicator', () => {
    it('shows running indicator when isActive', () => {
      render(<AgentActivityPanel events={[]} isActive={true} />);
      expect(screen.getByText('running')).toBeTruthy();
    });

    it('does not show running when not active', () => {
      render(<AgentActivityPanel events={[]} isActive={false} />);
      expect(screen.queryByText('running')).toBeNull();
    });
  });
});
