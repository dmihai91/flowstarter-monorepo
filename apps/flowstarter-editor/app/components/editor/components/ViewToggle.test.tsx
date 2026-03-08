import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle, type ViewMode } from './ViewToggle';

// Mock i18n
vi.mock('~/lib/i18n/editor-labels', () => ({
  EDITOR_LABEL_KEYS: { VIEW_PREVIEW: 'VIEW_PREVIEW', VIEW_EDITOR: 'VIEW_EDITOR' },
  t: (key: string) => key === 'VIEW_PREVIEW' ? 'Preview' : 'Code',
}));

// Mock theme hooks
vi.mock('~/components/editor/hooks', () => ({
  useThemeStyles: () => ({ isDark: true }),
  getColors: () => ({
    surfaceSelected: '#2a2a2f',
    surfaceMedium: '#18181b',
    borderLight: '1px solid rgba(255,255,255,0.08)',
    textPrimary: '#fafafa',
    textSubtle: '#71717a',
  }),
}));

describe('ViewToggle', () => {
  const mockChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders Preview, Code, and Terminal tabs on desktop', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} isMobile={false} />);
    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getByText('Code')).toBeTruthy();
    expect(screen.getByText('Terminal')).toBeTruthy();
  });

  it('does not render Chat tab on desktop', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} isMobile={false} />);
    expect(screen.queryByText('Chat')).toBeNull();
  });

  it('renders Chat tab on mobile', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} isMobile={true} />);
    expect(screen.getByText('Chat')).toBeTruthy();
  });

  it('does not render Code tab on mobile', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} isMobile={true} />);
    expect(screen.queryByText('Code')).toBeNull();
  });

  it('calls onViewModeChange with "preview" on Preview click', () => {
    render(<ViewToggle viewMode="terminal" onViewModeChange={mockChange} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(mockChange).toHaveBeenCalledWith('preview');
  });

  it('calls onViewModeChange with "terminal" on Terminal click', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} />);
    fireEvent.click(screen.getByText('Terminal'));
    expect(mockChange).toHaveBeenCalledWith('terminal');
  });

  it('calls onViewModeChange with "editor" on Code click', () => {
    render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} isMobile={false} />);
    fireEvent.click(screen.getByText('Code'));
    expect(mockChange).toHaveBeenCalledWith('editor');
  });

  describe('terminal error badge', () => {
    it('shows error badge when terminalErrorCount > 0', () => {
      render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} terminalErrorCount={3} />);
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('does not show badge when terminalErrorCount is 0', () => {
      render(<ViewToggle viewMode="preview" onViewModeChange={mockChange} terminalErrorCount={0} />);
      // No standalone number badge
      expect(screen.queryByText('0')).toBeNull();
    });
  });

  describe('activity pulse', () => {
    it('shows pulse dot when hasTerminalActivity and not on terminal tab', () => {
      const { container } = render(
        <ViewToggle viewMode="preview" onViewModeChange={mockChange}
          hasTerminalActivity={true} terminalErrorCount={0} />
      );
      // Pulse dot is a span with inline style animation
      const pulse = container.querySelector('span[style*="animation"]');
      expect(pulse).toBeTruthy();
    });

    it('does not show pulse when already on terminal tab', () => {
      const { container } = render(
        <ViewToggle viewMode="terminal" onViewModeChange={mockChange}
          hasTerminalActivity={true} terminalErrorCount={0} />
      );
      const pulse = container.querySelector('span[style*="animation"]');
      expect(pulse).toBeNull();
    });
  });
});
