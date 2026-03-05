import { useId } from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const iconSizes = { xs: 24, sm: 28, md: 32, lg: 40, xl: 48 };
const textSizes = { xs: 16, sm: 20, md: 24, lg: 30, xl: 36 };

export function LogoMark({ size = 'md', className }: { size?: LogoProps['size']; className?: string }) {
  const id = useId();
  const px = iconSizes[size!];

  return (
    <div className={className} style={{ width: px, height: px, flexShrink: 0, position: 'relative' }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--purple, #4D5DD9)" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {/* Background */}
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* Stylized "F" — vertical stem + two horizontal arms with flowing curves */}
        <path d="M14 10 L14 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 12 C18 12, 22 10, 27 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 20 C17 20, 20 18, 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 30 C18 30, 22 28, 28 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <LogoMark size={size} />
      {showText && (
        <span style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: textSizes[size!],
          letterSpacing: '-0.025em',
          color: 'var(--text-primary, #09090b)',
        }}>
          Flow
          <span style={{
            background: 'linear-gradient(to right, var(--purple, #4D5DD9), #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
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
