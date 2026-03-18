/**
 * Auth Guard for Editor
 *
 * Shows a login prompt for unauthenticated users.
 * Mirrors the main platform's AuthLayout + AuthTabs design exactly.
 * Uses flow-design-system components throughout.
 */

import { useUser } from '@clerk/remix';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { Logo, LoadingScreen, Footer, ThemeToggle, FlowBackground, GlassPanel, ScrollAwareHeader, type FooterLink } from '@flowstarter/flow-design-system';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { getMainPlatformHomepage, getCalendlyUrl } from '~/lib/config/domains';
import { themeStore, setTheme, getEffectiveTheme } from '~/lib/stores/theme';
import { useTranslation } from '~/lib/i18n/useTranslation';
import { en } from '~/lib/i18n/locales/en';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
}

function LoadingFallback() {
  return <LoadingScreen message={en.app.loadingFlowstarterEditor} />;
}

/**
 * LoginPrompt - Uses flow-design-system components exclusively.
 */
function useFooterLinks(): FooterLink[] {
  const { t } = useTranslation();
  return [
    { label: t.footer.help, href: '/help' },
    { label: t.footer.blog, href: '/blog' },
    { label: t.footer.privacy, href: '/privacy' },
    { label: t.footer.terms, href: '/terms' },
    { label: t.footer.contact, href: '/contact' },
    { label: t.footer.teamDashboard, href: '/team/dashboard' },
    { label: t.footer.editor, href: 'https://editor.flowstarter.dev', external: true },
  ];
}

