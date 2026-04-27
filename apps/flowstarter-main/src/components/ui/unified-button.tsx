import { forwardRef } from 'react';
import { Button as BaseButton, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UnifiedButtonTone = 'primary' | 'secondary';

interface UnifiedButtonProps extends ButtonProps {
  tone?: UnifiedButtonTone;
}

const toneClasses: Record<UnifiedButtonTone, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-lg shadow-[var(--purple-primary)]/25 hover:opacity-90',
  secondary:
    'border border-[var(--fs-rule-strong)] bg-[color-mix(in_oklab,var(--fs-bg-elevated)_86%,transparent)] text-[var(--fs-ink)] hover:bg-[color-mix(in_oklab,var(--fs-bg-elevated)_72%,transparent)]',
};

export const Button = forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  ({ tone = 'primary', className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      variant="transparent"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple-primary)]/30 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
