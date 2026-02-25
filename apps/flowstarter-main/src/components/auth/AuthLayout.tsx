'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { TranslationKeys, useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
  showTeamBadge?: boolean;
  hideFooterStats?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showTeamBadge = false,
  hideFooterStats = false,
}: AuthLayoutProps) {
  useTheme();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>
      
      <div className="min-h-screen w-full font-display bg-[#FAFAFA] dark:bg-[#0a0a0c] relative overflow-hidden">
        {/* Flow lines background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg 
            className="absolute inset-0 w-full h-full opacity-[0.20] dark:opacity-[0.15]"
            viewBox="0 0 1200 800" 
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="authFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#authFlowGradient)" strokeWidth="1.2">
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
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20 group-hover:shadow-[var(--purple)]/30 transition-shadow">
                <span className="text-white font-bold text-xs sm:text-sm">F</span>
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
              {showTeamBadge && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                  Team
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link 
                href="/"
                className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">← Back to home</span>
                <span className="sm:hidden">←</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 pt-28 pb-10">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                  <span className="text-gray-900 dark:text-white">{title.split(' ').slice(0, -1).join(' ')} </span>
                  <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    {title.split(' ').slice(-1)}
                  </span>
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-500 dark:text-white/50 text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Auth content */}
            <div className="relative">
              {children}
            </div>

            {/* Stats - for client login only */}
            {!hideFooterStats && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-6">
                  {[
                    { value: '1-2', label: 'Weeks' },
                    { value: '~300', label: 'edits/mo' },
                    { value: '0', label: 'Code' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-3">
                        <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">{stat.value}</div>
                        <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wider">{stat.label}</div>
                      </div>
                      {i < 2 && <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
