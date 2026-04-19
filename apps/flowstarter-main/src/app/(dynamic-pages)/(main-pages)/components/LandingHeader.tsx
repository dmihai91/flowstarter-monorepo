'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { useHeaderState } from './hooks/useHeaderState';
import { LANDING_COPY } from '../landing-copy';

/**
 * Landing page header with scroll-aware styling and mobile menu.
 */
export function LandingHeader({ onOpenModal }: { onOpenModal?: () => void }) {
  const { t } = useI18n();
  const { isLoaded, scrolled, mobileMenuOpen, setMobileMenuOpen } =
    useHeaderState();

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
        className={`ls-theme fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${
          scrolled || mobileMenuOpen
            ? 'border-b border-[var(--fs-rule)]/60 bg-white/90 dark:bg-[var(--fs-bg-base)]/85 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <Logo size="md" />
            </Link>

            <nav
              className="hidden lg:flex items-center gap-6"
              aria-label="Main navigation"
            >
              <a
                href="https://library.flowstarter.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {LANDING_COPY.nav.templatesLabel}
              </a>
              <a
                href="#process"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('process')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t('nav.process')}
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('pricing')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t('nav.pricing')}
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('faq')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t('nav.faq')}
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
              <Link
                href="/login"
                className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors hidden lg:block"
              >
                {t('nav.signIn')}
              </Link>
              <Button
                className="ls-cta ls-cta--sm !hidden lg:!inline-flex"
                onClick={() => onOpenModal?.()}
              >
                {t('landing.header.cta')}
              </Button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg active:bg-gray-100 dark:active:bg-white/10 transition-colors focus:outline-none"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
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
            className={`ls-mobile-menu lg:hidden overflow-hidden transition-all duration-[420ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
              mobileMenuOpen ? 'max-h-[36rem] pb-5' : 'max-h-0'
            }`}
          >
            <nav
              id="mobile-menu"
              aria-label="Mobile navigation"
              className="ls-mobile-nav flex flex-col gap-0.5 pt-4 mt-3 border-t border-[var(--fs-rule)]/50"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-base font-medium text-gray-700 dark:text-white/80">
                  {t('nav.theme')}
                </span>
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
                className="px-3 py-3 text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                {t('nav.process')}
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
                className="px-3 py-3 text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                {t('nav.pricing')}
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
                className="px-3 py-3 text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                {t('nav.faq')}
              </a>
              <a
                href="https://library.flowstarter.dev"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {LANDING_COPY.nav.templatesLabel}
              </a>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {t('nav.signIn')}
              </Link>
              <Button
                className="ls-cta mt-3 w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenModal?.();
                }}
              >
                {t('landing.header.cta')}
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}