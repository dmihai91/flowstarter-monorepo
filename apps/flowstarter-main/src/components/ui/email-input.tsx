'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Permissive but practical: requires non-whitespace local part, an `@`, a
// non-whitespace domain with at least one dot, and a TLD. Keeps things
// pragmatic for an MVP — full RFC 5322 grammar isn't worth the complexity.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns `true` when `value` looks like a syntactically valid email address.
 * Empty strings are considered invalid — callers that allow empty fields
 * should gate on truthiness before calling this.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Override the default invalid-email helper text. */
  errorMessage?: string;
  /**
   * Show the inline helper text under the field. Defaults to true. Set to
   * false for read-only / disabled email displays where there's nothing for
   * the user to fix.
   */
  showInlineError?: boolean;
  /**
   * Optional callback fired whenever the validity changes — useful for
   * driving an external "submit disabled" state without exposing the regex
   * to every call site.
   */
  onValidityChange?: (valid: boolean) => void;
}

const DEFAULT_ERROR = 'Enter a valid email address';

/**
 * Drop-in replacement for an email `Input`. Encapsulates:
 *
 *   - HTML5 + regex validation (matches `isValidEmail`)
 *   - "show error only after blur or non-empty failed input" UX
 *   - aria-invalid / aria-describedby wiring for screen readers
 *   - Subtle red border treatment when invalid
 *
 * Callers can drive submit-button gating either by tracking the value
 * themselves and calling `isValidEmail(value)`, or by passing an
 * `onValidityChange` callback.
 */
export const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  function EmailInput(
    {
      id,
      value,
      onChange,
      onBlur,
      errorMessage,
      showInlineError = true,
      onValidityChange,
      className,
      required,
      disabled,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? `email-input-${reactId}`;
    const helperId = `${inputId}-error`;

    const [touched, setTouched] = React.useState(false);

    // `value` may be `undefined` for uncontrolled use, so coerce to string
    // before running the regex.
    const stringValue = typeof value === 'string' ? value : '';
    const isEmpty = stringValue.trim().length === 0;
    const isValid = !isEmpty && isValidEmail(stringValue);

    // Notify the parent when validity flips. We deliberately treat empty as
    // "invalid" here so callers can gate submission on it without an extra
    // truthiness check.
    React.useEffect(() => {
      onValidityChange?.(isValid);
    }, [isValid, onValidityChange]);

    // Show inline error once the user has either:
    //   - blurred the field at least once and the value is invalid, OR
    //   - typed something non-empty that fails the regex (catches paste-
    //     and-tab-away scenarios where blur fires immediately).
    const shouldShowError =
      showInlineError && !disabled && !isValid && (touched || !isEmpty);

    return (
      <div className="space-y-1.5">
        <Input
          ref={ref}
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          aria-invalid={shouldShowError ? true : undefined}
          aria-describedby={
            shouldShowError
              ? [ariaDescribedBy, helperId].filter(Boolean).join(' ')
              : ariaDescribedBy
          }
          className={cn(
            shouldShowError &&
              'border-red-400/70 focus:border-red-400/70 focus-visible:border-red-400/70 focus-visible:ring-red-400/30 dark:border-red-400/60 dark:focus-visible:ring-red-400/40',
            className
          )}
          {...rest}
        />
        {shouldShowError && (
          <p
            id={helperId}
            className="text-xs text-red-500 dark:text-red-400"
            role="alert"
          >
            {errorMessage ?? DEFAULT_ERROR}
          </p>
        )}
      </div>
    );
  }
);
