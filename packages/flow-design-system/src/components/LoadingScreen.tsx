'use client';

import { useEffect } from 'react';
import { Logo } from './Logo';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Use fs tokens — adapts to dark/light automatically
        backgroundColor: 'var(--fs-bg-base, #fbf7ef)',
        margin: 0,
        padding: 0,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Primary indigo bloom — top-center, same as FlowBackground */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '75%',
        borderRadius: '50%',
        opacity: 0.28,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(88,106,240,0.7) 0%, rgba(78,94,218,0.2) 45%, transparent 72%)',
      }} />

      {/* Warm anchor — bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '-12%',
        left: '-5%',
        width: '55%',
        height: '50%',
        borderRadius: '50%',
        opacity: 0.16,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(255,160,80,0.7) 0%, rgba(200,100,20,0.2) 45%, transparent 72%)',
      }} />

      {/* Flow lines — same hues as FlowBackground auth variant */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.10,
          pointerEvents: 'none',
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ls-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="20%"  stopColor="hsl(233,65%,50%)" stopOpacity="0.6" />
            <stop offset="60%"  stopColor="hsl(233,70%,58%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="ls-grad-b" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="30%"  stopColor="hsl(233,60%,52%)" stopOpacity="0.5" />
            <stop offset="70%"  stopColor="hsl(30,70%,42%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <g stroke="url(#ls-grad-a)" strokeWidth="1.0">
          <path d="M-60,180 C200,140 420,220 720,175 S1100,135 1500,195" />
          <path d="M-60,340 C180,300 400,380 720,330 S1060,295 1500,360" />
          <path d="M-60,520 C220,480 440,555 720,505 S1080,470 1500,530" />
          <path d="M-60,700 C200,665 440,730 720,685 S1100,650 1500,710" />
        </g>
        <g stroke="url(#ls-grad-b)" strokeWidth="0.7">
          <path d="M-60,260 C240,220 460,300 720,255 S1080,215 1500,280" />
          <path d="M-60,430 C200,395 420,465 720,420 S1060,385 1500,445" />
          <path d="M-60,610 C210,575 440,645 720,600 S1080,565 1500,625" />
        </g>
      </svg>

      {/* Centered content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
      }}>
        <Logo size="lg" />

        {/* Spinner */}
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          {/* Track */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid var(--fs-rule, rgba(18,10,34,0.10))',
          }} />
          {/* Arc */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--fs-accent, hsl(233,65%,50%))',
            animation: 'fs-spin 0.8s linear infinite',
          }} />
        </div>

        {/* Message */}
        <p style={{
          fontSize: 13,
          letterSpacing: '0.06em',
          color: 'var(--fs-ink-faint, rgba(18,10,34,0.36))',
          fontFamily: 'var(--fs-font-mono, ui-monospace, monospace)',
          textTransform: 'uppercase',
        }}>
          {message}
        </p>
      </div>

      <style>{`
        @keyframes fs-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
