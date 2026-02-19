import { cn } from '@/lib/utils';
import * as React from 'react';
import { TagsInput } from './tags-input';

interface FormTagsInputProps extends React.ComponentProps<typeof TagsInput> {
  error?: string | null;
  showError?: boolean;
}

export function FormTagsInput({
  error,
  showError,
  className,
  ...props
}: FormTagsInputProps) {
  return (
    <div className="space-y-1.5">
      <TagsInput className={cn(className)} {...props} />
      {showError && error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
    </div>
  );
}

export default FormTagsInput;
