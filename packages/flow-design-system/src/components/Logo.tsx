import { useId } from 'react';
import { twMerge } from 'tailwind-merge';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const markSizeClass: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'size-6',
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-10',
  xl: 'size-12',
};

const wordmarkTextClass: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'text-base',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

/** Next to the wordmark, the full-size square reads taller than the type cap/line box. */
const markSizeBesideWordmark: Record<NonNullable<LogoProps['size']>, LogoProps['size']> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
};

export function LogoMark({ size = 'md', className }: { size?: LogoProps['size']; className?: string }) {
  const id = useId();

  return (
    <div className={twMerge('relative shrink-0', markSizeClass[size!], className)}>
      <svg viewBox="-2 -2 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--purple)" />
            <stop offset="0.5" stopColor="var(--purple)" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {/* Background */}
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* Stylized "F" — centered at x=13, arms balanced left/right of optical center */}
        <path d="M13 10 L13 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M13 11 C17 10, 22 10, 27 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M13 20 C16 19, 20 19, 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M13 30 C16 30, 20 29, 25 28" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={twMerge('flex items-center gap-2.5', className)}>
      <LogoMark size={showText ? markSizeBesideWordmark[size!] : size} />
      {showText && (
        <span
          className={twMerge(
            'font-bold tracking-tight text-[color:var(--text-primary,currentColor)]',
            wordmarkTextClass[size!],
          )}
          style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        >
          Flow
          <span className="bg-[linear-gradient(to_right,var(--purple),#06B6D4)] bg-clip-text text-transparent">
            starter
          </span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  return <LogoMark size={size} className={className} />;
}
