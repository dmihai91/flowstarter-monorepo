'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import Link from 'next/link';
import { useHeaderState } from './hooks/useHeaderState';

/**
 * Landing page header with scroll-aware styling and mobile menu.
 */
export function LandingHeader() {
  const { t } = useI18n();
  const { isLoaded, scrolled, mobileMenuOpen, setMobileMenuOpen } = useHeaderState();

  return (
    <>
        {/* Backdrop overlay when mobile menu is open */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          } ${
            scrolled || mobileMenuOpen
              ? 'bg-white/60 dark:bg-[#0a0a0c]/60 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.04)]'
              : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <Logo size="md" />
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('process')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Process
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('pricing')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('faq')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('nav.faq')}
                </a>
              </nav>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                <Link
                  href="/login"
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block"
                >
                  Sign In
                </Link>
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block"
                >
                  <Button className="bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white hover:from-[var(--landing-btn-hover-from)] hover:via-[var(--landing-btn-hover-via)] hover:to-[var(--landing-btn-hover-from)] rounded-lg px-6 h-10 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                    {t('landing.header.cta')}
                  </Button>
                </a>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile menu dropdown */}
            <div
              className={`md:hidden overflow-hidden transition-all duration-300 ${
                mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
              }`}
            >
              <nav className="flex flex-col gap-1 pt-3 mt-2 border-t border-gray-200/50 dark:border-white/10">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-600 dark:text-white/70">Theme</span>
                  <ThemeToggle />
                </div>
                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('process')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Process
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('pricing')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('faq')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  {t('nav.faq')}
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2"
                >
                  <Button className="w-full bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white hover:from-[var(--landing-btn-hover-from)] hover:via-[var(--landing-btn-hover-via)] hover:to-[var(--landing-btn-hover-from)] rounded-lg h-10 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                    {t('landing.header.cta')}
                  </Button>
                </a>
              </nav>
            </div>
          </div>
        </header>

    </>
  );
}
