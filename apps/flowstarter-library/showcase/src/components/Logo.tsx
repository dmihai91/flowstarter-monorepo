/**
 * Shared logo component — matches flow-design-system Logo.tsx exactly.
 * Used in Header and Footer.
 */
import React, { useId } from 'react';

interface LogoProps {
  size?: number;
  darkMode?: boolean;
  showSubtitle?: boolean;
}

export function LogoMark({ size = 32 }: { size?: number }): React.ReactElement {
  const id = useId();
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          {/* Exact same gradient as flow-design-system Logo.tsx */}
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4D5DD9" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <path d="M14 10 L14 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 12 C18 12, 22 10, 27 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 20 C17 20, 20 18, 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 30 C18 30, 22 28, 28 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function LogoText({ size = 15, darkMode = false, showSubtitle = true }: LogoProps): React.ReactElement {
  const textColor = darkMode ? '#ffffff' : '#09090b';
  const subColor  = darkMode ? '#737373' : '#a3a3a3';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 3 }}>
      <span style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.025em',
        color: textColor,
      }}>
        Flow
        <span style={{
          background: 'linear-gradient(to right, #4D5DD9, #06B6D4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          starter
        </span>
      </span>
      {showSubtitle && (
        <span style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          color: subColor,
          letterSpacing: '0.01em',
        }}>
          Template Library
        </span>
      )}
    </div>
  );
}
