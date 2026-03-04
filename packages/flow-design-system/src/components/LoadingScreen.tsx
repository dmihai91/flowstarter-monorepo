'use client';

import { useEffect } from 'react';
import { Logo } from './Logo';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  // Hide scroll on mount, restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #ffffff)',
        margin: 0,
        padding: 0,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.4,
          background:
            'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
        }}
      />

      {/* Gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          right: -160,
          width: 700,
          height: 700,
          borderRadius: '50%',
          opacity: 0.2,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          background: 'radial-gradient(circle, hsl(233, 65%, 58%, 0.3) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -160,
          left: -160,
          width: 600,
          height: 600,
          borderRadius: '50%',
          opacity: 0.15,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          background: 'radial-gradient(circle, hsl(211, 93%, 61%, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* Flow lines background - subtle */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="loadingFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--purple, hsl(233, 65%, 58%))" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <g stroke="url(#loadingFlowGradient)" strokeWidth="1.5">
            <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
            <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
            <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
            <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
            <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
            <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
            <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
          </g>
        </svg>
      </div>

      {/* Centered content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        {/* Logo */}
        <Logo size="lg" />

        {/* Simple elegant spinner */}
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid var(--border-light, #e4e4e7)',
          }} />
          {/* Spinning arc */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--purple, hsl(233, 65%, 58%))',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        {/* Message */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, #71717a)' }}>{message}</p>
        </div>
      </div>

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
