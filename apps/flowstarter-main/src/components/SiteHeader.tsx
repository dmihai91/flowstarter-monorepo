'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { UnifiedButton } from '@/components/ui/unified-button';
import { UserMenu } from '@/components/ui/user-menu';
import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '@/app/(dynamic-pages)/(main-pages)/landing-copy';
import { useHeaderState } from '@/app/(dynamic-pages)/(main-pages)/components/hooks/useHeaderState';
import { useTheme } from '@/contexts/ThemeContext';

type SiteHeaderMode = 'landing' | 'public' | 'auth' | 'app';

interface SiteHeaderProps {
  mode: SiteHeaderMode;
  onOpenModal?: () => void;
  showTeamBadge?: boolean;
  onOpenAppMenu?: () => void;
}

export function SiteHeader({
  mode,
  onOpenModal,
  showTeamBadge = false,
  onOpenAppMenu,
}: SiteHeaderProps) {
  const { resolvedTheme } = useTheme();
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
        ? 'text-[var(--fs-ink)] font-semibold'
        : 'text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white',
    ].join(' ');
  const mobileNavLinkClass = (isActive: boolean) =>
    [
      'px-3 py-3 text-base rounded-lg transition-colors cursor-pointer',
      isActive
        ? 'font-semibold text-[var(--fs-ink)] bg-gray-100 dark:bg-white/10'
        : 'font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5',
    ].join(' ');

  if (mode === 'landing') {
    return (
      <>
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <header
          className={`ls-theme fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            headerLoaded ? 'opacity-100' : 'opacity-0'
          } ${
            scrolled || mobileMenuOpen
              ? 'border-b border-[var(--fs-rule)]/60 bg-white/90 dark:bg-[var(--fs-bg-base)]/85 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
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
                  href="#editor-showcase"
                  onClick={scrollToSection('editor-showcase')}
                  className={navLinkClass(activeSection === 'editor-showcase')}
                >
                  Smart editor
                </a>
                <a
                  href="#templates"
                  onClick={scrollToSection('templates')}
                  className={navLinkClass(activeSection === 'templates')}
                >
                  {LANDING_COPY.nav.templatesLabel}
                </a>
                <a
                  href="#process"
                  onClick={scrollToSection('process')}
                  className={navLinkClass(activeSection === 'process')}
                >
                  {tLanding('nav.process')}
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
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Link
                  href="/login"
                  className="text-sm text-[var(--fs-ink-faint)] hover:text-gray-900 dark:hover:text-white transition-colors hidden lg:block"
                >
                  {tLanding('nav.signIn')}
                </Link>
                <UnifiedButton
                  className="!hidden h-10 px-4 py-2 text-sm lg:!inline-flex"
                  onClick={() => onOpenModal?.()}
                >
                  {tLanding('landing.header.cta')}
                </UnifiedButton>
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
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-base font-medium text-gray-700 dark:text-white/80">
                    {tLanding('nav.theme')}
                  </span>
                  <ThemeToggle />
                </div>
                <a
                  href="#editor-showcase"
                  onClick={scrollToSection('editor-showcase', true)}
                  className={mobileNavLinkClass(
                    activeSection === 'editor-showcase'
                  )}
                >
                  Smart editor
                </a>
                <a
                  href="#process"
                  onClick={scrollToSection('process', true)}
                  className={mobileNavLinkClass(activeSection === 'process')}
                >
                  {tLanding('nav.process')}
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
                <a
                  href="#templates"
                  onClick={scrollToSection('templates', true)}
                  className={mobileNavLinkClass(activeSection === 'templates')}
                >
                  {LANDING_COPY.nav.templatesLabel}
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass(false)}
                >
                  {tLanding('nav.signIn')}
                </Link>
                <UnifiedButton
                  className="ls-cta-hero mt-3 h-14 w-full px-8 text-[1.02rem]"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenModal?.();
                  }}
                >
                  {tLanding('landing.finalCta.primaryCta')}
                </UnifiedButton>
              </nav>
            </div>
          </div>
        </header>
      </>
    );
  }

  if (mode === 'auth') {
    return (
      <header
        className={`sticky top-0 z-50 shrink-0 transition-all duration-500 ${
          headerLoaded ? 'opacity-100' : 'opacity-0'
        } ${
          scrolled
            ? 'border-b border-[var(--fs-rule)]/60 bg-white/90 dark:bg-[var(--fs-bg-base)]/85 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
            : 'border-b border-transparent bg-transparent backdrop-blur-0 shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
            {showTeamBadge && (
              <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                Team
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  if (mode === 'app') {
    const isTeam = pathname?.startsWith('/team');
    const homeHref = isTeam ? '/team/dashboard' : '/dashboard';
    const appChromeStyle = {
      background:
        resolvedTheme === 'dark'
          ? 'rgba(20, 22, 34, 0.82)'
          : 'rgba(255, 255, 255, 0.86)',
      borderBottom:
        resolvedTheme === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(18, 10, 34, 0.08)',
      boxShadow:
        resolvedTheme === 'dark'
          ? '0 8px 20px rgba(2, 6, 23, 0.24)'
          : '0 10px 28px rgba(18, 10, 34, 0.06)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    } as const;

    return (
      <header
        className="fixed top-0 left-0 right-0 z-[100] h-16"
        style={appChromeStyle}
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
                  Team
                </span>
              )}
            </Link>
            <a
              href="https://library.flowstarter.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[var(--fs-ink)]/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors no-underline"
            >
              Templates
            </a>
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        headerLoaded ? 'opacity-100' : 'opacity-0'
      } ${
        scrolled
          ? 'border-b border-[var(--fs-rule)]/60 bg-white/90 dark:bg-[var(--fs-bg-base)]/85 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
          : 'border-b border-transparent bg-transparent backdrop-blur-0 shadow-none'
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
          <Link href="/login">
            <UnifiedButton
              tone="secondary"
              className="h-9 px-4 py-2 text-xs sm:h-10 sm:text-sm"
            >
              {tLanding('nav.signIn')}
            </UnifiedButton>
          </Link>
        </div>
      </div>
    </header>
  );
}
