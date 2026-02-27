interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'current';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colors = {
  primary: 'border-t-[var(--purple,hsl(233,65%,58%))]',
  white: 'border-t-white',
  current: 'border-t-current',
};

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        border-2 border-zinc-200 dark:border-zinc-700
        ${colors[color]}
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}
