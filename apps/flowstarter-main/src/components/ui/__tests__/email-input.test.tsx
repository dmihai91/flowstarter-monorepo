import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

import { EmailInput, isValidEmail } from '../email-input';

// Small controlled wrapper so we can mutate the value across user actions
// without manually rerendering with new props.
function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <EmailInput
      aria-label="email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.io')).toBe(true);
    expect(isValidEmail('darius@flowstarter.net')).toBe(true);
  });

  it('rejects empty / partial / malformed input', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('dar')).toBe(false);
    expect(isValidEmail('dar@')).toBe(false);
    expect(isValidEmail('dar@flow')).toBe(false);
    expect(isValidEmail('dar @flow.io')).toBe(false);
  });
});

describe('EmailInput', () => {
  it('renders without an error helper for an empty, untouched field', () => {
    render(<Harness />);

    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error after blur when the value is obviously invalid', () => {
    render(<Harness />);

    const input = screen.getByLabelText('email');
    fireEvent.change(input, { target: { value: 'dar' } });
    fireEvent.blur(input);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('hides the error once the value becomes valid', () => {
    render(<Harness />);

    const input = screen.getByLabelText('email');
    fireEvent.change(input, { target: { value: 'dar' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'dar@x.io' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
