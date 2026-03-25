import type { ReactNode } from 'react';

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
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'w-full h-12 px-6 rounded-lg',
        'font-semibold text-base text-white',
        'bg-[var(--purple)]',
        'hover:brightness-110 hover:shadow-lg hover:shadow-[var(--purple)]/20',
        'active:scale-[0.99]',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:pointer-events-none disabled:saturate-50',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
