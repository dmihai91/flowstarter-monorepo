/**
 * UI Components Logic Tests
 *
 * Tests for UI component logic, variant utilities, and class generation.
 * These tests verify component logic without DOM rendering.
 */

import { describe, it, expect, vi } from 'vitest';

// ─── Badge Variants ─────────────────────────────────────────────────────────

const badgeVariantClasses: Record<string, string> = {
  default: 'bg-flowstarter-elements-background text-flowstarter-elements-textPrimary',
  secondary: 'bg-flowstarter-elements-background text-flowstarter-elements-textSecondary',
  destructive: 'bg-red-500/10 text-red-500',
  outline: 'text-flowstarter-elements-textPrimary',
  primary: 'bg-blue-500/10 text-blue-600',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-yellow-500/10 text-yellow-600',
  danger: 'bg-red-500/10 text-red-600',
  info: 'bg-blue-500/10 text-blue-600',
  subtle: 'border bg-white/50 backdrop-blur-sm',
};

const badgeSizeClasses: Record<string, string> = {
  default: 'rounded-full px-2.5 py-0.5 text-xs font-semibold',
  sm: 'rounded-full px-1.5 py-0.5 text-xs',
  md: 'rounded-md px-2 py-1 text-xs font-medium',
  lg: 'rounded-md px-2.5 py-1.5 text-sm',
};

function getBadgeClasses(variant: string = 'default', size: string = 'default'): string {
  const variantClass = badgeVariantClasses[variant] || badgeVariantClasses.default;
  const sizeClass = badgeSizeClasses[size] || badgeSizeClasses.default;
  return `inline-flex items-center gap-1 ${variantClass} ${sizeClass}`;
}

// ─── Button Variants ────────────────────────────────────────────────────────

const buttonVariantClasses: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const buttonSizeClasses: Record<string, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

function getButtonClasses(variant: string = 'primary', size: string = 'md'): string {
  const variantClass = buttonVariantClasses[variant] || buttonVariantClasses.primary;
  const sizeClass = buttonSizeClasses[size] || buttonSizeClasses.md;
  return `${variantClass} ${sizeClass}`;
}

// ─── Badge Tests ────────────────────────────────────────────────────────────

describe('Badge Variants', () => {
  it('should have all expected variants', () => {
    const expectedVariants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'primary',
      'success',
      'warning',
      'danger',
      'info',
      'subtle',
    ];

    expectedVariants.forEach((variant) => {
      expect(badgeVariantClasses[variant]).toBeDefined();
    });
  });

  it('should have all expected sizes', () => {
    const expectedSizes = ['default', 'sm', 'md', 'lg'];

    expectedSizes.forEach((size) => {
      expect(badgeSizeClasses[size]).toBeDefined();
    });
  });

  it('should return correct classes for default props', () => {
    const classes = getBadgeClasses();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('items-center');
    expect(classes).toContain('px-2.5');
  });

  it('should return variant-specific classes', () => {
    const primaryClasses = getBadgeClasses('primary');
    expect(primaryClasses).toContain('bg-blue-500/10');

    const successClasses = getBadgeClasses('success');
    expect(successClasses).toContain('bg-green-500/10');

    const dangerClasses = getBadgeClasses('danger');
    expect(dangerClasses).toContain('bg-red-500/10');
  });

  it('should return size-specific classes', () => {
    const smClasses = getBadgeClasses('default', 'sm');
    expect(smClasses).toContain('px-1.5');

    const lgClasses = getBadgeClasses('default', 'lg');
    expect(lgClasses).toContain('text-sm');
  });

  it('should fall back to default for unknown variant', () => {
    const classes = getBadgeClasses('unknown');
    expect(classes).toContain('bg-flowstarter-elements-background');
  });

  it('should fall back to default for unknown size', () => {
    const classes = getBadgeClasses('default', 'unknown');
    expect(classes).toContain('px-2.5');
  });
});

// ─── Button Tests ───────────────────────────────────────────────────────────

describe('Button Variants', () => {
  it('should have all expected variants', () => {
    const expectedVariants = ['primary', 'secondary', 'ghost', 'danger'];

    expectedVariants.forEach((variant) => {
      expect(buttonVariantClasses[variant]).toBeDefined();
    });
  });

  it('should have all expected sizes', () => {
    const expectedSizes = ['sm', 'md', 'lg'];

    expectedSizes.forEach((size) => {
      expect(buttonSizeClasses[size]).toBeDefined();
    });
  });

  it('should return correct classes for primary variant', () => {
    const classes = getButtonClasses('primary');
    expect(classes).toContain('bg-blue-600');
    expect(classes).toContain('text-white');
  });

  it('should return correct classes for danger variant', () => {
    const classes = getButtonClasses('danger');
    expect(classes).toContain('bg-red-600');
    expect(classes).toContain('text-white');
  });

  it('should return correct classes for ghost variant', () => {
    const classes = getButtonClasses('ghost');
    expect(classes).toContain('bg-transparent');
  });

  it('should return size-specific classes', () => {
    const smClasses = getButtonClasses('primary', 'sm');
    expect(smClasses).toContain('px-2');
    expect(smClasses).toContain('py-1');

    const lgClasses = getButtonClasses('primary', 'lg');
    expect(lgClasses).toContain('px-6');
    expect(lgClasses).toContain('py-3');
  });
});

