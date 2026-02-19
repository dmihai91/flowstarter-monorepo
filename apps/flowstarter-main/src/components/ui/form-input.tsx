import { cn } from '@/lib/utils';
import * as React from 'react';
import { Input } from './input';

interface FormInputProps extends React.ComponentProps<typeof Input> {
  error?: string | null;
  showError?: boolean;
}

export function FormInput({
  error,
  showError,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <Input
        aria-invalid={!!(showError && error)}
        className={cn(className)}
        {...props}
      />
      {showError && error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
    </div>
  );
}

export default FormInput;
