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
 * Always uses the brand gradient: #4D5DD9 -> #7C3AED -> #06B6D4.
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
        'bg-[linear-gradient(to_right,#4D5DD9,#7C3AED,#06B6D4)]',
        'shadow-[0_4px_20px_rgba(77,93,217,0.35)]',
        'hover:opacity-90 active:opacity-80',
        'transition-opacity duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-50',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
