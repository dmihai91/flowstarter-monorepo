'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/unified-button';
import { UserMenu } from '@/components/ui/user-menu';
import { useI18n } from '@/lib/i18n';
import { useHeaderState } from '@/app/(dynamic-pages)/(main-pages)/components/hooks/useHeaderState';
import { useBookingModal } from '@/app/(dynamic-pages)/(main-pages)/components/booking-modal-store';
type SiteHeaderMode = 'landing' | 'public' | 'auth' | 'app';

interface SiteHeaderProps {
  mode: SiteHeaderMode;
  onOpenAppMenu?: () => void;
}

export function SiteHeader({ mode, onOpenAppMenu }: SiteHeaderProps) {
  const openBookingModal = useBookingModal((s) => s.open);
  const { t: tLanding } = useI18n();
  const {
    isLoaded: headerLoaded,
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    activeSection,
  } = useHeaderState();
  const pathname = usePathname();

  const scrollToSection =
    (sectionId: string, closeMobile = false) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (closeMobile) setMobileMenuOpen(false);
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: 'smooth' });
    };

  const navLinkClass = (isActive: boolean) =>
    [
      'text-sm transition-colors cursor-pointer',
      isActive
        ? 'text-[var(--fs-ink)] dark:text-white font-semibold'
        : 'text-[var(--fs-ink-faint)] dark:text-white/72 hover:text-gray-900 dark:hover:text-white',
    ].join(' ');
  const mobileNavLinkClass = (isActive: boolean) =>
    [
      'px-3 py-3 text-base rounded-lg transition-colors cursor-pointer',
      isActive
        ? 'font-semibold text-[var(--fs-ink)] dark:text-white bg-gray-100 dark:bg-white/14'
        : 'font-medium text-gray-700 dark:text-white/82 hover:bg-gray-100 dark:hover:bg-white/10',
    ].join(' ');

  if (mode === 'landing') {
    return (
      <>
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/55 dark:bg-black/75 backdrop-blur-lg md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <header
          className={`ls-theme fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            headerLoaded ? 'opacity-100' : 'opacity-0'
          } ${
            scrolled || mobileMenuOpen
              ? 'border-b border-[var(--fs-glass-edge)] bg-white/65 dark:bg-[var(--fs-bg-base)]/55 backdrop-blur-2xl backdrop-saturate-[180%] shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
              : 'border-b border-transparent bg-transparent backdrop-blur-0 shadow-none'
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
                  href="#process"
                  onClick={scrollToSection('process')}
                  className={navLinkClass(activeSection === 'process')}
                >
                  {tLanding('nav.process')}
                </a>
                <a
                  href="#editor-showcase"
                  onClick={scrollToSection('editor-showcase')}
                  className={navLinkClass(activeSection === 'editor-showcase')}
                >
                  {tLanding('nav.smartEditor')}
                </a>
                <a
                  href="#pricing"
                  onClick={scrollToSection('pricing')}
                  className={navLinkClass(activeSection === 'pricing')}
                >
                  {tLanding('nav.pricing')}
                </a>
                <a
                  href="#faq"
                  onClick={scrollToSection('faq')}
                  className={navLinkClass(activeSection === 'faq')}
                >
                  {tLanding('nav.faq')}
                </a>
              </nav>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                <Button
                  asChild
                  tone="secondary"
                  className="!hidden h-10 px-4 py-2 text-sm font-semibold border border-[var(--fs-accent)] text-[var(--fs-accent)] hover:bg-[var(--fs-accent)]/10 md:!inline-flex"
                >
                  <Link href="/login">{tLanding('nav.signIn')}</Link>
                </Button>
                <Button
                  className="!hidden h-10 px-4 py-2 text-sm md:!inline-flex"
                  onClick={openBookingModal}
                >
                  {tLanding('landing.header.cta')}
                </Button>
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
                <div className="md:hidden flex items-center justify-between px-3 py-2">
                  <span className="text-base font-medium text-gray-700 dark:text-white/80">
                    {tLanding('nav.theme')}
                  </span>
                  <ThemeToggle />
                </div>
                <a
                  href="#process"
                  onClick={scrollToSection('process', true)}
                  className={mobileNavLinkClass(activeSection === 'process')}
                >
                  {tLanding('nav.process')}
                </a>
                <a
                  href="#editor-showcase"
                  onClick={scrollToSection('editor-showcase', true)}
                  className={mobileNavLinkClass(
                    activeSection === 'editor-showcase'
                  )}
                >
                  {tLanding('nav.smartEditor')}
                </a>
                <a
                  href="#pricing"
                  onClick={scrollToSection('pricing', true)}
                  className={mobileNavLinkClass(activeSection === 'pricing')}
                >
                  {tLanding('nav.pricing')}
                </a>
                <a
                  href="#faq"
                  onClick={scrollToSection('faq', true)}
                  className={mobileNavLinkClass(activeSection === 'faq')}
                >
                  {tLanding('nav.faq')}
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="md:hidden mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-[var(--fs-rule-strong)] text-sm font-medium text-[var(--fs-ink)] hover:bg-[var(--fs-glass-bg)] transition-colors"
                >
                  {tLanding('nav.signIn')}
                </Link>
                <Button
                  className="mt-4 h-11 w-full rounded-lg px-6 text-sm md:!hidden"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openBookingModal();
                  }}
                >
                  {tLanding('landing.finalCta.primaryCta')}
                </Button>
              </nav>
            </div>
          </div>
        </header>
      </>
    );
  }

  if (mode === 'auth') {
    const showAdminAuthBadge = pathname?.startsWith('/admin') ?? false;
    // Mirror the Footer aesthetic so the chrome reads as a single, cohesive
    // frame around the auth card (same translucent background + hairline rule).
    return (
      <header
        className={`sticky top-0 z-50 shrink-0 border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent backdrop-blur-sm transition-opacity duration-500 ${
          headerLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
            {showAdminAuthBadge && (
              <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                {tLanding('admin.shell.headerBadge')}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  if (mode === 'app') {
    const isTeam = pathname?.startsWith('/admin');
    const homeHref = isTeam ? '/admin/dashboard' : '/dashboard';
    // Use Tailwind dark: variants instead of an inline style derived from
    // useTheme().resolvedTheme — the inline boot script in app/layout.tsx
    // sets html.dark synchronously before hydration, so CSS-class theming
    // paints correctly on first frame and avoids the SSR ('light') →
    // hydration ('dark') swap that left this header stuck on the light
    // chrome. Equivalent to the prior tokens; nothing else changes.
    return (
      <header
        className="fixed top-0 left-0 right-0 z-[100] h-16 border-b
          border-[rgba(18,10,34,0.08)] bg-[rgba(255,255,255,0.86)]
          shadow-[0_10px_28px_rgba(18,10,34,0.06)]
          backdrop-blur-[20px] backdrop-saturate-[160%]
          dark:border-white/[0.08] dark:bg-[rgba(20,22,34,0.82)]
          dark:shadow-[0_8px_20px_rgba(2,6,23,0.24)]"
      >
        <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAppMenu?.()}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-[var(--fs-ink)]/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href={homeHref} className="flex items-center gap-3 group">
              <span className="sm:hidden">
                <Logo size="sm" />
              </span>
              <span className="hidden sm:block">
                <Logo size="md" />
              </span>
              {isTeam && (
                <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full hidden sm:block">
                  {tLanding('admin.shell.headerBadge')}
                </span>
              )}
            </Link>
            {!isTeam && (
              <a
                href="https://library.flowstarter.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[var(--fs-ink)]/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors no-underline"
              >
                Templates
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />
            <UserMenu />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-500 border-b border-[var(--fs-glass-edge)] bg-white/65 dark:bg-[var(--fs-bg-base)]/55 backdrop-blur-2xl backdrop-saturate-[180%] shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset] ${
        headerLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0">
          <Logo size="md" />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button
            asChild
            tone="secondary"
            className="hidden h-9 px-4 py-2 text-xs sm:inline-flex sm:h-10 sm:text-sm"
          >
            <Link href="/login">{tLanding('nav.signIn')}</Link>
          </Button>
          <Button
            onClick={openBookingModal}
            className="h-9 px-4 py-2 text-xs sm:h-10 sm:text-sm"
          >
            {tLanding('landing.header.cta')}
          </Button>
        </div>
      </div>
    </header>
  );
}
