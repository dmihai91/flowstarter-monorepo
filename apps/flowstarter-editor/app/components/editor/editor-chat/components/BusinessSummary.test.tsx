/**
 * BusinessSummary Component Tests
 *
 * Tests rendering of collected business information
 * and confirm/edit callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BusinessSummary } from './BusinessSummary';
import type { BusinessInfo } from '../types';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const FULL_BUSINESS_INFO: Partial<BusinessInfo> = {
  uvp: 'Personalized 15-minute workouts for busy professionals',
  targetAudience: 'Executives aged 30-50',
  businessGoals: ['Generate leads', 'Book consultations', 'Build brand awareness'],
  brandTone: 'Professional yet motivating',
  sellingMethod: 'bookings',
  sellingMethodDetails: 'Online booking for training sessions',
  pricingOffers: 'Monthly packages from $99',
};

const MINIMAL_BUSINESS_INFO: Partial<BusinessInfo> = {
  uvp: 'Fast pizza delivery',
  targetAudience: 'College students',
  businessGoals: ['Get orders'],
  brandTone: 'Fun and casual',
};

const EMPTY_BUSINESS_INFO: Partial<BusinessInfo> = {};

describe('BusinessSummary', () => {
  const mockOnConfirm = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the summary title', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('📋 Your Business Summary')).toBeTruthy();
    });

    it('renders all section labels', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('UNIQUE VALUE')).toBeTruthy();
      expect(screen.getByText('TARGET AUDIENCE')).toBeTruthy();
      expect(screen.getByText('GOALS')).toBeTruthy();
      expect(screen.getByText('BRAND TONE')).toBeTruthy();
      expect(screen.getByText('SELLING METHOD')).toBeTruthy();
      expect(screen.getByText('PRICING/OFFERS')).toBeTruthy();
    });

    it('renders business info values', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Personalized 15-minute workouts for busy professionals')).toBeTruthy();
      expect(screen.getByText('Executives aged 30-50')).toBeTruthy();
      expect(screen.getByText('Professional yet motivating')).toBeTruthy();
      expect(screen.getByText('Monthly packages from $99')).toBeTruthy();
    });

    it('renders goals as a list', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Generate leads')).toBeTruthy();
      expect(screen.getByText('Book consultations')).toBeTruthy();
      expect(screen.getByText('Build brand awareness')).toBeTruthy();
    });

    it('renders both buttons', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('✓ Looks Good!')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
    });
  });

  // ─── Selling Method Display ───────────────────────────────────────────────

  describe('selling method display', () => {
    it('prefers sellingMethodDetails over sellingMethod category', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Online booking for training sessions')).toBeTruthy();
    });

    it('capitalizes sellingMethod category when no details', () => {
      render(
        <BusinessSummary
          businessInfo={{ ...FULL_BUSINESS_INFO, sellingMethodDetails: undefined }}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Bookings')).toBeTruthy();
    });

    it('shows "Not specified" when neither method nor details set', () => {
      render(
        <BusinessSummary
          businessInfo={MINIMAL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Not specified')).toBeTruthy();
    });
  });

  // ─── Empty/Missing Fields ─────────────────────────────────────────────────

  describe('empty/missing fields', () => {
    it('shows "Not specified" for missing uvp', () => {
      render(
        <BusinessSummary
          businessInfo={EMPTY_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      // Multiple "Not specified" fields
      const notSpecified = screen.getAllByText('Not specified');
      expect(notSpecified.length).toBeGreaterThan(0);
    });

    it('shows "Not specified" for missing goals', () => {
      render(
        <BusinessSummary
          businessInfo={{ ...EMPTY_BUSINESS_INFO, businessGoals: [] }}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      // Goals section shows "Not specified" when empty
      const notSpecified = screen.getAllByText('Not specified');
      expect(notSpecified.length).toBeGreaterThan(0);
    });

    it('does not render PRICING/OFFERS section when pricing is undefined', () => {
      render(
        <BusinessSummary
          businessInfo={MINIMAL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.queryByText('PRICING/OFFERS')).toBeNull();
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles very long UVP text', () => {
      const longUvp = 'A'.repeat(500);
      render(
        <BusinessSummary
          businessInfo={{ ...FULL_BUSINESS_INFO, uvp: longUvp }}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText(longUvp)).toBeTruthy();
    });

    it('handles many goals', () => {
      const manyGoals = Array.from({ length: 10 }, (_, i) => `Goal ${i + 1}`);
      render(
        <BusinessSummary
          businessInfo={{ ...FULL_BUSINESS_INFO, businessGoals: manyGoals }}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      expect(screen.getByText('Goal 1')).toBeTruthy();
      expect(screen.getByText('Goal 10')).toBeTruthy();
    });

    it('handles special characters in text', () => {
      render(
        <BusinessSummary
          businessInfo={{ ...FULL_BUSINESS_INFO, uvp: '<script>alert("xss")</script>' }}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      // React auto-escapes — should render as text, not execute
      expect(screen.getByText('<script>alert("xss")</script>')).toBeTruthy();
    });
  });

  // ─── Callbacks ────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onConfirm when "Looks Good" button is clicked', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      fireEvent.click(screen.getByText('✓ Looks Good!'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when "Edit" button is clicked', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      fireEvent.click(screen.getByText('Edit'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('does not call onEdit when onConfirm is clicked', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      fireEvent.click(screen.getByText('✓ Looks Good!'));
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('does not call onConfirm when onEdit is clicked', () => {
      render(
        <BusinessSummary
          businessInfo={FULL_BUSINESS_INFO}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />,
      );
      fireEvent.click(screen.getByText('Edit'));
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });
});
