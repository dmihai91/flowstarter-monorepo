import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewStep } from '../ReviewStep';

describe('ReviewStep', () => {
  const mockProjectConfig = {
    name: 'Test Project',
    description: 'Test Description',
    targetUsers: 'Test Users',
    businessGoals: 'Test Goals',
    USP: 'Test USP',
    brandTone: 'Professional',
    keyServices: 'Service 1',
    template: {
      id: 'template-1',
      name: 'Test Template',
      description: 'A test template',
      category: 'business',
      features: [],
      complexity: 'simple' as const,
    },
    designConfig: {
      primaryColor: '#3b82f6',
      generatedPalettes: [],
      selectedPalette: 0,
      logoOption: 'none' as const,
    },
    domainConfig: {
      domain: 'test.com',
      provider: 'vercel',
      domainType: 'hosted' as const,
    },
  };

  const mockProps = {
    projectConfig: mockProjectConfig,
    onNext: vi.fn(),
    onBack: vi.fn(),
    onProjectConfigChange: vi.fn(),
  };

  it('should render successfully', () => {
    render(<ReviewStep {...mockProps} />);
    expect(screen.getByText('Review & Generate')).toBeInTheDocument();
    expect(
      screen.getByText('Coding editor integration coming soon')
    ).toBeInTheDocument();
  });
});
