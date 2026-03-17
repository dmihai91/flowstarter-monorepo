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
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';

  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/50 dark:bg-white/5 backdrop-blur-sm',
  };

  const classes = `${base} ${variants[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return <a href={href} className={classes} onClick={onClick}>{children}</a>;
  }
  return <button className={classes} onClick={onClick}>{children}</button>;
}
