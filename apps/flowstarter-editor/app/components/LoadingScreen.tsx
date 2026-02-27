/**
 * LoadingScreen - Matches the main platform's loading screen
 * Used for auth loading, initial page load, and transitions
 */

import { useEffect } from 'react';

interface LoadingScreenProps {
  message?: string;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 relative flex-shrink-0">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill="url(#logoGradient)" />
          
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
      
      <span className="font-semibold text-gray-900 dark:text-white text-lg">
        Flowstarter
      </span>
    </div>
  );
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#0a0a0c]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          background:
            'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
        }}
      />

      {/* Gradient orbs */}
      <div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-20 dark:opacity-10 blur-[100px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsl(233, 65%, 58%, 0.3) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-8 blur-[100px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsl(211, 93%, 61%, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* Flow lines background - subtle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.03]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient
              id="loadingFlowGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#8B5CF6" />
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
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <Logo />

        {/* Simple elegant spinner */}
        <div className="relative w-12 h-12">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
          {/* Spinning arc */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-white/50">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
