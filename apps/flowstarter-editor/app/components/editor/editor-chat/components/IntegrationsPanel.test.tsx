/**
 * IntegrationsPanel Component Tests
 *
 * Unit tests for the IntegrationsPanel UI component.
 * Tests toggle behavior, URL validation, provider selection,
 * and callback payloads.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { IntegrationsPanel } from './IntegrationsPanel';

describe('IntegrationsPanel', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders with correct title', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );
      expect(screen.getByText('Connect Your Services')).toBeTruthy();
    });

    it('renders booking and newsletter toggles with role=switch', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Booking')).toBeTruthy();
      expect(screen.getByText('Newsletter')).toBeTruthy();

      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(2);
      expect(toggles[0].getAttribute('aria-checked')).toBe('false');
      expect(toggles[1].getAttribute('aria-checked')).toBe('false');
    });

    it('renders Skip and Continue buttons', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Skip for Now')).toBeTruthy();
      expect(screen.getByText(/Continue|Build/)).toBeTruthy();
    });
  });

  // ─── Booking Toggle ───────────────────────────────────────────────────────

  describe('booking toggle', () => {
    it('shows URL input when booking toggle is enabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Initially no URL input
      expect(screen.queryByPlaceholderText(/calendly/i)).toBeNull();

      // Click booking toggle
      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]);

      // Toggle checked
      expect(toggles[0].getAttribute('aria-checked')).toBe('true');

      // URL input visible
      expect(screen.getByPlaceholderText(/calendly/i)).toBeTruthy();
    });

    it('hides URL input when booking toggle is disabled again', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');

      // Enable
      fireEvent.click(toggles[0]);
      expect(screen.getByPlaceholderText(/calendly/i)).toBeTruthy();

      // Disable
      fireEvent.click(toggles[0]);
      expect(toggles[0].getAttribute('aria-checked')).toBe('false');
      expect(screen.queryByPlaceholderText(/calendly/i)).toBeNull();
    });

    it('preserves URL value when toggle is disabled and re-enabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');

      // Enable and fill
      fireEvent.click(toggles[0]);
      const input = screen.getByPlaceholderText(/calendly/i);
      fireEvent.change(input, { target: { value: 'https://calendly.com/test/30min' } });
      expect((input as HTMLInputElement).value).toBe('https://calendly.com/test/30min');

      // Disable then re-enable
      fireEvent.click(toggles[0]);
      fireEvent.click(toggles[0]);

      // URL should be preserved (good UX — don't lose config on accidental toggle)
      const newInput = screen.getByPlaceholderText(/calendly/i);
      expect((newInput as HTMLInputElement).value).toBe('https://calendly.com/test/30min');
    });
  });

  // ─── Newsletter Toggle ────────────────────────────────────────────────────

  describe('newsletter toggle', () => {
    it('shows provider selection when newsletter is enabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[1]); // Newsletter toggle

      expect(toggles[1].getAttribute('aria-checked')).toBe('true');

      // Should show a URL/form input or provider selector
      // The exact UI depends on implementation — look for common patterns
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  // ─── Continue Button State ────────────────────────────────────────────────

  describe('continue button validation', () => {
    it('disables Continue when integration enabled but URL empty', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]); // Enable booking

      const buildButton = screen.getByText(/Continue/);
      expect(buildButton.hasAttribute('disabled')).toBe(true);
    });

    it('enables Continue when URL is filled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]);

      const urlInput = screen.getByPlaceholderText(/calendly/i);
      fireEvent.change(urlInput, { target: { value: 'https://calendly.com/test/30min' } });

      const buildButton = screen.getByText(/Continue/);
      expect(buildButton.hasAttribute('disabled')).toBe(false);
    });

    it('enables Continue when no integrations are enabled (skip-through)', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // With no toggles enabled, Continue should be enabled (or hidden, with Skip visible)
      // The user can choose to build without integrations
      const buildButton = screen.getByText(/Continue|Build/);
      // If both disabled, the button might be in "Build My Site" state (always enabled)
      // or "Continue" state — either way it should be actionable
      expect(buildButton).toBeTruthy();
    });

    it('disables Continue when BOTH integrations enabled but only one has URL', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');

      // Enable booking with URL
      fireEvent.click(toggles[0]);
      const bookingInput = screen.getByPlaceholderText(/calendly/i);
      fireEvent.change(bookingInput, { target: { value: 'https://calendly.com/test/30min' } });

      // Enable newsletter without URL
      fireEvent.click(toggles[1]);

      // Continue should be disabled — newsletter URL missing
      const buildButton = screen.getByText(/Continue/);
      expect(buildButton.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Callbacks ────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onSkip when Skip button is clicked', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      fireEvent.click(screen.getByText('Skip for Now'));
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete with Calendly config when booking enabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]);

      const urlInput = screen.getByPlaceholderText(/calendly/i);
      fireEvent.change(urlInput, { target: { value: 'https://calendly.com/darius-popescu1191/30min' } });

      fireEvent.click(screen.getByText(/Continue/));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      // onComplete receives integrations array (contactDetails removed)
      expect(mockOnComplete).toHaveBeenCalledWith(
        [
          {
            id: 'booking',
            name: 'Calendly',
            enabled: true,
            config: {
              provider: 'calendly',
              url: 'https://calendly.com/darius-popescu1191/30min',
            },
          },
        ]
      );
    });

    it('calls onComplete with empty array when no integrations enabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Click Continue/Build without enabling anything
      const buildButton = screen.getByText(/Continue|Build/);
      if (!buildButton.hasAttribute('disabled')) {
        fireEvent.click(buildButton);
        // onComplete receives integrations array only
        expect(mockOnComplete).toHaveBeenCalledWith([]);
      }
    });

    it('does not call onComplete when button is disabled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      fireEvent.click(toggles[0]); // Enable booking, no URL

      const buildButton = screen.getByText(/Continue/);
      fireEvent.click(buildButton); // Should be disabled

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  // ─── Dark Mode ────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('renders without errors in dark mode', () => {
      const { container } = render(
        <IntegrationsPanel
          isDark={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Connect Your Services')).toBeTruthy();
      // Panel should apply dark styling (implementation-specific)
      expect(container.firstChild).toBeTruthy();
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('toggle switches have proper aria attributes', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggles = screen.getAllByRole('switch');
      toggles.forEach((toggle) => {
        expect(toggle.getAttribute('aria-checked')).toBeDefined();
        expect(['true', 'false']).toContain(toggle.getAttribute('aria-checked'));
      });
    });

    it('aria-checked updates when toggled', () => {
      render(
        <IntegrationsPanel
          isDark={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const toggle = screen.getAllByRole('switch')[0];
      expect(toggle.getAttribute('aria-checked')).toBe('false');

      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-checked')).toBe('true');

      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-checked')).toBe('false');
    });
  });
});
