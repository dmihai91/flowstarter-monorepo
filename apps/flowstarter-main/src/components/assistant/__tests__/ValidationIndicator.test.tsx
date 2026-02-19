import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValidationIndicator } from '../ValidationIndicator';

describe('ValidationIndicator', () => {
  it('renders nothing when status is null', () => {
    const { container } = render(
      <ValidationIndicator
        status={null}
        sufficientMessage="Ready"
        insufficientMessage="Not ready"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders sufficient status with green color', () => {
    render(
      <ValidationIndicator
        status="sufficient"
        sufficientMessage="Ready to generate"
        insufficientMessage="Not ready"
      />
    );

    const message = screen.getByText('Ready to generate');
    expect(message).toBeInTheDocument();

    const container = message.closest('div');
    expect(container).toHaveClass('text-green-600');
  });

  it('renders insufficient status with amber color', () => {
    render(
      <ValidationIndicator
        status="insufficient"
        sufficientMessage="Ready"
        insufficientMessage="Brief description"
      />
    );

    const message = screen.getByText('Brief description');
    expect(message).toBeInTheDocument();

    const container = message.closest('div');
    expect(container).toHaveClass('text-amber-600');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ValidationIndicator
        status="sufficient"
        sufficientMessage="Ready"
        insufficientMessage="Not ready"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders CheckCircle2 icon for sufficient status', () => {
    const { container } = render(
      <ValidationIndicator
        status="sufficient"
        sufficientMessage="Ready"
        insufficientMessage="Not ready"
      />
    );

    // Check for the icon by looking for the svg element
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders AlertCircle icon for insufficient status', () => {
    const { container } = render(
      <ValidationIndicator
        status="insufficient"
        sufficientMessage="Ready"
        insufficientMessage="Not ready"
      />
    );

    // Check for the icon by looking for the svg element
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
