import type { ReactNode } from 'react';
import { UnifiedButton } from '@/components/ui/unified-button';

interface AuthSubmitButtonProps {
  children: ReactNode;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  className?: string;
}

/**
 * Shared submit button for all auth forms (team login, client login, password reset).
 * Uses the design-system brand token: var(--purple).
 */
export function AuthSubmitButton({
  children,
  disabled = false,
  type = 'submit',
  onClick,
  className = '',
}: AuthSubmitButtonProps) {
  return (
    <UnifiedButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={['w-full !rounded-lg font-semibold', className].join(' ')}
    >
      {children}
    </UnifiedButton>
  );
}
