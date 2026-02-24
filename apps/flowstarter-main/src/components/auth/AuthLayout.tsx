'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { TranslationKeys, useTranslations } from '@/lib/i18n';
import Link from 'next/link';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  marketingKeys,
}: AuthLayoutProps) {
  useTheme();
  const { t } = useTranslations();
  const items = marketingKeys || [];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>
      
      <div className="relative min-h-screen w-full flex items-center justify-center font-display bg-gradient-to-b from-white via-[#F8F7FF] to-[#EDE9FE] dark:from-[#0a0a0c] dark:via-[#0a0a0c] dark:to-[#0a0a0c]">
        {/* Flow lines background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg 
            className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.12]"
            viewBox="0 0 1200 800" 
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="authFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#authFlowGradient)" strokeWidth="1.5">
              <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
              <path d="M-100,160 Q150,180 350,140 T750,180 T1300,160" />
              <path d="M-100,240 Q250,220 450,260 T850,230 T1300,270" />
              <path d="M-100,320 Q180,340 380,300 T780,340 T1300,320" />
              <path d="M-100,400 Q220,380 420,420 T820,390 T1300,430" />
              <path d="M-100,480 Q200,500 400,460 T800,500 T1300,480" />
              <path d="M-100,560 Q250,540 450,580 T850,550 T1300,590" />
              <path d="M-100,640 Q180,660 380,620 T780,660 T1300,640" />
              <path d="M-100,720 Q220,700 420,740 T820,710 T1300,750" />
            </g>
          </svg>
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0a0a0c]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/50 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-blue-500 flex items-center justify-center shadow-lg shadow-[#7C3AED]/20 group-hover:shadow-[#7C3AED]/30 transition-shadow">
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

        {/* Main content */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-16 min-h-screen flex items-center pt-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 items-center w-full py-8 lg:py-12">
            {/* Left side - Marketing */}
            <div className="hidden lg:flex flex-col justify-center">
              <div className="space-y-6">
                {title ? (
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                    {title.split(' ').slice(0, -1).join(' ')}{' '}
                    <span className="bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">
                      {title.split(' ').slice(-1)}
                    </span>
                  </h1>
                ) : null}
                {subtitle ? (
                  <p className="text-gray-500 dark:text-white/50 text-lg leading-relaxed max-w-md">
                    {subtitle}
                  </p>
                ) : null}

                {items.length > 0 && (
                  <ul className="mt-8 space-y-4">
                    {items.map((key) => (
                      <li key={key} className="flex items-center gap-3 text-gray-600 dark:text-white/60">
                        <div className="w-5 h-5 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-6 border-t border-gray-200 dark:border-white/10 mt-8">
                  {[
                    { value: '1-2', label: 'Weeks' },
                    { value: '∞', label: 'AI edits' },
                    { value: '0', label: 'Code' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-4">
                        <div className="text-xl font-bold bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">{stat.value}</div>
                        <div className="text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</div>
                      </div>
                      {i < 2 && <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="mx-auto w-full max-w-md">
              {/* Glassmorphism card */}
              <div className="p-8 rounded-2xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-[#7C3AED]/5">
                {/* Mobile title */}
                <div className="lg:hidden text-center mb-6">
                  {title ? (
                    <h1 className="text-2xl font-bold tracking-tight mb-2">
                      {title.split(' ').slice(0, -1).join(' ')}{' '}
                      <span className="bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">
                        {title.split(' ').slice(-1)}
                      </span>
                    </h1>
                  ) : null}
                  {subtitle ? (
                    <p className="text-gray-500 dark:text-white/50 text-sm">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