function LoginPrompt() {
  const homepageUrl = getMainPlatformHomepage();
  const { t } = useTranslation();
  const theme = useStore(themeStore);
  const [isDark, setIsDark] = useState(true);
  const footerLinks = useFooterLinks();

  useEffect(() => {
    setIsDark(getEffectiveTheme() === 'dark');
  }, [theme]);

  const redirectUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#fbf9ff] dark:bg-[#0a0810]">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

      {/* Header — static, not fixed */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-gray-200/30 dark:border-white/5 bg-white/80 dark:bg-[#0a0810]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href={homepageUrl} className="flex items-center gap-2 no-underline">
            <Logo size="md" />
          </a>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-4 sm:pt-10 lg:pt-20 pb-8">
        <div className="w-full max-w-md">

          {/* Title block — gradient on last word, same as main platform */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              <span className="text-gray-900 dark:text-white">Flowstarter </span>
              <span className="bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-blue-500 bg-clip-text text-transparent">
                Editor
              </span>
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm">
              {t.auth.pageSubtitle}
            </p>
          </div>

          {/* Auth card */}
          <div className="relative">
            <div className="bg-white/95 dark:bg-[#1a1a1f]/90 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-gray-200/50 dark:border-white/10 p-5 sm:p-8 shadow-lg dark:shadow-2xl">
              <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-1.5">
                {t.auth.cardTitle}
              </h2>
              <p className="text-sm text-center text-gray-500 dark:text-white/40 mb-6">
                {t.auth.newClient}{' '}
                <a
                  href={getCalendlyUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--purple,#7B6AD8)] no-underline font-medium hover:underline"
                >
                  {t.auth.bookDiscovery}
                </a>{' '}
                {t.auth.toGetStarted}
              </p>

              {/* Sign in button */}
              <a
                href={`${homepageUrl}/login?redirect_url=${redirectUrl}`}
                className={`flex items-center justify-center gap-2.5 w-full px-6 py-3.5 rounded-xl font-semibold text-[15px] no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t.auth.signInWithFlowstarter}
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                <span className="text-[11px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium">{t.auth.or}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              </div>

              {/* Team login link */}
              <a
                href={`${homepageUrl}/team/login?redirect_url=${redirectUrl}`}
                className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-medium text-sm no-underline transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                {t.auth.teamLogin}
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-center">
              {[
                { value: 'AI', label: t.auth.stats.aiPowered },
                { value: '\u26A1', label: t.auth.stats.livePreview },
                { value: '1', label: t.auth.stats.oneClickPublish },
              ].map((stat, i) => (
                <div key={i} className="flex items-center">
                  <div className="text-center px-4">
                    <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-blue-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wide font-medium">
                      {stat.label}
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer baseUrl={homepageUrl} links={footerLinks} builtWithLabel={t.footer.builtWith} byTeamLabel={t.footer.byTeam} />
    </div>
  );
}

function TeamAccessDenied() {
  const homepageUrl = getMainPlatformHomepage();
  const { t } = useTranslation();
  const theme = useStore(themeStore);
  const footerLinks = useFooterLinks();

  return (
    <div className="min-h-screen w-full font-display relative overflow-hidden flex flex-col">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

      <ScrollAwareHeader className="z-50" scrolledClass="bg-white/80 dark:bg-[#14141a]/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a href={homepageUrl} className="flex items-center gap-2 sm:gap-3 no-underline">
            <Logo size="md" />
          </a>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
      </ScrollAwareHeader>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 mt-14">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              <span className="text-gray-900 dark:text-white">{t.auth.teamAccessRequired.split(' ').slice(0, -1).join(' ')} </span>
              <span className="bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-blue-500 bg-clip-text text-transparent">
                {t.auth.teamAccessRequired.split(' ').slice(-1)}
              </span>
            </h1>
          </div>

          <div className="relative">
            <GlassPanel padding="lg" shadow="glass" className="text-center">
              <div className="mb-5">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mx-auto text-gray-400 dark:text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-white/50 text-sm leading-relaxed">
                {t.auth.teamAccessDescription}
              </p>
            </GlassPanel>
          </div>
        </div>
      </div>

      <Footer baseUrl={homepageUrl} links={footerLinks} builtWithLabel={t.footer.builtWith} byTeamLabel={t.footer.byTeam} />
    </div>
  );
}

export function AuthGuard({ children, fallback, requireTeam = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userMode, setUserMode] = useState<'guest' | 'team' | 'client'>('guest');
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Handoff session bypass — must be declared at top level (React hook rules)
  const [hasHandoffSession, setHasHandoffSession] = useState<boolean | null>(null);
  const location = useLocation();
  useEffect(() => {
    try {
      setHasHandoffSession(sessionStorage.getItem('flowstarter_handoff_session') === '1');
    } catch { setHasHandoffSession(false); }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const mode = initializeFromClerkUser(user);
      setUserMode(mode);
    }
  }, [isLoaded, isSignedIn, user]);

  // Timeout: if Clerk hasn't loaded after 15s, show login prompt instead of infinite loading
  useEffect(() => {
    if (isLoaded) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return;
    }

    timeoutRef.current = setTimeout(() => {
      console.warn('[AuthGuard] Clerk loading timed out after 15s, showing login prompt');
      setLoadingTimedOut(true);
    }, 15_000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoaded]);

  // Clerk still loading — show loading fallback, not the login prompt
  // Unless we've timed out, in which case show the login prompt
  if (!isLoaded) {
    if (loadingTimedOut) {
      return <LoginPrompt />;
    }

    return <>{fallback ?? <LoadingFallback />}</>;
  }

  // While sessionStorage check is pending, show loading to avoid flash of login
  if (hasHandoffSession === null) {
    return <>{fallback ?? <LoadingFallback />}</>;
  }

  // Bypass auth for handoff flows — HandoffGate/HandoffGate already validated the token
  const hasHandoffUrl = location.search.includes('handoff=');
  if (hasHandoffUrl || hasHandoffSession) {
    return <>{children}</>;
  }

  // Loaded but not signed in — show login prompt
  if (!isSignedIn) {
    return <LoginPrompt />;
  }

  if (requireTeam && userMode !== 'team') {
    return <TeamAccessDenied />;
  }

  return <>{children}</>;
}

export const TeamAuthGuard = AuthGuard;
