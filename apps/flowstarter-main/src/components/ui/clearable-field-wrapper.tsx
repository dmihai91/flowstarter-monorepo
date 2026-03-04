import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ClearableFieldWrapperProps {
  /** The input/textarea element to wrap */
  children: ReactNode;
  /** Whether the field has a value */
  hasValue: boolean;
  /** Whether the field is busy/loading */
  isBusy?: boolean;
  /** Callback when clear button is clicked */
  onClear: () => void;
  /** Clear button label for accessibility */
  clearLabel?: string;
  /** Optional AI rewrite menu positioned at top-right */
  aiMenu?: ReactNode;
  /** Additional wrapper classes */
  className?: string;
  /** Character counter to display at bottom-right */
  counter?: ReactNode;
}

/**
 * A consistent wrapper for clearable input fields with AI menu support.
 * Provides standardized positioning for:
 * - Clear button (X icon) and AI rewrite menu in a row at top-right
 * - Character counter at bottom-right
 */
export function ClearableFieldWrapper({
  children,
  hasValue,
  isBusy = false,
  onClear,
  clearLabel = 'Clear',
  aiMenu,
  className = '',
  counter,
}: ClearableFieldWrapperProps) {
  return (
    <div
      className={`group relative rounded-[8px] border-[1.5px] border-solid bg-transparent border-gray-300 dark:border-[var(--border-subtle)] focus-within:border-gray-400 dark:focus-within:border-white/40 transition-all duration-200 overflow-hidden ${className}`}
      aria-busy={isBusy}
    >
      {children}

      {/* Character counter at bottom-right */}
      {counter && (
        <div className="absolute right-[16px] bottom-[12px] text-[0.8125rem] font-normal leading-[16px] text-gray-500 dark:text-[#a1a1af] pointer-events-none">
          {counter}
        </div>
      )}

      {/* Top-right controls: Clear button + AI menu in a flex row */}
      <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
        {/* Clear button */}
        {hasValue && !isBusy && (
          <Button
            type="button"
            variant="transparent"
            aria-label={clearLabel}
            onClick={onClear}
            className="rounded-[8px] p-[4px] text-gray-400 hover:text-gray-600 dark:text-[#a1a1af] dark:hover:text-[#ffffff] hover:bg-gray-100 dark:hover:bg-[rgba(75,75,94,0.3)] transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* AI rewrite menu */}
        {aiMenu}
      </div>
    </div>
  );
}
