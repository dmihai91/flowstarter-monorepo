import { useId } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

// Must match main platform's logo.tsx sizes
const iconSizes = { xs: 24, sm: 28, md: 32, lg: 40, xl: 48 };
const textSizes = { xs: 16, sm: 20, md: 24, lg: 30, xl: 36 };

function LogoMark({ size = 'md', className }: { size?: LogoProps['size']; className?: string }) {
  const gradientId = useId();
  const px = iconSizes[size!];

  return (
    <div className={className} style={{ width: px, height: px, flexShrink: 0, position: 'relative' }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`${gradientId}-lines`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
        <path
          d="M8 26 Q14 20, 20 23 Q26 26, 32 20"
          stroke={`url(#${gradientId}-lines)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 20 Q14 14, 20 17 Q26 20, 32 14"
          stroke={`url(#${gradientId}-lines)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
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
          fontSize: textSizes[size],
          letterSpacing: '-0.025em',
          color: 'var(--text-primary, #09090b)',
        }}>
          Flowstarter
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  return <LogoMark size={size} className={className} />;
}
