/**
 * QuickProfileSelector Component Tests
 * 
 * Tests for the 3-question quick profile selector UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickProfileSelector } from './QuickProfileSelector';
import type { QuickProfile, BusinessGoal, OfferType, BrandTone } from '../types';

describe('QuickProfileSelector', () => {
  const mockOnComplete = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the component title', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByText('Quick Profile')).toBeTruthy();
    });

    it('renders all three question sections', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByText("What's your main goal?")).toBeTruthy();
      expect(screen.getByText("What's your price point?")).toBeTruthy();
      expect(screen.getByText("What's your brand vibe?")).toBeTruthy();
    });

    it('renders all goal options', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByText('Get Leads')).toBeTruthy();
      expect(screen.getByText('Make Sales')).toBeTruthy();
      expect(screen.getByText('Get Bookings')).toBeTruthy();
    });

    it('renders all offer type options', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByText('Premium')).toBeTruthy();
      expect(screen.getByText('Accessible')).toBeTruthy();
      expect(screen.getByText('Free First')).toBeTruthy();
    });

    it('renders all tone options', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByText('Professional')).toBeTruthy();
      expect(screen.getByText('Bold')).toBeTruthy();
      expect(screen.getByText('Friendly')).toBeTruthy();
    });

    it('renders progress indicators', () => {
      const { container } = render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      // Should have 3 progress dots (w-2.5 h-2.5 rounded-full)
      const progressDots = container.querySelectorAll('.rounded-full');
      expect(progressDots.length).toBeGreaterThanOrEqual(3);
    });

    it('renders continue button', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button).toBeTruthy();
    });
  });

  // ─── Initial State ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has no selections by default', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      // Continue button should be disabled initially
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('respects initialProfile for goal', () => {
      render(
        <QuickProfileSelector
          initialProfile={{ goal: 'leads' }}
          onComplete={mockOnComplete}
        />
      );
      
      // Button should still be disabled (missing offerType and tone)
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('respects initialProfile for all values', () => {
      render(
        <QuickProfileSelector
          initialProfile={{
            goal: 'leads',
            offerType: 'high-ticket',
            tone: 'professional',
          }}
          onComplete={mockOnComplete}
        />
      );
      
      // Button should be enabled
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });

  // ─── Selection Behavior ───────────────────────────────────────────────────

  describe('selection behavior', () => {
    it('updates goal when option clicked', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'leads' })
      );
    });

    it('updates offerType when option clicked', () => {
      render(
        <QuickProfileSelector
          initialProfile={{ goal: 'leads' }}
          onComplete={mockOnComplete}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Premium'));
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ offerType: 'high-ticket' })
      );
    });

    it('updates tone when option clicked', () => {
      render(
        <QuickProfileSelector
          initialProfile={{ goal: 'leads', offerType: 'high-ticket' }}
          onComplete={mockOnComplete}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Professional'));
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ tone: 'professional' })
      );
    });

    it('allows changing selection', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
          onChange={mockOnChange}
        />
      );
      
      // Select leads first
      fireEvent.click(screen.getByText('Get Leads'));
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ goal: 'leads' })
      );
      
      // Change to bookings
      fireEvent.click(screen.getByText('Get Bookings'));
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ goal: 'bookings' })
      );
    });
  });

  // ─── Button State ─────────────────────────────────────────────────────────

  describe('button state', () => {
    it('is disabled when no selection made', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('is disabled when only goal selected', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('is disabled when only goal and offerType selected', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      fireEvent.click(screen.getByText('Premium'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('is enabled when all three selected', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      fireEvent.click(screen.getByText('Premium'));
      fireEvent.click(screen.getByText('Professional'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });

  // ─── Complete Callback ────────────────────────────────────────────────────

  describe('onComplete callback', () => {
    it('calls onComplete with full profile when Continue clicked', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      fireEvent.click(screen.getByText('Premium'));
      fireEvent.click(screen.getByText('Professional'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(button);
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledWith({
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'professional',
      });
    });

    it('does not call onComplete when button disabled', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Leads'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(button);
      
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('calls onComplete with different profile combinations', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      fireEvent.click(screen.getByText('Get Bookings'));
      fireEvent.click(screen.getByText('Accessible'));
      fireEvent.click(screen.getByText('Friendly'));
      
      const button = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(button);
      
      expect(mockOnComplete).toHaveBeenCalledWith({
        goal: 'bookings',
        offerType: 'low-ticket',
        tone: 'friendly',
      });
    });
  });

  // ─── Dark Mode ────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('renders correctly in dark mode', () => {
      const { container } = render(
        <QuickProfileSelector
          isDark={true}
          onComplete={mockOnComplete}
        />
      );
      
      // Should have dark background class
      const panel = container.firstChild as HTMLElement;
      expect(panel.className).toContain('bg-gray-900');
    });

    it('renders correctly in light mode', () => {
      const { container } = render(
        <QuickProfileSelector
          isDark={false}
          onComplete={mockOnComplete}
        />
      );
      
      const panel = container.firstChild as HTMLElement;
      expect(panel.className).toContain('bg-gray-50');
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('options are keyboard accessible', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      const optionButtons = screen.getAllByRole('button');
      // All options should be buttons for keyboard accessibility
      expect(optionButtons.length).toBeGreaterThan(3); // 9 options + 1 continue = 10
    });

    it('continue button has appropriate disabled state', () => {
      render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      const button = screen.getByRole('button', { name: /Continue/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Progress Indicators ──────────────────────────────────────────────────

  describe('progress indicators', () => {
    it('shows progress as selections are made', () => {
      const { container } = render(
        <QuickProfileSelector
          onComplete={mockOnComplete}
        />
      );
      
      // Initially no progress dots should be indigo (selected)
      let indigoDots = container.querySelectorAll('.bg-indigo-500');
      expect(indigoDots.length).toBe(0);
      
      // After selecting goal, at least 1 indicator should be indigo
      fireEvent.click(screen.getByText('Get Leads'));
      indigoDots = container.querySelectorAll('.bg-indigo-500');
      expect(indigoDots.length).toBeGreaterThanOrEqual(1);
    });
  });
});
