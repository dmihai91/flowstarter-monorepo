import { cn } from '@/lib/utils';
import * as React from 'react';
import { Textarea } from './textarea';

interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  error?: string | null;
  showError?: boolean;
}

export function FormTextarea({
  error,
  showError,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <div className="space-y-1.5">
      <Textarea
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

export default FormTextarea;