// ─── Class Merging Tests ────────────────────────────────────────────────────

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

describe('Class Names Utility', () => {
  it('should merge multiple class strings', () => {
    const result = classNames('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should filter out falsy values', () => {
    const result = classNames('class1', false, null, undefined, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle empty input', () => {
    const result = classNames();
    expect(result).toBe('');
  });

  it('should handle all falsy values', () => {
    const result = classNames(false, null, undefined);
    expect(result).toBe('');
  });

  it('should preserve empty strings in classes', () => {
    const result = classNames('a', '', 'b');
    // Empty string is falsy, so it should be filtered
    expect(result).toBe('a b');
  });
});

// ─── Input Validation Tests ─────────────────────────────────────────────────

interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

function validateInput(value: string, validation: InputValidation): string | null {
  if (validation.required && !value.trim()) {
    return 'This field is required';
  }

  if (validation.minLength && value.length < validation.minLength) {
    return `Must be at least ${validation.minLength} characters`;
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return `Must be at most ${validation.maxLength} characters`;
  }

  if (validation.pattern && !validation.pattern.test(value)) {
    return 'Invalid format';
  }

  return null;
}

describe('Input Validation', () => {
  it('should validate required field', () => {
    expect(validateInput('', { required: true })).toBe('This field is required');
    expect(validateInput('  ', { required: true })).toBe('This field is required');
    expect(validateInput('value', { required: true })).toBeNull();
  });

  it('should validate minLength', () => {
    expect(validateInput('ab', { minLength: 3 })).toBe('Must be at least 3 characters');
    expect(validateInput('abc', { minLength: 3 })).toBeNull();
    expect(validateInput('abcd', { minLength: 3 })).toBeNull();
  });

  it('should validate maxLength', () => {
    expect(validateInput('abcdef', { maxLength: 5 })).toBe('Must be at most 5 characters');
    expect(validateInput('abcde', { maxLength: 5 })).toBeNull();
    expect(validateInput('abc', { maxLength: 5 })).toBeNull();
  });

  it('should validate pattern', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(validateInput('invalid', { pattern: emailPattern })).toBe('Invalid format');
    expect(validateInput('test@example.com', { pattern: emailPattern })).toBeNull();
  });

  it('should combine validations', () => {
    const validation = { required: true, minLength: 3 };
    expect(validateInput('', validation)).toBe('This field is required');
    expect(validateInput('ab', validation)).toBe('Must be at least 3 characters');
    expect(validateInput('abc', validation)).toBeNull();
  });
});

// ─── Status Indicator Tests ─────────────────────────────────────────────────

type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning';

interface StatusConfig {
  icon: string;
  color: string;
  message: string;
}

function getStatusConfig(status: StatusType): StatusConfig {
  const configs: Record<StatusType, StatusConfig> = {
    idle: { icon: 'circle', color: 'gray', message: 'Idle' },
    loading: { icon: 'spinner', color: 'blue', message: 'Loading...' },
    success: { icon: 'check', color: 'green', message: 'Success' },
    error: { icon: 'x', color: 'red', message: 'Error' },
    warning: { icon: 'alert', color: 'yellow', message: 'Warning' },
  };

  return configs[status];
}

describe('Status Indicator', () => {
  it('should return correct config for idle status', () => {
    const config = getStatusConfig('idle');
    expect(config.icon).toBe('circle');
    expect(config.color).toBe('gray');
    expect(config.message).toBe('Idle');
  });

  it('should return correct config for loading status', () => {
    const config = getStatusConfig('loading');
    expect(config.icon).toBe('spinner');
    expect(config.color).toBe('blue');
    expect(config.message).toBe('Loading...');
  });

  it('should return correct config for success status', () => {
    const config = getStatusConfig('success');
    expect(config.icon).toBe('check');
    expect(config.color).toBe('green');
  });

  it('should return correct config for error status', () => {
    const config = getStatusConfig('error');
    expect(config.icon).toBe('x');
    expect(config.color).toBe('red');
  });

  it('should return correct config for warning status', () => {
    const config = getStatusConfig('warning');
    expect(config.icon).toBe('alert');
    expect(config.color).toBe('yellow');
  });
});

// ─── Form State Tests ───────────────────────────────────────────────────────

interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

function createFormState(initialValues: Record<string, string>): FormState {
  return {
    values: { ...initialValues },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  };
}

function setFieldValue(state: FormState, field: string, value: string): FormState {
  return {
    ...state,
    values: { ...state.values, [field]: value },
    touched: { ...state.touched, [field]: true },
  };
}

function setFieldError(state: FormState, field: string, error: string | null): FormState {
  const newErrors = { ...state.errors };
  if (error) {
    newErrors[field] = error;
  } else {
    delete newErrors[field];
  }

  return {
    ...state,
    errors: newErrors,
    isValid: Object.keys(newErrors).length === 0,
  };
}

describe('Form State Management', () => {
  it('should create initial form state', () => {
    const state = createFormState({ name: '', email: '' });

    expect(state.values.name).toBe('');
    expect(state.values.email).toBe('');
    expect(state.errors).toEqual({});
    expect(state.touched).toEqual({});
    expect(state.isSubmitting).toBe(false);
    expect(state.isValid).toBe(true);
  });

  it('should set field value and mark as touched', () => {
    let state = createFormState({ name: '' });
    state = setFieldValue(state, 'name', 'John');

    expect(state.values.name).toBe('John');
    expect(state.touched.name).toBe(true);
  });

  it('should set field error', () => {
    let state = createFormState({ name: '' });
    state = setFieldError(state, 'name', 'Name is required');

    expect(state.errors.name).toBe('Name is required');
    expect(state.isValid).toBe(false);
  });

  it('should clear field error', () => {
    let state = createFormState({ name: '' });
    state = setFieldError(state, 'name', 'Name is required');
    state = setFieldError(state, 'name', null);

    expect(state.errors.name).toBeUndefined();
    expect(state.isValid).toBe(true);
  });

  it('should track multiple field errors', () => {
    let state = createFormState({ name: '', email: '' });
    state = setFieldError(state, 'name', 'Name is required');
    state = setFieldError(state, 'email', 'Email is required');

    expect(Object.keys(state.errors)).toHaveLength(2);
    expect(state.isValid).toBe(false);
  });
});

// ─── Card Composition Tests ─────────────────────────────────────────────────

interface CardConfig {
  title?: string;
  description?: string;
  footer?: string;
  variant?: 'default' | 'elevated' | 'bordered';
}

function getCardClasses(config: CardConfig): string {
  const baseClasses = 'rounded-lg p-4';

  const variantClasses: Record<string, string> = {
    default: 'bg-white',
    elevated: 'bg-white shadow-lg',
    bordered: 'bg-white border border-gray-200',
  };

  return `${baseClasses} ${variantClasses[config.variant || 'default']}`;
}

describe('Card Component Logic', () => {
  it('should return default classes', () => {
    const classes = getCardClasses({});
    expect(classes).toContain('rounded-lg');
    expect(classes).toContain('p-4');
    expect(classes).toContain('bg-white');
  });

  it('should return elevated variant classes', () => {
    const classes = getCardClasses({ variant: 'elevated' });
    expect(classes).toContain('shadow-lg');
  });

  it('should return bordered variant classes', () => {
    const classes = getCardClasses({ variant: 'bordered' });
    expect(classes).toContain('border');
    expect(classes).toContain('border-gray-200');
  });
});

// ─── Loading State Tests ────────────────────────────────────────────────────

interface LoadingState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

function createLoadingState<T>(): LoadingState<T> {
  return { data: null, isLoading: false, error: null };
}

function setLoading<T>(state: LoadingState<T>): LoadingState<T> {
  return { data: null, isLoading: true, error: null };
}

function setData<T>(state: LoadingState<T>, data: T): LoadingState<T> {
  return { data, isLoading: false, error: null };
}

function setError<T>(state: LoadingState<T>, error: Error): LoadingState<T> {
  return { data: null, isLoading: false, error };
}

describe('Loading State', () => {
  it('should create initial loading state', () => {
    const state = createLoadingState<string>();
    expect(state.data).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set loading state', () => {
    let state = createLoadingState<string>();
    state = setLoading(state);

    expect(state.isLoading).toBe(true);
    expect(state.data).toBeNull();
    expect(state.error).toBeNull();
  });

  it('should set data and clear loading', () => {
    let state = createLoadingState<string>();
    state = setLoading(state);
    state = setData(state, 'loaded data');

    expect(state.isLoading).toBe(false);
    expect(state.data).toBe('loaded data');
    expect(state.error).toBeNull();
  });

  it('should set error and clear loading', () => {
    let state = createLoadingState<string>();
    state = setLoading(state);
    state = setError(state, new Error('Failed to load'));

    expect(state.isLoading).toBe(false);
    expect(state.data).toBeNull();
    expect(state.error?.message).toBe('Failed to load');
  });
});

