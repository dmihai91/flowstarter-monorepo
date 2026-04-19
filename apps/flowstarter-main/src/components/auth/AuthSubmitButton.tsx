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
      style={{
        background: 'var(--fs-cta-bg)',
        color: 'var(--fs-cta-fg)',
        boxShadow: 'var(--fs-cta-shadow)',
        height: 'var(--fs-btn-h)',
        paddingInline: 'var(--fs-btn-px)',
        fontSize: 'var(--fs-btn-fs)',
        borderRadius: 'var(--fs-radius-md)',
      }}
      className={[
        'w-full font-semibold',
        'hover:translate-y-[-1px]',
        'active:translate-y-0',
        'transition-transform duration-[var(--fs-dur-micro)]',
        'disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
