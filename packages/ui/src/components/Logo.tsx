import { useId } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: 14 },
  md: { icon: 36, text: 15 },
  lg: { icon: 40, text: 16 },
  xl: { icon: 48, text: 18 },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const gradientId = useId();
  const { icon, text } = sizes[size];
  
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: icon, height: icon, flexShrink: 0 }}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
          
          {/* Flowing wave - represents flow/movement */}
          <path 
            d="M8 26 Q14 18, 20 22 Q26 26, 32 18" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Second wave - depth/layers */}
          <path 
            d="M8 20 Q14 12, 20 16 Q26 20, 32 12" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {showText && (
        <span style={{ 
          fontWeight: 600, 
          fontSize: text,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary, #09090b)',
        }}>
          Flowstarter
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} className={className} />;
}
