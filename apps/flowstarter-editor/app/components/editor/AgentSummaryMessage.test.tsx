import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentSummaryMessage } from './AgentSummaryMessage';
import type { AgentActivityEvent } from './AgentActivityPanel';

const doneEvent: AgentActivityEvent = {
  type: 'done', duration_ms: 10000, turns: 3, cost_usd: 0.2,
  input_tokens: 2000, output_tokens: 800,
};

const errorEvent: AgentActivityEvent = { type: 'error', message: 'Build failed: missing module' };

describe('AgentSummaryMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no errors and no done event', () => {
    const { container } = render(
      <AgentSummaryMessage events={[{ type: 'file_write', path: 'index.html' }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('error state', () => {
    it('shows error card when error events present', () => {
      render(<AgentSummaryMessage events={[errorEvent, doneEvent]} />);
      expect(screen.getByText(/1 error/i)).toBeTruthy();
      expect(screen.getByText('Build failed: missing module')).toBeTruthy();
    });

    it('shows top 3 errors only', () => {
      const errors: AgentActivityEvent[] = Array.from({ length: 5 }, (_, i) => ({
        type: 'error' as const, message: `Error ${i + 1}`,
      }));
      render(<AgentSummaryMessage events={[...errors, doneEvent]} />);
      expect(screen.getByText('+2 more')).toBeTruthy();
      expect(screen.getByText('Error 1')).toBeTruthy();
      expect(screen.queryByText('Error 5')).toBeNull();
    });

    it('shows plural "errors" for multiple', () => {
      render(<AgentSummaryMessage events={[errorEvent, { type: 'error', message: 'Another error' }, doneEvent]} />);
      expect(screen.getByText(/2 errors/i)).toBeTruthy();
    });
  });

  describe('success state', () => {
    it('shows success card when done event and no errors', () => {
      render(<AgentSummaryMessage events={[
        { type: 'file_write', path: 'a.html' },
        { type: 'file_write', path: 'b.css' },
        doneEvent,
      ]} />);
      expect(screen.getByText(/generation complete/i)).toBeTruthy();
      expect(screen.getByText(/2 files/)).toBeTruthy();
    });

    it('shows cost and duration in header', () => {
      render(<AgentSummaryMessage events={[doneEvent]} />);
      expect(screen.getByText(/\$0\.20/)).toBeTruthy();
    });
  });

  describe('terminal link', () => {
    it('calls onOpenTerminal when button clicked', () => {
      const mockOpen = vi.fn();
      render(<AgentSummaryMessage events={[doneEvent]} onOpenTerminal={mockOpen} />);
      fireEvent.click(screen.getByText('View full output in Terminal →'));
      expect(mockOpen).toHaveBeenCalledOnce();
    });

    it('does not render link when onOpenTerminal not provided', () => {
      render(<AgentSummaryMessage events={[doneEvent]} />);
      expect(screen.queryByText('View full output in Terminal →')).toBeNull();
    });
  });
});
