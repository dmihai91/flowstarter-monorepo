'use client';

interface CTAButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function CTAButton({ children, variant = 'primary', size = 'md', href, onClick, className = '' }: CTAButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--purple-primary)]';

  const variants = {
    primary: 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-lg shadow-[var(--purple-primary-lightest)] hover:shadow-xl hover:shadow-[var(--purple-primary-lighter)] hover:bg-[linear-gradient(135deg,var(--landing-btn-hover-from),var(--landing-btn-hover-via))] hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'border border-[var(--landing-card-border)] text-gray-700 dark:text-gray-200 hover:border-[var(--purple-primary-light)] dark:hover:border-[var(--purple-primary-light)] hover:text-[var(--purple-primary)] dark:hover:text-[var(--purple-primary-light)] bg-[var(--landing-card-bg)] backdrop-blur-sm',
  };

  const classes = `${base} ${variants[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return <a href={href} className={classes} onClick={onClick}>{children}</a>;
  }
  return <button className={classes} onClick={onClick}>{children}</button>;
}
