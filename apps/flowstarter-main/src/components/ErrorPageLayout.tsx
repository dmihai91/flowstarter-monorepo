'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import Footer from './Footer';

interface ErrorPageLayoutProps {
  children: ReactNode;
}

export function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>
      
      <div className="flex flex-col min-h-screen font-display bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg 
            className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.12]"
            viewBox="0 0 1200 800" 
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="errorFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#errorFlowGradient)" strokeWidth="1.2">
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

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0a0a0c]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20 group-hover:shadow-[var(--purple)]/30 transition-shadow">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
            </Link>
            <Link 
              href="/"
              className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12 relative z-10">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
